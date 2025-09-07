/**
 * API Test Page
 * Simple test to check if the stock search API is working
 */

'use client';

import React, { useState } from 'react';

export default function ApiTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testSearchAPI = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
      } else {
        setError(data.error || 'API Error');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testQuoteAPI = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      const response = await fetch(`/api/finnhub/quote/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data);
      } else {
        setError(data.error || 'API Error');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Test Query (e.g., "AAPL" or "Apple")
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter stock symbol or company name"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={testSearchAPI}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test Search API'}
          </button>
          
          <button
            onClick={testQuoteAPI}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test Quote API'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-semibold">Error:</p>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {searchResults && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-semibold">Results:</p>
            <pre className="mt-2 text-sm bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
