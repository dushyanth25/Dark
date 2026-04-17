import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';
import { TrendingUp, AlertCircle, Zap, Trophy, RotateCcw } from 'lucide-react';

// ==============================================================================
// GAME THEORY ADVISOR ENGINE
// ==============================================================================

const computeAdvisorData = (currentBid, estimatedValue, activePlayers, playerThresholds) => {
  const V = estimatedValue;
  
  // Estimate how many agents will exit at current bid
  let agentsExitingSoon = 0;
  let agentsStillActive = [];
  
  const conservative_threshold = 0.7 * V;
  const balanced_threshold = 0.85 * V;
  const aggressive_threshold = 1.2 * V;
  
  // Count agents likely to exit
  playerThresholds.forEach(agent => {
    if (agent.type === 'conservative' && currentBid > conservative_threshold) {
      agentsExitingSoon++;
    } else if (agent.type === 'balanced' && currentBid > balanced_threshold && Math.random() > 0.4) {
      agentsExitingSoon++;
    } else if (agent.type === 'aggressive' && currentBid > aggressive_threshold) {
      agentsExitingSoon++;
    } else {
      agentsStillActive.push(agent.type);
    }
  });
  
  const winProbability = agentsExitingSoon > 0 ? (agentsExitingSoon / activePlayers) : 0.5;
  const expectedPayoff = (V - currentBid) * Math.max(0, winProbability);
  const riskScore = currentBid > V ? ((currentBid - V) / V) * 100 : 0;
  
  // Determine zone
  let zone = 'SAFE';
  if (currentBid > V) zone = 'DANGER';
  else if (currentBid > 0.8 * V) zone = 'COMPETITIVE';
  
  // Calculate optimal bid
  const optimalBid = V * 0.85;
  const maxSafeBid = V;
  const suggestedIncrement = Math.max(5, (V - currentBid) / (activePlayers + 1));
  
  // Generate reasoning
  const reasoning = [];
  if (agentsExitingSoon > 0) {
    reasoning.push(`${agentsExitingSoon} agent(s) likely to exit at this bid level`);
  }
  if (agentsStillActive.includes('aggressive')) {
    reasoning.push('⚠️ Aggressive agent still active - expect competition');
  }
  if (currentBid < 0.7 * V) {
    reasoning.push('✅ Well below estimated value - safe zone');
  }
  if (expectedPayoff < 0) {
    reasoning.push('💔 Expected payoff is negative - likely overbidding');
  }
  if (zone === 'COMPETITIVE') {
    reasoning.push(`🎯 Entering competitive zone - ${(agentsStillActive.length)} competitors remain`);
  }
  
  const riskLevel = riskScore > 50 ? 'High' : riskScore > 20 ? 'Medium' : 'Low';
  
  const recommendedAction = 
    zone === 'SAFE' ? 'INCREASE' :
    zone === 'COMPETITIVE' && expectedPayoff > 10 ? 'INCREASE' :
    zone === 'COMPETITIVE' ? 'HOLD' :
    'EXIT';
  
  return {
    estimated_value: Math.round(V * 100) / 100,
    current_state: {
      current_bid: currentBid,
      active_players: activePlayers
    },
    math_analysis: {
      expected_payoff: Math.round(expectedPayoff * 100) / 100,
      win_probability: Math.round(winProbability * 100),
      risk_score: Math.round(riskScore)
    },
    zones: { zone },
    recommendation: {
      action: recommendedAction,
      optimal_bid: Math.round(optimalBid * 100) / 100,
      max_safe_bid: Math.round(maxSafeBid * 100) / 100,
      suggested_increment: Math.round(suggestedIncrement * 100) / 100
    },
    ai_reasoning: reasoning,
    risk_level: riskLevel
  };
};

// ==============================================================================
// AI AGENT LOGIC
// ==============================================================================

const getAIMove = (agentType, currentBid, estimatedValue, activePlayers) => {
  const V = estimatedValue;
  
  switch(agentType) {
    case 'conservative':
      if (currentBid < 0.7 * V) return 'INCREASE';
      return Math.random() > 0.6 ? 'HOLD' : 'EXIT';
    
    case 'balanced':
      if (currentBid < 0.85 * V) return 'INCREASE';
      if (activePlayers <= 2) return 'HOLD';
      return Math.random() > 0.5 ? 'HOLD' : 'EXIT';
    
    case 'aggressive':
      if (currentBid < 1.2 * V) return 'INCREASE';
      return Math.random() > 0.7 ? 'HOLD' : 'EXIT';
    
    default:
      return 'HOLD';
  }
};

// ==============================================================================
// STOCK DATA
// ==============================================================================

const STOCK_DATA = [
  { name: 'TechNova', min: 80, max: 120, quantity: 50, volatility: 'Medium' },
  { name: 'GreenGrid', min: 60, max: 100, quantity: 30, volatility: 'High' },
  { name: 'FinCore', min: 100, max: 150, quantity: 40, volatility: 'Low' },
  { name: 'NanoSys', min: 90, max: 130, quantity: 25, volatility: 'Medium' },
  { name: 'BioGen', min: 70, max: 110, quantity: 35, volatility: 'High' }
];

// ==============================================================================
// MAIN GAME COMPONENT
// ==============================================================================

const StockBidArena = () => {
  const [gameState, setGameState] = useState('start'); // start, playing, results, gameOver
  const [currentRound, setCurrentRound] = useState(0);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [trueValue, setTrueValue] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [activePlayers, setActivePlayers] = useState([
    { id: 'human', name: 'You', type: 'human', status: 'active' },
    { id: 'conservative', name: 'Agent Conservative', type: 'conservative', status: 'active' },
    { id: 'balanced', name: 'Agent Balanced', type: 'balanced', status: 'active' },
    { id: 'aggressive', name: 'Agent Aggressive', type: 'aggressive', status: 'active' }
  ]);
  const [roundResults, setRoundResults] = useState([]);
  const [advisorData, setAdvisorData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([
    { id: 'human', name: 'You', profit: 0, wins: 0 },
    { id: 'conservative', name: 'Conservative', profit: 0, wins: 0 },
    { id: 'balanced', name: 'Balanced', profit: 0, wins: 0 },
    { id: 'aggressive', name: 'Aggressive', profit: 0, wins: 0 }
  ]);
  const [biddingHistory, setBiddingHistory] = useState([]);
  const [waitingForAI, setWaitingForAI] = useState(false);

  // Initialize game
  const startGame = () => {
    setGameState('playing');
    startNewRound();
  };

  const startNewRound = () => {
    if (currentRound >= STOCK_DATA.length) {
      setGameState('gameOver');
      return;
    }

    const company = STOCK_DATA[currentRound];
    const min = company.min;
    const max = company.max;
    const value = Math.round((min + max) / 2 + (Math.random() - 0.5) * (max - min) * 0.2);
    const bid = min;

    setCurrentCompany(company);
    setTrueValue(value);
    setCurrentBid(bid);
    setHighestBidder('human');
    setActivePlayers([
      { id: 'human', name: 'You', type: 'human', status: 'active' },
      { id: 'conservative', name: 'Conservative', type: 'conservative', status: 'active' },
      { id: 'balanced', name: 'Balanced', type: 'balanced', status: 'active' },
      { id: 'aggressive', name: 'Aggressive', type: 'aggressive', status: 'active' }
    ]);
    setBiddingHistory([
      { player: 'human', action: 'INCREASE', bid: bid, bidder: 'human' }
    ]);
    setRoundResults([]);

    // Update advisor
    const advisorOutput = computeAdvisorData(
      bid,
      value,
      4,
      [
        { type: 'conservative' },
        { type: 'balanced' },
        { type: 'aggressive' }
      ]
    );
    setAdvisorData(advisorOutput);
    setGameState('playing');
  };

  // Handle player action
  const handlePlayerAction = (action) => {
    if (waitingForAI) return;

    let newBid = currentBid;
    let newHighestBidder = highestBidder;
    let newActivePlayers = activePlayers.map(p => p);

    if (action === 'INCREASE') {
      newBid = currentBid + 10;
      newHighestBidder = 'human';
    } else if (action === 'EXIT') {
      newActivePlayers = newActivePlayers.map(p =>
        p.id === 'human' ? { ...p, status: 'exited' } : p
      );
    } else if (action === 'HOLD') {
      // No change
    }

    setCurrentBid(newBid);
    setHighestBidder(newHighestBidder);
    setActivePlayers(newActivePlayers);
    setBiddingHistory([
      ...biddingHistory,
      { player: 'human', action, bid: newBid, bidder: newHighestBidder }
    ]);

    // Update advisor
    const activeCount = newActivePlayers.filter(p => p.status === 'active').length;
    const advisorOutput = computeAdvisorData(
      newBid,
      trueValue,
      activeCount,
      [
        { type: 'conservative' },
        { type: 'balanced' },
        { type: 'aggressive' }
      ]
    );
    setAdvisorData(advisorOutput);

    // Check if game should end
    const activeStatuses = newActivePlayers.filter(p => p.status === 'active');
    if (activeStatuses.length <= 1) {
      endBiddingRound(newActivePlayers, newHighestBidder, newBid);
    } else {
      // AI turn
      executeAIRound(newActivePlayers, newHighestBidder, newBid);
    }
  };

  const executeAIRound = async (players, currentHighestBidder, bid) => {
    setWaitingForAI(true);

    const aiPlayers = players.filter(p => p.type !== 'human' && p.status === 'active');
    let newBid = bid;
    let newHighestBidder = currentHighestBidder;
    let newPlayers = players.map(p => p);
    let newHistory = [...biddingHistory];

    for (let agent of aiPlayers) {
      const move = getAIMove(agent.type, newBid, trueValue, newPlayers.filter(p => p.status === 'active').length);

      if (move === 'INCREASE') {
        newBid = newBid + 10;
        newHighestBidder = agent.id;
      } else if (move === 'EXIT') {
        newPlayers = newPlayers.map(p =>
          p.id === agent.id ? { ...p, status: 'exited' } : p
        );
      }

      newHistory = [
        ...newHistory,
        { player: agent.id, action: move, bid: newBid, bidder: newHighestBidder }
      ];

      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentBid(newBid);
    setHighestBidder(newHighestBidder);
    setActivePlayers(newPlayers);
    setBiddingHistory(newHistory);

    // Update advisor
    const activeCount = newPlayers.filter(p => p.status === 'active').length;
    const advisorOutput = computeAdvisorData(
      newBid,
      trueValue,
      activeCount,
      [
        { type: 'conservative' },
        { type: 'balanced' },
        { type: 'aggressive' }
      ]
    );
    setAdvisorData(advisorOutput);

    const activeStatuses = newPlayers.filter(p => p.status === 'active');
    if (activeStatuses.length <= 1) {
      endBiddingRound(newPlayers, newHighestBidder, newBid);
    } else {
      setWaitingForAI(false);
    }
  };

  const endBiddingRound = (players, winner, finalBid) => {
    const winnerData = players.find(p => p.id === winner);
    const profit = trueValue - finalBid;

    // Update leaderboard
    const newLeaderboard = leaderboard.map(p => {
      if (p.id === winner) {
        return { ...p, profit: p.profit + profit, wins: p.wins + 1 };
      }
      return p;
    });
    setLeaderboard(newLeaderboard);

    setRoundResults({
      winner: winnerData?.name || 'Unknown',
      winnerId: winner,
      finalBid,
      profit,
      trueValue
    });

    setGameState('results');
    setWaitingForAI(false);
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    startNewRound();
  };

  const resetGame = () => {
    setGameState('start');
    setCurrentRound(0);
    setLeaderboard([
      { id: 'human', name: 'You', profit: 0, wins: 0 },
      { id: 'conservative', name: 'Conservative', profit: 0, wins: 0 },
      { id: 'balanced', name: 'Balanced', profit: 0, wins: 0 },
      { id: 'aggressive', name: 'Aggressive', profit: 0, wins: 0 }
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Main Game Container */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-batman-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-batman-yellow" />
            <h3 className="font-display text-xl text-white tracking-widest">STOCK BID ARENA</h3>
          </div>
          <p className="text-batman-muted text-sm font-mono">Strategic Auction Game</p>
        </div>

        {/* START STATE */}
        {gameState === 'start' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-batman-yellow/40 rounded-lg p-8">
              <h2 className="font-display text-2xl text-batman-yellow mb-4">Welcome to Stock Bid Arena</h2>
              <p className="text-batman-muted text-sm mb-6 max-w-2xl mx-auto">
                Compete against 3 AI agents in strategic bidding auctions. Use the Game Theory Advisor to make informed decisions about when to bid, hold, or exit. Highest bidder wins the stock, but profit depends on how much you overpaid compared to the true value.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-yellow font-mono mb-1">5 Rounds</p>
                  <p className="text-batman-muted text-xs">Different companies</p>
                </div>
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-yellow font-mono mb-1">Real Strategy</p>
                  <p className="text-batman-muted text-xs">Math-driven advisors</p>
                </div>
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-yellow font-mono mb-1">AI Rivals</p>
                  <p className="text-batman-muted text-xs">Different tactics</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="bg-gradient-to-r from-batman-yellow/40 to-yellow-600/40 border border-batman-yellow/60 text-batman-yellow py-3 px-8 rounded-lg font-display tracking-widest uppercase text-sm hover:from-batman-yellow/60 hover:to-yellow-600/60 transition-all"
              >
                Start Game
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && currentCompany && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Company Info */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/60 rounded-lg p-4 border border-batman-border/30">
                <p className="text-batman-muted text-xs font-mono mb-1">COMPANY</p>
                <p className="text-batman-yellow font-display text-lg">{currentCompany.name}</p>
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-batman-border/30">
                <p className="text-batman-muted text-xs font-mono mb-1">ROUND</p>
                <p className="text-green-400 font-display text-lg">{currentRound + 1}/5</p>
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-batman-border/30">
                <p className="text-batman-muted text-xs font-mono mb-1">CURRENT BID</p>
                <p className="text-batman-yellow font-display text-lg">₹{currentBid}</p>
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-batman-border/30">
                <p className="text-batman-muted text-xs font-mono mb-1">ACTIVE PLAYERS</p>
                <p className="text-red-400 font-display text-lg">
                  {activePlayers.filter(p => p.status === 'active').length}/4
                </p>
              </div>
            </div>

            {/* Advisor Panel */}
            {advisorData && (
              <GlassCard className="p-4 bg-blue-900/20 border-blue-500/30">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-1" />
                  <p className="text-blue-400 font-display text-sm uppercase tracking-widest">Game Theory Advisor</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                  <div>
                    <p className="text-batman-muted font-mono mb-1">Est. Value</p>
                    <p className="text-green-400 font-semibold">₹{advisorData.estimated_value}</p>
                  </div>
                  <div>
                    <p className="text-batman-muted font-mono mb-1">Win Prob.</p>
                    <p className="text-cyan-400 font-semibold">{advisorData.math_analysis.win_probability}%</p>
                  </div>
                  <div>
                    <p className="text-batman-muted font-mono mb-1">Expected Payoff</p>
                    <p className={advisorData.math_analysis.expected_payoff > 0 ? 'text-green-400' : 'text-red-400'}>
                      ₹{advisorData.math_analysis.expected_payoff}
                    </p>
                  </div>
                  <div>
                    <p className="text-batman-muted font-mono mb-1">Risk Level</p>
                    <p className={
                      advisorData.risk_level === 'High' ? 'text-red-400' :
                      advisorData.risk_level === 'Medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }>
                      {advisorData.risk_level}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-batman-muted text-xs font-mono mb-2">Recommendation:</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-display font-bold ${
                      advisorData.recommendation.action === 'INCREASE' ? 'text-green-400' :
                      advisorData.recommendation.action === 'EXIT' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {advisorData.recommendation.action}
                    </p>
                    <p className="text-batman-muted text-xs">
                      @ ₹{advisorData.recommendation.suggested_increment} increment
                      (Max safe: ₹{advisorData.recommendation.max_safe_bid})
                    </p>
                  </div>
                </div>

                {advisorData.ai_reasoning.length > 0 && (
                  <div className="space-y-1 text-xs text-batman-muted">
                    {advisorData.ai_reasoning.map((reason, i) => (
                      <p key={i} className="flex items-start gap-2">
                        <span className="text-blue-400">•</span> {reason}
                      </p>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Active Players Status */}
            <div className="grid grid-cols-4 gap-3">
              {activePlayers.map(player => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    player.status === 'exited'
                      ? 'bg-black/40 border-red-500/30 opacity-50'
                      : player.id === highestBidder
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-black/60 border-batman-border/30'
                  }`}
                >
                  <p className="text-batman-muted text-xs font-mono truncate">{player.name}</p>
                  <p className={`text-xs font-semibold ${
                    player.status === 'exited' ? 'text-red-400' :
                    player.id === highestBidder ? 'text-green-400' :
                    'text-batman-yellow'
                  }`}>
                    {player.status === 'exited' ? 'EXITED' : 'ACTIVE'}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerAction('INCREASE')}
                disabled={waitingForAI || activePlayers.find(p => p.id === 'human')?.status !== 'active'}
                className="bg-green-900/40 border-2 border-green-500/60 text-green-400 py-4 px-3 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                +10 INCREASE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerAction('HOLD')}
                disabled={waitingForAI || activePlayers.find(p => p.id === 'human')?.status !== 'active'}
                className="bg-blue-900/40 border-2 border-blue-500/60 text-blue-400 py-4 px-3 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                HOLD
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayerAction('EXIT')}
                disabled={waitingForAI || activePlayers.find(p => p.id === 'human')?.status !== 'active'}
                className="bg-red-900/40 border-2 border-red-500/60 text-red-400 py-4 px-3 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                EXIT
              </motion.button>
            </div>

            {waitingForAI && (
              <div className="text-center">
                <p className="text-batman-muted text-sm font-mono">
                  AI agents are making decisions...
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-batman-yellow rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-batman-yellow rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-batman-yellow rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* RESULTS STATE */}
        {gameState === 'results' && roundResults && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="bg-gradient-to-br from-batman-yellow/20 to-yellow-600/20 border border-batman-yellow/40 rounded-lg p-6 text-center">
              <p className="text-batman-yellow font-display text-2xl mb-2">Round {currentRound + 1} Complete!</p>
              <p className="text-batman-muted mb-4">
                <span className="font-semibold text-green-400">{roundResults.winner}</span> won the auction
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-muted text-xs font-mono mb-1">Final Bid</p>
                  <p className="text-batman-yellow font-display">₹{roundResults.finalBid}</p>
                </div>
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-muted text-xs font-mono mb-1">True Value</p>
                  <p className="text-cyan-400 font-display">₹{roundResults.trueValue}</p>
                </div>
                <div className="bg-black/40 border border-batman-border/30 rounded p-3">
                  <p className="text-batman-muted text-xs font-mono mb-1">Profit</p>
                  <p className={`font-display ${roundResults.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{roundResults.profit}
                  </p>
                </div>
              </div>

              {currentRound < 4 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextRound}
                  className="bg-gradient-to-r from-green-500/40 to-emerald-600/40 border border-green-400/60 text-green-400 py-3 px-8 rounded-lg font-display tracking-widest uppercase text-sm hover:from-green-500/60 hover:to-emerald-600/60 transition-all"
                >
                  Next Round →
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGameState('gameOver')}
                  className="bg-gradient-to-r from-batman-yellow/40 to-yellow-600/40 border border-batman-yellow/60 text-batman-yellow py-3 px-8 rounded-lg font-display tracking-widest uppercase text-sm hover:from-batman-yellow/60 hover:to-yellow-600/60 transition-all"
                >
                  View Final Results →
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* GAME OVER STATE */}
        {gameState === 'gameOver' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="text-center mb-6">
              <Trophy size={32} className="mx-auto text-batman-yellow mb-3" />
              <p className="font-display text-2xl text-batman-yellow mb-2">Game Complete!</p>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
              {leaderboard
                .sort((a, b) => b.profit - a.profit)
                .map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      idx === 0
                        ? 'bg-yellow-900/30 border-batman-yellow/50'
                        : 'bg-black/40 border-batman-border/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-display text-lg font-bold text-batman-yellow">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-semibold">{player.name}</p>
                        <p className="text-batman-muted text-xs font-mono">
                          {player.wins} wins · {player.profit > 0 ? '+' : ''}₹{player.profit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-lg ${player.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {player.profit > 0 ? '+' : ''}₹{player.profit}
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-green-500/40 to-emerald-600/40 border border-green-400/60 text-green-400 py-3 px-4 rounded-lg font-display tracking-widest uppercase text-sm hover:from-green-500/60 hover:to-emerald-600/60 transition-all mt-4"
            >
              <RotateCcw size={16} className="inline mr-2" />
              Play Again
            </motion.button>
          </motion.div>
        )}
      </GlassCard>

      {/* Educational Card */}
      <GlassCard className="p-4">
        <p className="text-batman-muted text-xs font-mono uppercase tracking-widest mb-2">💡 GAME THEORY LESSONS</p>
        <ul className="text-batman-muted text-xs space-y-1 list-disc list-inside">
          <li>Auction theory: Winner's curse - bidders often overbid relative to true value</li>
          <li>Risk assessment: Higher bids = lower profit margins with increasing risk</li>
          <li>Agent modeling: Understanding competitor strategies improves your decisions</li>
          <li>Information asymmetry: Limited value estimates create strategic tension</li>
        </ul>
      </GlassCard>
    </div>
  );
};

export default StockBidArena;
