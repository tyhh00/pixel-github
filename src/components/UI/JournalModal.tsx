'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGameStore } from '@/store/gameStore';
import { fetchRepoReadme } from '@/services/github';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoFullName?: string; // e.g., "owner/repo"
  repoName?: string;
}

export function JournalModal({ isOpen, onClose, repoFullName, repoName }: JournalModalProps) {
  const { currentTheme } = useGameStore();
  const colors = currentTheme.colors;
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && repoFullName) {
      setLoading(true);
      setError(null);

      const [owner, repo] = repoFullName.split('/');
      fetchRepoReadme(owner, repo)
        .then((content) => {
          if (content) {
            setReadme(content);
          } else {
            setError('No README found for this repository.');
          }
        })
        .catch(() => {
          setError('Failed to load README.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, repoFullName]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[100]"
          />

          {/* Journal Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 sm:inset-8 md:inset-16 lg:inset-24 z-[101] flex items-center justify-center"
          >
            <div
              className="relative w-full h-full max-w-4xl mx-auto rounded-lg overflow-hidden flex flex-col"
              style={{
                background: 'linear-gradient(to bottom, #f5e6d3, #e8d4bc)',
                boxShadow: `
                  0 0 0 4px #8b5a2b,
                  0 0 0 8px #6d4c41,
                  0 25px 50px rgba(0,0,0,0.5),
                  inset 0 2px 0 rgba(255,255,255,0.3)
                `,
              }}
            >
              {/* Book spine decoration */}
              <div
                className="absolute left-0 top-0 bottom-0 w-4"
                style={{
                  background: 'linear-gradient(to right, #5d4037, #6d4c41, #5d4037)',
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
                }}
              />

              {/* Header - like a book title */}
              <div
                className="relative px-8 py-4 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(to bottom, #6d4c41, #5d4037)',
                  borderBottom: '3px solid #4e342e',
                }}
              >
                <div className="flex items-center gap-3 pl-4">
                  <BookOpen className="w-6 h-6 text-amber-200" />
                  <div>
                    <h2 className="text-lg font-bold text-amber-100">
                      {repoName || 'README'}
                    </h2>
                    <p className="text-xs text-amber-200/70">Repository Documentation</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff8e1',
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content area - parchment style */}
              <div
                className="flex-1 overflow-y-auto pl-8 pr-6 py-6"
                style={{
                  background: `
                    linear-gradient(to right, rgba(0,0,0,0.05) 0%, transparent 10%),
                    linear-gradient(to bottom, #f5e6d3, #ede0cc)
                  `,
                }}
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-700" />
                    <p className="text-amber-800 font-medium">Loading ancient scrolls...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <AlertCircle className="w-10 h-10 text-amber-700" />
                    <p className="text-amber-800 font-medium">{error}</p>
                  </div>
                )}

                {!loading && !error && readme && (
                  <div className="prose prose-amber max-w-none journal-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom styling for markdown elements
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-amber-900 border-b-2 border-amber-300 pb-2 mb-4">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-bold text-amber-900 border-b border-amber-200 pb-1 mb-3 mt-6">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-bold text-amber-800 mb-2 mt-4">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-amber-900 leading-relaxed mb-4">
                            {children}
                          </p>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-700 underline hover:text-amber-600 font-medium"
                          >
                            {children}
                          </a>
                        ),
                        code: ({ className, children }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-amber-200/50 text-amber-900 px-1.5 py-0.5 rounded font-mono text-sm">
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-amber-900/90 text-amber-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                              {children}
                            </code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-amber-900/90 text-amber-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-4">
                            {children}
                          </pre>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-amber-900 mb-4 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside text-amber-900 mb-4 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-amber-900">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-amber-400 pl-4 italic text-amber-800 my-4">
                            {children}
                          </blockquote>
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt}
                            className="max-w-full h-auto rounded-lg shadow-md my-4"
                          />
                        ),
                        table: ({ children }) => (
                          <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-amber-300">
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="bg-amber-200 border border-amber-300 px-3 py-2 text-left font-bold text-amber-900">
                            {children}
                          </th>
                        ),
                        td: ({ children }) => (
                          <td className="border border-amber-300 px-3 py-2 text-amber-900">
                            {children}
                          </td>
                        ),
                        hr: () => (
                          <hr className="border-t-2 border-amber-300 my-6" />
                        ),
                      }}
                    >
                      {readme}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Footer - page curl effect hint */}
              <div
                className="px-8 py-3 flex items-center justify-between"
                style={{
                  background: 'linear-gradient(to top, #d4c4a8, #e8d4bc)',
                  borderTop: '1px solid #c4b49a',
                }}
              >
                <span className="text-xs text-amber-700/70 pl-4">
                  Press <kbd className="px-1.5 py-0.5 bg-amber-200 rounded text-amber-800 font-mono">ESC</kbd> to close
                </span>
                {repoFullName && (
                  <a
                    href={`https://github.com/${repoFullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-700 hover:text-amber-600 font-medium"
                  >
                    View on GitHub
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
