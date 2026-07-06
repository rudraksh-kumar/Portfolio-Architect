import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing.js';
import { Dashboard } from './components/Dashboard.js';
import { PortfolioView } from './components/PortfolioView.js';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [viewState, setViewState] = useState<{ page: 'landing' | 'dashboard' | 'portfolio'; slug?: string }>({
    page: 'landing',
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const currentToken = localStorage.getItem('token');
      if (path.startsWith('/p/')) {
        const slug = path.split('/p/')[1];
        if (slug) {
          setViewState({ page: 'portfolio', slug });
        } else {
          setViewState({ page: 'landing' });
        }
      } else {
        if (currentToken) {
          setViewState({ page: 'dashboard' });
        } else {
          setViewState({ page: 'landing' });
        }
      }
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleAuthSuccess = (newToken: string, shouldRedirect: boolean = true) => {
    setToken(newToken);
    if (shouldRedirect) {
      window.history.pushState({}, '', '/');
      setViewState({ page: 'dashboard' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    window.history.pushState({}, '', '/');
    setViewState({ page: 'landing' });
  };

  const handleGenerationComplete = (slug: string) => {
    if (slug === 'dashboard') {
      window.history.pushState({}, '', '/');
      setViewState({ page: 'dashboard' });
    } else {
      // Direct view of portfolio slug
      window.history.pushState({}, '', `/p/${slug}`);
      setViewState({ page: 'portfolio', slug });
    }
  };

  const handleViewPortfolio = (slug: string) => {
    window.history.pushState({}, '', `/p/${slug}`);
    setViewState({ page: 'portfolio', slug });
  };

  return (
    <>
      {viewState.page === 'portfolio' && viewState.slug && (
        <PortfolioView slug={viewState.slug} />
      )}
      {viewState.page === 'dashboard' && token && (
        <Dashboard token={token} onLogout={handleLogout} onViewPortfolio={handleViewPortfolio} />
      )}
      {viewState.page === 'landing' && (
        <Landing token={token} onAuthSuccess={handleAuthSuccess} onGenerationComplete={handleGenerationComplete} />
      )}
    </>
  );
};

export default App;
