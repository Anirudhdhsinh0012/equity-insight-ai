/**
 * Stock Autocomplete Input Component
 * Provides real-time search and selection of stocks
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { stockSearchService, FinnhubSearchResult } from '@/services/stockSearchService';

interface StockAutocompleteProps {
  value?: string;
  onSelect: (stock: FinnhubSearchResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function StockAutocomplete({
  value = '',
  onSelect,
  placeholder = 'Search for stocks (e.g., AAPL, Tesla)',
  className = '',
  disabled = false
}: StockAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Use the new simplified search API
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          if (response.status === 429) {
            setError('Stock data temporarily unavailable, please try again later.');
          } else {
            setError('Search temporarily unavailable. Please try again.');
          }
          setResults([]);
          setIsOpen(false);
          return;
        }

        const searchResults = await response.json();
        
        if (Array.isArray(searchResults)) {
          // Convert to the expected format
          const formattedResults = searchResults.map(stock => ({
            symbol: stock.symbol,
            displaySymbol: stock.symbol,
            description: stock.name,
            type: 'Common Stock',
            label: `${stock.symbol} - ${stock.name}`
          }));
          
          setResults(formattedResults);
          setIsOpen(formattedResults.length > 0);
          setSelectedIndex(-1);
          
          if (formattedResults.length === 0) {
            setError('No matching stock ticker found.');
          }
        } else if (searchResults.error) {
          setError(searchResults.error);
          setResults([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search temporarily unavailable. Please try again.');
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleSelect = (stock: FinnhubSearchResult) => {
    setQuery(stockSearchService.formatStockOption(stock));
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    onSelect(stock);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (query.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500' : ''}
          `}
          autoComplete="off"
        />

        {/* Loading/Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {results.map((stock, index) => (
              <motion.button
                key={stock.symbol}
                onClick={() => handleSelect(stock)}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between
                  hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0
                  ${selectedIndex === index ? 'bg-gray-50' : ''}
                `}
                type="button"
                whileHover={{ backgroundColor: '#f9fafb' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {stock.symbol}
                    </span>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {stock.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && !error && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No stocks found for "{query}"
        </div>
      )}
    </div>
  );
}
