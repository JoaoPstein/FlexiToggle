import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Flag, 
  FolderOpen, 
  BarChart3, 
  Settings,
  Zap,
  X,
  Sparkles,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, badge: null },
  { name: 'Projetos', href: '/projects', icon: FolderOpen, badge: null },
  { name: 'Feature Flags', href: '/feature-flags', icon: Flag, badge: 'New' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: null },
  { name: 'Configurações', href: '/settings', icon: Settings, badge: null },
];

const quickStats = [
  { label: 'Flags Ativas', value: '24', icon: Flag, color: 'text-blue-600' },
  { label: 'Projetos', value: '8', icon: FolderOpen, color: 'text-green-600' },
  { label: 'Usuários', value: '1.2k', icon: Users, color: 'text-purple-600' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
        isOpen ? "lg:w-64" : "lg:w-20"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-gray-200/50 shadow-xl">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              {isOpen && (
                <div className="animate-fade-in">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    FlexiToggle
                  </span>
                  <div className="text-xs text-gray-500 font-medium">Feature Management</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Stats - Only when expanded */}
          {isOpen && (
            <div className="px-6 animate-slide-up">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">Status Geral</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {quickStats.map((stat, index) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <stat.icon className={cn("h-3 w-3", stat.color)} />
                        <span className="text-xs text-gray-600">{stat.label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item, index) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200 relative overflow-hidden',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-md'
                      )
                    }
                    title={!isOpen ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {/* Background glow effect */}
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-xl" />
                        )}
                        
                        <div className="relative flex items-center gap-x-3 w-full">
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0 transition-all duration-200',
                              isActive ? 'text-white scale-110' : 'text-gray-500 group-hover:text-blue-600 group-hover:scale-105'
                            )}
                          />
                          
                          {isOpen && (
                            <div className="flex items-center justify-between w-full">
                              <span className="animate-fade-in">{item.name}</span>
                              {item.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
            
            {/* Bottom Section */}
            {isOpen && (
              <div className="mt-auto pb-4 animate-fade-in">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-gray-900">Sistema Seguro</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Todas as conexões são criptografadas e monitoradas.
                  </div>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl">
          {/* Mobile Header */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FlexiToggle
                </span>
                <div className="text-xs text-gray-500 font-medium">Feature Management</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Mobile Navigation */}
          <nav className="flex flex-1 flex-col px-6">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-x-3 rounded-xl p-3 text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                          )}
                        />
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
