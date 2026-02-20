
import React, { useState } from 'react';
import { ChitConfig, UserRole, AppData } from '../types';
import { Save, Info, Check, LogOut, Lock, ShieldCheck, Calendar, Wallet, Cloud } from 'lucide-react';

interface ChitSettingsProps {
  config: ChitConfig;
  data: AppData;
  userRole: UserRole;
  onUpdateConfig: (config: any) => void;
  onLogout: () => void;
  onImportFile: (file: File) => void;
}

export const ChitSettings: React.FC<ChitSettingsProps> = ({ config, userRole, onUpdateConfig, onLogout }) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    onUpdateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Session Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic">Account Session</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Status: {userRole}</p>
          </div>
          <button onClick={onLogout} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs uppercase tracking-widest border border-rose-100 flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
      </div>

      {/* Cloud Status */}
      <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-100 border border-emerald-500">
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                 <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Cloud Sync Enabled</h3>
                <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest mt-0.5">Automated Real-Time Mirroring</p>
              </div>
           </div>
           <p className="text-xs font-medium text-emerald-50/80 mt-6 leading-relaxed">
             This group is now connected to Firebase Cloud. Every change made by an Admin is instantly reflected on all member devices. No manual sharing required.
           </p>
      </div>

      {/* Main Configuration Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Group Rules</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Financial Architecture</p>
          </div>
          {!isAdmin && <div className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase flex items-center space-x-2"><Lock className="w-3 h-3" /><span>Protected</span></div>}
        </div>
        
        <form onSubmit={handleSubmit} className={`p-8 space-y-6 ${!isAdmin ? 'opacity-70 grayscale-[0.2]' : ''}`}>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Chit Fund Name</label>
              <input disabled={!isAdmin} type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Value (₹)</label>
                <input disabled={!isAdmin} type="number" value={formData.totalChitValue} onChange={(e) => setFormData({ ...formData, totalChitValue: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-indigo-600 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Monthly/Member (₹)</label>
                <input disabled={!isAdmin} type="number" value={formData.fixedMonthlyCollection} onChange={(e) => setFormData({ ...formData, fixedMonthlyCollection: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-emerald-600 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                <input disabled={!isAdmin} type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Mobile</label>
                <input disabled={!isAdmin} type="tel" value={formData.adminPhone} onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none" />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="pt-6 border-t border-slate-50 flex items-center justify-end">
              <button type="submit" className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-10 py-4 rounded-2xl font-black transition-all shadow-xl uppercase tracking-widest text-xs active:scale-95 ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                <span>{saved ? 'Rules Updated' : 'Apply Rules'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
