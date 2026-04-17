import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../GlassCard';

const CoachingPanel = ({ coachingAdvice }) => {
  const [displayedText, setDisplayedText] = useState('');
  const adviceType = coachingAdvice?.adviceType || 'neutral';
  const fullMessage = coachingAdvice?.message || 'AWAITING BATCH DATA...';
  const prevMessageRef = useRef('');

  useEffect(() => {
    if (fullMessage && fullMessage !== prevMessageRef.current) {
      setDisplayedText('');
      prevMessageRef.current = fullMessage;
      
      let index = 0;
      const interval = setInterval(() => {
        setDisplayedText(prev => prev + fullMessage.charAt(index));
        index++;
        if (index >= fullMessage.length) {
          clearInterval(interval);
        }
      }, 35); // typing speed
      
      return () => clearInterval(interval);
    } else if (!fullMessage && !prevMessageRef.current) {
        setDisplayedText('AWAITING BATCH DATA...');
    }
  }, [fullMessage]);

  const getColor = () => {
    if (adviceType === 'risk') return 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]';
    if (adviceType === 'timing') return 'text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]';
    if (adviceType === 'strategy') return 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]';
    return 'text-batman-yellow';
  };

  return (
    <GlassCard className="p-4 sm:p-5 font-mono text-sm relative overflow-hidden bg-black/80 flex flex-col min-h-[120px]">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-batman-border to-transparent opacity-50" />
      
      <div className="flex items-center gap-2 mb-3 text-batman-muted border-b border-batman-border/30 pb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-batman-yellow animate-pulse" />
        <span className="tracking-widest capitalize text-[10px] sm:text-xs font-display">TACTICAL ANALYSIS</span>
      </div>
      
      <div className={`flex-1 transition-colors ${getColor()}`}>
        <p className="text-xs sm:text-sm leading-relaxed tracking-wide">
          {displayedText}
          <motion.span 
            animate={{ opacity: [1, 0, 1] }} 
            transition={{ repeat: Infinity, duration: 0.9 }}
            className="inline-block w-1.5 h-3 ml-1 bg-current align-baseline"
          />
        </p>
      </div>
      
      {coachingAdvice?.confidence && (
        <div className="mt-auto pt-2 text-right">
          <span className="text-[9px] font-mono text-batman-muted uppercase">
            Confidence Link: {(coachingAdvice.confidence * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </GlassCard>
  );
};

export default CoachingPanel;
