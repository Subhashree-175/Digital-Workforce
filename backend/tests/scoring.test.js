const { computeAchievementAndScore, ratingBand } = require('../src/utils/scoring');

describe('computeAchievementAndScore - automated KPI scoring', () => {
  test('full target achievement yields 100% and weight', () => {
    const { achievementPct, weightedScore } = computeAchievementAndScore(100, 100, 40);
    expect(achievementPct).toBe(100);
    expect(weightedScore).toBe(40);
  });

  test('over-achievement is capped at 150%', () => {
    const { achievementPct, weightedScore } = computeAchievementAndScore(300, 100, 30);
    expect(achievementPct).toBe(150);
    expect(weightedScore).toBe(45);
  });

  test('partial achievement computes proportionally', () => {
    const { achievementPct, weightedScore } = computeAchievementAndScore(50, 200, 20);
    expect(achievementPct).toBe(25);
    expect(weightedScore).toBe(5);
  });

  test('zero target does not divide by zero', () => {
    const { achievementPct, weightedScore } = computeAchievementAndScore(80, 0, 10);
    expect(achievementPct).toBe(0);
    expect(weightedScore).toBe(0);
  });

  test('values are rounded to two decimals', () => {
    const { achievementPct } = computeAchievementAndScore(1, 3, 5);
    expect(achievementPct).toBe(33.33); // 1/3 = 33.333... -> 33.33
    const { weightedScore } = computeAchievementAndScore(8, 3, 5);
    expect(weightedScore).toBe(7.5); // 266.67% capped to 150 -> 7.5
  });
});

describe('ratingBand - consistent rating labels', () => {
  test.each([
    [120, 100, 'Outstanding'],
    [100, 100, 'Exceeds Expectations'],
    [85, 100, 'Meets Expectations'],
    [65, 100, 'Needs Improvement'],
    [40, 100, 'Unsatisfactory'],
    [0, 0, 'Not Rated'],
  ])('%s/%s -> %s', (score, max, expected) => {
    expect(ratingBand(score, max)).toBe(expected);
  });
});