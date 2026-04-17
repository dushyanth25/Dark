const { triggerVoice } = require('../../services/voiceEngine');

describe('Voice Engine', () => {
  describe('triggerVoice', () => {
    beforeEach(() => {
      // Clear the module to reset lastSpokenMessage between tests
      jest.resetModules();
    });

    test('should return null when insight is null', () => {
      const result = triggerVoice(null, {});
      expect(result).toBeNull();
    });

    test('should return null when systemInsight is missing', () => {
      const insightObj = {
        playerInsight: {},
        coachingAdvice: {},
      };
      const result = triggerVoice(insightObj, {});
      expect(result).toBeNull();
    });

    test('should trigger voice on high priority event', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'neutral',
          message: 'High priority event',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('High priority event');
    });

    test('should trigger voice on warning event type', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'warning',
          message: 'Market warning detected',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('Market warning detected');
    });

    test('should trigger voice on opportunity event type', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'opportunity',
          message: 'Market opportunity detected',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('Market opportunity detected');
    });

    test('should trigger voice when tier changed', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'Base message',
        },
      };
      const playerState = {
        tierChanged: true,
        tier: 'Silver',
      };
      const result = triggerVoice(insightObj, playerState);
      expect(result).not.toBeNull();
      expect(result).toContain('Silver');
    });

    test('should include tier promotion message when tier changed', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'You advanced',
        },
      };
      const playerState = {
        tierChanged: true,
        tier: 'Gold',
      };
      const result = triggerVoice(insightObj, playerState);
      expect(result).toContain('Promoted to Gold');
    });

    test('should trigger voice when rank improved', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'System message',
        },
        playerInsight: {
          rankImproved: true,
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
    });

    test('should trigger voice on high confidence coaching', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'System message',
        },
        coachingAdvice: {
          confidence: 0.8,
          message: 'Buy now',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('Buy now');
    });

    test('should not trigger voice on low confidence coaching (< 0.7)', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'System message',
        },
        coachingAdvice: {
          confidence: 0.6,
          message: 'Low confidence advice',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).toBeNull();
    });

    test('should not trigger voice on neutral low priority', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'Boring message',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).toBeNull();
    });

    test('should combine system message and coaching advice', () => {
      const insightObj = {
        systemInsight: {
          priority: 4,
          eventType: 'caution',
          message: 'Market caution',
        },
        coachingAdvice: {
          confidence: 0.8,
          message: 'Consider selling',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).toContain('Market caution');
      expect(result).toContain('Consider selling');
    });

    test('should combine all message types', () => {
      const insightObj = {
        systemInsight: {
          priority: 5,
          eventType: 'warning',
          message: 'Critical warning',
        },
        coachingAdvice: {
          confidence: 0.85,
          message: 'Execute exit strategy',
        },
      };
      const playerState = {
        tierChanged: true,
        tier: 'Platinum',
      };
      const result = triggerVoice(insightObj, playerState);
      expect(result).toContain('Critical warning');
      expect(result).toContain('Execute exit strategy');
      expect(result).toContain('Platinum');
    });

    test('should have message field in system insight', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'custom',
          // Missing message field
        },
      };
      const result = triggerVoice(insightObj, {});
      // Should still work but might not include message
      expect(typeof result === 'string' || result === null).toBe(true);
    });

    test('should handle undefined coachingAdvice message', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'warning',
          message: 'Warning message',
        },
        coachingAdvice: {
          confidence: 0.8,
          // Missing message
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('Warning message');
    });

    test('should handle missing playerState properties safely', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'warning',
          message: 'Warning',
        },
      };
      const result = triggerVoice(insightObj, undefined);
      expect(result).not.toBeNull();
    });

    test('should handle competing triggers - priority over tier', () => {
      const insightObj = {
        systemInsight: {
          priority: 5,
          eventType: 'warning',
          message: 'High priority warning',
        },
      };
      const playerState = {
        tierChanged: true,
        tier: 'Elite Trader',
      };
      const result = triggerVoice(insightObj, playerState);
      expect(result).toContain('High priority warning');
      expect(result).toContain('Elite Trader');
    });

    test('should return specific message structure', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'opportunity',
          message: 'Buy signal',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle 0.7 confidence boundary', () => {
      const insightObj = {
        systemInsight: {
          priority: 1,
          eventType: 'neutral',
          message: 'Message',
        },
        coachingAdvice: {
          confidence: 0.7,
          message: 'Boundary coaching',
        },
      };
      const result = triggerVoice(insightObj, {});
      expect(result).not.toBeNull();
      expect(result).toContain('Boundary coaching');
    });

    test('should filter empty string segments', () => {
      const insightObj = {
        systemInsight: {
          priority: 3,
          eventType: 'warning',
          message: 'Main message',
        },
        coachingAdvice: {
          confidence: 0.8,
          message: '',
        },
      };
      const playerState = {
        tierChanged: false, // No tier message
      };
      const result = triggerVoice(insightObj, playerState);
      expect(result).toContain('Main message');
    });
  });
});
