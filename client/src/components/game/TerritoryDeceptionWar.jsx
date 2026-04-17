import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';

// ======================= TERRITORY WAR GAME COMPONENT =======================

const TerritoryDeceptionWar = () => {
  // ==================== INITIAL TERRITORY SETUP ====================
  const initializeTerritories = () => [
    { id: 1, name: 'Alpha', value: 10, defense: 2, owner: 'neutral', x: 20, y: 20 },
    { id: 2, name: 'Beta', value: 8, defense: 3, owner: 'neutral', x: 70, y: 25 },
    { id: 3, name: 'Gamma', value: 12, defense: 2, owner: 'neutral', x: 45, y: 50 },
    { id: 4, name: 'Delta', value: 6, defense: 1, owner: 'neutral', x: 25, y: 75 },
    { id: 5, name: 'Epsilon', value: 9, defense: 2, owner: 'neutral', x: 75, y: 70 },
    { id: 6, name: 'Zeta', value: 11, defense: 3, owner: 'neutral', x: 50, y: 80 },
    { id: 7, name: 'Eta', value: 7, defense: 2, owner: 'neutral', x: 15, y: 50 },
  ];

  // ==================== STATE MANAGEMENT ====================
  const [gameState, setGameState] = useState('setup'); // setup, playing, resolution, gameOver
  const [turn, setTurn] = useState(1);
  const maxTurns = 10;
  const [territories, setTerritories] = useState(initializeTerritories());
  
  // Player actions state
  const [playerActions, setPlayerActions] = useState({});
  const [aiActions, setAiActions] = useState({ AI1: {}, AI2: {}, AI3: {} });
  
  // Turn results
  const [turnResults, setTurnResults] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  
  // Scores
  const [scores, setScores] = useState({
    PLAYER: 0,
    AI1: 0,
    AI2: 0,
    AI3: 0
  });

  // Action history for AI learning
  const [actionHistory, setActionHistory] = useState({
    PLAYER: [],
    AI1: [],
    AI2: [],
    AI3: []
  });

  // Advisor insights
  const [advisorInsights, setAdvisorInsights] = useState(null);

  // UI State
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionsRemaining, setActionsRemaining] = useState(2);
  const [showAdvicePanel, setShowAdvicePanel] = useState(false);

  // ==================== GAME THEORY & UTILITY FUNCTIONS ====================

  // Calculate Nash equilibrium mixed strategy probabilities
  const calculateMixedStrategy = (player, territories, history) => {
    const strategy = {
      ATTACK: 0.3,
      DEFEND: 0.3,
      FORTIFY: 0.2,
      BLUFF: 0.2
    };

    // Adjust based on player history
    if (history.length > 0) {
      const avgAttack = history.filter(a => a.action === 'ATTACK').length / history.length;
      const avgDefend = history.filter(a => a.action === 'DEFEND').length / history.length;
      
      if (avgAttack > 0.4) strategy.ATTACK -= 0.1;
      if (avgDefend > 0.4) strategy.DEFEND -= 0.1;
      if (avgAttack < 0.2) strategy.ATTACK += 0.1;
    }

    // Normalize
    const sum = Object.values(strategy).reduce((a, b) => a + b, 0);
    Object.keys(strategy).forEach(key => {
      strategy[key] /= sum;
    });

    return strategy;
  };

  // Select action based on mixed strategy
  const selectActionFromStrategy = (strategy) => {
    const rand = Math.random();
    let cumulative = 0;
    for (let [action, probability] of Object.entries(strategy)) {
      cumulative += probability;
      if (rand <= cumulative) return action;
    }
    return 'DEFEND';
  };

  // ==================== AI AGENT STRATEGIES ====================

  const generateAI1Actions = (territories, history) => {
    // Opportunist: Attacks weakest territories
    const actions = {};
    const weakTerritories = territories
      .filter(t => t.owner !== 'AI1')
      .sort((a, b) => (a.defense + a.value) - (b.defense + b.value))
      .slice(0, 2);

    weakTerritories.forEach(t => {
      actions[t.id] = 'ATTACK';
    });

    return actions;
  };

  const generateAI2Actions = (territories, history) => {
    // Defender: Protects high-value zones
    const actions = {};
    const ownTerritories = territories.filter(t => t.owner === 'AI2');
    
    const highValueOwned = ownTerritories
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);

    highValueOwned.forEach(t => {
      actions[t.id] = 'DEFEND';
    });

    if (Object.keys(actions).length === 0) {
      // If no owned territories, attack
      const unowned = territories.filter(t => t.owner !== 'AI2');
      if (unowned.length > 0) {
        actions[unowned[0].id] = 'ATTACK';
      }
    }

    return actions;
  };

  const generateAI3Actions = (territories, history) => {
    // Adaptive: Mixed strategy based on game state
    const actions = {};
    const strategy = calculateMixedStrategy('AI3', territories, actionHistory.AI3);
    
    // Select 2 territories to act on
    const targetTerritories = territories.slice(0, 2);
    
    targetTerritories.forEach(t => {
      const action = selectActionFromStrategy(strategy);
      actions[t.id] = action;
    });

    return actions;
  };

  // ==================== CONFLICT RESOLUTION ====================

  const resolveConflicts = (territories, playerActs, ai1Acts, ai2Acts, ai3Acts) => {
    const allActions = {
      PLAYER: playerActs,
      AI1: ai1Acts,
      AI2: ai2Acts,
      AI3: ai3Acts
    };

    const newTerritories = territories.map(t => ({ ...t }));
    const results = {};

    // Process each territory
    newTerritories.forEach(territory => {
      results[territory.id] = {
        territoryName: territory.name,
        actions: {},
        outcome: '',
        newOwner: territory.owner,
        previousOwner: territory.owner,
        newDefense: territory.defense
      };

      // Collect all actions for this territory
      const actionsOnTerritory = {};
      Object.entries(allActions).forEach(([player, acts]) => {
        if (acts[territory.id]) {
          actionsOnTerritory[player] = acts[territory.id];
          results[territory.id].actions[player] = acts[territory.id];
        }
      });

      // Resolve conflicts
      const attackers = Object.entries(actionsOnTerritory)
        .filter(([_, action]) => action === 'ATTACK')
        .map(([player, _]) => player);

      const defenders = Object.entries(actionsOnTerritory)
        .filter(([_, action]) => action === 'DEFEND')
        .map(([player, _]) => player);

      const fortifiers = Object.entries(actionsOnTerritory)
        .filter(([_, action]) => action === 'FORTIFY')
        .map(([player, _]) => player);

      const bluffers = Object.entries(actionsOnTerritory)
        .filter(([_, action]) => action === 'BLUFF')
        .map(([player, _]) => player);

      // Calculate effective defense
      let effectiveDefense = territory.defense;
      defenders.forEach(() => effectiveDefense += 2);
      fortifiers.forEach(() => effectiveDefense += 1);

      // Resolve attacks
      if (attackers.length > 0) {
        const strongestAttacker = attackers[0];
        const attackStrength = 5 + Math.floor(Math.random() * 3);

        if (attackStrength > effectiveDefense) {
          results[territory.id].outcome = `${strongestAttacker} captured`;
          results[territory.id].newOwner = strongestAttacker;
          results[territory.id].newDefense = 2;
          const idx = newTerritories.findIndex(t => t.id === territory.id);
          newTerritories[idx].owner = strongestAttacker;
          newTerritories[idx].defense = 2;
        } else {
          results[territory.id].outcome = `Defense held`;
          results[territory.id].newDefense = Math.min(effectiveDefense, 5);
          const idx = newTerritories.findIndex(t => t.id === territory.id);
          newTerritories[idx].defense = results[territory.id].newDefense;
        }
      } else if (fortifiers.length > 0) {
        results[territory.id].outcome = `Fortified`;
        results[territory.id].newDefense = Math.min(territory.defense + 1, 5);
        const idx = newTerritories.findIndex(t => t.id === territory.id);
        newTerritories[idx].defense = results[territory.id].newDefense;
      } else {
        results[territory.id].outcome = `No action`;
      }
    });

    return { territories: newTerritories, results };
  };

  // ==================== SCORING ====================

  const calculateScores = (territories) => {
    const newScores = { PLAYER: 0, AI1: 0, AI2: 0, AI3: 0 };

    territories.forEach(t => {
      if (t.owner !== 'neutral') {
        newScores[t.owner] += t.value;
      }
    });

    return newScores;
  };

  // ==================== ADVISOR SYSTEM ====================

  const generateAdvisorInsights = (currentTerritories, allResults, currentScores, playerActs) => {
    const playerTerrCount = currentTerritories.filter(t => t.owner === 'PLAYER').length;
    const playerScore = currentScores.PLAYER;

    // Detect patterns
    let pattern = '';
    let risk = 'Medium';
    let recommendation = '';
    let aiResponse = '';

    const playerActCount = Object.keys(playerActs).length;
    if (playerActCount === 0) {
      pattern = 'No action taken this turn';
      risk = 'High';
      recommendation = 'Engage with territories to build score';
      aiResponse = 'AI adapting to passive strategy';
    } else if (playerActCount === 2) {
      const actions = Object.values(playerActs);
      const bluffCount = actions.filter(a => a === 'BLUFF').length;
      
      if (bluffCount > 0) {
        pattern = 'Using bluff strategy';
        risk = 'Medium';
        recommendation = 'Mix with real attacks to confuse AI';
        aiResponse = 'AI learning to trust less in signals';
      } else if (actions.filter(a => a === 'ATTACK').length === 2) {
        pattern = 'Aggressive attack strategy detected';
        risk = risk = 'High';
        recommendation = 'Defend more to maintain territories';
        aiResponse = 'AI increasing defense on weak zones';
      } else if (actions.filter(a => a === 'DEFEND').length === 2) {
        pattern = 'Conservative defense pattern';
        risk = 'Low';
        recommendation = 'Attack to expand territory control';
        aiResponse = 'AI taking advantage with targeted attacks';
      }
    }

    // Score comparison
    const aiAvgScore = (currentScores.AI1 + currentScores.AI2 + currentScores.AI3) / 3;
    if (playerScore < aiAvgScore) {
      recommendation += ` | Current score behind AI average (${playerScore} vs ${aiAvgScore.toFixed(1)})`;
      risk = 'High';
    }

    return {
      pattern_detected: pattern || 'Strategic play observed',
      ai_response: aiResponse || 'Awaiting player pattern',
      recommended_strategy: recommendation || 'Diversify actions',
      risk_level: risk,
      playerTerrritories: playerTerrCount,
      playerScore: playerScore
    };
  };

  // ==================== GAME FLOW HANDLERS ====================

  const addPlayerAction = (territoryId, action) => {
    if (Object.keys(playerActions).length >= 2 && !playerActions[territoryId]) {
      alert('Maximum 2 actions per turn reached');
      return;
    }

    const newActions = { ...playerActions };
    if (newActions[territoryId]) {
      delete newActions[territoryId];
    } else {
      newActions[territoryId] = action;
    }
    setPlayerActions(newActions);
    setActionsRemaining(2 - Object.keys(newActions).length);
  };

  const executeTurn = () => {
    // Generate AI actions
    const ai1Acts = generateAI1Actions(territories, actionHistory.AI1);
    const ai2Acts = generateAI2Actions(territories, actionHistory.AI2);
    const ai3Acts = generateAI3Actions(territories, actionHistory.AI3);

    setAiActions({ AI1: ai1Acts, AI2: ai2Acts, AI3: ai3Acts });

    // Resolve conflicts
    const { territories: newTerritories, results } = resolveConflicts(
      territories,
      playerActions,
      ai1Acts,
      ai2Acts,
      ai3Acts
    );

    setTerritories(newTerritories);
    setTurnResults(results);
    setShowingResults(true);

    // Update scores
    const newScores = calculateScores(newTerritories);
    setScores(newScores);

    // Update action history
    setActionHistory({
      PLAYER: [...actionHistory.PLAYER, ...Object.entries(playerActions).map(([tid, act]) => ({ tid, action: act }))],
      AI1: [...actionHistory.AI1, ...Object.entries(ai1Acts).map(([tid, act]) => ({ tid, action: act }))],
      AI2: [...actionHistory.AI2, ...Object.entries(ai2Acts).map(([tid, act]) => ({ tid, action: act }))],
      AI3: [...actionHistory.AI3, ...Object.entries(ai3Acts).map(([tid, act]) => ({ tid, action: act }))]
    });

    // Generate advisor insights
    const insights = generateAdvisorInsights(newTerritories, results, newScores, playerActions);
    setAdvisorInsights(insights);

    // Reset for next turn
    setPlayerActions({});
    setSelectedTerritory(null);
    setSelectedAction(null);
    setActionsRemaining(2);

    // Move to next turn or end game
    if (turn >= maxTurns) {
      setGameState('gameOver');
    } else {
      setTimeout(() => {
        setShowingResults(false);
        setTurn(turn + 1);
      }, 3000);
    }
  };

  const restartGame = () => {
    setGameState('setup');
    setTurn(1);
    setTerritories(initializeTerritories());
    setPlayerActions({});
    setAiActions({ AI1: {}, AI2: {}, AI3: {} });
    setTurnResults(null);
    setShowingResults(false);
    setScores({ PLAYER: 0, AI1: 0, AI2: 0, AI3: 0 });
    setActionHistory({ PLAYER: [], AI1: [], AI2: [], AI3: [] });
    setAdvisorInsights(null);
    setSelectedTerritory(null);
    setSelectedAction(null);
    setActionsRemaining(2);
    setShowAdvicePanel(false);
  };

  const startGame = () => {
    setGameState('playing');
  };

  // ==================== TERRITORY OWNERSHIP COLOR ====================
  const getOwnerColor = (owner) => {
    const colors = {
      PLAYER: '#fbbf24',
      AI1: '#ef4444',
      AI2: '#3b82f6',
      AI3: '#10b981',
      neutral: '#6b7280'
    };
    return colors[owner] || colors.neutral;
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-display text-2xl sm:text-3xl text-batman-yellow tracking-widest">
          ⚔ TERRITORY DECEPTION WAR
        </h2>
        <p className="text-batman-muted font-mono text-xs sm:text-sm">
          Master mixed strategies, bluff your opponents, and control the territories
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
                <p>• <strong>4 Players:</strong> You vs 3 AI agents with different strategies</p>
                <p>• <strong>7 Territories:</strong> Control them to earn points</p>
                <p>• <strong>Simultaneous Actions:</strong> Choose ATTACK, DEFEND, FORTIFY, or BLUFF</p>
                <p>• <strong>Limited Actions:</strong> Max 2 actions per turn</p>
                <p>• <strong>10 Turns:</strong> Highest score wins</p>
                <p className="pt-3"><strong>AI Strategies:</strong></p>
                <p className="pl-4">🔴 AI1 (Opportunist) - Attacks weakest territories</p>
                <p className="pl-4">🔵 AI2 (Defender) - Protects high-value zones</p>
                <p className="pl-4">🟢 AI3 (Adaptive) - Uses mixed strategies</p>
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
      {gameState === 'playing' && !showingResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Turn & Score Info */}
          <GlassCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">TURN</p>
                <p className="font-display text-3xl text-batman-yellow">{turn}/{maxTurns}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">YOU</p>
                  <p className="font-display text-2xl text-batman-yellow">{scores.PLAYER}</p>
                </div>
                <div className="text-center">
                  <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">AI AVG</p>
                  <p className="font-display text-2xl text-gray-400">
                    {((scores.AI1 + scores.AI2 + scores.AI3) / 3).toFixed(1)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-batman-muted font-mono text-xs tracking-widest mb-1">ACTIONS</p>
                <p className="font-display text-2xl text-batman-yellow">{actionsRemaining}/2</p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-1 bg-batman-border/30 rounded overflow-hidden"
            >
              <motion.div
                className="h-full bg-batman-yellow"
                initial={{ width: '0%' }}
                animate={{ width: `${(turn / maxTurns) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          </GlassCard>

          {/* Territory Map */}
          <GlassCard className="p-6">
            <p className="text-batman-muted font-mono text-xs tracking-widest mb-4">TERRITORY MAP</p>
            <div className="relative w-full aspect-video bg-black/40 rounded-lg border border-batman-border/50 overflow-hidden">
              {/* SVG Background Grid */}
              <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
                {/* Territory nodes connection lines */}
                {territories.map((territory, idx) => {
                  const nextTerritory = territories[(idx + 1) % territories.length];
                  return (
                    <line
                      key={`line-${idx}`}
                      x1={territory.x}
                      y1={territory.y}
                      x2={nextTerritory.x}
                      y2={nextTerritory.y}
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>

              {/* Territory Nodes as positioned divs */}
              {territories.map((territory) => {
                const isSelected = selectedTerritory?.id === territory.id;
                return (
                  <motion.div
                    key={territory.id}
                    style={{
                      left: `${territory.x}%`,
                      top: `${territory.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    className="absolute cursor-pointer group"
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedTerritory(territory)}
                  >
                    {/* Circle */}
                    <div
                      style={{
                        width: isSelected ? '24px' : '18px',
                        height: isSelected ? '24px' : '18px',
                        backgroundColor: getOwnerColor(territory.owner),
                        border: isSelected ? '2px solid white' : '1px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      className="rounded-full"
                    />
                    {/* Label */}
                    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] text-white font-mono group-hover:text-batman-yellow transition-colors">
                      {territory.name}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Territory Info */}
            {selectedTerritory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-batman-border/20 rounded-lg border border-batman-border/50"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-display text-lg text-batman-yellow">{selectedTerritory.name}</h4>
                    <p className="text-batman-muted font-mono text-xs mt-1">
                      Owner:
                      <span
                        style={{
                          color: getOwnerColor(selectedTerritory.owner),
                          marginLeft: '0.5rem'
                        }}
                        className="font-bold"
                      >
                        {selectedTerritory.owner}
                      </span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-batman-muted font-mono text-xs">Value: {selectedTerritory.value} pts</p>
                    <p className="text-batman-muted font-mono text-xs">Defense: {selectedTerritory.defense}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {['ATTACK', 'DEFEND', 'FORTIFY', 'BLUFF'].map((action) => (
                    <motion.button
                      key={action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addPlayerAction(selectedTerritory.id, action)}
                      className={`py-2 px-3 rounded text-xs font-mono font-semibold tracking-wide transition-all ${
                        playerActions[selectedTerritory.id] === action
                          ? 'bg-batman-yellow/30 border-2 border-batman-yellow text-batman-yellow'
                          : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
                      }`}
                      disabled={actionsRemaining === 0 && playerActions[selectedTerritory.id] !== action}
                    >
                      {action.charAt(0)}
                    </motion.button>
                  ))}
                </div>

                {playerActions[selectedTerritory.id] && (
                  <p className="text-batman-yellow text-xs font-mono mt-3">
                    ✓ {playerActions[selectedTerritory.id]} selected
                  </p>
                )}
              </motion.div>
            )}
          </GlassCard>

          {/* Action Summary */}
          {Object.keys(playerActions).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-batman-yellow/10 border border-batman-yellow/50 rounded-lg space-y-2"
            >
              <p className="font-mono text-xs text-batman-yellow font-semibold">YOUR MOVES:</p>
              {Object.entries(playerActions).map(([tidStr, action]) => {
                const tid = parseInt(tidStr);
                const terr = territories.find(t => t.id === tid);
                return (
                  <p key={tid} className="text-batman-muted font-mono text-xs">
                    {terr.name}: <span className="text-batman-yellow">{action}</span>
                  </p>
                );
              })}
            </motion.div>
          )}

          {/* Execute Turn Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={executeTurn}
            className="w-full py-3 bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow rounded-lg font-display font-semibold tracking-widest uppercase hover:bg-batman-yellow/30 transition-all"
          >
            Execute Turn
          </motion.button>

          {/* Advisor Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdvicePanel(!showAdvicePanel)}
            className="w-full py-2 bg-black/40 border-2 border-batman-border/50 text-batman-muted rounded-lg font-mono text-xs font-semibold tracking-widest uppercase hover:border-batman-yellow/50 transition-all"
          >
            {showAdvicePanel ? '← Hide' : '→'} Advisor Insights
          </motion.button>

          {/* Advisor Panel */}
          {showAdvicePanel && advisorInsights && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-batman-border/20 border border-batman-border/50 rounded-lg space-y-3 text-xs"
            >
              <div>
                <p className="text-batman-yellow font-semibold mb-1">Pattern Detected:</p>
                <p className="text-batman-muted">{advisorInsights.pattern_detected}</p>
              </div>
              <div>
                <p className="font-semibold mb-1" style={{ color: advisorInsights.risk_level === 'High' ? '#ef4444' : '#fbbf24' }}>
                  Risk Level: {advisorInsights.risk_level}
                </p>
              </div>
              <div>
                <p className="text-batman-yellow font-semibold mb-1">AI Response:</p>
                <p className="text-batman-muted">{advisorInsights.ai_response}</p>
              </div>
              <div>
                <p className="text-batman-yellow font-semibold mb-1">Recommendation:</p>
                <p className="text-batman-muted">{advisorInsights.recommended_strategy}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results Screen */}
      {showingResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <GlassCard className="p-6">
            <p className="text-batman-yellow font-display text-xl mb-4 tracking-widest">TURN {turn} RESULTS</p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {turnResults && Object.values(turnResults).map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 bg-black/40 border border-batman-border/50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-display text-batman-yellow">{result.territoryName}</h4>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        result.newOwner === result.previousOwner
                          ? 'bg-batman-border/30 text-batman-muted'
                          : 'bg-batman-yellow/20 text-batman-yellow'
                      }`}
                    >
                      {result.outcome}
                    </span>
                  </div>
                  <div className="text-xs text-batman-muted font-mono space-y-1">
                    {Object.entries(result.actions).map(([player, action]) => (
                      <p key={player}>
                        {player}: <span className="text-batman-yellow">{action}</span>
                      </p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Continue next turn */}
          <p className="text-center text-batman-muted font-mono text-xs">Next turn in 3 seconds...</p>
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
                      🏆 YOU WIN! 🏆
                    </p>
                  ) : (
                    <p className="font-display text-lg text-batman-muted tracking-widest">
                      {winner} WINS - Play again to reclaim dominance
                    </p>
                  )}
                </motion.div>
              );
            })()}

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

export default TerritoryDeceptionWar;
