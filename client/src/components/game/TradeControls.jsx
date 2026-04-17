import React from 'react';
import { motion } from 'framer-motion';

const TradeControls = ({ handleTrade, loadingAction, canBuy, canSell }) => {
  const buttonVariants = {
    hover: { scale: 1.05, clipPath: "polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)", filter: "brightness(1.2)" },
    tap: { scale: 0.95 }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
      <motion.button
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        disabled={!canBuy || loadingAction === 'sell'}
        onClick={() => handleTrade('buy')}
        className={`flex-1 relative h-12 uppercase font-display tracking-widest text-sm overflow-hidden bg-green-900/40 border border-green-500/50 text-green-400 group ${(!canBuy || loadingAction) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]'}`}
        style={{ clipPath: "polygon(5% 0, 95% 0, 100% 100%, 0 100%)" }}
      >
        <span className="relative z-10">{loadingAction === 'buy' ? 'PROCESSING...' : 'ACQUIRE'}</span>
        <span className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      <motion.button
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        disabled={!canSell || loadingAction === 'buy'}
        onClick={() => handleTrade('sell')}
        className={`flex-1 relative h-12 uppercase font-display tracking-widest text-sm overflow-hidden bg-red-900/40 border border-red-500/50 text-red-500 group ${(!canSell || loadingAction) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
        style={{ clipPath: "polygon(5% 0, 95% 0, 100% 100%, 0 100%)" }}
      >
        <span className="relative z-10">{loadingAction === 'sell' ? 'PROCESSING...' : 'LIQUIDATE'}</span>
        <span className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
};

export default TradeControls;
