import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SpeechToTextPage from './pages/SpeechToTextPage';
import StudentDashboard from './pages/StudentDashboard';
import ThemeToggle from './components/ThemeToggle';
import { Mic, LayoutDashboard, CreditCard } from 'lucide-react';

function App() {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <>
      {isAuthenticated ? (
        activePage === 'dashboard' ? (
          <DashboardPage onViewChange={setActivePage} />
        ) : activePage === 'student-dashboard' ? (
          <StudentDashboard onViewChange={setActivePage} />
        ) : (
          <SpeechToTextPage onViewChange={setActivePage} />
        )
      ) : (
        <LoginPage />
      )}
      <ThemeToggle />

      {isAuthenticated && (
        <button 
          className="floating-action-btn"
          onClick={() => setActivePage(prev => {
            if (prev === 'dashboard') return 'student-dashboard';
            if (prev === 'student-dashboard') return 'speech-to-text';
            return 'dashboard';
          })}
          title="Switch views"
        >
          {activePage === 'dashboard' ? <CreditCard size={24} /> : activePage === 'student-dashboard' ? <Mic size={24} /> : <LayoutDashboard size={24} />}
        </button>
      )}
    </>
  );
}

export default App;
