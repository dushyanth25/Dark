const { assignTier, getTierProgress } = require('../../services/tierEngine');

describe('Tier Engine', () => {
  describe('assignTier', () => {
    test('should assign Bronze tier for score below 20', () => {
      expect(assignTier(0)).toBe('Bronze');
      expect(assignTier(10)).toBe('Bronze');
      expect(assignTier(19)).toBe('Bronze');
      expect(assignTier(19.9)).toBe('Bronze');
    });

    test('should assign Silver tier for score 20-49', () => {
      expect(assignTier(20)).toBe('Silver');
      expect(assignTier(30)).toBe('Silver');
      expect(assignTier(49)).toBe('Silver');
    });

    test('should assign Gold tier for score 50-99', () => {
      expect(assignTier(50)).toBe('Gold');
      expect(assignTier(75)).toBe('Gold');
      expect(assignTier(99)).toBe('Gold');
    });

    test('should assign Platinum tier for score 100-199', () => {
      expect(assignTier(100)).toBe('Platinum');
      expect(assignTier(150)).toBe('Platinum');
      expect(assignTier(199)).toBe('Platinum');
    });

    test('should assign Elite Trader for score 200+', () => {
      expect(assignTier(200)).toBe('Elite Trader');
      expect(assignTier(300)).toBe('Elite Trader');
      expect(assignTier(1000)).toBe('Elite Trader');
    });

    test('should handle negative scores as 0', () => {
      expect(assignTier(-10)).toBe('Bronze');
      expect(assignTier(-100)).toBe('Bronze');
    });

    test('should handle null/undefined as 0', () => {
      expect(assignTier(null)).toBe('Bronze');
      expect(assignTier(undefined)).toBe('Bronze');
    });

    test('should handle string numbers', () => {
      expect(assignTier('25')).toBe('Silver');
      expect(assignTier('75')).toBe('Gold');
    });

    test('should handle invalid string inputs', () => {
      expect(assignTier('invalid')).toBe('Bronze');
      expect(assignTier('abc')).toBe('Bronze');
    });

    test('should handle floating point scores', () => {
      expect(assignTier(49.5)).toBe('Silver');
      expect(assignTier(99.9)).toBe('Gold');
      expect(assignTier(199.99)).toBe('Platinum');
    });
  });

  describe('getTierProgress', () => {
    test('should return Bronze tier info for score < 20', () => {
      const result = getTierProgress(10);
      expect(result.currentTier).toBe('Bronze');
      expect(result.nextTier).toBe('Silver');
      expect(result.progressPercentage).toBeCloseTo(50); // 10 / (20 - 0) * 100
    });

    test('should return Silver tier info for score 20-49', () => {
      const result = getTierProgress(30);
      expect(result.currentTier).toBe('Silver');
      expect(result.nextTier).toBe('Gold');
      expect(result.progressPercentage).toBeCloseTo((10 / 30) * 100); // (30 - 20) / (50 - 20)
    });

    test('should return Gold tier info for score 50-99', () => {
      const result = getTierProgress(75);
      expect(result.currentTier).toBe('Gold');
      expect(result.nextTier).toBe('Platinum');
      expect(result.progressPercentage).toBeCloseTo(50); // (75 - 50) / (100 - 50)
    });

    test('should return Platinum tier info for score 100-199', () => {
      const result = getTierProgress(150);
      expect(result.currentTier).toBe('Platinum');
      expect(result.nextTier).toBe('Elite Trader');
      expect(result.progressPercentage).toBeCloseTo(50); // (150 - 100) / (200 - 100)
    });

    test('should return Elite Trader with 100% progress when maxed out', () => {
      const result = getTierProgress(200);
      expect(result.currentTier).toBe('Elite Trader');
      expect(result.nextTier).toBeNull();
      expect(result.progressPercentage).toBe(100);
    });

    test('should handle Elite Trader scores over 200', () => {
      const result = getTierProgress(500);
      expect(result.currentTier).toBe('Elite Trader');
      expect(result.nextTier).toBeNull();
      expect(result.progressPercentage).toBe(100);
    });

    test('should handle at boundary scores', () => {
      const at20 = getTierProgress(20);
      expect(at20.currentTier).toBe('Silver');
      expect(at20.nextTier).toBe('Gold');

      const at50 = getTierProgress(50);
      expect(at50.currentTier).toBe('Gold');
      expect(at50.nextTier).toBe('Platinum');

      const at100 = getTierProgress(100);
      expect(at100.currentTier).toBe('Platinum');
      expect(at100.nextTier).toBe('Elite Trader');
    });

    test('should handle score 0', () => {
      const result = getTierProgress(0);
      expect(result.currentTier).toBe('Bronze');
      expect(result.nextTier).toBe('Silver');
      expect(result.progressPercentage).toBe(0);
    });

    test('should handle negative scores as 0', () => {
      const result = getTierProgress(-10);
      expect(result.currentTier).toBe('Bronze');
      expect(result.nextTier).toBe('Silver');
      expect(result.progressPercentage).toBe(0);
    });

    test('should handle null/undefined as 0', () => {
      const nullResult = getTierProgress(null);
      expect(nullResult.currentTier).toBe('Bronze');
      expect(nullResult.nextTier).toBe('Silver');

      const undefinedResult = getTierProgress(undefined);
      expect(undefinedResult.currentTier).toBe('Bronze');
      expect(undefinedResult.nextTier).toBe('Silver');
    });

    test('should keep progress between 0 and 100', () => {
      const results = [0, 19, 20, 49, 50, 99, 100, 199, 200, 1000].map(getTierProgress);
      results.forEach(result => {
        expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(result.progressPercentage).toBeLessThanOrEqual(100);
      });
    });

    test('should properly calculate progress for all tiers', () => {
      // Test mid-range for each tier
      const tierTests = [
        { score: 10, expectedProgress: 50 },     // Bronze mid
        { score: 35, expectedProgress: 50 },     // Silver mid
        { score: 75, expectedProgress: 50 },     // Gold mid
        { score: 150, expectedProgress: 50 },    // Platinum mid
      ];

      tierTests.forEach(({ score, expectedProgress }) => {
        const result = getTierProgress(score);
        expect(result.progressPercentage).toBeCloseTo(expectedProgress, 0);
      });
    });
  });
});
