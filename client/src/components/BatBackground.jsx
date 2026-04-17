import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const BatShape = () => (
  <svg viewBox="0 0 200 120" className="w-full h-full fill-current" aria-hidden="true">
    <path d="M100 10 C70 10 40 30 20 30 C10 30 0 24 0 24 C10 40 20 56 30 60 C20 60 10 56 4 60 C16 76 40 84 60 80 C70 96 84 104 100 104 C116 104 130 96 140 80 C160 84 184 76 196 60 C190 56 180 60 170 60 C180 56 190 40 200 24 C200 24 190 30 180 30 C160 30 130 10 100 10Z" />
  </svg>
);

const BatBackground = ({ count = 12 }) => {
  const [bats, setBats] = useState([]);

  useEffect(() => {
    const newBats = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 40 + 20, // 20px to 60px
      left: Math.random() * 100,
      duration: Math.random() * 20 + 15, // 15s to 35s
      delay: Math.random() * 10,
      opacity: Math.random() * 0.4 + 0.2,
      scaleX: Math.random() > 0.5 ? 1 : -1 // random flip
    }));
    setBats(newBats);
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-batman-black">
      {/* Background radial layer */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% -20%, rgba(255, 215, 0, 0.15) 0%, transparent 60%)'
        }}
      />
      
      {/* Animated flying bats layer */}
      {bats.map((bat) => (
        <motion.div
          key={bat.id}
          className="absolute bottom-[-10%] text-batman-black drop-shadow-md"
          initial={{ 
            y: '10vh', 
            x: `${bat.left}vw`, 
            scale: bat.scaleX, 
            opacity: 0,
            rotate: 0 
          }}
          animate={{
            y: '-110vh',
            x: `${bat.left + (Math.random() * 20 - 10)}vw`,
            opacity: [0, bat.opacity, bat.opacity, 0],
            rotate: Math.random() * 20 - 10
          }}
          transition={{
            duration: bat.duration,
            repeat: Infinity,
            delay: bat.delay,
            ease: "easeInOut"
          }}
          style={{ width: bat.size, height: bat.size * 0.6 }}
        >
          <BatShape />
        </motion.div>
      ))}
      
      {/* Wayne Enterprises Watermark */}
      <div className="absolute bottom-6 right-6 opacity-[0.03] select-none pointer-events-none text-right">
        <div className="font-display text-4xl tracking-[0.2em] text-white">WAYNE ENTERPRISES</div>
        <div className="font-sans text-xs tracking-widest text-white mt-1">SECURE GOTHAM NETWORK</div>
      </div>
    </div>
  );
};

export default BatBackground;
