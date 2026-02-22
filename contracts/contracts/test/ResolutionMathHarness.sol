// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ResolutionMath } from "../libraries/ResolutionMath.sol";

/// @dev Test harness that exposes ResolutionMath as an external function.
contract ResolutionMathHarness {
    function compute(
        uint8   aiScore,
        uint256 votePassWeight,
        uint256 voteFailWeight,
        uint256 selfTotalScore,
        uint256 selfVoterCount,
        bool    selfReportSubmitted
    ) external pure returns (uint8 finalScore, bool passed) {
        return ResolutionMath.computeFinalScore(
            aiScore,
            votePassWeight,
            voteFailWeight,
            selfTotalScore,
            selfVoterCount,
            selfReportSubmitted
        );
    }
}
