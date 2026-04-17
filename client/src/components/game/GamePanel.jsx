import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../GlassCard';
import TradeControls from './TradeControls';
import { motionConfigs } from '../animations/BatOverlay';

const GamePanel = ({ market, portfolio, handleTrade, loadingAction }) => {
  const [pulseType, setPulseType] = useState(null);
  const currentPrice = market?.currentPrice || 0;

  useEffect(() => {
    // Only pulse if we have a market and it changed in the recent tick
    if (market?.priceChange) {
      if (market.priceChange > 0) setPulseType('profit');
      else if (market.priceChange < 0) setPulseType('loss');
      
      const timer = setTimeout(() => setPulseType(null), 500);
      return () => clearTimeout(timer);
    }
  }, [market?.priceChange, market?.currentPrice]);

  const pulseProps = pulseType === 'profit' 
    ? { boxShadow: '0 0 20px rgba(74,222,128,0.5)', borderColor: 'rgba(74,222,128,0.8)' }
    : pulseType === 'loss'
    ? { boxShadow: '0 0 20px rgba(239,68,68,0.5)', borderColor: 'rgba(239,68,68,0.8)' }
    : { boxShadow: '0 0 0px rgba(0,0,0,0)', borderColor: 'rgba(255,255,255,0.1)' };

  return (
    <GlassCard className="p-6 flex flex-col items-center justify-between">
      <div className="w-full flex justify-between items-start mb-6 border-b border-batman-border/50 pb-4">
        <div>
          <p className="text-batman-muted font-mono text-xs uppercase tracking-widest mb-1">WayneTech Value</p>
          <motion.div 
            animate={pulseProps}
            transition={{ duration: 0.3 }}
            className="px-4 py-2 bg-black/60 border rounded-sm"
          >
            <h2 className="font-display text-3xl sm:text-4xl text-batman-yellow">
              ${currentPrice.toFixed(2)}
            </h2>
          </motion.div>
        </div>
        
        <div className="text-right space-y-3">
          <div>
            <p className="text-batman-muted font-mono text-[10px] uppercase tracking-widest leading-none mb-1">Liquidity</p>
            <p className="font-mono text-sm text-green-400 leading-none">${portfolio?.cash?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-batman-muted font-mono text-[10px] uppercase tracking-widest leading-none mb-1">W.E. Shares</p>
            <p className="font-mono text-sm text-batman-yellow leading-none">{portfolio?.assets || 0}</p>
          </div>
        </div>
      </div>

      <TradeControls 
        handleTrade={handleTrade} 
        loadingAction={loadingAction} 
        canBuy={(portfolio?.cash || 0) >= currentPrice}
        canSell={(portfolio?.assets || 0) >= 1}
      />
      
      <AnimatePresence>
        {portfolio?.lastTrade && (
          <motion.div 
            {...motionConfigs.fadeIn}
            className="mt-4 text-[10px] sm:text-xs font-mono text-batman-muted self-end"
          >
            SEQUENCE EXECUTED: {portfolio.lastTrade.type.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

export default GamePanel;
