
export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE',
  MEMBER_CLAIMED = 'MEMBER_CLAIMED'  // Member says they paid, waiting admin confirmation
}

export enum PaymentMethod {
  GPAY = 'GPay',
  PHONEPE = 'PhonePe',
  PAYTM = 'Paytm',
  CASH = 'CASH',
  OTHER = 'Other'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole;
  phoneNumber: string;
  userName?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  joinDate: string;
  isSideFundMember: boolean;
}

export interface MonthlyAuction {
  monthIndex: number;
  auctionAmount: number;
}

export interface ChitConfig {
  id: string;
  name: string;
  totalChitValue: number;
  fixedMonthlyCollection: number;
  monthlyPayoutBase: number;
  durationMonths: number;
  startDate: string;
  adminPhone: string;
  upiId?: string;        // e.g. 9876543210@paytm or name@upi
  upiName?: string;      // Display name shown on UPI payment screen
}

export interface PaymentRecord {
  memberId: string;
  monthIndex: number;
  amount: number;           // Default fixed amount
  customAmount?: number;    // Admin override — specific amount for this member/month
  extraAmount?: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paymentDate?: string;
  receiptUrl?: string;
  receiptName?: string;
  notes?: string;
}

export interface AppData {
  config: ChitConfig;
  members: Member[];
  payments: PaymentRecord[];
  auctions: MonthlyAuction[];
}
