'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Ghost, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a3d12] to-[#0d1f09]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-6"
      >
        {/* Ghost icon */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-6"
        >
          <Ghost className="w-24 h-24 mx-auto text-white/60" />
        </motion.div>

        {/* Error message */}
        <h1 className="text-4xl font-bold text-white mb-3">User Not Found</h1>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          This GitHub user doesn&apos;t exist or their profile is not accessible.
          Check the username and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          <Link
            href="https://github.com"
            target="_blank"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            Search on GitHub
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
