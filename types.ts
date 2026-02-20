
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
  auctionAmount: number; // The "Action Amount" or discount taken
}

export interface ChitConfig {
  id: string;
  name: string;
  totalChitValue: number;      // e.g. 5,00,000
  fixedMonthlyCollection: number; // e.g. 2,000 (collected from each member)
  monthlyPayoutBase: number;    // e.g. 25,000 (the base for payout before action discount)
  durationMonths: number;
  startDate: string;
  adminPhone: string;
}

export interface PaymentRecord {
  memberId: string;
  monthIndex: number;
  amount: number;      // Strictly fixed (e.g. 2,000)
  extraAmount?: number; // Miscellaneous fees/fines (optional)
  status: PaymentStatus;
  method?: PaymentMethod;
  paymentDate?: string;
}

export interface AppData {
  config: ChitConfig;
  members: Member[];
  payments: PaymentRecord[];
  auctions: MonthlyAuction[];
}
