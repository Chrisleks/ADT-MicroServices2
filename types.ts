
// --- Chat / Socratic Tutor Types ---
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  isThinking?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export type SendMessageFunction = (text: string, image?: string) => Promise<void>;

// --- Microcredit App Types ---

export enum UserRole {
  MASTER_ADMIN = 'Master Admin',
  BDM = 'Business Dev Manager',
  HOB = 'Head of Business',
  SFO = 'Senior Finance Officer',
  ACCOUNTANT = 'Accountant',
  AUDITOR = 'Internal Auditor',
  ENCODER = 'Data Encoder',
  FIELD_OFFICER = 'Field Officer'
}

export enum LoanStatus {
  CURRENT = 'Current',
  WATCH = 'Watch',
  SUBSTANDARD = 'Substandard',
  DOUBTFUL = 'Doubtful',
  LOSS = 'Loss'
}

export enum LoanType {
  BUSINESS = 'Business Loan (20%)',
  AGRIC = 'Agric Loan (20%)'
}

export enum ApprovalStatus {
  PENDING_BDM = 'Pending BDM',
  PENDING_SFO = 'Pending SFO',
  PENDING_HOB = 'Pending HOB',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum CreditOfficer {
  CD = 'CD',
  CL = 'CL',
  GPK = 'GPK'
}

export type TransactionCategory = 
  | 'Loan Instalment' 
  | 'Savings' 
  | 'Adashe' 
  | 'Risk Premium' 
  | 'Admission Fee' 
  | 'Membership fee' 
  | 'Form/card' 
  | 'Withdrawal from bank' 
  | 'Bank Deposit' 
  | 'Adjustment/Refund' 
  | 'Risk premium claim' 
  | 'Salary & benefit' 
  | 'Field Transport' 
  | 'Funds transfer' 
  | 'Other Fees';

export interface Payment {
  id: string;
  date: string;
  category: TransactionCategory | string;
  direction: 'In' | 'Out';
  amount: number;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  officer: string;
  type: 'Field Visit' | 'Phone Call' | 'Office Meeting' | 'Arrears Follow-up' | 'Note';
  notes: string;
  flagged?: boolean;
}

export interface TransactionRequest {
  id: string;
  loanId: string;
  borrowerName: string;
  amount: number;
  category: string;
  status: ApprovalStatus;
  loanGroup?: string;
}

export interface Loan {
  id: string;
  dateOfRegistration: string;
  borrowerName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  groupName: string;
  creditOfficer: string;
  loanType: LoanType | string;
  loanDisbursementAmount: number;
  loanDisbursementDate: string;
  disbursementStatus: ApprovalStatus;
  principal: number;
  interestRate: number;
  dueDate: string;
  dpd: number;
  savingsBalance: number;
  adasheBalance: number;
  payments: Payment[];
  pendingRequests: TransactionRequest[];
  activityLog: ActivityLog[];
  status: LoanStatus;
  loanCycle: number;
  nextOfKinName: string;
  nextOfKinPhone: string;
  guarantorName: string;
  guarantorPhone: string;
  guarantorAddress: string;
  passportPhoto: string;
  loanFormPhoto: string;
  weeks: Record<number | string, { savings: number; adashe: number; loan: number }>;
  savingsAdjustment: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  read: boolean;
  link?: string;
  timestamp: string;
}

export interface GroupSummary {
  groupName: string;
  memberCount: number;
  totalLoanBalance: number;
  totalSavingsBalance: number;
  totalAdasheBalance: number;
}

export interface OfflineTransaction {
  loanId: string;
  category: TransactionCategory;
  direction: 'In' | 'Out';
  amount: number;
  notes: string;
  timestamp: string;
}

export interface SystemUser {
  username: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  email?: string;
}

export interface ResetRequest {
  id: string;
  timestamp: string;
  username: string;
  phone: string;
  newPassword?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: UserRole;
  content: string;
  timestamp: string;
  channel: string;
}
