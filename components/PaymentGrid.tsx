
import React, { useState } from 'react';
import { AppData, PaymentStatus, PaymentRecord, UserRole, PaymentMethod } from '../types';
import { 
  CheckCircle2, Clock, Search, Smartphone, Banknote, Tag, Info, Zap, 
  ChevronLeft, ChevronRight, Calendar, X, Upload, ImageIcon, Eye,
  CreditCard, Wallet, BadgeCheck, FileImage, Trash2
} from 'lucide-react';
import { formatMonthYear, getCurrentMonthIndex } from '../utils/dateUtils';

interface PaymentGridProps {
  data: AppData;
  userRole: UserRole;
  onUpdateStatus: (memberId: string, monthIndex: number, status: PaymentStatus, method?: PaymentMethod, extraAmount?: number, customDate?: string, receiptUrl?: string, receiptName?: string, notes?: string) => void;
  onUpdateAuction: (monthIndex: number, amount: number) => void;
}

interface PaymentModalState {
  memberId: string;
  memberName: string;
  monthIndex: number;
  existingPayment?: PaymentRecord;
}

const METHOD_OPTIONS = [
  { value: PaymentMethod.GPAY,    label: 'GPay',     icon: <Smartphone className="w-4 h-4" />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: PaymentMethod.PHONEPE, label: 'PhonePe',  icon: <Smartphone className="w-4 h-4" />, color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: PaymentMethod.PAYTM,   label: 'Paytm',    icon: <Wallet className="w-4 h-4" />,     color: 'bg-sky-50 border-sky-200 text-sky-700' },
  { value: PaymentMethod.CASH,    label: 'Cash',     icon: <Banknote className="w-4 h-4" />,   color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: PaymentMethod.OTHER,   label: 'Other',    icon: <CreditCard className="w-4 h-4" />, color: 'bg-slate-50 border-slate-200 text-slate-700' },
];

export const PaymentGrid: React.FC<PaymentGridProps> = ({ data, userRole, onUpdateStatus, onUpdateAuction }) => {
  const realCurrentMonthIdx = getCurrentMonthIndex(data.config.startDate);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(realCurrentMonthIdx);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<PaymentModalState | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Modal form state
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payNotes, setPayNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<{ url: string; name: string } | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const isAdmin = userRole === UserRole.ADMIN;
  const currentAuction = data.auctions.find(a => a.monthIndex === selectedMonthIdx);
  const auctionAmount = currentAuction ? currentAuction.auctionAmount : 0;
  const filteredMembers = data.members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
  );
  const payoutToWinner = data.config.monthlyPayoutBase - auctionAmount;
  const expectedCollection = data.config.fixedMonthlyCollection * data.members.length;
  const potentialSurplus = expectedCollection - payoutToWinner;

  const openPayModal = (memberId: string, memberName: string, monthIndex: number, existing?: PaymentRecord) => {
    setModal({ memberId, memberName, monthIndex, existingPayment: existing });
    const today = new Date().toISOString().split('T')[0];
    setPayDate(existing?.paymentDate || today);
    setPayMethod(existing?.method || PaymentMethod.CASH);
    setPayNotes(existing?.notes || '');
    setReceiptFile(existing?.receiptUrl ? { url: existing.receiptUrl, name: existing.receiptName || 'receipt' } : null);
  };

  const closeModal = () => {
    setModal(null);
    setReceiptFile(null);
    setPayNotes('');
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Please upload an image under 2MB.');
      return;
    }
    setReceiptLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceiptFile({ url: ev.target?.result as string, name: file.name });
      setReceiptLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = () => {
    if (!modal) return;
    onUpdateStatus(
      modal.memberId,
      modal.monthIndex,
      PaymentStatus.PAID,
      payMethod,
      0,
      payDate,
      receiptFile?.url,
      receiptFile?.name,
      payNotes
    );
    closeModal();
  };

  const handleUndo = (memberId: string, monthIndex: number) => {
    onUpdateStatus(memberId, monthIndex, PaymentStatus.PENDING);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => selectedMonthIdx > 0 && setSelectedMonthIdx(selectedMonthIdx - 1)}
          disabled={selectedMonthIdx === 0}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600">
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
            {selectedMonthIdx === realCurrentMonthIdx && <span className="ml-2 text-indigo-600 font-black">• Current Month</span>}
          </p>
        </div>
        <button onClick={() => selectedMonthIdx < data.config.durationMonths - 1 && setSelectedMonthIdx(selectedMonthIdx + 1)}
          disabled={selectedMonthIdx === data.config.durationMonths - 1}
          className="p-2 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Auction & Surplus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 bg-white flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 rounded-xl"><Tag className="w-6 h-6 text-indigo-600" /></div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Auction Amount Entry</p>
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
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Set Auction Amount for this Round (₹)</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-4">
              <span className="text-slate-400 font-bold mr-2 text-xl">₹</span>
              <input disabled={!isAdmin} type="number" placeholder="0"
                className="bg-transparent font-black text-slate-900 outline-none w-full text-2xl"
                value={auctionAmount}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  onUpdateAuction(selectedMonthIdx, isNaN(val) ? 0 : val);
                }} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic">
              Round Payout: ₹{payoutToWinner.toLocaleString()} (₹{data.config.monthlyPayoutBase.toLocaleString()} - ₹{auctionAmount.toLocaleString()})
            </p>
          </div>
        </div>
        <div className="card p-6 flex flex-col justify-center bg-indigo-600 text-white border-none shadow-lg shadow-indigo-100">
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
          <input type="text" placeholder="Search member payments..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium" />
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
                const fixedAmount = data.config.fixedMonthlyCollection;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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
                          <CheckCircle2 className="w-3.5 h-3.5" /><span>Received</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase italic">
                          <Clock className="w-3.5 h-3.5" /><span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isPaid && payment ? (
                        <div className="space-y-0.5">
                          {payment.paymentDate && (
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              📅 {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                          {payment.method && (
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">
                              💳 {payment.method}
                            </p>
                          )}
                          {payment.receiptUrl && (
                            <button onClick={() => setViewReceiptUrl(payment.receiptUrl!)}
                              className="flex items-center space-x-1 text-[10px] text-emerald-600 font-black uppercase tracking-widest hover:underline">
                              <FileImage className="w-3 h-3" /><span>View Receipt</span>
                            </button>
                          )}
                          {payment.notes && (
                            <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[150px]" title={payment.notes}>
                              📝 {payment.notes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isPaid ? (
                            <button
                              onClick={() => openPayModal(member.id, member.name, selectedMonthIdx)}
                              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 transition-all shadow-sm active:scale-95 uppercase tracking-widest">
                              <BadgeCheck className="w-3.5 h-3.5" /><span>Collect</span>
                            </button>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => openPayModal(member.id, member.name, selectedMonthIdx, payment)}
                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                title="Edit payment">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUndo(member.id, selectedMonthIdx)}
                                className="px-3 py-1.5 bg-white text-slate-400 text-[10px] font-black rounded-lg hover:text-rose-500 transition-all uppercase tracking-widest border border-slate-100 shadow-sm">
                                Undo
                              </button>
                            </div>
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

      {/* ── Payment Collection Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Collecting Payment</p>
                <h2 className="text-white text-xl font-black tracking-tight">{modal.memberName}</h2>
                <p className="text-indigo-300 text-xs font-bold mt-0.5">{formatMonthYear(data.config.startDate, modal.monthIndex)} · ₹{data.config.fixedMonthlyCollection.toLocaleString()}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment Date */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  📅 Payment Date
                </label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  💳 Payment Method
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {METHOD_OPTIONS.map((m) => (
                    <button key={m.value} onClick={() => setPayMethod(m.value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all text-[9px] font-black uppercase tracking-widest gap-1
                        ${payMethod === m.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-105' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-200'}`}>
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  🧾 Receipt / Screenshot (optional)
                </label>
                {receiptFile ? (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-200 bg-emerald-50">
                    <img src={receiptFile.url} alt="receipt"
                      className="w-full max-h-40 object-cover cursor-pointer"
                      onClick={() => setViewReceiptUrl(receiptFile.url)} />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button onClick={() => setViewReceiptUrl(receiptFile.url)}
                        className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-indigo-600 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setReceiptFile(null)}
                        className="p-1.5 bg-white rounded-lg shadow text-slate-600 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-3 py-2 bg-emerald-100">
                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest truncate">{receiptFile.name}</p>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-all bg-slate-50">
                    {receiptLoading ? (
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Receipt / Screenshot</span>
                        <span className="text-[9px] text-slate-300 mt-0.5">JPG, PNG, max 2MB</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  📝 Notes (optional)
                </label>
                <input type="text" placeholder="e.g. Partial payment, Advance, etc."
                  value={payNotes} onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm placeholder:text-slate-300" />
              </div>

              {/* Confirm Button */}
              <button onClick={handleConfirmPayment}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center space-x-2 text-sm uppercase tracking-widest">
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Payment Received</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Viewer Modal ── */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewReceiptUrl(null)}>
          <div className="relative max-w-lg w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewReceiptUrl(null)}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-xl text-slate-700 hover:text-rose-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900 px-4 py-3 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt / Screenshot</span>
              </div>
              <img src={viewReceiptUrl} alt="Receipt" className="w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
