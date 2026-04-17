import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMarketData, executeTrade } from '../utils/api';
import GlassCard from '../components/GlassCard';
import BatBackground from '../components/BatBackground';
import ChartComponent from '../components/ChartComponent';
import Terminal from '../components/Terminal';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getUser } from '../utils/auth';

// New Component Imports
import GamePanel from '../components/game/GamePanel';
import Leaderboard from '../components/ranking/Leaderboard';
import TierBadge from '../components/ranking/TierBadge';
import CoachingPanel from '../components/ai/CoachingPanel';
import VoiceAssistant from '../components/ai/VoiceAssistant';
import BatOverlay from '../components/animations/BatOverlay';

const getBadgeContent = (state) => {
  switch (state) {
    case 'bull': return { icon: TrendingUp, text: 'Gotham Rising', color: 'text-green-400', glow: 'drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]', border: 'border-green-400/50' };
    case 'panic': return { icon: TrendingDown, text: 'City in Chaos', color: 'text-red-500', glow: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]', border: 'border-red-500/50' };
    default: return { icon: Minus, text: 'Silent Watch', color: 'text-batman-yellow', glow: 'drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]', border: 'border-batman-yellow/50' };
  }
};

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [portfolio, setPortfolio] = useState({ cash: 1000, assets: 0, lastTrade: null });
  const [loadingAction, setLoadingAction] = useState(false);
  const [batEventTrigger, setBatEventTrigger] = useState(0);
  
  const user = getUser();
  const currentUserEmail = user?.email;

  const fetchMarket = async () => {
    try {
      const res = await getMarketData();
      setMarketData(prev => res?.data ?? {});
      if (res?.data?.portfolio) {
         setPortfolio(prev => ({ 
             ...prev, 
             cash: res.data?.portfolio?.cash ?? 0, 
             assets: res.data?.portfolio?.assets ?? 0 
         }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    let interval;

    const fetchData = async () => {
      try {
        const res = await getMarketData();
        if (mounted) {
          setMarketData(prev => res?.data ?? {});
          if (res?.data?.portfolio) {
            setPortfolio(prev => ({
              ...prev,
              cash: res.data?.portfolio?.cash ?? 0,
              assets: res.data?.portfolio?.assets ?? 0
            }));
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to fetch dashboard data:', err);
        }
      }
    };

    fetchData();
    interval = setInterval(fetchData, 2000);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const handleTrade = async (type) => {
    setLoadingAction(type);
    try {
      const res = await executeTrade(type, 1);
      setPortfolio(prev => ({
        cash: res?.data?.portfolio?.cash ?? prev.cash,
        assets: res?.data?.portfolio?.assets ?? prev.assets,
        lastTrade: { type, time: new Date() }
      }));
      // Trigger bat swoop animation on trade
      setBatEventTrigger(prev => Date.now());
      fetchMarket();
    } catch (err) {
      console.error('Trade failed', err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (!marketData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-batman-yellow animate-spin" />
      </div>
    );
  }

  // Safe extraction matching backend properties (assumes backend attaches these to current state)
  const market = marketData;
  const badge = getBadgeContent(market?.state);
  const BadgeIcon = badge.icon;
  const priceHistory = market?.priceHistory || [];
  
  // Destructure leaderboard & AI insights safely from the API response
  const leaderboard = marketData?.leaderboard || [];
  
  // Find current user's stats natively from leaderboard payload
  const myStats = leaderboard.find(p => p.userId === currentUserEmail) || {};
  
  const tierData = {
    currentTier: myStats?.tier ?? 'Bronze',
    progressPercentage: myStats?.progressPercentage ?? 0
  };

  const { systemInsight, coachingAdvice, voiceInsight } = marketData || {};

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar"
    >
      <BatBackground count={6} />
      <BatOverlay triggerEvent={batEventTrigger} />
      
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-batman-border/30 pb-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-widest drop-shadow-md">GOTHAM EXCHANGE</h1>
            <p className="text-batman-muted font-mono mt-1 text-xs">OPERATIVE ID: {currentUserEmail}</p>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-2 px-6 py-2 border rounded-sm font-display tracking-widest uppercase ${badge.color} ${badge.border} ${badge.glow} bg-black/60 backdrop-blur-sm shadow-xl`}
            style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
          >
            <BadgeIcon size={18} />
            {badge.text}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Chart & Trading Layout */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Top row: Chart + GamePanel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Chart Column */}
              <div className="md:col-span-2">
                <GlassCard className="p-4 sm:p-6 flex flex-col h-full min-h-[350px]">
                  <div className="flex justify-between items-end mb-4 border-b border-batman-border/50 pb-2">
                    <p className="text-batman-muted font-mono text-xs uppercase tracking-widest">Global Volatility Render</p>
                    <p className={`font-mono text-xs uppercase tracking-widest ${market.riskLevel === 'Extreme' ? 'text-red-500' : market.riskLevel === 'High' ? 'text-orange-500' : 'text-green-500'}`}>
                      Risk Constraint: {market.riskLevel || 'LOW'}
                    </p>
                  </div>
                  <div className="flex-1 min-h-[250px] relative rounded-sm overflow-hidden border border-batman-border/30">
                    <ChartComponent priceHistory={priceHistory} />
                  </div>
                </GlassCard>
              </div>

              {/* GamePanel Column */}
              <div className="h-full">
                <GamePanel 
                  market={market} 
                  portfolio={portfolio} 
                  handleTrade={handleTrade} 
                  loadingAction={loadingAction} 
                />
              </div>

            </div>

            {/* Bottom Row inside Main: Coaching Panel & AI Terminal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CoachingPanel coachingAdvice={coachingAdvice} />
              <Terminal explanation={market.explanation} />
            </div>

          </div>

          {/* Right Sidebar: Hierarchy & Ranks */}
          <div className="space-y-6 flex flex-col h-full">
            <TierBadge tierData={tierData} />
            <Leaderboard leaderboard={leaderboard} currentUserEmail={currentUserEmail} />
          </div>

        </div>
      </div>

      {/* Floating Global Voice Assistant Panel */}
      <VoiceAssistant voiceInsight={voiceInsight || { message: systemInsight?.message }} />

    </motion.div>
  );
};

export default Dashboard;
