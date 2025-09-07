'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import StockAutocomplete from './StockAutocomplete';
import { FinnhubSearchResult } from '@/services/stockSearchService';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (ticker: string) => void;
}

export default function AddStockModal({ isOpen, onClose, onAdd }: AddStockModalProps) {
  const [selectedStock, setSelectedStock] = useState<FinnhubSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleStockSelect = (stock: FinnhubSearchResult) => {
    setSelectedStock(stock);
    setError(''); // Clear any previous errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock) {
      setError('Please select a valid stock ticker from the list.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simple validation - just add the ticker
      onAdd(selectedStock.symbol);
      
      // Reset form on success
      setSelectedStock(null);
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError('Failed to add stock. Please try again.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStock(null);
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white/95 dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-700 p-6 w-full max-w-md shadow-xl backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Add New Stock</h2>
              <button
                onClick={handleClose}
                className="text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Stock Search */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                  Stock Ticker *
                </label>
                <StockAutocomplete
                  onSelect={handleStockSelect}
                  placeholder="Search for stocks (e.g., AAPL, Tesla, Microsoft)"
                  className="w-full"
                />
                
                {/* Selected Stock Display */}
                {selectedStock && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-green-800 dark:text-green-300">
                          {selectedStock.symbol}
                        </span>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          {selectedStock.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStock(null)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !selectedStock}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:bg-gray-200 transition-all duration-300 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full"
                  />
                ) : (
                  'Add Stock to Watchlist'
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
