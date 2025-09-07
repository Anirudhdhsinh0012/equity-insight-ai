'use client';

import React from 'react';
import CustomerDashboard from './CustomerDashboard';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const DemoEnhancedDashboard: React.FC = () => {
  // Demo user data
  const demoUser = {
    id: 'demo-user',
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    phoneNumber: '+1234567890',
    createdAt: new Date()
  };

  const handleLogout = () => {
    console.log('Demo logout - would redirect to landing page');
  };

  return (
    <ThemeProvider>
      <NotificationProvider userId={demoUser.id}>
        <CustomerDashboard user={demoUser} onLogout={handleLogout} />
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default DemoEnhancedDashboard;
