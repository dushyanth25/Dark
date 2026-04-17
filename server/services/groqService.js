const axios = require('axios');

let cachedAnalysis = {
  sentimentScore: 50,
  riskLevel: 'Low',
  explanation: 'Initial system boot up. Awaiting market data.'
};

async function analyzeMarket(marketData) {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY not found. Using cached/default analysis.');
    return cachedAnalysis;
  }

  const { trend, volatility, phase, sentimentIndex, topPlayerBehavior } = marketData;

  const payload = {
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'user',
        content: `Act as the Bat-Computer.
Analyze market using game theory concepts.
Market Data:
- Trend: ${trend}
- Volatility: ${volatility}
- Phase: ${phase}
- Sentiment Index: ${sentimentIndex}
- Top Player Behavior: ${topPlayerBehavior}

Return JSON:
{
"sentimentScore": number (0-100),
"riskLevel": "Low" | "High" | "Extreme",
"explanation": "Short Gotham-themed analysis"
}`
      }
    ],
    response_format: { type: 'json_object' }
  };

  try {
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const dataStr = response.data.choices[0].message.content;
    const parsed = JSON.parse(dataStr);
    
    // Cache response
    cachedAnalysis = {
      sentimentScore: parsed.sentimentScore ?? 50,
      riskLevel: parsed.riskLevel || 'Low',
      explanation: parsed.explanation || 'Protocol stable.'
    };
    
    return cachedAnalysis;
  } catch (err) {
    // Use fallback on failure
    console.error('❌ Groq API error. Falling back to cached data.', err.message);
    return cachedAnalysis;
  }
}

module.exports = { analyzeMarket };
