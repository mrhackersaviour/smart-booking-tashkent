import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 min-h-[80vh] flex items-center justify-center bg-surface px-6">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-32 h-32 mx-auto mb-8 rounded-full bg-surface-container-low flex items-center justify-center"
        >
          <MapPin className="h-16 w-16 text-outline-variant" strokeWidth={1.2} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-black tracking-tightest text-on-surface mb-4"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-on-surface-variant mb-2"
        >
          This page doesn't exist
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-outline mb-10"
        >
          The page you're looking for might have been moved or doesn't exist anymore.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button as={Link} to="/" variant="primary" iconLeft={Home}>
            Go Home
          </Button>
          <Button as={Link} to="/venues" variant="secondary" iconLeft={Search}>
            Browse Venues
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
