/**
 * Automated KPI scoring utilities.
 *
 * achievementPct = (achievedValue / targetValue) * 100, capped at 150% to
 *   reward over-achievement while preventing runaway outliers from skewing
 *   department analytics.
 * weightedScore   = achievementPct * weight / 100
 *
 * The sum of weightedScore across all KPIs assigned to an employee for a
 * period gives the overall_score for that evaluation (max = sum(weights) * 1.5).
 */

const MAX_ACHIEVEMENT_PCT = 150;

function computeAchievementAndScore(achievedValue, targetValue, weight) {
  const achieved = Number(achievedValue) || 0;
  const target = Number(targetValue) || 0;
  const w = Number(weight) || 0;

  let achievementPct = 0;
  if (target > 0) {
    achievementPct = (achieved / target) * 100;
  }
  achievementPct = Math.min(achievementPct, MAX_ACHIEVEMENT_PCT);
  achievementPct = Math.max(achievementPct, 0);

  const weightedScore = (achievementPct * w) / 100;

  return {
    achievementPct: Number(achievementPct.toFixed(2)),
    weightedScore: Number(weightedScore.toFixed(2)),
  };
}

/**
 * Maps a numeric overall score (relative to max possible = sum of weights)
 * to a performance rating band, used across dashboards for consistency.
 */
function ratingBand(overallScore, maxPossible) {
  if (!maxPossible || maxPossible <= 0) return 'Not Rated';
  const pct = (overallScore / maxPossible) * 100;
  if (pct >= 120) return 'Outstanding';
  if (pct >= 100) return 'Exceeds Expectations';
  if (pct >= 80) return 'Meets Expectations';
  if (pct >= 60) return 'Needs Improvement';
  return 'Unsatisfactory';
}

module.exports = { computeAchievementAndScore, ratingBand, MAX_ACHIEVEMENT_PCT };
