import React, { useState } from 'react';
import { motion } from 'framer-motion';
import BatBackground from '../components/BatBackground';
import BatOverlay from '../components/animations/BatOverlay';
import PuzzleGame from '../components/game/PuzzleGame';
import StockBidArena from '../components/game/StockBidArena';
import TerritoryDeceptionWar from '../components/game/TerritoryDeceptionWar';
import SelfEvolvingGameArena from '../components/game/SelfEvolvingGameArena';
import { Gamepad2 } from 'lucide-react';

const GamePage = () => {
  const [activeGame, setActiveGame] = useState('cooperation'); // cooperation, stock, territory, or evolving

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar"
    >
      <BatBackground count={6} />
      <BatOverlay triggerEvent={0} />
      
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-batman-border/30 pb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 size={28} className="text-batman-yellow" />
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-widest">STRATEGY ARENA</h1>
          </div>
          <p className="text-batman-muted font-mono text-sm">
            Master game theory through interactive puzzles and strategic auctions
          </p>
        </motion.div>

        {/* Game Tabs */}
        <div className="flex gap-3 border-b border-batman-border/30 pb-4 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveGame('cooperation')}
            className={`px-6 py-3 rounded-lg font-display tracking-widest uppercase text-sm font-semibold transition-all ${
              activeGame === 'cooperation'
                ? 'bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow'
                : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
            }`}
          >
            🤝 Cooperation Puzzle
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveGame('stock')}
            className={`px-6 py-3 rounded-lg font-display tracking-widest uppercase text-sm font-semibold transition-all ${
              activeGame === 'stock'
                ? 'bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow'
                : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
            }`}
          >
            💰 Stock Bid Arena
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveGame('territory')}
            className={`px-6 py-3 rounded-lg font-display tracking-widest uppercase text-sm font-semibold transition-all ${
              activeGame === 'territory'
                ? 'bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow'
                : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
            }`}
          >
            ⚔ Territory War
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveGame('evolving')}
            className={`px-6 py-3 rounded-lg font-display tracking-widest uppercase text-sm font-semibold transition-all ${
              activeGame === 'evolving'
                ? 'bg-batman-yellow/20 border-2 border-batman-yellow/80 text-batman-yellow'
                : 'bg-black/40 border-2 border-batman-border/50 text-batman-muted hover:border-batman-yellow/50'
            }`}
          >
            🌀 Evolving Arena
          </motion.button>
        </div>

        {/* Game Content */}
        {activeGame === 'cooperation' && <PuzzleGame />}
        {activeGame === 'stock' && <StockBidArena />}
        {activeGame === 'territory' && <TerritoryDeceptionWar />}
        {activeGame === 'evolving' && <SelfEvolvingGameArena />}
      </div>
    </motion.div>
  );
};

export default GamePage;
