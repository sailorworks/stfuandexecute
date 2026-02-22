// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ResolutionMath
 * @notice Documents and computes the STFU & Execute weighted resolution formula.
 *
 * The oracle (backend) uses this formula off-chain to compute the final verdict,
 * then submits a binary pass/fail to ChallengeVault.resolve().
 * This library is provided on-chain for full transparency and auditability.
 *
 * Weights:
 *   AI agent verdict    → 60 %
 *   Community vote      → 30 % (stake-weighted vote by prediction market bettors)
 *   Self-report         → 10 % (challenger submits proof; premium members verify)
 *
 * All scores are 0–100. Final score ≥ 50 → SUCCESS, < 50 → FAILURE.
 */
library ResolutionMath {
    uint256 internal constant AI_WEIGHT        = 60;
    uint256 internal constant COMMUNITY_WEIGHT = 30;
    uint256 internal constant SELF_WEIGHT      = 10;
    uint256 internal constant PASS_THRESHOLD   = 50;

    /**
     * @notice Compute the weighted final score.
     *
     * @param aiScore            0–100. Score from the AI oracle after analysing
     *                           Telegram activity, GitHub commits, social posts, etc.
     *
     * @param votePassWeight     Total stake (in wei/tokens) of bettors who voted PASS.
     * @param voteFailWeight     Total stake of bettors who voted FAIL.
     *                           Community score = votePassWeight * 100 / total.
     *                           Defaults to 50 (neutral) if no votes cast.
     *
     * @param selfTotalScore     Sum of all premium-member scores (0 or 100 each).
     * @param selfVoterCount     Number of premium members who reviewed the proof.
     * @param selfReportSubmitted Whether the challenger submitted a proof URI.
     *                           If no proof was submitted, self score = 0.
     *                           If proof submitted but no reviewers, score = 50 (neutral).
     *
     * @return finalScore 0–100 composite score.
     * @return passed     True when finalScore ≥ PASS_THRESHOLD.
     */
    function computeFinalScore(
        uint8   aiScore,
        uint256 votePassWeight,
        uint256 voteFailWeight,
        uint256 selfTotalScore,
        uint256 selfVoterCount,
        bool    selfReportSubmitted
    ) internal pure returns (uint8 finalScore, bool passed) {
        // ── Community score ────────────────────────────────────────────────
        uint256 communityScore;
        uint256 totalVoteWeight = votePassWeight + voteFailWeight;
        if (totalVoteWeight == 0) {
            communityScore = 50; // neutral — no one voted
        } else {
            communityScore = (votePassWeight * 100) / totalVoteWeight;
        }

        // ── Self-report score ──────────────────────────────────────────────
        uint256 selfScore;
        if (!selfReportSubmitted) {
            selfScore = 0; // no proof → penalised
        } else if (selfVoterCount == 0) {
            selfScore = 50; // proof submitted but unreviewed → neutral
        } else {
            selfScore = selfTotalScore / selfVoterCount; // average of 0/100 verdicts
        }

        // ── Weighted composite ─────────────────────────────────────────────
        uint256 composite = (uint256(aiScore) * AI_WEIGHT
                           + communityScore   * COMMUNITY_WEIGHT
                           + selfScore        * SELF_WEIGHT) / 100;

        // composite is guaranteed 0–100; safe downcast
        finalScore = uint8(composite);
        passed     = finalScore >= PASS_THRESHOLD;
    }
}
