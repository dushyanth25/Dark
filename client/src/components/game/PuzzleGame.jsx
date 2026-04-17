import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';
import { Zap, Heart, Brain, RotateCcw } from 'lucide-react';

const PuzzleGame = () => {
  const [gameState, setGameState] = useState('choose'); // choose, playing, results, idle
  const [playerChoice, setPlayerChoice] = useState(null);
  const [aiChoice, setAiChoice] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [round, setRound] = useState(0);
  const [gameMode, setGameMode] = useState(null); // 'easy', 'medium', 'hard', 'cooperative'
  const [history, setHistory] = useState([]);

  // Game strategies based on difficulty
  const getAIChoice = (difficulty) => {
    const rand = Math.random();
    
    switch(difficulty) {
      case 'easy':
        // AI cooperates 70% of the time
        return rand > 0.3 ? 'cooperate' : 'defect';
      case 'medium':
        // AI mirrors player choice 60% of the time
        if (history.length > 0) {
          const lastPlayer = history[history.length - 1].playerChoice;
          return rand > 0.4 ? lastPlayer : (rand > 0.7 ? 'cooperate' : 'defect');
        }
        return rand > 0.5 ? 'cooperate' : 'defect';
      case 'hard':
        // AI is strategic - punishes defection
        if (history.length > 0) {
          const lastPlayer = history[history.length - 1].playerChoice;
          if (lastPlayer === 'defect') return 'defect';
          return rand > 0.3 ? 'cooperate' : 'defect';
        }
        return 'cooperate';
      case 'cooperative':
        // AI always cooperates
        return 'cooperate';
      default:
        return rand > 0.5 ? 'cooperate' : 'defect';
    }
  };

  const calculateScore = (player, ai) => {
    if (player === 'cooperate' && ai === 'cooperate') {
      return { player: 3, ai: 3 }; // Mutual cooperation - best for both
    } else if (player === 'cooperate' && ai === 'defect') {
      return { player: 0, ai: 5 }; // Player nice, AI exploits
    } else if (player === 'defect' && ai === 'cooperate') {
      return { player: 5, ai: 0 }; // Player exploits
    } else {
      return { player: 1, ai: 1 }; // Mutual defection - worst outcome
    }
  };

  const handleChoice = (choice) => {
    const ai = getAIChoice(gameMode);
    const scores = calculateScore(choice, ai);
    
    setPlayerChoice(choice);
    setAiChoice(ai);
    
    setPlayerScore(prev => prev + scores.player);
    setAiScore(prev => prev + scores.ai);
    
    setHistory([...history, { playerChoice: choice, aiChoice: ai, scores }]);
    setGameState('results');
    setRound(prev => prev + 1);
  };

  const nextRound = () => {
    if (round < 5) {
      setGameState('choose');
      setPlayerChoice(null);
      setAiChoice(null);
    } else {
      setGameState('idle'); // Game over
    }
  };

  const resetGame = () => {
    setGameState('choose');
    setPlayerScore(0);
    setAiScore(0);
    setRound(0);
    setHistory([]);
    setGameMode(null);
    setPlayerChoice(null);
    setAiChoice(null);
  };

  const startGame = (mode) => {
    setGameMode(mode);
    setGameState('choose');
    setPlayerScore(0);
    setAiScore(0);
    setRound(0);
    setHistory([]);
  };

  const getResultMessage = () => {
    if (!playerChoice || !aiChoice) return '';
    
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') {
      return '🤝 Harmony Achieved! Both chose cooperation.';
    } else if (playerChoice === 'cooperate' && aiChoice === 'defect') {
      return '😞 You were kind, but they exploited you.';
    } else if (playerChoice === 'defect' && aiChoice === 'cooperate') {
      return '⚡ You gained short-term advantage...';
    } else {
      return '💔 Mutual conflict. Nobody wins.';
    }
  };

  const getModeDescription = (mode) => {
    const descriptions = {
      cooperative: 'Both players cooperate naturally—the harmonious path.',
      easy: 'Opponent is naive and cooperative 70% of the time.',
      medium: 'Opponent mirrors your strategy 60% of the time.',
      hard: 'Opponent punishes defection—play strategically.'
    };
    return descriptions[mode] || '';
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4 border-b border-batman-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-batman-yellow" />
            <h3 className="font-display text-xl text-white tracking-widest">COOPERATION PUZZLE</h3>
          </div>
          <p className="text-batman-muted text-sm font-mono">Game Theory Challenge</p>
        </div>

        {gameState === 'choose' && !gameMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-batman-muted text-sm text-center mb-6">Choose your difficulty level. Each game is 5 rounds.</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { mode: 'cooperative', label: '🤝 Harmony', color: 'from-emerald-500 to-cyan-500' },
                { mode: 'easy', label: '😊 Easy', color: 'from-green-500 to-emerald-500' },
                { mode: 'medium', label: '⚔️ Medium', color: 'from-yellow-500 to-orange-500' },
                { mode: 'hard', label: '💀 Hard', color: 'from-red-500 to-orange-500' }
              ].map(({ mode, label, color }) => (
                <motion.button
                  key={mode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startGame(mode)}
                  className={`py-4 px-3 rounded-lg border-2 border-transparent font-mono text-sm font-semibold text-white transition-all bg-gradient-to-r ${color} hover:shadow-lg hover:shadow-yellow-500/30`}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {gameMode && (
          <>
            {/* Score Display */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <motion.div 
                className="bg-black/60 rounded-lg p-4 border border-batman-border/30 text-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <p className="text-batman-muted text-xs font-mono mb-1">YOUR SCORE</p>
                <p className="text-green-400 font-display text-2xl">{playerScore}</p>
              </motion.div>
              
              <motion.div className="bg-black/60 rounded-lg p-4 border border-batman-border/30 text-center">
                <p className="text-batman-muted text-xs font-mono mb-1">ROUND</p>
                <p className="text-batman-yellow font-display text-2xl">{round}/5</p>
              </motion.div>
              
              <motion.div 
                className="bg-black/60 rounded-lg p-4 border border-batman-border/30 text-center"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
              >
                <p className="text-batman-muted text-xs font-mono mb-1">AI SCORE</p>
                <p className="text-red-400 font-display text-2xl">{aiScore}</p>
              </motion.div>
            </div>

            {/* Game Mode Description */}
            {gameMode && (
              <p className="text-batman-muted text-sm text-center mb-4 italic">
                {getModeDescription(gameMode)}
              </p>
            )}

            {/* Choice Phase */}
            {gameState === 'choose' && round < 5 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <p className="text-center text-batman-muted font-mono text-sm mb-4">What is your move?</p>
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(74,222,128,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('cooperate')}
                    className="bg-emerald-900/40 border-2 border-emerald-500/60 text-emerald-400 py-6 px-4 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-emerald-900/60 transition-colors"
                  >
                    <Heart size={20} className="mx-auto mb-2" />
                    Cooperate
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleChoice('defect')}
                    className="bg-red-900/40 border-2 border-red-500/60 text-red-400 py-6 px-4 rounded-lg font-display tracking-widest uppercase text-sm hover:bg-red-900/60 transition-colors"
                  >
                    <Zap size={20} className="mx-auto mb-2" />
                    Defect
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Results Phase */}
            {gameState === 'results' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <p className="text-center text-batman-yellow text-sm font-mono mb-4">{getResultMessage()}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-center">
                    <p className="text-green-400 font-mono text-xs mb-1">YOU CHOSE</p>
                    <p className="text-green-300 font-display capitalize">{playerChoice}</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center">
                    <p className="text-red-400 font-mono text-xs mb-1">AI CHOSE</p>
                    <p className="text-red-300 font-display capitalize">{aiChoice}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextRound}
                  className="w-full bg-gradient-to-r from-batman-yellow/40 to-yellow-600/40 border border-batman-yellow/60 text-batman-yellow py-3 px-4 rounded-lg font-display tracking-widest uppercase text-sm hover:from-batman-yellow/60 hover:to-yellow-600/60 transition-all"
                >
                  {round >= 5 ? 'View Results' : `Next Round (${round}/5)`}
                </motion.button>
              </motion.div>
            )}

            {/* Game Over / Idle Phase */}
            {gameState === 'idle' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 text-center"
              >
                <div className="bg-gradient-to-br from-batman-yellow/20 to-yellow-600/20 border border-batman-yellow/40 rounded-lg p-6">
                  <p className="text-batman-yellow font-display text-2xl mb-4">GAME OVER!</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-batman-muted">Your Score: <span className="text-green-400 font-mono">{playerScore}</span></p>
                    <p className="text-batman-muted">AI Score: <span className="text-red-400 font-mono">{aiScore}</span></p>
                    {playerScore > aiScore ? (
                      <p className="text-emerald-400 font-display mt-4">🎉 YOU WIN!</p>
                    ) : playerScore === aiScore ? (
                      <p className="text-batman-yellow font-display mt-4">⚖️ TIE GAME</p>
                    ) : (
                      <p className="text-red-400 font-display mt-4">🤖 AI WINS</p>
                    )}
                  </div>
                  <p className="text-batman-muted text-sm mb-4">
                    Games like this teach us that cooperation often yields better outcomes than competition alone.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="w-full bg-gradient-to-r from-green-500/40 to-emerald-600/40 border border-green-400/60 text-green-400 py-3 px-4 rounded-lg font-display tracking-widest uppercase text-sm hover:from-green-500/60 hover:to-emerald-600/60 transition-all"
                  >
                    <RotateCcw size={16} className="inline mr-2" />
                    Play Again
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </GlassCard>

      {/* Game Theory Explanation Card */}
      <GlassCard className="p-4">
        <p className="text-batman-muted text-xs font-mono uppercase tracking-widest mb-2">💡 GAME THEORY LESSONS</p>
        <ul className="text-batman-muted text-xs space-y-1 list-disc list-inside">
          <li>Cooperation yields better collective results</li>
          <li>Defection exploits trust but damages long-term relationships</li>
          <li>Tit-for-tat strategy is often optimal (mirror opponent)</li>
          <li>Punishment discourages further exploitation</li>
        </ul>
      </GlassCard>
    </div>
  );
};

export default PuzzleGame;
