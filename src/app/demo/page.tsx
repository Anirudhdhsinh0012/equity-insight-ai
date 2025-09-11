'use client';

import LandingPage from '@/components/LandingPage';

export default function DemoPage() {
  // Provide a minimal onLogin handler to satisfy required prop for the landing page component
  const handleLogin = (user: any) => {
    // no-op for demo build
    return;
  };

  return <LandingPage onLogin={handleLogin} />;
}
