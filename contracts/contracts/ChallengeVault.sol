// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ChallengeVault
 * @notice Holds challenger stakes (native MONAD or USDC) for STFU & Execute.
 *
 * Resolution is intentionally binary — the oracle (our backend) computes the
 * weighted score (AI 60% + community vote 30% + self-report 10%) off-chain and
 * calls resolve() with the final pass/fail verdict.
 *
 * On FAILURE:  5% of stake → treasury, 95% → PredictionMarket (slashed pool).
 * On SUCCESS:  full stake returned to challenger.
 * Safety-valve: challenger can reclaim after 30 days past deadline if unresolved.
 */
contract ChallengeVault is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ─── Types ──────────────────────────────────────────────────────────────
    enum Token  { NATIVE, USDC }
    enum Status { Active, Passed, Failed, Expired }

    struct Challenge {
        address challenger;
        uint256 stake;
        bytes32 goalHash;
        uint64  deadline;
        uint64  createdAt;
        Token   token;
        Status  status;
    }

    // ─── Constants ──────────────────────────────────────────────────────────
    uint256 public constant PLATFORM_CUT_BPS  = 500;       // 5 %
    uint256 public constant REFUND_GRACE      = 30 days;
    uint256 public constant MIN_STAKE_NATIVE  = 0.001 ether;
    uint256 public constant MIN_STAKE_USDC    = 1e6;        // 1 USDC (6 decimals)

    // ─── State ──────────────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public oracle;
    address public predictionMarket;
    address public treasury;

    uint256 public nextChallengeId;
    mapping(uint256 => Challenge) public challenges;

    // ─── Events ─────────────────────────────────────────────────────────────
    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed challenger,
        uint256 stake,
        Token   token,
        bytes32 goalHash,
        uint64  deadline
    );
    event ChallengeResolved(
        uint256 indexed challengeId,
        bool    passed,
        uint256 returnedToChallenger,
        uint256 sentToMarket,
        uint256 platformFee
    );
    event RefundClaimed(uint256 indexed challengeId, uint256 amount);
    event OracleUpdated(address indexed newOracle);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Errors ─────────────────────────────────────────────────────────────
    error OnlyOracle();
    error InvalidDeadline();
    error StakeTooLow();
    error NativeWithUSDC();
    error NotActive();
    error NotChallenger();
    error TooEarlyForRefund();
    error TransferFailed();
    error ZeroAddress();

    // ─── Constructor ────────────────────────────────────────────────────────
    constructor(
        address _oracle,
        address _predictionMarket,
        address _treasury,
        address _usdc
    ) Ownable(msg.sender) {
        if (_oracle == address(0) || _predictionMarket == address(0) || _treasury == address(0) || _usdc == address(0))
            revert ZeroAddress();
        oracle          = _oracle;
        predictionMarket = _predictionMarket;
        treasury        = _treasury;
        usdc            = IERC20(_usdc);
    }

    // ─── Challenger ─────────────────────────────────────────────────────────

    /**
     * @notice Create a new challenge. For NATIVE, send MON as msg.value.
     *         For USDC, approve this contract first then call with amount.
     */
    function createChallenge(
        bytes32 goalHash,
        uint64  deadline,
        Token   token,
        uint256 usdcAmount   // ignored for NATIVE — use msg.value
    ) external payable nonReentrant whenNotPaused returns (uint256 challengeId) {
        if (deadline <= block.timestamp) revert InvalidDeadline();

        uint256 stakeAmount;

        if (token == Token.NATIVE) {
            if (msg.value < MIN_STAKE_NATIVE) revert StakeTooLow();
            stakeAmount = msg.value;
        } else {
            // USDC path — no native value should be sent
            if (msg.value != 0) revert NativeWithUSDC();
            if (usdcAmount < MIN_STAKE_USDC) revert StakeTooLow();
            usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);
            stakeAmount = usdcAmount;
        }

        challengeId = nextChallengeId++;

        challenges[challengeId] = Challenge({
            challenger: msg.sender,
            stake:      stakeAmount,
            goalHash:   goalHash,
            deadline:   deadline,
            createdAt:  uint64(block.timestamp),
            token:      token,
            status:     Status.Active
        });

        emit ChallengeCreated(challengeId, msg.sender, stakeAmount, token, goalHash, deadline);
    }

    /**
     * @notice Claim refund if oracle never resolves (30 days past deadline).
     */
    function claimRefund(uint256 challengeId) external nonReentrant {
        Challenge storage c = challenges[challengeId];
        if (c.status != Status.Active)                                  revert NotActive();
        if (msg.sender != c.challenger)                                 revert NotChallenger();
        if (block.timestamp < uint256(c.deadline) + REFUND_GRACE)      revert TooEarlyForRefund();

        c.status = Status.Expired;
        uint256 amount = c.stake;
        _transfer(c.token, msg.sender, amount);

        emit RefundClaimed(challengeId, amount);
    }

    // ─── Oracle ─────────────────────────────────────────────────────────────

    /**
     * @notice Resolve a challenge. Only callable by the oracle.
     *         The oracle computes the weighted score off-chain and passes
     *         the binary result here.
     */
    function resolve(uint256 challengeId, bool passed) external nonReentrant whenNotPaused {
        if (msg.sender != oracle) revert OnlyOracle();

        Challenge storage c = challenges[challengeId];
        if (c.status != Status.Active) revert NotActive();

        uint256 stake = c.stake;

        if (passed) {
            c.status = Status.Passed;
            _transfer(c.token, c.challenger, stake);
            // Notify market (no funds) so it can settle pass bettors
            IPredictionMarket(predictionMarket).resolve(challengeId, true, c.token, 0);
            emit ChallengeResolved(challengeId, true, stake, 0, 0);

        } else {
            c.status = Status.Failed;

            uint256 fee     = (stake * PLATFORM_CUT_BPS) / 10_000;
            uint256 toMarket = stake - fee;

            // Send platform fee to treasury
            _transfer(c.token, treasury, fee);

            // Send 95% of slashed stake to market for fail-bettor distribution
            if (c.token == Token.NATIVE) {
                IPredictionMarket(predictionMarket).resolve{value: toMarket}(challengeId, false, c.token, toMarket);
            } else {
                usdc.safeTransfer(predictionMarket, toMarket);
                IPredictionMarket(predictionMarket).resolve(challengeId, false, c.token, toMarket);
            }

            emit ChallengeResolved(challengeId, false, 0, toMarket, fee);
        }
    }

    // ─── Admin ──────────────────────────────────────────────────────────────
    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── View ────────────────────────────────────────────────────────────────
    function getChallenge(uint256 challengeId) external view returns (Challenge memory) {
        return challenges[challengeId];
    }

    // ─── Internal ────────────────────────────────────────────────────────────
    function _transfer(Token token, address to, uint256 amount) internal {
        if (token == Token.NATIVE) {
            (bool ok,) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            usdc.safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}

// ─── Interface ───────────────────────────────────────────────────────────────
interface IPredictionMarket {
    function resolve(uint256 challengeId, bool passed, ChallengeVault.Token token, uint256 slashedAmount) external payable;
}
