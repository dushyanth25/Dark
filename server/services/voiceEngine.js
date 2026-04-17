let lastSpokenMessage = "";

function triggerVoice(insightObj, playerState) {
  if (!insightObj) return null;

  const { systemInsight, playerInsight, coachingAdvice } = insightObj;
  
  if (!systemInsight) return null;

  const priority = systemInsight.priority || 1;
  const eventType = systemInsight.eventType || "neutral";

  // System checks
  const isMajorMarketEvent = ['warning', 'opportunity'].includes(eventType);
  const isHighPriority = priority >= 3;

  // Player state checks
  const tierChanged = playerState && playerState.tierChanged;
  const rankImproved = playerInsight && playerInsight.rankImproved;
  
  // Coaching checks
  const highConfidenceCoaching = coachingAdvice && coachingAdvice.confidence >= 0.7;

  // New Voice Triggers logic
  const shouldSpeak = isHighPriority || isMajorMarketEvent || tierChanged || rankImproved || highConfidenceCoaching;

  if (shouldSpeak) {
    const tierMessage = tierChanged ? `Promoted to ${playerState.tier}.` : "";
    
    // Combine safely
    const message = [
      systemInsight.message,
      coachingAdvice && coachingAdvice.message ? coachingAdvice.message : "",
      tierMessage
    ].filter(Boolean).join(" ");
    
    // Avoid duplicate speech
    if (message && message !== lastSpokenMessage) {
      lastSpokenMessage = message;
      
      console.log(`\n🎤 [BAT-COMPUTER VOICE]: "${message}"\n`);
      return message;
    }
  }

  return null;
}

module.exports = { triggerVoice };
