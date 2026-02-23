
import React, { useState } from 'react';
import { AppData, PaymentStatus, PaymentRecord, UserRole, PaymentMethod } from '../types';
import {
  CheckCircle2, Clock, Search, Smartphone, Banknote, Tag, Info, Zap,
  ChevronLeft, ChevronRight, Calendar, X, Upload, Eye,
  CreditCard, Wallet, BadgeCheck, FileImage, Trash2, AlertCircle, ShieldCheck, ArrowRight
} from 'lucide-react';
import { formatMonthYear, getCurrentMonthIndex } from '../utils/dateUtils';

interface PaymentGridProps {
  data: AppData;
  userRole: UserRole;
  onUpdateStatus: (memberId: string, monthIndex: number, status: PaymentStatus, method?: PaymentMethod, extraAmount?: number, customDate?: string, receiptUrl?: string, receiptName?: string, notes?: string, customAmount?: number) => void;
  onSetCustomAmount: (memberId: string, monthIndex: number, customAmount: number) => void;
  onUpdateAuction: (monthIndex: number, amount: number) => void;
}

// Build UPI deep link
const buildUpiLink = (upiId: string, upiName: string, amount: number, note: string, app: 'gpay' | 'phonepe' | 'paytm') => {
  const params = new URLSearchParams({ pa: upiId, pn: upiName, am: amount.toString(), cu: 'INR', tn: note });
  switch (app) {
    case 'gpay':    return `tez://upi/pay?${params.toString()}`;
    case 'phonepe': return `phonepe://pay?${params.toString()}`;
    case 'paytm':   return `paytmmp://pay?${params.toString()}`;
  }
};

const METHOD_OPTIONS = [
  { value: PaymentMethod.GPAY,    label: 'GPay',    icon: <Smartphone className="w-4 h-4" />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: PaymentMethod.PHONEPE, label: 'PhonePe', icon: <Smartphone className="w-4 h-4" />, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: PaymentMethod.PAYTM,   label: 'Paytm',   icon: <Wallet className="w-4 h-4" />,     color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { value: PaymentMethod.CASH,    label: 'Cash',     icon: <Banknote className="w-4 h-4" />,   color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: PaymentMethod.OTHER,   label: 'Other',    icon: <CreditCard className="w-4 h-4" />, color: 'bg-slate-50 border-slate-200 text-slate-700' },
];

export const PaymentGrid: React.FC<PaymentGridProps> = ({ data, userRole, onUpdateStatus, onSetCustomAmount, onUpdateAuction }) => {
  const realCurrentMonthIdx = getCurrentMonthIndex(data.config.startDate);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(realCurrentMonthIdx);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin modal state
  const [adminModal, setAdminModal] = useState<{ memberId: string; memberName: string; monthIndex: number; existing?: PaymentRecord; mode: 'set_amount' | 'confirm_payment' } | null>(null);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payNotes, setPayNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<{ url: string; name: string } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);

  // Member payment screen state — Paytm-style
  const [memberPayScreen, setMemberPayScreen] = useState<{ memberId: string; memberName: string; monthIndex: number; defaultAmount: number } | null>(null);
  const [memberPayAmount, setMemberPayAmount] = useState<number>(0);
  const [memberPayStep, setMemberPayStep] = useState<'enter_amount' | 'choose_method'>('enter_amount');

  // Member "I've Paid" confirm modal
  const [memberClaimModal, setMemberClaimModal] = useState<{ memberId: string; memberName: string; monthIndex: number; amount: number; method: PaymentMethod } | null>(null);
  const [memberReceiptFile, setMemberReceiptFile] = useState<{ url: string; name: string } | null>(null);
  const [memberReceiptLoading, setMemberReceiptLoading] = useState(false);
  const [memberNotes, setMemberNotes] = useState('');

  // Receipt viewer
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  const isAdmin = userRole === UserRole.ADMIN;
  const currentAuction = data.auctions.find(a => a.monthIndex === selectedMonthIdx);
  const auctionAmount = currentAuction ? currentAuction.auctionAmount : 0;
  const filteredMembers = data.members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
  );
  const payoutToWinner = data.config.monthlyPayoutBase - auctionAmount;
  const expectedCollection = data.config.fixedMonthlyCollection * data.members.length;
  const potentialSurplus = expectedCollection - payoutToWinner;
  const hasUpi = !!data.config.upiId;
  const pendingVerifications = data.payments.filter(p => p.status === PaymentStatus.MEMBER_CLAIMED).length;

  // Admin modal
  const openAdminModal = (memberId: string, memberName: string, monthIndex: number, existing?: PaymentRecord, mode: 'set_amount' | 'confirm_payment' = 'confirm_payment') => {
    setAdminModal({ memberId, memberName, monthIndex, existing, mode });
    setPayDate(existing?.paymentDate || new Date().toISOString().split('T')[0]);
    setPayMethod(existing?.method || PaymentMethod.CASH);
    setPayNotes(existing?.notes || '');
    setReceiptFile(existing?.receiptUrl ? { url: existing.receiptUrl, name: existing.receiptName || 'receipt' } : null);
    setPayAmount(existing?.customAmount || data.config.fixedMonthlyCollection);
  };
  const closeAdminModal = () => { setAdminModal(null); setReceiptFile(null); setPayNotes(''); };

  const handleSetAmount = () => {
    if (!adminModal) return;
    onSetCustomAmount(adminModal.memberId, adminModal.monthIndex, payAmount);
    closeAdminModal();
  };

  const handleAdminConfirm = () => {
    if (!adminModal) return;
    const defaultAmount = data.config.fixedMonthlyCollection;
    const finalCustomAmount = payAmount !== defaultAmount ? payAmount : undefined;
    onUpdateStatus(adminModal.memberId, adminModal.monthIndex, PaymentStatus.PAID, payMethod, 0, payDate, receiptFile?.url, receiptFile?.name, payNotes, finalCustomAmount);
    closeAdminModal();
  };

  // Member payment screen
  const openMemberPayScreen = (memberId: string, memberName: string, monthIndex: number, amount: number) => {
    setMemberPayScreen({ memberId, memberName, monthIndex, defaultAmount: amount });
    setMemberPayAmount(amount);
    setMemberPayStep('enter_amount');
  };
  const closeMemberPayScreen = () => { setMemberPayScreen(null); setMemberPayStep('enter_amount'); };

  // Member claim modal (after paying via UPI or cash)
  const openMemberClaimModal = (method: PaymentMethod) => {
    if (!memberPayScreen) return;
    setMemberClaimModal({ memberId: memberPayScreen.memberId, memberName: memberPayScreen.memberName, monthIndex: memberPayScreen.monthIndex, amount: memberPayAmount, method });
    setMemberReceiptFile(null);
    setMemberNotes('');
    closeMemberPayScreen();
  };

  const handleMemberClaim = () => {
    if (!memberClaimModal) return;
    const today = new Date().toISOString().split('T')[0];
    onUpdateStatus(memberClaimModal.memberId, memberClaimModal.monthIndex, PaymentStatus.MEMBER_CLAIMED, memberClaimModal.method, 0, today, memberReceiptFile?.url, memberReceiptFile?.name, memberNotes || 'Payment claimed by member — awaiting admin confirmation', memberClaimModal.amount !== data.config.fixedMonthlyCollection ? memberClaimModal.amount : undefined);
    setMemberClaimModal(null);
    setMemberReceiptFile(null);
    setMemberNotes('');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>, isMember = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; }
    if (isMember) setMemberReceiptLoading(true); else setReceiptLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = { url: ev.target?.result as string, name: file.name };
      if (isMember) { setMemberReceiptFile(result); setMemberReceiptLoading(false); }
      else { setReceiptFile(result); setReceiptLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">

      {/* Admin pending verifications alert */}
      {isAdmin && pendingVerifications > 0 && (
        <div className="flex items-center justify-between px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-black text-amber-900">{pendingVerifications} Payment{pendingVerifications > 1 ? 's' : ''} Awaiting Confirmation</p>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Members claimed payment — verify below</p>
            </div>
          </div>
          <span className="w-7 h-7 flex items-center justify-center bg-amber-500 text-white text-xs font-black rounded-full">{pendingVerifications}</span>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => selectedMonthIdx > 0 && setSelectedMonthIdx(selectedMonthIdx - 1)} disabled={selectedMonthIdx === 0}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{formatMonthYear(data.config.startDate, selectedMonthIdx)}</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            Round {selectedMonthIdx + 1} of {data.config.durationMonths}
            {selectedMonthIdx === realCurrentMonthIdx && <span className="ml-2 text-indigo-600">• Current Month</span>}
          </p>
        </div>
        <button onClick={() => selectedMonthIdx < data.config.durationMonths - 1 && setSelectedMonthIdx(selectedMonthIdx + 1)} disabled={selectedMonthIdx === data.config.durationMonths - 1}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Auction Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 bg-white flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl"><Tag className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Auction Amount Entry</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{formatMonthYear(data.config.startDate, selectedMonthIdx)}</h3>
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
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Auction Amount (₹)</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
              <span className="text-slate-400 font-bold mr-2 text-xl">₹</span>
              <input disabled={!isAdmin} type="number" placeholder="0" className="bg-transparent font-black text-slate-900 outline-none w-full text-2xl"
                value={auctionAmount}
                onChange={(e) => { const val = e.target.value === '' ? 0 : parseInt(e.target.value); onUpdateAuction(selectedMonthIdx, isNaN(val) ? 0 : val); }} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">Payout: ₹{payoutToWinner.toLocaleString()} (₹{data.config.monthlyPayoutBase.toLocaleString()} - ₹{auctionAmount.toLocaleString()})</p>
          </div>
        </div>
        <div className="card p-6 flex flex-col justify-center bg-indigo-600 text-white border-none shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg"><Banknote className="w-5 h-5 text-white" /></div>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Fixed Installment</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight">₹{data.config.fixedMonthlyCollection.toLocaleString()}</h3>
          <p className="text-[10px] text-white/40 mt-2 font-medium uppercase tracking-widest">Fixed Collection Target</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search member..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
        </div>
        <div className="flex items-center space-x-3 text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 uppercase tracking-widest italic">
          <Info className="w-4 h-4" /><span>Month Target: ₹{expectedCollection.toLocaleString()}</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const payment = data.payments.find(p => p.memberId === member.id && p.monthIndex === selectedMonthIdx);
                const isPaid = payment?.status === PaymentStatus.PAID;
                const isClaimed = payment?.status === PaymentStatus.MEMBER_CLAIMED;
                const dueAmount = payment?.customAmount || data.config.fixedMonthlyCollection;

                return (
                  <tr key={member.id} className={`hover:bg-slate-50/50 transition-colors ${isClaimed ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                          ${isPaid ? 'bg-emerald-100 text-emerald-700' : isClaimed ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-black text-slate-700 italic">₹{dueAmount.toLocaleString()}</p>
                        {payment?.customAmount && payment.customAmount !== data.config.fixedMonthlyCollection && (
                          <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest">Custom ↑</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isPaid ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-100 uppercase italic">
                          <CheckCircle2 className="w-3.5 h-3.5" /><span>Received</span>
                        </span>
                      ) : isClaimed ? (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase italic">
                          <AlertCircle className="w-3.5 h-3.5" /><span>Verify</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase italic">
                          <Clock className="w-3.5 h-3.5" /><span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(isPaid || isClaimed) && payment ? (
                        <div className="space-y-0.5">
                          {payment.paymentDate && <p className="text-[10px] text-slate-500 font-bold">📅 {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>}
                          {payment.method && <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">💳 {payment.method}</p>}
                          {payment.receiptUrl && (
                            <button onClick={() => setViewReceiptUrl(payment.receiptUrl!)} className="flex items-center space-x-1 text-[10px] text-emerald-600 font-black uppercase hover:underline">
                              <FileImage className="w-3 h-3" /><span>View Receipt</span>
                            </button>
                          )}
                          {isClaimed && <p className="text-[9px] text-amber-600 font-black uppercase">⏳ Awaiting admin confirm</p>}
                        </div>
                      ) : <span className="text-[10px] text-slate-300 font-bold">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {isClaimed ? (
                            <>
                              <button onClick={() => openAdminModal(member.id, member.name, selectedMonthIdx, payment, 'confirm_payment')}
                                className="flex items-center space-x-1 px-3 py-2 bg-amber-500 text-white text-[10px] font-black rounded-xl hover:bg-amber-600 transition-all active:scale-95 uppercase">
                                <ShieldCheck className="w-3.5 h-3.5" /><span>Confirm</span>
                              </button>
                              <button onClick={() => onUpdateStatus(member.id, selectedMonthIdx, PaymentStatus.PENDING)}
                                className="px-3 py-2 bg-rose-50 text-rose-500 text-[10px] font-black rounded-xl hover:bg-rose-100 transition-all uppercase border border-rose-100">
                                Reject
                              </button>
                            </>
                          ) : !isPaid ? (
                            <div className="flex flex-col items-end space-y-1">
                              <button onClick={() => openAdminModal(member.id, member.name, selectedMonthIdx, payment, 'confirm_payment')}
                                className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95 uppercase">
                                <BadgeCheck className="w-3.5 h-3.5" /><span>Collect</span>
                              </button>
                              <button onClick={() => openAdminModal(member.id, member.name, selectedMonthIdx, payment, 'set_amount')}
                                className="text-[9px] text-indigo-400 font-black hover:text-indigo-600 underline uppercase">Set Amount</button>
                            </div>
                          ) : (
                            <div className="flex space-x-1.5">
                              <button onClick={() => openAdminModal(member.id, member.name, selectedMonthIdx, payment, 'confirm_payment')}
                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => onUpdateStatus(member.id, selectedMonthIdx, PaymentStatus.PENDING)}
                                className="px-3 py-1.5 bg-white text-slate-400 text-[10px] font-black rounded-lg hover:text-rose-500 transition-all uppercase border border-slate-100">Undo</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── MEMBER ACTION ── */
                        <div className="flex items-center justify-end">
                          {isPaid ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                              <CheckCircle2 className="w-3.5 h-3.5" /><span>Paid ✓</span>
                            </span>
                          ) : isClaimed ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-amber-600 font-black uppercase tracking-widest">
                              <Clock className="w-3.5 h-3.5" /><span>Pending Confirm</span>
                            </span>
                          ) : (
                            <button onClick={() => openMemberPayScreen(member.id, member.name, selectedMonthIdx, dueAmount)}
                              className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-black rounded-xl hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest shadow-md">
                              <span>Pay Now</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="py-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest italic">No members found.</div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          MEMBER PAYMENT SCREEN — Paytm style full screen
          ═══════════════════════════════════════════════ */}
      {memberPayScreen && (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col animate-in slide-in-from-bottom duration-300">

          {/* Header */}
          <div className="bg-white px-5 py-4 flex items-center space-x-4 border-b border-slate-100 shadow-sm">
            <button onClick={closeMemberPayScreen} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h2 className="text-base font-black text-slate-900">Pay Chit Installment</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}</p>
            </div>
          </div>

          {memberPayStep === 'enter_amount' ? (
            /* ── STEP 1: Name + Amount entry ── */
            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">

              {/* Member info card */}
              <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  {memberPayScreen.memberName.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-base">{memberPayScreen.memberName}</p>
                  <p className="text-[11px] text-slate-500 font-bold">{data.config.name} — {formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}</p>
                </div>
              </div>

              {/* Payee info */}
              {data.config.upiId && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Paying To</p>
                  <p className="font-black text-slate-900">{data.config.upiName || data.config.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{data.config.upiId}</p>
                </div>
              )}

              {/* Amount selection */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
                <p className="font-black text-slate-800 text-sm">Select amount to pay</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Due: {formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}</p>

                {/* Total Due option */}
                <button onClick={() => setMemberPayAmount(memberPayScreen.defaultAmount)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${memberPayAmount === memberPayScreen.defaultAmount ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${memberPayAmount === memberPayScreen.defaultAmount ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                      {memberPayAmount === memberPayScreen.defaultAmount && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="font-black text-slate-800">Total Due</span>
                  </div>
                  <span className="font-black text-slate-900 text-lg">₹{memberPayScreen.defaultAmount.toLocaleString()}</span>
                </button>

                {/* Custom amount option */}
                <div className={`w-full p-4 rounded-xl border-2 transition-all ${memberPayAmount !== memberPayScreen.defaultAmount ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <button onClick={() => setMemberPayAmount(0)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${memberPayAmount !== memberPayScreen.defaultAmount ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                      {memberPayAmount !== memberPayScreen.defaultAmount && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>
                    <span className="font-black text-slate-800">Customise Amount</span>
                  </div>
                  <div className="flex items-center bg-white border-2 border-slate-200 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-all">
                    <span className="text-slate-400 font-bold mr-2 text-xl">₹</span>
                    <input type="number"
                      placeholder={memberPayScreen.defaultAmount.toString()}
                      value={memberPayAmount !== memberPayScreen.defaultAmount ? memberPayAmount : ''}
                      onChange={(e) => setMemberPayAmount(parseInt(e.target.value) || 0)}
                      onClick={() => setMemberPayAmount(0)}
                      className="bg-transparent font-black text-slate-900 outline-none w-full text-xl placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── STEP 2: Choose payment method ── */
            <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Amount to Pay</p>
                  <p className="text-2xl font-black text-slate-900">₹{memberPayAmount.toLocaleString()}</p>
                </div>
                <button onClick={() => setMemberPayStep('enter_amount')} className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:underline">Change</button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                <p className="font-black text-slate-800 text-sm">Pay using</p>

                {hasUpi && (
                  <>
                    {/* GPay */}
                    <a href={buildUpiLink(data.config.upiId!, data.config.upiName || data.config.name, memberPayAmount, `Chit ${formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}`, 'gpay')}
                      onClick={() => setTimeout(() => openMemberClaimModal(PaymentMethod.GPAY), 1500)}
                      className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-all active:scale-95 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm">Google Pay</p>
                          <p className="text-[10px] text-slate-400 font-medium">Pay via GPay UPI</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </a>

                    {/* PhonePe */}
                    <a href={buildUpiLink(data.config.upiId!, data.config.upiName || data.config.name, memberPayAmount, `Chit ${formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}`, 'phonepe')}
                      onClick={() => setTimeout(() => openMemberClaimModal(PaymentMethod.PHONEPE), 1500)}
                      className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-purple-50 rounded-xl border border-slate-100 hover:border-purple-200 transition-all active:scale-95 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm">PhonePe</p>
                          <p className="text-[10px] text-slate-400 font-medium">Pay via PhonePe UPI</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                    </a>

                    {/* Paytm */}
                    <a href={buildUpiLink(data.config.upiId!, data.config.upiName || data.config.name, memberPayAmount, `Chit ${formatMonthYear(data.config.startDate, memberPayScreen.monthIndex)}`, 'paytm')}
                      onClick={() => setTimeout(() => openMemberClaimModal(PaymentMethod.PAYTM), 1500)}
                      className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-sky-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-all active:scale-95 group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-sky-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-black text-slate-900 text-sm">Paytm</p>
                          <p className="text-[10px] text-slate-400 font-medium">Pay via Paytm UPI</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </a>
                  </>
                )}

                {/* Cash */}
                <button onClick={() => openMemberClaimModal(PaymentMethod.CASH)}
                  className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-all active:scale-95 group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-sm">Cash</p>
                      <p className="text-[10px] text-slate-400 font-medium">Paid in person</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="bg-white border-t border-slate-100 p-4 pb-24 shadow-lg">
            {memberPayStep === 'enter_amount' ? (
              <button
                onClick={() => memberPayAmount > 0 && setMemberPayStep('choose_method')}
                disabled={memberPayAmount <= 0}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                <span>Proceed to Pay ₹{memberPayAmount > 0 ? memberPayAmount.toLocaleString() : '—'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select a payment method above</p>
            )}
          </div>
        </div>
      )}

      {/* ── Member "I've Paid" confirm modal ── */}
      {memberClaimModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Confirm Payment</p>
                <h2 className="text-white text-xl font-black">{memberClaimModal.memberName}</h2>
                <p className="text-emerald-200 text-xs mt-0.5">₹{memberClaimModal.amount.toLocaleString()} via {memberClaimModal.method}</p>
              </div>
              <button onClick={() => setMemberClaimModal(null)} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 font-bold">
                ℹ️ Upload your payment screenshot — this helps the admin verify faster!
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🧾 Payment Screenshot</label>
                {memberReceiptFile ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200">
                    <img src={memberReceiptFile.url} alt="receipt" className="w-full max-h-40 object-cover cursor-pointer" onClick={() => setViewReceiptUrl(memberReceiptFile.url)} />
                    <button onClick={() => setMemberReceiptFile(null)} className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all bg-slate-50">
                    {memberReceiptLoading ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> : <><Upload className="w-5 h-5 text-slate-400 mb-1" /><span className="text-[10px] font-black text-slate-400 uppercase">Upload Screenshot</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptUpload(e, true)} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📝 Note to Admin</label>
                <input type="text" placeholder="e.g. Txn ID: 123456..." value={memberNotes} onChange={(e) => setMemberNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300" />
              </div>
              <button onClick={handleMemberClaim}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm uppercase tracking-widest shadow-xl">
                <CheckCircle2 className="w-5 h-5" /><span>Submit — Payment Done ✓</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN Collect Modal ── */}
      {adminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-5 flex items-center justify-between ${adminModal.existing?.status === PaymentStatus.MEMBER_CLAIMED ? 'bg-amber-500' : adminModal.mode === 'set_amount' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                  {adminModal.existing?.status === PaymentStatus.MEMBER_CLAIMED ? 'Confirming Member Claim' : adminModal.mode === 'set_amount' ? 'Set Custom Amount' : 'Collecting Payment'}
                </p>
                <h2 className="text-white text-xl font-black">{adminModal.memberName}</h2>
                <p className="text-white/70 text-xs mt-0.5">{formatMonthYear(data.config.startDate, adminModal.monthIndex)} · ₹{payAmount.toLocaleString()}</p>
              </div>
              <button onClick={closeAdminModal} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {adminModal.existing?.receiptUrl && adminModal.existing.status === PaymentStatus.MEMBER_CLAIMED && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">📎 Receipt from Member</p>
                  <img src={adminModal.existing.receiptUrl} alt="receipt" className="w-full max-h-32 object-contain rounded-lg cursor-pointer" onClick={() => setViewReceiptUrl(adminModal.existing!.receiptUrl!)} />
                  {adminModal.existing.notes && <p className="text-[10px] text-amber-600 mt-2 font-medium">{adminModal.existing.notes}</p>}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💰 Amount</label>
                <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-all">
                  <span className="text-slate-400 font-bold mr-2 text-lg">₹</span>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                    className="bg-transparent font-black text-slate-900 outline-none w-full text-xl" />
                </div>
                {payAmount !== data.config.fixedMonthlyCollection && (
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[9px] text-amber-600 font-black uppercase">⚠ Custom (default: ₹{data.config.fixedMonthlyCollection.toLocaleString()})</p>
                    <button onClick={() => setPayAmount(data.config.fixedMonthlyCollection)} className="text-[9px] text-indigo-500 font-black hover:underline">Reset</button>
                  </div>
                )}
              </div>
              {adminModal.mode === 'confirm_payment' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📅 Payment Date</label>
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-900 focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💳 Payment Method</label>
                    <div className="grid grid-cols-5 gap-2">
                      {METHOD_OPTIONS.map((m) => (
                        <button key={m.value} onClick={() => setPayMethod(m.value)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all text-[9px] font-black uppercase gap-1
                            ${payMethod === m.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 scale-105' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-200'}`}>
                          {m.icon}{m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🧾 Receipt</label>
                    {receiptFile ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200">
                        <img src={receiptFile.url} alt="receipt" className="w-full max-h-32 object-cover cursor-pointer" onClick={() => setViewReceiptUrl(receiptFile.url)} />
                        <button onClick={() => setReceiptFile(null)} className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 bg-slate-50">
                        {receiptLoading ? <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> : <><Upload className="w-5 h-5 text-slate-400 mb-1" /><span className="text-[10px] font-black text-slate-400 uppercase">Upload Receipt</span></>}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptUpload(e, false)} />
                      </label>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📝 Notes</label>
                    <input type="text" placeholder="Optional..." value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500 placeholder:text-slate-300" />
                  </div>
                </>
              )}
              {adminModal.mode === 'set_amount' ? (
                <div className="space-y-3">
                  <button onClick={handleSetAmount}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm uppercase">
                    <BadgeCheck className="w-5 h-5" /><span>Save Amount for Member</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Member will see ₹{payAmount.toLocaleString()} in their Pay Now screen</p>
                </div>
              ) : (
                <button onClick={handleAdminConfirm}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm uppercase">
                  <CheckCircle2 className="w-5 h-5" /><span>Confirm Payment Received</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Viewer */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewReceiptUrl(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewReceiptUrl(null)} className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-xl text-slate-700 hover:text-rose-500">
              <X className="w-5 h-5" />
            </button>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-4 py-3 flex items-center space-x-2">
                <FileImage className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt</span>
              </div>
              <img src={viewReceiptUrl} alt="Receipt" className="w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
