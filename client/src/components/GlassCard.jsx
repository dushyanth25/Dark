import { motion } from 'framer-motion';

/**
 * GlassCard — Batman-themed glassmorphism container
 * Props:
 *   children  — content
 *   className — extra Tailwind classes
 *   glowing   — enable pulsing yellow glow (default false)
 *   onClick   — optional click handler
 */
const GlassCard = ({ children, className = '', glowing = false, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`
        glass-card rounded-2xl p-6
        ${glowing ? 'animate-pulse_glow' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
