import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../GlassCard';

const TierBadge = ({ tierData }) => {
  const [pulse, setPulse] = useState(false);
  const { currentTier = 'Bronze', nextTier, progressPercentage = 0 } = tierData || {};

  useEffect(() => {
    if (currentTier) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTier]);

  const getTierColor = (t) => {
    switch(t?.toLowerCase()) {
      case 'bronze': return 'text-orange-600 bg-orange-600/10 border-orange-600/50';
      case 'silver': return 'text-gray-300 bg-gray-300/10 border-gray-300/50';
      case 'gold': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/50';
      case 'platinum': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/50 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]';
      case 'elite trader': return 'text-purple-400 bg-purple-500/20 border-purple-500/80 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]';
      default: return 'text-batman-muted bg-gray-900 border-gray-700';
    }
  };

  const currentStyle = getTierColor(currentTier);

  return (
    <GlassCard className="p-4 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono text-[10px] sm:text-xs text-batman-muted tracking-widest uppercase">Operative Class</span>
        <motion.div 
          animate={pulse ? { scale: [1, 1.15, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : {}}
          className={`px-3 py-1 font-display tracking-widest text-[10px] sm:text-xs border rounded-sm transition-colors ${currentStyle}`}
        >
          {currentTier.toUpperCase()}
        </motion.div>
      </div>
      
      <div className="relative h-1.5 bg-black rounded-sm overflow-hidden border border-batman-border">
        <motion.div 
          className="absolute top-0 bottom-0 left-0 bg-batman-yellow"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ ease: "easeOut", duration: 0.8 }}
        />
      </div>
      
      {nextTier ? (
        <div className="flex justify-between mt-2 items-center">
          <span className="text-[10px] text-batman-muted font-mono">{progressPercentage.toFixed(1)}%</span>
          <span className="text-[10px] text-batman-muted font-mono uppercase tracking-widest">NEXT: {nextTier}</span>
        </div>
      ) : (
        <div className="flex justify-center mt-2 items-center">
          <span className="text-[10px] text-batman-yellow font-display uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">MAXIMUM POTENTIAL REACHED</span>
        </div>
      )}
    </GlassCard>
  );
};

export default TierBadge;
