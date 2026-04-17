'use strict';

const Market = require('../models/Market');
const Agent = require('../models/Agent');
const Order = require('../models/Order');
const SimulationState = require('../models/SimulationState');

// ── Constants ─────────────────────────────────────────────
const TICK_INTERVAL_MS = 2000;
const AGENT_COUNT = 10;
const AGENT_TYPES = ['greedy', 'fearful', 'rational'];
const INITIAL_PRICE = 100;
const PRICE_IMPACT_FACTOR = 0.1;

// Singleton guard — ensures only one interval ever runs
let _intervalId = null;

// ── Helpers ───────────────────────────────────────────────

/** Clamp a value between min and max */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Pick a random element from an array */
const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Spread between 0 and range, centred around base */
const jitter = (base, range) => base + (Math.random() - 0.5) * range;

// ── Bootstrap helpers ─────────────────────────────────────

/**
 * Load SimulationState from DB.
 * If none exists, create a fresh one at step 0 with price = 100.
 */
async function getOrCreateSimulationState() {
  let state = await SimulationState.findOne();
  if (!state) {
    console.log('🆕 No existing simulation state found — starting fresh at price 100');
    state = await SimulationState.create({
      currentStep: 0,
      priceHistory: [INITIAL_PRICE],
      isRunning: true,
      updatedAt: new Date(),
    });
  }
  return state;
}

/**
 * Ensure exactly AGENT_COUNT agents exist in the DB.
 * Creates missing agents with random types and jittered starting emotions.
 */
async function ensureAgents() {
  const existing = await Agent.countDocuments();
  const needed = AGENT_COUNT - existing;
  if (needed <= 0) return;

  const toCreate = Array.from({ length: needed }, () => {
    const type = randomFrom(AGENT_TYPES);
    return {
      type,
      cash: jitter(10000, 4000),
      assets: Math.floor(jitter(50, 30)),
      fearLevel: clamp(type === 'fearful' ? jitter(0.55, 0.3) : jitter(0.3, 0.2), 0, 1),
      greedLevel: clamp(type === 'greedy' ? jitter(0.55, 0.3) : jitter(0.3, 0.2), 0, 1),
    };
  });

  await Agent.insertMany(toCreate);
  console.log(`✅ Created ${needed} new agent(s)`);
}

/**
 * Ensure a Market document exists. Returns the document.
 */
async function getOrCreateMarket(initialPrice) {
  let market = await Market.findOne();
  if (!market) {
    market = await Market.create({
      currentPrice: initialPrice,
      state: 'stable',
      updatedAt: new Date(),
    });
  }
  return market;
}

// ── Decision logic ────────────────────────────────────────

/**
 * Decide what an agent does this tick.
 * Returns { decision: 'buy'|'sell'|'hold', quantity: Number }
 */
function agentDecision(agent, currentPrice) {
  // Fearful agents override if fear is high enough
  if (agent.fearLevel > 0.6) {
    const qty = Math.floor(agent.assets * 0.3); // sell 30% of holdings
    return { decision: 'sell', quantity: Math.max(qty, 1) };
  }

  if (agent.greedLevel > 0.6) {
    const affordable = Math.floor(agent.cash / currentPrice);
    const qty = Math.max(Math.floor(affordable * 0.3), 1); // buy up to 30% of affordable
    return { decision: 'buy', quantity: qty };
  }

  // Rational agents with moderate fear/greed make smaller moves
  if (agent.type === 'rational') {
    if (agent.greedLevel > 0.45 && agent.cash >= currentPrice) {
      return { decision: 'buy', quantity: 1 };
    }
    if (agent.fearLevel > 0.45 && agent.assets > 0) {
      return { decision: 'sell', quantity: 1 };
    }
  }

  return { decision: 'hold', quantity: 0 };
}

// ── Emotion update ────────────────────────────────────────

/**
 * Adjust agent emotions based on price delta.
 * Returns { fearLevel, greedLevel } (clamped to [0, 1]).
 */
function updatedEmotions(agent, priceDelta) {
  let { fearLevel, greedLevel } = agent;

  if (priceDelta < 0) {
    // Price dropped → more fear, less greed
    fearLevel += Math.abs(priceDelta) * 0.005;
    greedLevel -= Math.abs(priceDelta) * 0.002;
  } else if (priceDelta > 0) {
    // Price rose → more greed, less fear
    greedLevel += priceDelta * 0.005;
    fearLevel -= priceDelta * 0.002;
  } else {
    // Stable → emotions drift back toward baseline
    fearLevel = fearLevel > 0.3 ? fearLevel - 0.01 : fearLevel;
    greedLevel = greedLevel > 0.3 ? greedLevel - 0.01 : greedLevel;
  }

  // Add a tiny random walk to keep things lively
  fearLevel += (Math.random() - 0.5) * 0.02;
  greedLevel += (Math.random() - 0.5) * 0.02;

  return {
    fearLevel: clamp(fearLevel, 0, 1),
    greedLevel: clamp(greedLevel, 0, 1),
  };
}

// ── Market state ──────────────────────────────────────────

/**
 * Determine market state from priceDelta.
 */
function computeMarketState(priceDelta) {
  if (priceDelta >= 2) return 'bull';
  if (priceDelta <= -2) return 'panic';
  return 'stable';
}

// ── Core tick ─────────────────────────────────────────────

async function runTick() {
  try {
    // 1. Load simulation state
    const simState = await getOrCreateSimulationState();
    const lastPrice = simState.priceHistory.at(-1) ?? INITIAL_PRICE;

    // 2. Ensure 10 agents
    await ensureAgents();

    // 3. Load all agents and market
    const agents = await Agent.find();
    const market = await getOrCreateMarket(lastPrice);

    const currentPrice = market.currentPrice;

    // 4. Process each agent's decision
    let buyVolume = 0;
    let sellVolume = 0;
    const ordersToInsert = [];
    const agentUpdates = [];

    for (const agent of agents) {
      const { decision, quantity } = agentDecision(agent, currentPrice);

      ordersToInsert.push({
        agentId: agent._id,
        type: decision,
        quantity,
        price: currentPrice,
        createdAt: new Date(),
      });

      if (decision === 'buy') {
        buyVolume += quantity;
        // Deduct cash, add assets
        agentUpdates.push({
          updateOne: {
            filter: { _id: agent._id },
            update: {
              $inc: {
                cash: -(quantity * currentPrice),
                assets: quantity,
              },
            },
          },
        });
      } else if (decision === 'sell') {
        sellVolume += quantity;
        agentUpdates.push({
          updateOne: {
            filter: { _id: agent._id },
            update: {
              $inc: {
                cash: quantity * currentPrice,
                assets: -quantity,
              },
            },
          },
        });
      }
    }

    // 5. Compute new price
    const rawNewPrice = currentPrice + (buyVolume - sellVolume) * PRICE_IMPACT_FACTOR;
    // Keep price from going below 1 cent
    const newPrice = Math.max(parseFloat(rawNewPrice.toFixed(2)), 0.01);
    const priceDelta = newPrice - currentPrice;

    // 6. Update emotions on all agents
    for (const agent of agents) {
      const emotions = updatedEmotions(agent, priceDelta);
      agentUpdates.push({
        updateOne: {
          filter: { _id: agent._id },
          update: { $set: emotions },
        },
      });
    }

    // 7. Determine market state
    const newMarketState = computeMarketState(priceDelta);

    // 8. Persist everything in parallel
    await Promise.all([
      // Save orders
      Order.insertMany(ordersToInsert),

      // Bulk update agents (cash, assets, emotions)
      agentUpdates.length > 0 ? Agent.bulkWrite(agentUpdates) : Promise.resolve(),

      // Update market
      Market.updateOne(
        { _id: market._id },
        { $set: { currentPrice: newPrice, state: newMarketState, updatedAt: new Date() } }
      ),

      // Update simulation state
      SimulationState.updateOne(
        { _id: simState._id },
        {
          $set: { updatedAt: new Date() },
          $inc: { currentStep: 1 },
          $push: { priceHistory: newPrice },
        }
      ),
    ]);

    console.log(
      `📈 Step ${simState.currentStep + 1} | Price: $${newPrice.toFixed(2)} | ` +
      `State: ${newMarketState} | Buy: ${buyVolume} Sell: ${sellVolume}`
    );
  } catch (err) {
    console.error('❌ Simulation tick error:', err.message);
  }
}

// ── Public API ────────────────────────────────────────────

/**
 * Start the simulation engine.
 * Singleton — safe to call multiple times; only one interval will ever run.
 */
function startSimulation() {
  if (_intervalId !== null) {
    console.log('⚠️  Simulation already running — skipping duplicate start');
    return;
  }

  console.log('🦇 Simulation engine starting…');

  // Run first tick immediately, then every 2 seconds
  runTick();
  _intervalId = setInterval(runTick, TICK_INTERVAL_MS);
}

/**
 * Stop the simulation engine gracefully.
 */
function stopSimulation() {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
    console.log('🛑 Simulation engine stopped');
  }
}

module.exports = { startSimulation, stopSimulation };
