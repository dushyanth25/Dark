import { useEffect, useRef } from 'react';

/**
 * Lightweight CSS-only floating particles — no canvas, no heavy libs.
 * Creates DOM particles that animate via CSS keyframes.
 */
const Particles = ({ count = 18 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = Math.random() * 3 + 1; // 1–4px
      const left = Math.random() * 100;
      const delay = Math.random() * 12;
      const duration = Math.random() * 10 + 8; // 8–18s
      const opacity = Math.random() * 0.5 + 0.1;

      // Alternate between yellow dots and small bat silhouettes
      const isBat = Math.random() > 0.7;

      el.className = 'particle';
      Object.assign(el.style, {
        width: isBat ? `${size * 5}px` : `${size}px`,
        height: isBat ? `${size * 3}px` : `${size}px`,
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        backgroundColor: isBat ? 'transparent' : `rgba(255,215,0,${opacity})`,
        borderRadius: isBat ? '0' : '50%',
        clipPath: isBat
          ? 'polygon(50% 0%, 20% 40%, 0% 60%, 15% 70%, 30% 55%, 50% 100%, 70% 55%, 85% 70%, 100% 60%, 80% 40%)'
          : '',
        background: isBat ? `rgba(255,215,0,${opacity * 0.6})` : `rgba(255,215,0,${opacity})`,
      });

      container.appendChild(el);
    }

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    />
  );
};

export default Particles;
