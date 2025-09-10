/**
 * Export Test Page
 * A simple page to test the export functionality
 */

'use client';

import React from 'react';
import ApiQuotaBanner from '@/components/ApiQuotaBanner';

export default function ExportTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Export & Reports Test Page
        </h1>
        
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              API Quota Banner with Export
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The banner below includes export functionality. Click the download icon to access CSV and PDF export options.
            </p>
            
            {/* Always show the banner for testing */}
            <ApiQuotaBanner showAlways={true} className="mb-4" />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Export Features
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">CSV Export</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Historical quota usage data</li>
                  <li>• Daily breakdowns with timestamps</li>
                  <li>• Usage percentages and limits</li>
                  <li>• Perfect for Excel analysis</li>
                </ul>
              </div>
              
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">PDF Reports</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Professional formatted reports</li>
                  <li>• Executive summary with insights</li>
                  <li>• Visual usage trends and status</li>
                  <li>• Ready for audits and billing</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
              📊 Export Options Available
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• <strong>CSV - Last 7 days:</strong> Quick overview for recent analysis</p>
              <p>• <strong>CSV - Last 30 days:</strong> Monthly usage patterns and trends</p>
              <p>• <strong>PDF - Last 7 days:</strong> Professional weekly report</p>
              <p>• <strong>PDF - Last 30 days:</strong> Comprehensive monthly analysis</p>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
            <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">
              ✅ Implementation Status
            </h3>
            <div className="text-sm text-green-800 dark:text-green-200">
              <p>
                The export functionality has been successfully implemented with both frontend UI and backend API endpoints. 
                The system generates realistic historical data for demonstration and provides professional reports 
                suitable for audits and billing reconciliation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
