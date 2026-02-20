
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: any) => void;
  userRole: UserRole;
  userName?: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, userRole, userName, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'members', label: 'Members', icon: Users },
  ];

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* MOBILE HEADER - Fixed at the top */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-[50] shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
          <span className="font-bold text-slate-900 tracking-tight">ChitTrack</span>
        </div>
        <div className="flex items-center space-x-1">
           <button className="p-2 text-slate-400">
             <Bell className="w-5 h-5" />
           </button>
           <button 
             onClick={() => setIsMobileMenuOpen(true)}
             className="p-2 text-slate-900 bg-slate-100 rounded-lg active:scale-95 transition-transform"
             aria-label="Open Menu"
           >
             <Menu className="w-6 h-6" />
           </button>
        </div>
      </header>

      {/* DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR / DRAWER */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] bg-white transition-transform duration-300 transform w-[280px] shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 md:border-r md:border-slate-200 flex flex-col md:shadow-none
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-6 md:px-8 md:py-8">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">C</div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">ChitTrack</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Profile/Admin Section */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-4 bg-slate-50 rounded-2xl mb-2">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm uppercase">
                {userName?.[0] || 'A'}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate tracking-tight">{userName || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{userRole}</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-4 px-4 py-4 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pt-20 pb-28 md:pt-8 md:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* BOTTOM NAVIGATION (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-around z-[50]">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`flex flex-col items-center space-y-1 flex-1 transition-all ${
              activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-indigo-50' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
        <button
           onClick={() => setIsMobileMenuOpen(true)}
           className="flex flex-col items-center space-y-1 flex-1 text-slate-400"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-wider">Menu</span>
        </button>
      </nav>
    </div>
  );
};
