import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, Moon, Sun, Search, Zap, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('featurehub-theme');
    console.log('Loading saved theme:', savedTheme);
    
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      applyTheme('dark');
    } else {
      setIsDarkMode(false);
      applyTheme('light');
    }
  }, []);

  const applyTheme = (theme: 'light' | 'dark') => {
    console.log('Applying theme:', theme);
    
    // Remove all theme classes first
    document.body.classList.remove('theme-light', 'theme-dark');
    
    // Add the new theme class
    document.body.classList.add(`theme-${theme}`);
    
    // Also apply to html element for better coverage
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${theme}`);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    const themeValue = newTheme ? 'dark' : 'light';
    applyTheme(themeValue);
    localStorage.setItem('featurehub-theme', themeValue);
    
    console.log('Theme toggled to:', themeValue);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 lg:hover:scale-105"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar flags, projetos..."
                className="pl-10 pr-4 py-2 w-64 lg:w-80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                type="button"
                className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                title="Configurações Rápidas"
              >
                <Settings className="h-4 w-4" />
              </button>
              
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105"
                title={isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro"}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-105 relative"
              >
                <Bell className="h-4 w-4" />
                {/* Notification Badge */}
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border border-white animate-pulse" />
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3 pl-1 sm:pl-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-32">{user?.Name || user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.Role || user?.role}</p>
                </div>
              </div>
              
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar flags, projetos..."
            className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 text-sm"
          />
        </div>
      </div>
    </header>
  );
};