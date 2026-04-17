import { motion } from 'framer-motion';

/**
 * Button — Batman-themed interactive button with Framer Motion
 * Props:
 *   children   — label content
 *   onClick    — click handler
 *   type       — html button type (default 'button')
 *   variant    — 'primary' | 'outline' | 'ghost'
 *   disabled   — disabled state
 *   loading    — shows spinner when true
 *   className  — extra classes
 *   fullWidth  — stretch to full container width
 */
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
}) => {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-batman-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-batman-black';

  // Bat-wing inspired angular look
  const clipPathStyle = { clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" };

  const variants = {
    primary:
      'bg-batman-yellow text-batman-black border-none hover:bg-batman-yellowDim shadow-[0_0_15px_rgba(255,215,0,0.4)] hover:shadow-[0_0_25px_rgba(255,215,0,0.8)] px-6 py-3 text-sm',
    outline:
      'bg-transparent text-batman-yellow border border-batman-yellow hover:bg-batman-yellow/20 hover:text-batman-yellow glow-yellow-sm hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] px-6 py-3 text-sm',
    ghost:
      'bg-transparent text-batman-muted border border-batman-border hover:border-batman-yellow hover:text-batman-yellow px-4 py-2 text-sm',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={clipPathStyle}
      whileHover={isDisabled ? {} : { scale: 1.03 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`
        ${base}
        ${variants[variant] ?? variants.primary}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
};

export default Button;
