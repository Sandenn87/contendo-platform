import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabaseClient } from '../lib/supabase';
import { LayoutDashboard, Heart, GraduationCap, Building2, DollarSign, Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/healthcare', icon: Heart, label: 'Healthcare' },
    { path: '/training', icon: GraduationCap, label: 'Training' },
    { path: '/arbiter', icon: Building2, label: 'Arbiter' },
    { path: '/financial', icon: DollarSign, label: 'Financial' },
    { path: '/crm', icon: Users, label: 'CRM' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-700">Contendo</h1>
          <p className="text-sm text-gray-500 mt-1">Business Platform</p>
        </div>
        <nav className="mt-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                  isActive ? 'bg-primary-50 border-r-4 border-primary-600 text-primary-700' : ''
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

