// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ChallengeVault } from "./ChallengeVault.sol";

/**
 * @title PredictionMarket
 * @notice Spectators bet on whether a challenger will pass or fail.
 *         - Supports native MON and USDC betting.
 *         - Resolution is driven by ChallengeVault.
 *         - Winners claim proportional share of the losing pool (+ slashed stake on fail).
 */
contract PredictionMarket is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ─── Types ──────────────────────────────────────────────────────────────
    enum Status { Open, ResolvedPass, ResolvedFail }

    struct Market {
        uint256 totalPassNative;
        uint256 totalFailNative;
        uint256 totalPassUSDC;
        uint256 totalFailUSDC;
        uint256 slashedNative;     // From ChallengeVault failure
        uint256 slashedUSDC;       // From ChallengeVault failure
        uint256 protocolFeeNative;  // 5% of the losing pool
        uint256 protocolFeeUSDC;    // 5% of the losing pool
        Status  status;
    }

    // ─── Constants ──────────────────────────────────────────────────────────
    uint256 public constant PLATFORM_CUT_BPS = 500; // 5%

    // ─── State ──────────────────────────────────────────────────────────────
    address public immutable challengeVault;
    IERC20  public immutable usdc;
    address public treasury;

    mapping(uint256 => Market) public markets;

    // challengeId => user => amount
    mapping(uint256 => mapping(address => uint256)) public passNative;
    mapping(uint256 => mapping(address => uint256)) public failNative;
    mapping(uint256 => mapping(address => uint256)) public passUSDC;
    mapping(uint256 => mapping(address => uint256)) public failUSDC;

    // challengeId => user => token => claimed
    mapping(uint256 => mapping(address => mapping(ChallengeVault.Token => bool))) public claimed;

    // ─── Events ─────────────────────────────────────────────────────────────
    event BetPlaced(uint256 indexed challengeId, address indexed bettor, bool onPass, ChallengeVault.Token token, uint256 amount);
    event MarketResolved(uint256 indexed challengeId, bool passed, ChallengeVault.Token token, uint256 slashed, uint256 protocolFee);
    event WinningsClaimed(uint256 indexed challengeId, address indexed bettor, ChallengeVault.Token token, uint256 amount);
    event TreasuryUpdated(address indexed newTreasury);

    // ─── Errors ─────────────────────────────────────────────────────────────
    error OnlyVault();
    error MarketNotOpen();
    error MarketNotResolved();
    error ZeroBet();
    error NativeWithUSDC();
    error AlreadyClaimed();
    error NothingToClaim();
    error TransferFailed();
    error ZeroAddress();

    // ─── Constructor ────────────────────────────────────────────────────────
    constructor(address _challengeVault, address _usdc, address _treasury) Ownable(msg.sender) {
        if (_challengeVault == address(0) || _usdc == address(0) || _treasury == address(0)) revert ZeroAddress();
        challengeVault = _challengeVault;
        usdc           = IERC20(_usdc);
        treasury       = _treasury;
    }

    // ─── Bettors ────────────────────────────────────────────────────────────

    /**
     * @notice Bet on PASS or FAIL.
     */
    function placeBet(uint256 challengeId, bool onPass, ChallengeVault.Token token, uint256 amount) external payable nonReentrant whenNotPaused {
        Market storage m = markets[challengeId];
        if (m.status != Status.Open) revert MarketNotOpen();

        if (token == ChallengeVault.Token.NATIVE) {
            if (msg.value == 0) revert ZeroBet();
            if (onPass) {
                passNative[challengeId][msg.sender] += msg.value;
                m.totalPassNative += msg.value;
            } else {
                failNative[challengeId][msg.sender] += msg.value;
                m.totalFailNative += msg.value;
            }
            emit BetPlaced(challengeId, msg.sender, onPass, ChallengeVault.Token.NATIVE, msg.value);
        } else {
            if (msg.value != 0) revert NativeWithUSDC();
            if (amount == 0) revert ZeroBet();
            usdc.safeTransferFrom(msg.sender, address(this), amount);
            if (onPass) {
                passUSDC[challengeId][msg.sender] += amount;
                m.totalPassUSDC += amount;
            } else {
                failUSDC[challengeId][msg.sender] += amount;
                m.totalFailUSDC += amount;
            }
            emit BetPlaced(challengeId, msg.sender, onPass, ChallengeVault.Token.USDC, amount);
        }
    }

    /**
     * @notice Claim winnings for a specific token (Native or USDC).
     */
    function claimWinnings(uint256 challengeId, ChallengeVault.Token token) external nonReentrant {
        Market storage m = markets[challengeId];
        if (m.status == Status.Open)      revert MarketNotResolved();
        if (claimed[challengeId][msg.sender][token]) revert AlreadyClaimed();

        uint256 payout = _calculatePayout(challengeId, msg.sender, m, token);
        if (payout == 0) revert NothingToClaim();

        claimed[challengeId][msg.sender][token] = true;
        _transfer(token, msg.sender, payout);

        emit WinningsClaimed(challengeId, msg.sender, token, payout);
    }

    // ─── ChallengeVault ─────────────────────────────────────────────────────

    /**
     * @notice Called by ChallengeVault to resolve the market.
     *         Collects slashed stake and computes protocol fees on the losing pool.
     */
    function resolve(uint256 challengeId, bool passed, ChallengeVault.Token token, uint256 slashedAmount) external payable {
        if (msg.sender != challengeVault) revert OnlyVault();
        Market storage m = markets[challengeId];

        uint256 fee;
        if (passed) {
            m.status = Status.ResolvedPass;
            // Fee is 5% of the losing (FAIL) pool
            if (token == ChallengeVault.Token.NATIVE) {
                fee = (m.totalFailNative * PLATFORM_CUT_BPS) / 10000;
                m.protocolFeeNative = fee;
            } else {
                fee = (m.totalFailUSDC * PLATFORM_CUT_BPS) / 10000;
                m.protocolFeeUSDC = fee;
            }
        } else {
            m.status = Status.ResolvedFail;
            // Fee is 5% of the losing (PASS) pool
            if (token == ChallengeVault.Token.NATIVE) {
                m.slashedNative = slashedAmount;
                fee = (m.totalPassNative * PLATFORM_CUT_BPS) / 10000;
                m.protocolFeeNative = fee;
            } else {
                m.slashedUSDC = slashedAmount;
                fee = (m.totalPassUSDC * PLATFORM_CUT_BPS) / 10000;
                m.protocolFeeUSDC = fee;
            }
        }

        if (fee > 0) {
            _transfer(token, treasury, fee);
        }

        emit MarketResolved(challengeId, passed, token, slashedAmount, fee);
    }

    // ─── Admin ──────────────────────────────────────────────────────────────
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─── View ───────────────────────────────────────────────────────────────

    function getMarket(uint256 challengeId) external view returns (Market memory) {
        return markets[challengeId];
    }

    function calculatePayout(uint256 challengeId, address user, ChallengeVault.Token token) external view returns (uint256) {
        Market storage m = markets[challengeId];
        if (m.status == Status.Open) return 0;
        if (claimed[challengeId][user][token]) return 0;
        return _calculatePayout(challengeId, user, m, token);
    }

    // ─── Internal ───────────────────────────────────────────────────────────

    function _calculatePayout(uint256 challengeId, address user, Market storage m, ChallengeVault.Token token) internal view returns (uint256) {
        if (token == ChallengeVault.Token.NATIVE) {
            return _math(
                m.status,
                passNative[challengeId][user],
                failNative[challengeId][user],
                m.totalPassNative,
                m.totalFailNative,
                m.slashedNative,
                m.protocolFeeNative
            );
        } else {
            return _math(
                m.status,
                passUSDC[challengeId][user],
                failUSDC[challengeId][user],
                m.totalPassUSDC,
                m.totalFailUSDC,
                m.slashedUSDC,
                m.protocolFeeUSDC
            );
        }
    }

    function _math(
        Status status,
        uint256 userPass,
        uint256 userFail,
        uint256 totalPass,
        uint256 totalFail,
        uint256 slashed,
        uint256 protocolFee
    ) internal pure returns (uint256) {
        if (status == Status.ResolvedPass) {
            if (userPass == 0 || totalPass == 0) return 0;
            // Won your bet back + share of (totalFail - protocolFee)
            uint256 distributable = totalFail > protocolFee ? totalFail - protocolFee : 0;
            uint256 winnings      = (distributable > 0) ? (userPass * distributable) / totalPass : 0;
            return userPass + winnings;
        } else if (status == Status.ResolvedFail) {
            if (userFail == 0 || totalFail == 0) return 0;
            // Won your bet back + share of (totalPass - protocolFee + slashed)
            uint256 distributable = (totalPass > protocolFee ? totalPass - protocolFee : 0) + slashed;
            uint256 winnings      = (distributable > 0) ? (userFail * distributable) / totalFail : 0;
            return userFail + winnings;
        }
        return 0;
    }

    function _transfer(ChallengeVault.Token token, address to, uint256 amount) internal {
        if (token == ChallengeVault.Token.NATIVE) {
            (bool ok,) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
        } else {
            usdc.safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
