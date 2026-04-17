import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMarketData, getHistoryData, adminControl } from '../utils/api';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import BatBackground from '../components/BatBackground';
import { ShieldAlert, Activity, Users, Database } from 'lucide-react';

const AdminPanel = () => {
  const [market, setMarket] = useState(null);
  const [orders, setOrders] = useState([]);
  const [confirming, setConfirming] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [marketRes, historyRes] = await Promise.all([
          getMarketData(),
          getHistoryData()
        ]);
        setMarket(marketRes.data);
        setOrders(historyRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminAction = async (action) => {
    if (confirming !== action) {
      setConfirming(action);
      return;
    }
    
    setActionLoading(true);
    try {
      await adminControl(action);
      setConfirming(null);
    } catch (err) {
      console.error(`Failed to execute ${action}`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action === 'crash') return 'bg-red-500/20 text-red-500 border-red-500 hover:bg-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    if (action === 'reset') return 'bg-orange-500/20 text-orange-500 border-orange-500 hover:bg-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
    return 'bg-batman-yellow/20 text-batman-yellow border-batman-yellow hover:bg-batman-yellow/40 shadow-[0_0_15px_rgba(255,215,0,0.5)]';
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <BatBackground count={8} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="text-batman-yellow w-8 h-8 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
          <h1 className="font-display text-4xl text-batman-yellow tracking-wider">SYSTEM OVERRIDE</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex items-center gap-4">
            <Activity className="text-blue-400 w-8 h-8" />
            <div>
              <p className="text-xs text-batman-muted uppercase tracking-widest">Market State</p>
              <p className="font-mono text-2xl font-bold uppercase text-white">{market?.state || '---'}</p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center gap-4">
            <Users className="text-purple-400 w-8 h-8" />
            <div>
              <p className="text-xs text-batman-muted uppercase tracking-widest">Active Agents</p>
              <p className="font-mono text-2xl font-bold text-white">10</p>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4 flex items-center gap-4">
            <Database className="text-green-400 w-8 h-8" />
            <div>
              <p className="text-xs text-batman-muted uppercase tracking-widest">Live Orders</p>
              <p className="font-mono text-2xl font-bold text-white">{orders.length}</p>
            </div>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <GlassCard className="p-6">
            <h2 className="font-display tracking-widest text-xl mb-4 border-b border-batman-border pb-2 text-white">MANUAL CONTROLS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'crash', label: 'FORCE CRASH' },
                { id: 'pause', label: 'PAUSE ALGORITHM' },
                { id: 'resume', label: 'RESUME ALGORITHM' },
                { id: 'reset', label: 'PURGE MARKET DATA' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => handleAdminAction(btn.id)}
                  className={`px-4 py-4 border rounded-sm font-display tracking-widest transition-all duration-200 ${getActionColor(btn.id)} clip-path-bat`}
                  style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
                >
                  {confirming === btn.id ? 'CONFIRM ACTION' : btn.label}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col h-[400px]">
             <h2 className="font-display tracking-widest text-xl mb-4 border-b border-batman-border pb-2 text-white">LIVE FEED interception</h2>
             <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {orders.slice(0, 20).map((o, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={o._id || idx}
                    className="flex justify-between items-center text-sm font-mono border-b border-batman-border/50 py-2"
                  >
                    <span className={o.type === 'buy' ? 'text-green-400' : o.type === 'sell' ? 'text-red-400' : 'text-gray-400'}>
                      [{o.type.toUpperCase()}]
                    </span>
                    <span className="text-white">QTY: {o.quantity}</span>
                    <span className="text-batman-yellow">${o.price?.toFixed(2)}</span>
                  </motion.div>
                ))}
             </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
