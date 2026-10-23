import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Overlay from './pages/Overlay';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If you are using React Router, keep your routes. 
  // If you are routing via pathname:
  const isOverlay = window.location.pathname.startsWith('/overlay');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isOverlay) {
    return <Overlay />;
  }

  if (loading) {
    return <div className="min-h-screen bg-[#06080F] flex items-center justify-center text-amber-400 font-mono text-sm">Loading studio...</div>;
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return <Dashboard />;
}