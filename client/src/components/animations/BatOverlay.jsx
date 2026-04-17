import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const motionConfigs = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slideUp: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -20, opacity: 0 } },
  glowPulse: { animate: { boxShadow: ['0 0 5px #FCD34D', '0 0 20px #FCD34D', '0 0 5px #FCD34D'], transition: { repeat: Infinity, duration: 2 } } },
  batSwoop: { initial: { x: '-10vw', y: '50vh', scale: 0.5 }, animate: { x: '110vw', y: '20vh', scale: 1, transition: { duration: 1.5, ease: 'easeIn' } } }
};

const BatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.2,16.4c0,0-1.8-0.9-1.5-2.2c0.2-0.8,1.3-1.3,2.4-1.2C3.5,12.7,4.3,11.3,4.7,11c0,0,0-4,3-6c0,0,0.5,2,2.5,2c0.5-0.1,1.5-0.2,1.8-1c0,0-0.4-2,0-3c1,0.5,1,1,1,1s2.5,3.5,7.5,1c0,0,0,1-1,2c0,0,3,1.5,4,0.5c-0.5,3.5-3.5,4-3.5,4s-1.5,1.5-1,3.5C18.8,15,13.5,14,12,19C11,15,6,15.5,2.2,16.4z" />
  </svg>
);

const BatOverlay = ({ triggerEvent }) => {
  const [swoopBats, setSwoopBats] = useState([]);
  const [driftBats, setDriftBats] = useState([]);

  useEffect(() => {
    // Generate 3 slow drift bats
    const drift = Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 15 + Math.random() * 15,
      delay: Math.random() * 5
    }));
    setDriftBats(drift);
  }, []);

  useEffect(() => {
    if (triggerEvent) {
      const newBat = { id: Date.now() };
      setSwoopBats(prev => [...prev.slice(-4), newBat]); // max 5
      const timer = setTimeout(() => {
        setSwoopBats(prev => prev.filter(b => b.id !== newBat.id));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [triggerEvent]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {driftBats.map(bat => (
        <motion.div
          key={`drift-${bat.id}`}
          className="absolute text-black opacity-10"
          initial={{ x: `${bat.x}vw`, y: `${bat.y}vh` }}
          animate={{ x: `${(bat.x + 20) % 100}vw`, y: `${(bat.y + 10) % 100}vh` }}
          transition={{ duration: bat.duration, delay: bat.delay, repeat: Infinity, repeatType: "reverse" }}
        >
          <BatIcon />
        </motion.div>
      ))}

      <AnimatePresence>
        {swoopBats.map(bat => (
          <motion.div
            key={bat.id}
            className="absolute text-batman-yellow opacity-40 mix-blend-screen"
            variants={motionConfigs.batSwoop}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0 }}
          >
            <BatIcon />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BatOverlay;
