
import React, { useState } from 'react';
import { AppData, PaymentStatus, UserRole, PaymentMethod } from '../types';
import { CheckCircle2, Clock, Search, Smartphone, Banknote, Tag, Info, Zap, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear, getCurrentMonthIndex } from '../utils/dateUtils';

interface PaymentGridProps {
  data: AppData;
  userRole: UserRole;
  onUpdateStatus: (memberId: string, monthIndex: number, status: PaymentStatus, method?: PaymentMethod, extraAmount?: number) => void;
  onUpdateAuction: (monthIndex: number, amount: number) => void;
}

export const PaymentGrid: React.FC<PaymentGridProps> = ({ data, userRole, onUpdateStatus, onUpdateAuction }) => {
  const realCurrentMonthIdx = getCurrentMonthIndex(data.config.startDate);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(realCurrentMonthIdx);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = userRole === UserRole.ADMIN;
  const currentAuction = data.auctions.find(a => a.monthIndex === selectedMonthIdx);
  
  // LOGIC: If an auction record exists, use its value, otherwise default to 0.
  const auctionAmount = currentAuction ? currentAuction.auctionAmount : 0;

  const filteredMembers = data.members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
  );

  const payoutToWinner = data.config.monthlyPayoutBase - auctionAmount;
  const expectedCollection = data.config.fixedMonthlyCollection * data.members.length;
  const potentialSurplus = expectedCollection - payoutToWinner;

  const handlePrevMonth = () => {
    if (selectedMonthIdx > 0) setSelectedMonthIdx(selectedMonthIdx - 1);
  };

  const handleNextMonth = () => {
    if (selectedMonthIdx < data.config.durationMonths - 1) setSelectedMonthIdx(selectedMonthIdx + 1);
  };

  const isCurrentMonth = selectedMonthIdx === realCurrentMonthIdx;

  return (
    <div className="space-y-6">
      {/* Month Navigation Bar */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <button 
          onClick={handlePrevMonth}
          disabled={selectedMonthIdx === 0}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
              {formatMonthYear(data.config.startDate, selectedMonthIdx)}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            Round {selectedMonthIdx + 1} of {data.config.durationMonths}
            {isCurrentMonth && <span className="ml-2 text-indigo-600 font-black">• Current Month</span>}
          </p>
        </div>

        <button 
          onClick={handleNextMonth}
          disabled={selectedMonthIdx === data.config.durationMonths - 1}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Monthly Auction & Surplus Calculation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 bg-white flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Tag className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Action Amount Entry</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Data for {formatMonthYear(data.config.startDate, selectedMonthIdx)}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Surplus</p>
              <div className="flex items-center justify-end space-x-1">
                 <Zap className="w-4 h-4 text-emerald-500" />
                 <p className="text-xl font-black text-emerald-600">₹{potentialSurplus.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Action Amount for this Round (₹)</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
                <span className="text-slate-400 font-bold mr-2 text-xl">₹</span>
                <input 
                  disabled={!isAdmin}
                  type="number" 
                  placeholder="0"
                  className="bg-transparent font-black text-slate-900 outline-none w-full text-2xl"
                  // Use value directly so 0 is displayed correctly
                  value={auctionAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                    onUpdateAuction(selectedMonthIdx, isNaN(val) ? 0 : val);
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">
                Round Payout: ₹{payoutToWinner.toLocaleString()} (₹{data.config.monthlyPayoutBase.toLocaleString()} - ₹{auctionAmount.toLocaleString()})
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Fixed Installment</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight">₹{data.config.fixedMonthlyCollection.toLocaleString()}</h3>
          <p className="text-[10px] text-white/40 mt-2 font-medium uppercase tracking-widest">Fixed Collection Target</p>
        </div>
      </div>

      {/* Collection Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search member payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium"
          />
        </div>
        <div className="flex items-center space-x-3 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 uppercase tracking-widest italic">
           <Info className="w-4 h-4" />
           <span>Month Target: ₹{expectedCollection.toLocaleString()}</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contribution</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const payment = data.payments.find(p => p.memberId === member.id && p.monthIndex === selectedMonthIdx);
                const isPaid = payment?.status === PaymentStatus.PAID;
                const fixedAmount = data.config.fixedMonthlyCollection;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isPaid ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-black text-slate-700 italic">₹{fixedAmount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase italic">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Received</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase italic">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end space-x-1.5">
                           {!isPaid ? (
                             <>
                               <button 
                                 onClick={() => onUpdateStatus(member.id, selectedMonthIdx, PaymentStatus.PAID, PaymentMethod.GPAY)}
                                 className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all shadow-sm active:scale-90 border border-indigo-100"
                               >
                                 <Smartphone className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => onUpdateStatus(member.id, selectedMonthIdx, PaymentStatus.PAID, PaymentMethod.CASH)}
                                 className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all shadow-sm active:scale-90 border border-emerald-100"
                               >
                                 <Banknote className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <button 
                               onClick={() => onUpdateStatus(member.id, selectedMonthIdx, PaymentStatus.PENDING)}
                               className="px-4 py-1.5 bg-white text-slate-400 text-[10px] font-black rounded-lg hover:text-rose-500 transition-all uppercase tracking-widest border border-slate-100 shadow-sm"
                             >
                               Undo
                             </button>
                           )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="py-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest italic">
             No group members found.
          </div>
        )}
      </div>
    </div>
  );
};
