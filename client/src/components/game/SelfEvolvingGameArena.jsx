import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';

// ======================= SELF-EVOLVING GAME ARENA =======================

const SelfEvolvingGameArena = () => {
  // ==================== GAME CONSTANTS ====================
  const ACTION_TYPES = ['EXPLORE', 'OPTIMIZE', 'DISRUPT', 'COOPERATE', 'RANDOMIZE'];
  const BASE_PAYOFFS = {
    EXPLORE: 2,
    OPTIMIZE: 4,
    DISRUPT: 3,
    COOPERATE: 3,
    RANDOMIZE: 1
  };
  const MAX_ROUNDS = 12;

  // ==================== STATE INITIALIZATION ====================
  const [gameState, setGameState] = useState('setup'); // setup, playing, roundEnd, gameOver
  const [round, setRound] = useState(1);
  
  // Player actions
  const [playerAction, setPlayerAction] = useState(null);
  const [aiActions, setAiActions] = useState({ AI1: null, AI2: null, AI3: null });
  
  // Scores
  const [scores, setScores] = useState({
    PLAYER: 0,
    AI1: 0,
    AI2: 0,
    AI3: 0
  });

  // Rule engine
  const [currentRules, setCurrentRules] = useState({
    optimizePenalty: 0,
    cooperationBonus: 0,
    disruptionImpact: 1,
    randomnessProtection: false,
    exploreBenefit: 0,
    chaosAmplification: 1,
    exploitPenalty: 0,
    stabilityBonus: 0
  });

  // Behavior tracking
  const [behaviorHistory, setBehaviorHistory] = useState([]);
  const [actionCounts, setActionCounts] = useState({
    EXPLORE: 0,
    OPTIMIZE: 0,
    DISRUPT: 0,
    COOPERATE: 0,
    RANDOMIZE: 0
  });

  // Round results
  const [roundResults, setRoundResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Advisor
  const [advisorInsights, setAdvisorInsights] = useState(null);
  const [strategyAdvice, setStrategyAdvice] = useState(null);

  // UI State
  const [showRulePanel, setShowRulePanel] = useState(true);
  const [showStrategyPanel, setShowStrategyPanel] = useState(true);
  const [ruleChangeHistory, setRuleChangeHistory] = useState([]);

  // ==================== RULE ENGINE ====================

  const analyzePlayerBehavior = (history) => {
    if (history.length === 0) return null;

    const totalRounds = history.length;
    const counts = { EXPLORE: 0, OPTIMIZE: 0, DISRUPT: 0, COOPERATE: 0, RANDOMIZE: 0 };

    history.forEach((round) => {
      counts[round.allActions.PLAYER]++;
    });

    const percentages = {};
    Object.keys(counts).forEach((action) => {
      percentages[action] = (counts[action] / totalRounds) * 100;
    });

    // Detect dominant strategy
    let dominantAction = null;
    let dominantPercentage = 0;
    Object.entries(percentages).forEach(([action, pct]) => {
      if (pct > dominantPercentage) {
        dominantAction = action;
        dominantPercentage = pct;
      }
    });

    // Detect repetition pattern
    let repetitionScore = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].allActions.PLAYER === history[i - 1].allActions.PLAYER) {
        repetitionScore++;
      }
    }
    const repetitionRatio = repetitionScore / Math.max(1, history.length - 1);

    return {
      counts,
      percentages,
      dominantAction,
      dominantPercentage,
      repetitionRatio
    };
  };

  const evolveRules = (behaviorAnalysis, history) => {
    const newRules = { ...currentRules };
    const changes = [];

    if (!behaviorAnalysis) return { newRules, changes };

    const { percentages } = behaviorAnalysis;

    // Detect OPTIMIZE overuse
    if (percentages.OPTIMIZE > 50) {
      newRules.optimizePenalty = Math.min(newRules.optimizePenalty - 1, -3);
      changes.push({
        type: 'penalty',
        message: 'OPTIMIZE penalty increased (overuse detected)',
        value: newRules.optimizePenalty
      });
    } else if (percentages.OPTIMIZE < 20 && newRules.optimizePenalty < 0) {
      newRules.optimizePenalty = Math.min(newRules.optimizePenalty + 1, 0);
      changes.push({
        type: 'bonus',
        message: 'OPTIMIZE penalty reduced',
        value: newRules.optimizePenalty
      });
    }

    // Detect RANDOMIZE usage
    if (percentages.RANDOMIZE > 40) {
      newRules.randomnessProtection = true;
      newRules.stabilityBonus = 2;
      changes.push({
        type: 'bonus',
        message: 'Randomness protection activated',
        value: newRules.stabilityBonus
      });
    } else {
      newRules.randomnessProtection = false;
      newRules.stabilityBonus = 0;
    }

    // Detect COOPERATE patterns
    if (percentages.COOPERATE > 40) {
      newRules.cooperationBonus = Math.min(newRules.cooperationBonus + 1, 3);
      newRules.chaosAmplification = Math.max(newRules.chaosAmplification - 0.5, 0.5);
      changes.push({
        type: 'bonus',
        message: 'Cooperation bonus increased, chaos reduced',
        value: newRules.cooperationBonus
      });
    } else {
      newRules.cooperationBonus = Math.max(newRules.cooperationBonus - 1, 0);
    }

    // Detect DISRUPT patterns
    if (percentages.DISRUPT > 35) {
      newRules.disruptionImpact = Math.min(newRules.disruptionImpact + 0.3, 2);
      newRules.chaosAmplification = Math.min(newRules.chaosAmplification + 0.5, 2.5);
      changes.push({
        type: 'chaos',
        message: 'Disruption impact amplified',
        value: newRules.disruptionImpact
      });
    }

    // Detect EXPLORE patterns
    if (percentages.EXPLORE > 40) {
      newRules.exploreBenefit = Math.min(newRules.exploreBenefit + 1, 2);
      changes.push({
        type: 'bonus',
        message: 'EXPLORE bonus activated',
        value: newRules.exploreBenefit
      });
    }

    // Detect exploitation (high OPTIMIZE + DISRUPT combo)
    const exploitScore = percentages.OPTIMIZE + percentages.DISRUPT;
    if (exploitScore > 60) {
      newRules.exploitPenalty = Math.min(newRules.exploitPenalty - 1, -2);
      changes.push({
        type: 'penalty',
        message: 'Exploitation pattern detected, penalty applied',
        value: newRules.exploitPenalty
      });
    }

    return { newRules, changes };
  };

  // ==================== PAYOFF SYSTEM ====================

  const calculatePayoff = (action, allActions, rules, playerId) => {
    let basePayoff = BASE_PAYOFFS[action];

    // Apply rule modifiers
    let finalPayoff = basePayoff;

    if (action === 'OPTIMIZE') {
      finalPayoff += rules.optimizePenalty;
    }

    if (action === 'RANDOMIZE') {
      if (rules.randomnessProtection) {
        finalPayoff += rules.stabilityBonus;
      }
    }

    if (action === 'EXPLORE') {
      finalPayoff += rules.exploreBenefit;
    }

    if (action === 'COOPERATE') {
      const cooperators = Object.values(allActions).filter((a) => a === 'COOPERATE').length;
      if (cooperators > 2) {
        finalPayoff += rules.cooperationBonus;
      } else {
        finalPayoff = Math.max(1, finalPayoff - 1); // Betrayal penalty
      }
    }

    if (action === 'DISRUPT') {
      finalPayoff *= rules.chaosAmplification;
      finalPayoff += rules.exploitPenalty;
    }

    // Chaos amplification affects all actions
    if (rules.chaosAmplification > 1) {
      const chaosModifier = 1 + (rules.chaosAmplification - 1) * 0.2;
      finalPayoff *= chaosModifier;
    }

    return Math.max(0, Math.round(finalPayoff * 10) / 10);
  };

  // ==================== AI AGENTS ====================

  const generateAI1Actions = (behaviorAnalysis, rules, history) => {
    // Pattern Follower: Observes rules and adapts
    const actions = {};

    if (!behaviorAnalysis) {
      // Random start
      actions.AI1 = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
      return actions;
    }

    // Identify which actions are currently rewarded
    const rewardedActions = [];
    ACTION_TYPES.forEach((action) => {
      const testPayoff = calculatePayoff(action, { test: action }, rules, 'AI1');
      rewardedActions.push({ action, payoff: testPayoff });
    });

    rewardedActions.sort((a, b) => b.payoff - a.payoff);
    const bestAction = rewardedActions[0].action;

    // 70% best action, 30% exploration
    actions.AI1 = Math.random() < 0.7 ? bestAction : ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];

    return actions;
  };

  const generateAI2Actions = (behaviorAnalysis, rules, history) => {
    // Exploiter: Maximizes immediate gain without regard for system
    const actions = {};

    // Always choose the action with highest base payoff
    if (Math.random() < 0.8) {
      actions.AI2 = 'OPTIMIZE'; // High base payoff
    } else {
      actions.AI2 = 'DISRUPT'; // High base payoff, creates chaos
    }

    return actions;
  };

  const generateAI3Actions = (behaviorAnalysis, rules, history) => {
    // Meta-Agent: Predicts future rule changes
    const actions = {};

    if (!behaviorAnalysis) {
      actions.AI3 = 'EXPLORE';
      return actions;
    }

    // Predict which actions will be penalized
    const { percentages } = behaviorAnalysis;

    if (percentages.OPTIMIZE > 45) {
      // OPTIMIZE will likely be penalized next round
      actions.AI3 = 'EXPLORE';
    } else if (percentages.RANDOMIZE > 35) {
      // System might reward randomness
      actions.AI3 = 'RANDOMIZE';
    } else if (percentages.COOPERATE < 30) {
      // Cooperation might be rewarded
      actions.AI3 = 'COOPERATE';
    } else {
      // Play it safe with EXPLORE
      actions.AI3 = 'EXPLORE';
    }

    return actions;
  };

  // ==================== STRATEGY ADVISOR ENGINE ====================

  const predictNextRoundRules = (behaviorAnalysis, currentRules) => {
    // Predict how rules will evolve based on current behavior
    if (!behaviorAnalysis) return currentRules;

    const predictedRules = { ...currentRules };
    const { percentages } = behaviorAnalysis;

    // OPTIMIZE penalty prediction
    if (percentages.OPTIMIZE > 50) {
      predictedRules.optimizePenalty = Math.min(currentRules.optimizePenalty - 1, -3);
    } else if (percentages.OPTIMIZE < 20 && currentRules.optimizePenalty < 0) {
      predictedRules.optimizePenalty = Math.min(currentRules.optimizePenalty + 1, 0);
    }

    // RANDOMIZE prediction
    if (percentages.RANDOMIZE > 40) {
      predictedRules.randomnessProtection = true;
      predictedRules.stabilityBonus = 2;
    } else {
      predictedRules.randomnessProtection = false;
      predictedRules.stabilityBonus = 0;
    }

    // COOPERATE prediction
    if (percentages.COOPERATE > 40) {
      predictedRules.cooperationBonus = Math.min(currentRules.cooperationBonus + 1, 3);
      predictedRules.chaosAmplification = Math.max(currentRules.chaosAmplification - 0.5, 0.5);
    } else {
      predictedRules.cooperationBonus = Math.max(currentRules.cooperationBonus - 1, 0);
    }

    // DISRUPT prediction
    if (percentages.DISRUPT > 35) {
      predictedRules.disruptionImpact = Math.min(currentRules.disruptionImpact + 0.3, 2);
      predictedRules.chaosAmplification = Math.min(currentRules.chaosAmplification + 0.5, 2.5);
    }

    // EXPLORE prediction
    if (percentages.EXPLORE > 40) {
      predictedRules.exploreBenefit = Math.min(currentRules.exploreBenefit + 1, 2);
    }

    return predictedRules;
  };

  const computeStrategyAdvice = (behaviorAnalysis, rules) => {
    // Game Theory Expected Value Computation
    const LAMBDA = 0.5; // Weight for future impact
    const expectedValues = {};
    const reasoning = [];
    let bestAction = 'EXPLORE';
    let bestEV = -Infinity;

    const actionPercentages = behaviorAnalysis ? behaviorAnalysis.percentages : {};
    const exploitScore = (actionPercentages.OPTIMIZE || 0) + (actionPercentages.DISRUPT || 0);

    // Compute E(action) = Immediate + λ × FutureImpact for each action
    ACTION_TYPES.forEach((action) => {
      // 1. IMMEDIATE PAYOFF
      const immediatePayoff = calculatePayoff(action, { [action]: action }, rules, 'PLAYER');

      // 2. FUTURE IMPACT ESTIMATION
      let futureImpact = 0;

      if (action === 'OPTIMIZE') {
        if ((actionPercentages.OPTIMIZE || 0) > 50) {
          futureImpact = -2; // Penalty coming
        } else if ((actionPercentages.OPTIMIZE || 0) < 20) {
          futureImpact = 0.5; // Bonus opportunity
        }
      } else if (action === 'RANDOMIZE') {
        if ((actionPercentages.RANDOMIZE || 0) > 40) {
          futureImpact = 1.5; // Protection bonus
        } else {
          futureImpact = 0; // Safe choice
        }
      } else if (action === 'COOPERATE') {
        if ((actionPercentages.COOPERATE || 0) > 40) {
          futureImpact = 1; // Bonus incoming
        } else if ((actionPercentages.COOPERATE || 0) < 20) {
          futureImpact = 1.5; // Underused = reward
        }
      } else if (action === 'DISRUPT') {
        if ((actionPercentages.DISRUPT || 0) > 35) {
          futureImpact = -1.5; // Risky
        } else {
          futureImpact = 0.3; // Safe if rare
        }
      } else if (action === 'EXPLORE') {
        if ((actionPercentages.EXPLORE || 0) < 25) {
          futureImpact = 1; // Bonus for underused
        } else if ((actionPercentages.EXPLORE || 0) > 40) {
          futureImpact = 0.8; // Consistent bonus
        }
      }

      // 3. EXPECTED VALUE: E = Immediate + λ × Future
      const expectedValue = immediatePayoff + LAMBDA * futureImpact;
      expectedValues[action] = Math.round(expectedValue * 10) / 10;

      if (expectedValue > bestEV) {
        bestEV = expectedValue;
        bestAction = action;
      }
    });

    // 4. RISK & STRATEGY ANALYSIS
    const evValues = Object.values(expectedValues);
    const maxEV = Math.max(...evValues);
    const minEV = Math.min(...evValues);
    const evVariance = maxEV - minEV;

    let riskLevel = 'Medium';
    let strategyType = 'Adaptive';

    // Determine strategy type
    if (bestAction === 'OPTIMIZE' && evVariance < 1.5) {
      strategyType = 'Greedy';
      reasoning.push('Greedy: Maximum immediate payoff');
    } else if (bestEV > maxEV * 0.9 && evVariance > 2) {
      strategyType = 'Meta';
      reasoning.push('Meta: Future-aware strategy');
    } else if (evVariance < 1) {
      strategyType = 'Safe';
      reasoning.push('Safe: Low-risk selection');
    } else {
      strategyType = 'Adaptive';
      reasoning.push('Adaptive: Balanced approach');
    }

    // Determine risk level
    if (bestAction === 'OPTIMIZE' && (actionPercentages.OPTIMIZE || 0) > 50) {
      riskLevel = 'High';
      reasoning.push('⚠ OPTIMIZE overuse detected');
    } else if (exploitScore > 60) {
      riskLevel = 'High';
      reasoning.push('⚠ Exploitation pattern risky');
    } else if (evVariance > 2.5) {
      riskLevel = 'Medium';
      reasoning.push('Medium: Variable payoffs');
    } else if (bestAction === 'RANDOMIZE' || evVariance < 0.8) {
      riskLevel = 'Low';
      reasoning.push('✓ Low-risk choice');
    }

    // Additional insights
    if (bestAction === 'EXPLORE' && (actionPercentages.EXPLORE || 0) < 30) {
      reasoning.push('Underused = potential bonus next round');
    } else if (bestAction === 'COOPERATE' && (actionPercentages.COOPERATE || 0) > 25) {
      reasoning.push('Cooperation bonus likely building');
    }

    return {
      best_action: bestAction,
      expected_values: expectedValues,
      reasoning,
      risk_level: riskLevel,
      strategy_type: strategyType
    };
  };

  // ==================== ADVISOR SYSTEM ====================

  const generateAdvisorInsights = (behaviorAnalysis, rules, predictedRules) => {
    if (!behaviorAnalysis) {
      return {
        dominant_pattern: 'Game starting - observing player strategy',
        predicted_rule_change: 'Rules will adapt based on behavior',
        recommended_action: 'Choose your first action',
        risk_level: 'Low'
      };
    }

    const { percentages, dominantAction, dominantPercentage } = behaviorAnalysis;

    let pattern = `${dominantAction} usage at ${Math.round(dominantPercentage)}%`;
    let prediction = '';
    let recommendation = '';
    let riskLevel = 'Medium';

    // Analyze dominant pattern and predict consequences
    if (dominantAction === 'OPTIMIZE' && dominantPercentage > 50) {
      prediction = 'OPTIMIZE penalty will increase next round';
      recommendation = 'Switch to EXPLORE or COOPERATE to avoid penalty';
      riskLevel = 'High';
    } else if (dominantAction === 'RANDOMIZE' && dominantPercentage > 40) {
      prediction = 'Randomness protection bonus will activate';
      recommendation = 'Continue RANDOMIZE to gain stability bonus';
      riskLevel = 'Low';
    } else if (dominantAction === 'COOPERATE' && dominantPercentage > 40) {
      prediction = 'Cooperation bonus will increase, chaos will decrease';
      recommendation = 'Be cautious - AI agents may exploit cooperation';
      riskLevel = 'Medium';
    } else if (dominantAction === 'DISRUPT' && dominantPercentage > 35) {
      prediction = 'Disruption impact will amplify, chaos increases';
      recommendation = 'Expect higher volatility in payoffs';
      riskLevel = 'High';
    } else if (dominantAction === 'EXPLORE' && dominantPercentage > 40) {
      prediction = 'EXPLORE bonus will activate';
      recommendation = 'Maintain exploration strategy';
      riskLevel = 'Low';
    }

    // Detect exploitation patterns
    const exploitScore = percentages.OPTIMIZE + percentages.DISRUPT;
    if (exploitScore > 60) {
      recommendation = 'Exploitation detected - system will impose penalties next round';
      riskLevel = 'High';
    }

    return {
      dominant_pattern: pattern,
      predicted_rule_change: prediction || 'Rules adjusting to behavior patterns',
      recommended_action: recommendation || 'Diversify action selection',
      risk_level: riskLevel
    };
  };

  // ==================== GAME FLOW ====================

  const executeRound = (playerAct) => {
    // Generate AI actions
    const behaviorAnalysis = analyzePlayerBehavior(behaviorHistory);
    const ai1Act = generateAI1Actions(behaviorAnalysis, currentRules, behaviorHistory);
    const ai2Act = generateAI2Actions(behaviorAnalysis, currentRules, behaviorHistory);
    const ai3Act = generateAI3Actions(behaviorAnalysis, currentRules, behaviorHistory);

    const allActions = {
      PLAYER: playerAct,
      AI1: ai1Act.AI1,
      AI2: ai2Act.AI2,
      AI3: ai3Act.AI3
    };

    // Calculate payoffs
    const payoffs = {};
    Object.entries(allActions).forEach(([player, action]) => {
      payoffs[player] = calculatePayoff(action, allActions, currentRules, player);
    });

    // Update scores
    const newScores = {
      PLAYER: scores.PLAYER + payoffs.PLAYER,
      AI1: scores.AI1 + payoffs.AI1,
      AI2: scores.AI2 + payoffs.AI2,
      AI3: scores.AI3 + payoffs.AI3
    };

    // Update behavior history
    const newHistory = [
      ...behaviorHistory,
      { round, allActions, payoffs }
    ];

    // Count actions for tracking
    const newActionCounts = { ...actionCounts };
    Object.entries(allActions).forEach(([player, action]) => {
      if (player === 'PLAYER') {
        newActionCounts[action]++;
      }
    });

    // Evolve rules
    const newBehaviorAnalysis = analyzePlayerBehavior(newHistory);
    const { newRules, changes } = evolveRules(newBehaviorAnalysis, newHistory);

    // Generate advisor insights
    const insights = generateAdvisorInsights(newBehaviorAnalysis, newRules, newRules);

    // Compute strategy advice for current state (will be used if player continues)
    const advice = computeStrategyAdvice(newBehaviorAnalysis, newRules);
    setStrategyAdvice(advice);

    // Store round results
    const results = {
      round,
      allActions,
      payoffs,
      ruleChanges: changes,
      newRules
    };

    setRoundResults(results);
    setShowResults(true);
    setScores(newScores);
    setBehaviorHistory(newHistory);
    setActionCounts(newActionCounts);
    setCurrentRules(newRules);
    setAdvisorInsights(insights);
    setRuleChangeHistory([...ruleChangeHistory, ...changes]);
    setAiActions(ai1Act);

    // Move to next round or end game
    if (round >= MAX_ROUNDS) {
      setGameState('gameOver');
    } else {
      setTimeout(() => {
        setShowResults(false);
        setRound(round + 1);
        setPlayerAction(null);
        // Compute strategy advice for next round
        const nextAdvice = computeStrategyAdvice(newBehaviorAnalysis, newRules);
        setStrategyAdvice(nextAdvice);
      }, 3000);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setRound(1);
    // Initialize strategy advice for round 1
    const initialAdvice = computeStrategyAdvice(null, currentRules);
    setStrategyAdvice(initialAdvice);
  };

  const restartGame = () => {
    setGameState('setup');
    setRound(1);
    setPlayerAction(null);
    setAiActions({ AI1: null, AI2: null, AI3: null });
    setScores({ PLAYER: 0, AI1: 0, AI2: 0, AI3: 0 });
    setCurrentRules({
      optimizePenalty: 0,
      cooperationBonus: 0,
      disruptionImpact: 1,
      randomnessProtection: false,
      exploreBenefit: 0,
      chaosAmplification: 1,
      exploitPenalty: 0,
      stabilityBonus: 0
    });
    setBehaviorHistory([]);
    setActionCounts({ EXPLORE: 0, OPTIMIZE: 0, DISRUPT: 0, COOPERATE: 0, RANDOMIZE: 0 });
    setRoundResults(null);
    setShowResults(false);
    setAdvisorInsights(null);
    setStrategyAdvice(null);
    setRuleChangeHistory([]);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-display text-2xl sm:text-3xl text-batman-yellow tracking-widest">
          🌀 SELF-EVOLVING GAME ARENA
        </h2>
        <p className="text-batman-muted font-mono text-xs sm:text-sm">
          The game evolves based on your choices. Master adaptation and predict system changes.
        </p>
      </div>

      {/* Setup Screen */}
      {gameState === 'setup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <GlassCard className="p-8 text-center space-y-6">
            <div className="space-y-3">
              <h3 className="font-display text-xl text-batman-yellow">Game Overview</h3>
              <div className="space-y-2 text-sm text-batman-muted font-mono text-left max-w-2xl mx-auto">
                <p><strong>Objective:</strong> Maximize your score while the game adapts to your strategy</p>
                <p className="pt-3"><strong>Available Actions:</strong></p>
                <p className="pl-4">🔍 EXPLORE - Discover opportunities (+2, safe)</p>
                <p className="pl-4">⚡ OPTIMIZE - Maximize gain (+4, risky if overused)</p>
                <p className="pl-4">💥 DISRUPT - Destabilize system (+3, affects others)</p>
                <p className="pl-4">🤝 COOPERATE - Shared reward if others cooperate (+3)</p>
                <p className="pl-4">🎲 RANDOMIZE - Unpredictable (+1, avoids patterns)</p>
                <p className="pt-3"><strong>The Catch:</strong> The system observes your patterns and changes rules to counter them!</p>
                <p className="pt-3"><strong>3 AI Agents:</strong></p>
                <p className="pl-4">🔴 AI1 (Pattern Follower) - Adapts to current rules</p>
                <p className="pl-4">🔵 AI2 (Exploiter) - Maximizes short-term gain</p>
                <p className="pl-4">🟢 AI3 (Meta-Agent) - Predicts rule changes</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-8 py-3 bg-batman-yellow/20 border-2 border-batman-yellow text-batman-yellow rounded-lg font-display font-semibold tracking-widest uppercase hover:bg-batman-yellow/30 transition-all"
            >
              Start Game
            </motion.button>
          </GlassCard>
        </motion.div>
      )}

      {/* Playing State */}
      {gameState === 'playing' && !showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Round Info */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">ROUND</p>
                <p className="font-display text-3xl text-batman-yellow">{round}/{MAX_ROUNDS}</p>
              </div>
              <div>
                <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">YOUR SCORE</p>
                <p className="font-display text-3xl text-batman-yellow">{scores.PLAYER}</p>
              </div>
              <div>
                <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">AI AVG</p>
                <p className="font-display text-3xl text-gray-400">
                  {((scores.AI1 + scores.AI2 + scores.AI3) / 3).toFixed(1)}
                </p>
              </div>
            </div>
            <motion.div className="h-1 bg-batman-border/30 rounded overflow-hidden">
              <motion.div
                className="h-full bg-batman-yellow"
                initial={{ width: '0%' }}
                animate={{ width: `${(round / MAX_ROUNDS) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          </GlassCard>

          {/* Rule Display Panel */}
          {showRulePanel && (
            <GlassCard className="p-4 bg-batman-border/20">
              <div className="flex justify-between items-center mb-3">
                <p className="text-batman-yellow font-mono text-xs font-semibold tracking-widest">CURRENT RULES</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowRulePanel(!showRulePanel)}
                  className="text-batman-muted hover:text-batman-yellow text-xs"
                >
                  ✕
                </motion.button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(currentRules).map(([rule, value]) => {
                  let displayValue = value;
                  if (typeof value === 'boolean') {
                    displayValue = value ? '✓ ON' : '✗ OFF';
                  } else if (typeof value === 'number') {
                    displayValue = value > 0 ? `+${value}` : `${value}`;
                  }

                  const color = value < 0 ? '#ef4444' : value > 0 ? '#10b981' : '#6b7280';

                  return (
                    <div key={rule} className="p-2 bg-black/40 border border-batman-border/30 rounded">
                      <p className="text-batman-muted font-mono text-[10px] mb-1">{rule}</p>
                      <p style={{ color }} className="font-semibold">
                        {displayValue}
                      </p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Action Selection Panel */}
          <GlassCard className="p-6">
            <p className="text-batman-yellow font-display text-lg mb-4 tracking-widest">Choose Your Action</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ACTION_TYPES.map((action) => (
                <motion.button
                  key={action}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlayerAction(action)}
                  className={`py-3 px-2 rounded-lg font-mono text-xs font-semibold tracking-widest transition-all ${
                    playerAction === action
                      ? 'bg-batman-yellow/30 border-2 border-batman-yellow text-batman-yellow'
                      : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
                  }`}
                >
                  {action.charAt(0)}{action.slice(1).toLowerCase()}
                </motion.button>
              ))}
            </div>

            {/* Action Description */}
            {playerAction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-batman-yellow/10 border border-batman-yellow/50 rounded-lg"
              >
                <p className="text-batman-yellow font-semibold text-sm mb-2">{playerAction}</p>
                <p className="text-batman-muted text-xs font-mono">
                  {playerAction === 'EXPLORE' && 'Base Payoff: +2 | Medium risk. Discovers opportunities.'}
                  {playerAction === 'OPTIMIZE' && 'Base Payoff: +4 | High risk. Repeated use triggers penalties.'}
                  {playerAction === 'DISRUPT' && 'Base Payoff: +3 | Destabilizes others. System responds with amp.'}
                  {playerAction === 'COOPERATE' && 'Base Payoff: +3 if others cooperate. Risk: Betrayal.'}
                  {playerAction === 'RANDOMIZE' && 'Base Payoff: +1 | Avoids pattern detection. Safe choice.'}
                </p>
              </motion.div>
            )}
          </GlassCard>

          {/* Strategy Advice Panel (Game Theory Engine) */}
          {strategyAdvice && (
            <GlassCard className="p-4 bg-batman-border/20 border-l-4" style={{ borderLeftColor: '#fbbf24' }}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-batman-yellow font-mono text-xs font-semibold tracking-widest">📊 GAME THEORY ADVISOR</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowStrategyPanel(!showStrategyPanel)}
                  className="text-batman-muted hover:text-batman-yellow text-xs"
                >
                  {showStrategyPanel ? '▼' : '▶'}
                </motion.button>
              </div>

              {showStrategyPanel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 text-xs font-mono"
                >
                  {/* Best Action Recommendation */}
                  <div className="p-3 bg-black/40 border border-batman-yellow/50 rounded-lg">
                    <p className="text-batman-muted mb-1">OPTIMAL ACTION (Expected Value):</p>
                    <motion.p
                      className="text-batman-yellow font-semibold text-sm"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      {strategyAdvice.best_action} (E={strategyAdvice.expected_values[strategyAdvice.best_action]})
                    </motion.p>
                  </div>

                  {/* Expected Values for All Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {ACTION_TYPES.map((action) => (
                      <div
                        key={action}
                        className={`p-2 rounded border text-center transition-all ${
                          action === strategyAdvice.best_action
                            ? 'bg-batman-yellow/20 border-batman-yellow text-batman-yellow'
                            : 'bg-black/40 border-batman-border/50 text-batman-muted'
                        }`}
                      >
                        <p className="text-[10px] font-semibold">{action.slice(0, 3)}</p>
                        <p className="text-sm font-bold">E={strategyAdvice.expected_values[action]}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strategy Type & Risk */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-black/40 border border-batman-border/50 rounded">
                      <p className="text-batman-muted text-[10px] mb-1">STRATEGY</p>
                      <p className="text-batman-yellow font-semibold">{strategyAdvice.strategy_type}</p>
                    </div>
                    <div
                      className="p-2 border rounded"
                      style={{
                        backgroundColor:
                          strategyAdvice.risk_level === 'Low'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : strategyAdvice.risk_level === 'High'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(251, 191, 36, 0.1)',
                        borderColor:
                          strategyAdvice.risk_level === 'Low'
                            ? '#10b981'
                            : strategyAdvice.risk_level === 'High'
                            ? '#ef4444'
                            : '#fbbf24'
                      }}
                    >
                      <p className="text-[10px] mb-1" style={{
                        color:
                          strategyAdvice.risk_level === 'Low'
                            ? '#10b981'
                            : strategyAdvice.risk_level === 'High'
                            ? '#ef4444'
                            : '#fbbf24'
                      }}>RISK</p>
                      <p
                        className="font-semibold text-xs"
                        style={{
                          color:
                            strategyAdvice.risk_level === 'Low'
                              ? '#10b981'
                              : strategyAdvice.risk_level === 'High'
                              ? '#ef4444'
                              : '#fbbf24'
                        }}
                      >
                        {strategyAdvice.risk_level}
                      </p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <p className="text-batman-yellow font-semibold mb-1 text-[10px]">REASONING:</p>
                    <div className="space-y-1">
                      {strategyAdvice.reasoning.map((reason, idx) => (
                        <motion.p
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="text-batman-muted text-[10px] pl-2 border-l border-batman-border/50"
                        >
                          • {reason}
                        </motion.p>
                      ))}
                    </div>
                  </div>

                  {/* Formula Info */}
                  <div className="p-2 bg-black/60 border border-batman-border/30 rounded text-[9px] text-batman-muted">
                    <p>E(action) = Immediate + 0.5 × FutureImpact</p>
                  </div>
                </motion.div>
              )}
            </GlassCard>
          )}

          {/* Advisor Panel */}
          {advisorInsights && (
            <GlassCard className="p-4 bg-batman-border/20">
              <p className="text-batman-yellow font-mono text-xs font-semibold tracking-widest mb-3">ADVISOR INSIGHTS</p>
              <div className="space-y-2 text-xs text-batman-muted font-mono">
                <div>
                  <p className="text-batman-yellow font-semibold mb-1">Pattern Detected:</p>
                  <p>{advisorInsights.dominant_pattern}</p>
                </div>
                <div>
                  <p className="text-batman-yellow font-semibold mb-1">Predicted Rule Change:</p>
                  <p>{advisorInsights.predicted_rule_change}</p>
                </div>
                <div>
                  <p className="text-batman-yellow font-semibold mb-1">Recommendation:</p>
                  <p>{advisorInsights.recommended_action}</p>
                </div>
                <div className="pt-2 border-t border-batman-border/30">
                  <p
                    className="font-semibold"
                    style={{
                      color:
                        advisorInsights.risk_level === 'High'
                          ? '#ef4444'
                          : advisorInsights.risk_level === 'Medium'
                          ? '#fbbf24'
                          : '#10b981'
                    }}
                  >
                    Risk Level: {advisorInsights.risk_level}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Execute Button */}
          <motion.button
            whileHover={{ scale: playerAction ? 1.02 : 1 }}
            whileTap={{ scale: playerAction ? 0.98 : 1 }}
            onClick={() => playerAction && executeRound(playerAction)}
            disabled={!playerAction}
            className={`w-full py-3 rounded-lg font-display font-semibold tracking-widest uppercase transition-all ${
              playerAction
                ? 'bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow hover:bg-batman-yellow/30'
                : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted cursor-not-allowed'
            }`}
          >
            Execute Round
          </motion.button>
        </motion.div>
      )}

      {/* Results Screen */}
      {showResults && roundResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <GlassCard className="p-6">
            <p className="text-batman-yellow font-display text-xl mb-4 tracking-widest">ROUND {roundResults.round} RESULTS</p>

            {/* Actions Taken */}
            <div className="mb-6 p-4 bg-black/40 border border-batman-border/50 rounded-lg">
              <p className="text-batman-yellow font-semibold text-sm mb-3">Actions Taken:</p>
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(roundResults.allActions).map(([player, action]) => (
                  <div key={player} className="flex justify-between">
                    <span className="text-batman-muted">{player}:</span>
                    <span className="text-batman-yellow font-semibold">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payoffs */}
            <div className="mb-6 p-4 bg-black/40 border border-batman-border/50 rounded-lg">
              <p className="text-batman-yellow font-semibold text-sm mb-3">Round Payoffs:</p>
              <div className="space-y-2 text-xs font-mono">
                {Object.entries(roundResults.payoffs).map(([player, payoff]) => (
                  <div key={player} className="flex justify-between">
                    <span className="text-batman-muted">{player}:</span>
                    <span style={{ color: payoff > 2 ? '#10b981' : payoff > 1 ? '#fbbf24' : '#ef4444' }} className="font-semibold">
                      +{payoff}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rule Changes */}
            {roundResults.ruleChanges.length > 0 && (
              <div className="p-4 bg-batman-border/20 border border-batman-border/50 rounded-lg">
                <p className="text-batman-yellow font-semibold text-sm mb-3">⚙ System Adapted:</p>
                <div className="space-y-2">
                  {roundResults.ruleChanges.map((change, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-xs font-mono"
                      style={{
                        color: change.type === 'penalty' ? '#ef4444' : change.type === 'chaos' ? '#ff8c00' : '#10b981'
                      }}
                    >
                      • {change.message}
                    </motion.p>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          <p className="text-center text-batman-muted font-mono text-xs">Next round in 3 seconds...</p>
        </motion.div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <GlassCard className="p-8 text-center space-y-6">
            <h3 className="font-display text-2xl text-batman-yellow tracking-widest">GAME OVER</h3>

            {/* Final Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'YOU', score: scores.PLAYER, color: '#fbbf24' },
                { name: 'AI1', score: scores.AI1, color: '#ef4444' },
                { name: 'AI2', score: scores.AI2, color: '#3b82f6' },
                { name: 'AI3', score: scores.AI3, color: '#10b981' }
              ].map((player, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-black/40 border border-batman-border/50 rounded-lg"
                >
                  <p className="text-batman-muted font-mono text-xs mb-2">{player.name}</p>
                  <p style={{ color: player.color }} className="font-display text-2xl">
                    {player.score}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Winner */}
            {(() => {
              const maxScore = Math.max(scores.PLAYER, scores.AI1, scores.AI2, scores.AI3);
              const winner = Object.entries(scores).find(([, s]) => s === maxScore)?.[0];
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="pt-4 border-t border-batman-border/50"
                >
                  {winner === 'PLAYER' ? (
                    <p className="font-display text-xl text-batman-yellow tracking-widest">
                      🏆 YOU MASTERED THE SYSTEM! 🏆
                    </p>
                  ) : (
                    <p className="font-display text-lg text-batman-muted tracking-widest">
                      {winner} ADAPTED BETTER - Try a different strategy next time
                    </p>
                  )}
                </motion.div>
              );
            })()}

            {/* Statistics */}
            <div className="pt-4 border-t border-batman-border/50 space-y-2 text-xs text-batman-muted font-mono">
              <p>Your most used action: <span className="text-batman-yellow font-semibold">{
                Object.entries(actionCounts).reduce((max, [action, count]) => count > max[1] ? [action, count] : max, ['NONE', 0])[0]
              }</span></p>
              <p>Total rule changes: <span className="text-batman-yellow font-semibold">{ruleChangeHistory.length}</span></p>
            </div>

            {/* Restart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartGame}
              className="px-8 py-3 bg-batman-yellow/20 border-2 border-batman-yellow text-batman-yellow rounded-lg font-display font-semibold tracking-widest uppercase hover:bg-batman-yellow/30 transition-all"
            >
              Play Again
            </motion.button>
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

export default SelfEvolvingGameArena;
