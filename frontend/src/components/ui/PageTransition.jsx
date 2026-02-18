import { motion } from 'framer-motion';

/**
 * PageTransition — wraps route content with a smooth enter/exit animation.
 *
 * Usage: wrap each Route element:
 *   <Route path="/" element={<PageTransition><Home /></PageTransition>} />
 *
 * Animation: fade + subtle upward slide (16px), 300ms ease-out.
 * Exit: fade out + slight downward drift.
 */

const variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
