import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';

const Leaderboard = ({ leaderboard, currentUserEmail }) => {
  return (
    <GlassCard className="p-4 sm:p-6 overflow-hidden flex flex-col min-h-[300px]">
      <h3 className="font-display text-lg text-white tracking-widest mb-4 border-b border-batman-border/50 pb-2">TOP OPERATIVES</h3>
      <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {(!leaderboard || leaderboard.length === 0) ? (
          <p className="text-batman-muted font-mono text-xs text-center mt-8">AWAITING INTELLIGENCE...</p>
        ) : (
          <AnimatePresence>
            {leaderboard.slice(0, 10).map((player, index) => {
              const isMe = player.userId === currentUserEmail;
              return (
                <motion.div
                  key={player.userId}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={`flex justify-between items-center p-3 rounded-sm border ${isMe ? 'bg-batman-yellow/10 border-batman-yellow shadow-[0_0_10px_rgba(255,215,0,0.2)]' : 'bg-black/60 border-batman-border/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-display text-lg w-6 text-center ${index < 3 ? 'text-batman-yellow drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' : 'text-batman-muted'}`}>
                      #{player.rank || index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className={`font-mono text-sm max-w-[100px] sm:max-w-[150px] truncate ${isMe ? 'text-batman-yellow font-bold' : 'text-gray-300'}`}>
                        {player.userId.split('@')[0]}
                      </span>
                      <span className="text-[10px] text-batman-muted uppercase tracking-widest">{player.tier || 'BRONZE'}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-mono text-xs sm:text-sm text-white font-bold">{Math.round(player.score || 0)} PTS</p>
                    <p className={`font-mono text-[10px] sm:text-xs ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${Math.round(player.profit || 0)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
};

export default Leaderboard;
