
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PaymentGrid } from './components/PaymentGrid';
import { MemberList } from './components/MemberList';
import { AIInsights } from './components/AIInsights';
import { ChitSettings } from './components/ChitSettings';
import { Login } from './components/Login';
import { AppData, PaymentStatus, Member, UserRole, AuthState, PaymentMethod } from './types';
import { calculatePaymentDate } from './utils/dateUtils';
import { subscribeToChitData, saveChitData } from './services/firebase';
import { Loader2, AlertTriangle, ShieldAlert, Database, ExternalLink, RefreshCw } from 'lucide-react';

const STORAGE_KEY = 'chittrack_local_fallback';

const INITIAL_DATA: AppData = {
  config: {
    id: 'chit-1',
    name: 'Shared Group',
    totalChitValue: 500000,
    fixedMonthlyCollection: 2000,
    monthlyPayoutBase: 25000,
    durationMonths: 20,
    startDate: new Date().toISOString().split('T')[0],
    adminPhone: '9876543210'
  },
  members: [],
  payments: [],
  auctions: []
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    // Always load from local storage instantly — no waiting for Firebase
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : INITIAL_DATA;
  });

  // FIX: Start isSyncing as FALSE so login page shows immediately
  // The cloud sync happens silently in the background
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);

  const [auth, setAuth] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('chittrack_auth');
    return savedAuth ? JSON.parse(savedAuth) : { isAuthenticated: false, role: UserRole.MEMBER, phoneNumber: '' };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'payments' | 'members' | 'ai' | 'settings'>('dashboard');

  const isSyncingRef = useRef(false);

  useEffect(() => {
    // Background sync — does NOT block login or UI
    const syncTimeout = setTimeout(() => {
      if (isSyncingRef.current) {
        isSyncingRef.current = false;
        setIsSyncing(false);
        setSyncError("Cloud slow - using local data");
      }
    }, 10000);

    const unsubscribe = subscribeToChitData(
      (newData) => {
        clearTimeout(syncTimeout);
        isSyncingRef.current = false;
        setIsSyncing(false);
        setSyncError(null);
        setCloudReady(true);

        if (newData !== null) {
          // Safely merge cloud data with defaults to prevent crashes
          // when Firestore doc is missing fields like config
          const safeData: AppData = {
            config: { ...INITIAL_DATA.config, ...(newData.config || {}) },
            members: newData.members || [],
            payments: newData.payments || [],
            auctions: newData.auctions || [],
          };
          setData(safeData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
        } else {
          // Cloud doc is empty — push local data up to Firestore
          const local = localStorage.getItem(STORAGE_KEY);
          const localData: AppData = local ? JSON.parse(local) : INITIAL_DATA;
          saveChitData(localData).catch(console.warn);
        }
      },
      (error) => {
        clearTimeout(syncTimeout);
        isSyncingRef.current = false;
        setIsSyncing(false);
        setCloudReady(false);

        if (error.name === 'AbortError' || error.message?.includes('aborted') || error.code === 'cancelled') return;

        if (error.code === 'permission-denied') {
          if (error.message?.includes('API has not been used')) {
            setSyncError("Cloud API Disabled - Enable in Console");
          } else {
            setSyncError("Permission Denied - Check Firestore Rules");
          }
        } else if (error.code === 'placeholder-config') {
          setSyncError("Firebase Configuration Required");
        } else {
          setSyncError("Cloud Offline - Using Local Data");
        }
      }
    );

    return () => {
      clearTimeout(syncTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('chittrack_auth', JSON.stringify(auth));
  }, [auth]);

  const handleLogin = (newAuth: AuthState) => setAuth(newAuth);
  const handleLogout = () => setAuth({ isAuthenticated: false, role: UserRole.MEMBER, phoneNumber: '' });

  const safeSave = (newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    saveChitData(newData).catch((err) => {
      if (err.name === 'AbortError' || err.message?.includes('aborted') || err.code === 'cancelled') return;
      console.warn("Cloud save pending (Offline/Error):", err.message);
    });
  };

  const handleUpdatePayment = (memberId: string, monthIndex: number, status: PaymentStatus, method?: PaymentMethod, extraAmount: number = 0, customDate?: string, receiptUrl?: string, receiptName?: string, notes?: string, customAmount?: number) => {
    if (auth.role !== UserRole.ADMIN) return;
    const existingIdx = data.payments.findIndex(p => p.memberId === memberId && p.monthIndex === monthIndex);
    const newPayments = [...data.payments];
    const amount = data.config.fixedMonthlyCollection;
    const paymentDate = status === PaymentStatus.PAID ? (customDate || calculatePaymentDate(data.config.startDate, monthIndex)) : undefined;
    if (existingIdx >= 0) {
      newPayments[existingIdx] = { ...newPayments[existingIdx], status, amount, customAmount, extraAmount, method, paymentDate, receiptUrl, receiptName, notes };
    } else {
      newPayments.push({ memberId, monthIndex, amount, customAmount, extraAmount, status, method, paymentDate, receiptUrl, receiptName, notes });
    }
    safeSave({ ...data, payments: newPayments });
  };

  const handleUpdateAuction = (monthIndex: number, auctionAmount: number) => {
    if (auth.role !== UserRole.ADMIN) return;
    const newAuctions = [...data.auctions];
    const idx = newAuctions.findIndex(a => a.monthIndex === monthIndex);
    if (idx >= 0) {
      newAuctions[idx] = { ...newAuctions[idx], auctionAmount };
    } else {
      newAuctions.push({ monthIndex, auctionAmount });
    }
    safeSave({ ...data, auctions: newAuctions });
  };

  const handleUpdateConfig = (config: any) => {
    if (auth.role !== UserRole.ADMIN) return;
    safeSave({ ...data, config: { ...data.config, ...config } });
  };

  const handleAddMember = (member: Omit<Member, 'id'>) => {
    if (auth.role !== UserRole.ADMIN) return;
    const newMember = { ...member, id: Math.random().toString(36).substr(2, 9) };
    safeSave({ ...data, members: [...data.members, newMember] });
  };

  const handleUpdateMember = (id: string, updatedMember: Partial<Member>) => {
    if (auth.role !== UserRole.ADMIN) return;
    safeSave({ ...data, members: data.members.map(m => m.id === id ? { ...m, ...updatedMember } : m) });
  };

  const handleDeleteMember = (id: string) => {
    if (auth.role !== UserRole.ADMIN) return;
    safeSave({
      ...data,
      members: data.members.filter(m => m.id !== id),
      payments: data.payments.filter(p => p.memberId !== id)
    });
  };

  if (!auth.isAuthenticated) {
    return (
      <Login
        data={data}
        onLogin={handleLogin}
        onImportFile={() => {}}
        isSyncing={isSyncing}
        syncError={syncError}
      />
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      userRole={auth.role}
      userName={auth.userName}
      onLogout={handleLogout}
    >
      {/* Cloud Status Panel */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {isSyncing ? (
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing...</span>
          </div>
        ) : syncError ? (
          <div className="flex items-center space-x-3 px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 shadow-sm cursor-help" title={syncError}>
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{syncError}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cloud Active</span>
          </div>
        )}
      </div>

      {/* Setup Instructions Overlay for Admin */}
      {syncError && auth.role === UserRole.ADMIN && (
        <div className="mb-8 bg-white rounded-3xl border border-rose-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6" />
              <h3 className="font-black uppercase italic tracking-tight">Cloud Configuration Required</h3>
            </div>
            <button onClick={() => window.location.reload()} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs flex-shrink-0">1</div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase italic">Configure your own Firebase Project</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Update `services/firebase.ts` with your own API Key and Project ID.</p>
                <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-xs font-black text-indigo-600 uppercase tracking-widest mt-3 hover:underline">
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <div className="flex items-start space-x-4 border-t border-slate-50 pt-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs flex-shrink-0">2</div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase italic">Update Firestore Rules</p>
                <div className="mt-3 p-4 bg-slate-900 rounded-xl font-mono text-[10px] text-emerald-400 overflow-x-auto">
                  allow read, write: if true;
                </div>
              </div>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-relaxed">
                App is currently running in "Local Mode". Data will only save on THIS device until cloud is fixed.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' && <Dashboard data={data} />}
      {activeTab === 'payments' && (
        <PaymentGrid data={data} userRole={auth.role} onUpdateStatus={handleUpdatePayment} onUpdateAuction={handleUpdateAuction} />
      )}
      {activeTab === 'members' && (
        <MemberList members={data.members} userRole={auth.role} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} />
      )}
      {activeTab === 'ai' && <AIInsights data={data} userRole={auth.role} />}
      {activeTab === 'settings' && (
        <ChitSettings config={data.config} data={data} userRole={auth.role} onUpdateConfig={handleUpdateConfig} onLogout={handleLogout} onImportFile={() => {}} />
      )}
    </Layout>
  );
};

export default App;
