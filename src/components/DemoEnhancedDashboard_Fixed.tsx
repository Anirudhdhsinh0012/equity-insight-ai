'use client';

import React from 'react';
import ModernStockDashboard from './ModernStockDashboard';

const DemoEnhancedDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <ModernStockDashboard
        userName="Alex Thompson"
        className="demo-dashboard"
      />
    </div>
  );
};

export default DemoEnhancedDashboard;
