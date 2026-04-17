const Market = require('../models/Market');
const Agent = require('../models/Agent');
const Order = require('../models/Order');
const SimulationState = require('../models/SimulationState');
const Portfolio = require('../models/Portfolio'); // For real players

const { analyzeMarket } = require('./groqService');
const { updateBelief } = require('./beliefEngine');
const { decideAction } = require('./decisionEngine');
const { evolveStrategies } = require('./strategyEngine');
const { detectPhase } = require('./phaseEngine');

// Newly integrated modules
const { updatePlayerRanking, getLeaderboard } = require('./rankingEngine');
const { generateInsights } = require('./insightEngine');
const { triggerVoice } = require('./voiceEngine');

let simulationInterval = null;

async function runSimulationTick() {
  try {
    // 1. LOAD AGENTS + MARKET + STATE
    let state = await SimulationState.findOne();
    if (!state) {
      state = await SimulationState.create({
        currentStep: 0,
        priceHistory: [100],
        isRunning: true,
      });
    }

    if (!state.isRunning) return;

    let market = await Market.findOne();
    if (!market) {
      market = await Market.create({
        currentPrice: 100,
        state: 'stable',
        phase: 'stable',
        volatility: 0,
        sentimentIndex: 0,
        orderBook: { buyVolume: 0, sellVolume: 0 }
      });
    }

    const agentCount = await Agent.countDocuments();
    if (agentCount < 10) {
      const types = ['bot', 'human'];
      const strategies = ['momentum', 'contrarian', 'panic', 'liquidity'];
      const agentsToCreate = [];
      for (let i = 0; i < 10 - agentCount; i++) {
        agentsToCreate.push({
          type: types[Math.floor(Math.random() * types.length)] === 'human' ? 'human' : 'bot',
          strategy: strategies[Math.floor(Math.random() * strategies.length)],
          riskTolerance: Math.random(),
          cash: 1000,
          assets: 10,
          performanceScore: 0,
          belief: { bullish: 0.33, bearish: 0.33, neutral: 0.34 }
        });
      }
      await Agent.insertMany(agentsToCreate);
    }

    const agents = await Agent.find();

    // 2. COMPUTE PRICE CHANGE
    const history = state.priceHistory;
    let priceChange = 0;
    if (history.length >= 2) {
      priceChange = history[history.length - 1] - history[history.length - 2];
    }

    const basicMarketData = {
      priceChange,
      phase: market.phase,
      volatility: market.volatility,
      sentimentIndex: market.sentimentIndex
    };

    let buyVolume = 0;
    let sellVolume = 0;
    const orders = [];
    const agentUpdates = [];

    // 3. UPDATE BELIEFS & GET ACTIONS
    for (let agent of agents) {
      agent.belief = updateBelief(agent, basicMarketData);
      const action = decideAction(agent, basicMarketData);
      
      const isHuman = agent.type === 'human';
      const weight = isHuman ? 2 : 1;
      
      if (action === 'buy') buyVolume += weight;
      else if (action === 'sell') sellVolume += weight;

      orders.push({
        agentId: agent._id,
        type: action,
        quantity: weight,
        price: market.currentPrice,
      });

      agent.actionTaken = action; 
    }

    // 4. PRICE UPDATE
    let currentPrice = market.currentPrice;
    const demand = buyVolume;
    const supply = sellVolume;
    
    const noise = (Math.random() * 0.01) - 0.005;
    let newPrice = currentPrice * (1 + (demand - supply) * 0.01 + noise);
    if (newPrice < 1) newPrice = 1;

    // 5. UPDATE MARKET METRICS
    const newHistory = [...history, newPrice].slice(-20);
    const priceChanges = [];
    for(let i = 1; i < newHistory.length; i++) {
        priceChanges.push(newHistory[i] - newHistory[i-1]);
    }
    
    let vol = 0;
    if (priceChanges.length > 0) {
      const mean = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
      const variance = priceChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / priceChanges.length;
      vol = Math.sqrt(variance);
    }

    const totalVolume = demand + supply;
    const sentimentIndex = totalVolume > 0 ? (demand - supply) / totalVolume : 0;

    const updatedMarketDataForPhase = {
      priceChanges,
      volatility: vol,
      buyVolume: demand,
      sellVolume: supply,
    };

    // 6. PHASE DETECTION
    const newPhase = detectPhase(updatedMarketDataForPhase);

    let marketStateEnum = 'stable';
    if (newPrice - currentPrice > 1) marketStateEnum = 'bull';
    else if (newPrice - currentPrice < -1) marketStateEnum = 'panic';

    let marketUpdateFields = {
      currentPrice: newPrice,
      state: marketStateEnum,
      phase: newPhase,
      volatility: vol,
      sentimentIndex: sentimentIndex,
      orderBook: { buyVolume: demand, sellVolume: supply },
      updatedAt: Date.now()
    };

    const recentTrend = priceChanges.reduce((a, b) => a + b, 0);

    const fullMarketData = {
      priceChange: newPrice - currentPrice,
      currentPrice: newPrice,
      volatility: vol,
      phase: newPhase,
      equilibriumState: marketStateEnum === 'stable' ? 'stable' : 'shift',
      priceTrend: recentTrend,
      buySellRatio: demand / Math.max(1, supply),
      tend: recentTrend.toFixed(2),
      sentimentIndex: sentimentIndex.toFixed(2),
    };

    // --- NEW: AFTER EACH TICK ---
    
    // 1. Call rankingEngine.updatePlayerRanking()
    const portfolios = await Portfolio.find();
    portfolios.forEach(p => {
      let lastAction = null;
      if (p.tradeHistory && p.tradeHistory.length > 0) {
        lastAction = p.tradeHistory[p.tradeHistory.length - 1].type;
      }
      
      updatePlayerRanking(p.userId.toString(), {
        cash: p.cash,
        assets: p.assets,
        lastAction
      }, fullMarketData);
    });

    const leaderboard = getLeaderboard();
    const topPlayer = leaderboard.length > 0 ? leaderboard[0] : null;

    let topPlayerBehavior = "Hold";
    let playerData = null;
    if (topPlayer) {
       const tpPort = portfolios.find(p => p.userId.toString() === topPlayer.userId);
       if (tpPort && tpPort.tradeHistory.length) {
         topPlayerBehavior = tpPort.tradeHistory[tpPort.tradeHistory.length-1].type;
       }
       playerData = { userId: topPlayer.userId, rank: topPlayer.rank };
    }

    // 2. Generate insights: insightEngine.generateInsights()
    let insight = generateInsights(fullMarketData, playerData);

    // 3. IF step % 5 == 0: call Groq
    if (state.currentStep % 5 === 0) {
      const analysis = await analyzeMarket({
        trend: fullMarketData.tend,
        volatility: fullMarketData.volatility.toFixed(4),
        phase: fullMarketData.phase,
        sentimentIndex: fullMarketData.sentimentIndex,
        topPlayerBehavior: topPlayerBehavior
      });
      
      marketUpdateFields.sentimentScore = analysis.sentimentScore;
      marketUpdateFields.riskLevel = analysis.riskLevel;
      marketUpdateFields.explanation = analysis.explanation;

      // 4. Merge: system insight + Groq explanation + ranking insight (ranking is already in message)
      insight.message += ` | AI: ${analysis.explanation}`;
    }

    // 5. Trigger voiceEngine
    // Check if player rank trend indicated a major shift for voice logic
    if (playerData) {
      const { getPlayerTrend } = require('./rankingEngine');
      if (Math.abs(getPlayerTrend(topPlayer.userId)) >= 2) {
        insight.majorRankingChange = true;
      }
    }
    
    triggerVoice(insight);
    // --- END NEW LOGIC ---

    // 7. PERFORMANCE UPDATE
    const priceMovement = newPrice - currentPrice;
    for (let agent of agents) {
      let gain = 0;
      if (agent.actionTaken === 'buy' && priceMovement > 0) gain = priceMovement;
      if (agent.actionTaken === 'sell' && priceMovement < 0) gain = Math.abs(priceMovement);
      if (agent.actionTaken === 'hold') gain = 0;
      
      agent.performanceScore += gain;
    }

    // 8. EVOLUTION STEP
    if (state.currentStep > 0 && state.currentStep % 10 === 0) {
      evolveStrategies(agents);
    }

    for (let agent of agents) {
      agentUpdates.push({
        updateOne: {
          filter: { _id: agent._id },
          update: {
            belief: agent.belief,
            performanceScore: agent.performanceScore,
            strategy: agent.strategy,
            riskTolerance: agent.riskTolerance
          }
        }
      });
    }

    // 9. PERSISTENCE
    await Market.updateOne({ _id: market._id }, { $set: marketUpdateFields });
    if (orders.length > 0) await Order.insertMany(orders);
    if (agentUpdates.length > 0) await Agent.bulkWrite(agentUpdates);
    
    await SimulationState.updateOne(
      { _id: state._id },
      {
        $inc: { currentStep: 1 },
        $push: { priceHistory: newPrice },
        $set: { updatedAt: Date.now() },
      }
    );

  } catch (error) {
    console.error('Error in simulation tick:', error);
  }
}

function startSimulation() {
  if (simulationInterval) return;
  console.log('Starting Advanced Multi-Agent Market simulation...');
  simulationInterval = setInterval(runSimulationTick, 2000);
}

module.exports = { startSimulation };
