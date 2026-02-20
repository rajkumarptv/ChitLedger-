import React, { useState } from 'react';
import { AppData, PaymentStatus } from '../types';
import { 
  CheckCircle2,
  CalendarDays,
  Zap,
  BarChart3,
  ShieldCheck,
  Coins,
  X,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Percent,
  Banknote,
  Wallet
} from 'lucide-react';
import { formatMonthYear, getCurrentMonthIndex } from '../utils/dateUtils';

interface MonthlyDetail {
  monthIndex: number;
  monthName: string;
  collected: number;
  payout: number;
  auctionGain: number;    // The discount (Action Amount)
  cashSurplus: number;    // Collected - (Base - Action)
  actionAmount: number;
}

export const Dashboard: React.FC<{ data: AppData }> = ({ data }) => {
  const [showLedger, setShowLedger] = useState(false);
  const currentMonthIdx = getCurrentMonthIndex(data.config.startDate);
  const currentMonthName = formatMonthYear(data.config.startDate, currentMonthIdx);

  // --- Aggregate and Monthly Calculations ---
  const monthlyHistory: MonthlyDetail[] = [];
  let totalGrossCollectedAllTime = 0;
  let totalAuctionGainAllTime = 0;
  let totalPayoutAllTime = 0;

  // Process all rounds up to the current one to calculate cumulative totals
  for (let m = 0; m <= currentMonthIdx; m++) {
    const monthPayments = data.payments.filter(p => p.monthIndex === m && p.status === PaymentStatus.PAID);
    const monthlyCollection = monthPayments.reduce((sum, p) => sum + p.amount + (p.extraAmount || 0), 0);
    
    const auctionInMonth = data.auctions.find(a => a.monthIndex === m);
    const actionAmountInMonth = auctionInMonth ? auctionInMonth.auctionAmount : 0;
    
    // Payout for this specific round: Base Payout - Auction Discount (Action Amount)
    const payout = data.config.monthlyPayoutBase - actionAmountInMonth;
    const auctionGain = actionAmountInMonth; 
    
    // CRITICAL FIX: Only add to running totals if there is actually collection for this month.
    // This prevents rounds with 0 payments from being counted as full 25k payouts.
    if (monthlyCollection > 0) {
      totalGrossCollectedAllTime += monthlyCollection;
      totalAuctionGainAllTime += auctionGain;
      totalPayoutAllTime += payout;
    }

    monthlyHistory.push({
      monthIndex: m,
      monthName: formatMonthYear(data.config.startDate, m),
      collected: monthlyCollection,
      payout: payout,
      auctionGain: auctionGain,
      cashSurplus: monthlyCollection > 0 ? (monthlyCollection - payout) : 0,
      actionAmount: actionAmountInMonth
    });
  }

  // Total Extra Surplus = All Money in - All Money out
  const totalExtraSurplus = totalGrossCollectedAllTime - totalPayoutAllTime;

  // Percentage Gained calculation (Extra Surplus / Gross Collected)
  const percentageGained = totalGrossCollectedAllTime > 0 
    ? Math.round((totalExtraSurplus / totalGrossCollectedAllTime) * 100) 
    : 0;

  // Current Round Specifics (for the Breakdown Panel)
  const currentAuction = data.auctions.find(a => a.monthIndex === currentMonthIdx);
  const currentAction = currentAuction ? currentAuction.auctionAmount : 0;
  const currentPayout = data.config.monthlyPayoutBase - currentAction;
  const currentMonthPayments = data.payments.filter(p => p.monthIndex === currentMonthIdx && p.status === PaymentStatus.PAID);
  const totalCollectedCurrent = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentMonthSurplus = totalCollectedCurrent > 0 ? (totalCollectedCurrent - currentPayout) : 0;

  const unpaidMembers = data.members.filter(member => {
    const payment = data.payments.find(p => p.memberId === member.id && p.monthIndex === currentMonthIdx);
    return !payment || payment.status !== PaymentStatus.PAID;
  });

  const stats = [
    { 
        id: 'totalCollected',
        label: 'TOTAL AMOUNT RECEIVED', 
        value: `₹${totalGrossCollectedAllTime.toLocaleString()}`, 
        icon: Wallet, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        sub: 'Gross Member Payments',
        clickable: true
    },
    { 
        id: 'totalPayout',
        label: 'Total Amount to Chit', 
        value: `₹${totalPayoutAllTime.toLocaleString()}`, 
        icon: Banknote, 
        color: 'text-indigo-600', 
        bg: 'bg-indigo-50',
        sub: 'Total Paid to Winners',
        clickable: true
    },
    { 
        id: 'totalGain',
        label: 'Total Net Gain', 
        value: `₹${totalAuctionGainAllTime.toLocaleString()}`, 
        icon: Coins, 
        color: 'text-emerald-600', 
        bg: 'bg-emerald-50',
        sub: 'Cumulative Savings',
        clickable: true
    },
    { 
        id: 'cashSurplus',
        label: 'Extra Surplus', 
        value: `₹${totalExtraSurplus.toLocaleString()}`, 
        icon: Zap, 
        color: 'text-amber-600', 
        bg: 'bg-amber-50',
        sub: 'Net Cash Margin',
        clickable: true
    },
    { 
        id: 'percentageGained',
        label: 'Percentage Gained', 
        value: `${percentageGained}%`, 
        icon: Percent, 
        color: 'text-slate-600', 
        bg: 'bg-slate-100',
        sub: 'Yield Efficiency',
        clickable: false
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.id} 
            onClick={() => stat.clickable && setShowLedger(true)}
            className={`card p-5 flex flex-col space-y-3 border-none shadow-md transition-all bg-white ${stat.clickable ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 group active:scale-95' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${stat.bg} shadow-inner transition-colors group-hover:bg-opacity-80`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.clickable && <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-600 transition-all" />}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{stat.value}</h3>
              <p className={`text-[9px] font-bold uppercase mt-1 ${stat.clickable ? 'text-indigo-400 group-hover:text-indigo-600' : 'text-slate-300'}`}>
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Ledger Modal */}
      {showLedger && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">Financial Transaction Ledger</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Historical Breakdown: {data.config.name}</p>
              </div>
              <button 
                onClick={() => setShowLedger(false)}
                className="p-2.5 bg-white text-slate-400 hover:text-rose-500 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Month</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Collected</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-indigo-600">Paid to Winner</th>
                    <th className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-right">Action Amt (Gain)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right bg-amber-50/20">Monthly Surplus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {monthlyHistory.map((item) => (
                    <tr key={item.monthIndex} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900 italic">{item.monthName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Round {item.monthIndex + 1}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-slate-700 tracking-tight">₹{item.collected.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-indigo-600 tracking-tight">₹{item.payout.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-emerald-600 tracking-tight">₹{item.auctionGain.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right bg-amber-50/10">
                        <p className={`text-sm font-black tracking-tight ${item.cashSurplus < 0 ? 'text-rose-500' : 'text-amber-600'}`}>
                          ₹{item.cashSurplus.toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-6 bg-slate-900 text-white flex items-center justify-between">
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount to Chit</p>
                    <p className="text-xl font-black text-indigo-400 italic">₹{totalPayoutAllTime.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Extra Surplus</p>
                    <p className={`text-xl font-black italic ${totalExtraSurplus < 0 ? 'text-rose-400' : 'text-amber-400'}`}>₹{totalExtraSurplus.toLocaleString()}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency Index</p>
                  <div className="flex items-center justify-end text-emerald-400">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="text-2xl font-black">{percentageGained}%</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Yield Architecture Panel */}
          <div className="card p-8 bg-gradient-to-br from-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-2xl border-none">
             <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                   <div className="flex items-center space-x-3">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Yield Architecture Breakdown</span>
                   </div>
                   
                   <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
                      <CalendarDays className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Active Cycle</p>
                        <p className="text-xs font-black text-white italic leading-none">{currentMonthIdx + 1}/{data.config.durationMonths} • {currentMonthName}</p>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Gain (Action)</p>
                      <p className="text-3xl font-black text-emerald-400 italic">₹{currentAction.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase italic">Auction Discount</p>
                   </div>
                   
                   <div className="md:border-l border-white/10 md:pl-8 space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Surplus</p>
                      <p className={`text-3xl font-black italic ${currentMonthSurplus < 0 ? 'text-rose-400' : 'text-amber-400'}`}>₹{currentMonthSurplus.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase italic">Collection Margin</p>
                   </div>

                   <div className="md:border-l border-white/10 md:pl-8 space-y-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Amount to Chit (B)</p>
                      <p className="text-3xl font-black text-white italic">₹{currentPayout.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase italic">Base - Discount</p>
                   </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Live session data for Round {currentMonthIdx + 1}</p>
                   <div className="flex space-x-4">
                      <div className="flex items-center text-[10px] text-emerald-500 font-bold uppercase"><TrendingUp className="w-3 h-3 mr-1" /> Dynamic Gain</div>
                      <div className="flex items-center text-[10px] text-indigo-400 font-bold uppercase"><ShieldCheck className="w-3 h-3 mr-1" /> Protected</div>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px]"></div>
          </div>

          {/* Pending Collections Pipeline */}
          <div className="card overflow-hidden border-none shadow-sm bg-white">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase italic text-sm tracking-widest">Collection Pipeline ({currentMonthName})</h3>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase italic">
                  {unpaidMembers.length} Outstanding
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto custom-scrollbar">
              {unpaidMembers.length > 0 ? unpaidMembers.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-sm text-slate-300 border border-slate-100">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">{member.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{member.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{data.config.fixedMonthlyCollection.toLocaleString()}</p>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Pending Payment</p>
                  </div>
                </div>
              )) : (
                <div className="px-6 py-20 text-center text-slate-400">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-black uppercase italic tracking-widest text-slate-900">Round Complete!</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">100% Collection for {currentMonthName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="card p-6 border-none shadow-md bg-white">
            <h3 className="font-black text-slate-900 uppercase italic mb-6 tracking-widest flex items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2" />
              Wealth Performance
            </h3>
            <div className="space-y-5">
               <div className="flex justify-between items-center group">
                 <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Collection</span>
                 <span className="font-black text-slate-900">₹{totalGrossCollectedAllTime.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center group">
                 <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Gain (Action)</span>
                 <span className="font-black text-emerald-600">₹{totalAuctionGainAllTime.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center group">
                 <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Paid to Winners</span>
                 <span className="font-black text-indigo-600">₹{totalPayoutAllTime.toLocaleString()}</span>
               </div>
               <div className="flex justify-between items-center group">
                 <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Extra Surplus</span>
                 <span className={`font-black ${totalExtraSurplus < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                   ₹{totalExtraSurplus.toLocaleString()}
                 </span>
               </div>
               <div className="pt-5 mt-5 border-t border-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Yield Efficiency</span>
                    <span className="text-sm font-black text-indigo-700">{percentageGained}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${percentageGained}%` }}></div>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="card p-6 bg-gradient-to-br from-slate-50 to-white border-2 border-indigo-50 shadow-sm relative overflow-hidden group">
             <div className="relative z-10">
               <div className="flex items-center justify-between mb-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Access</p>
                 <span className="px-2 py-1 bg-white text-[10px] font-black text-indigo-600 rounded border border-indigo-100 shadow-sm">ACTIVE</span>
               </div>
               <div className="space-y-1">
                 <p className="text-xs font-black text-slate-800 uppercase italic leading-tight">Historical Ledger</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">Tracked over {currentMonthIdx + 1} months</p>
               </div>
               <div className="mt-6">
                 <button onClick={() => setShowLedger(true)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95">
                   View Full History
                 </button>
               </div>
             </div>
             <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};