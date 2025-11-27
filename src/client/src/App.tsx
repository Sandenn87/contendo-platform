import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase';
import Dashboard from './pages/Dashboard';
import Healthcare from './pages/Healthcare';
import Training from './pages/Training';
import Arbiter from './pages/Arbiter';
import Financial from './pages/Financial';
import CRM from './pages/CRM';
import Login from './pages/Login';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/healthcare" element={<Healthcare />} />
          <Route path="/training" element={<Training />} />
          <Route path="/arbiter" element={<Arbiter />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

