
export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
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
}

export interface PaymentRecord {
  memberId: string;
  monthIndex: number;
  amount: number;
  extraAmount?: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  paymentDate?: string;
  receiptUrl?: string;      // base64 image or URL of uploaded receipt
  receiptName?: string;     // original filename
  notes?: string;           // optional admin notes
}

export interface AppData {
  config: ChitConfig;
  members: Member[];
  payments: PaymentRecord[];
  auctions: MonthlyAuction[];
}
