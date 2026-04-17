import { motion } from 'framer-motion';

const swoopVariants = {
  initial: { x: '100vw', opacity: 1 },
  animate: { x: '-100vw', opacity: 1, transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] } },
  exit: { x: '100vw', opacity: 1, transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] } },
};

const contentVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { delay: 0.4, duration: 0.4 } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.3 } },
};

const PageTransition = ({ children }) => {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-batman-black pointer-events-none flex items-center justify-center overflow-hidden"
        variants={swoopVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <svg viewBox="0 0 200 120" className="w-[300px] h-[300px] fill-batman-yellow opacity-20 transform scale-150 relative -right-10">
          <path d="M100 10 C70 10 40 30 20 30 C10 30 0 24 0 24 C10 40 20 56 30 60 C20 60 10 56 4 60 C16 76 40 84 60 80 C70 96 84 104 100 104 C116 104 130 96 140 80 C160 84 184 76 196 60 C190 56 180 60 170 60 C180 56 190 40 200 24 C200 24 190 30 180 30 C160 30 130 10 100 10Z" />
        </svg>
      </motion.div>
      <motion.div
        variants={contentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </>
  );
};

export default PageTransition;
