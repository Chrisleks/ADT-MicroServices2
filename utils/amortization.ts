
import { Loan, LoanType, LoanStatus } from '../types';

export interface ScheduleItem {
  period: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Pending';
  loanId?: string;
  borrowerName?: string;
  group?: string;
}

export const getStatusFromDPD = (dpd: number): LoanStatus => {
  if (dpd <= 0) return LoanStatus.CURRENT; // 0
  if (dpd <= 30) return LoanStatus.WATCH; // 1-30
  if (dpd <= 60) return LoanStatus.SUBSTANDARD; // 31-60
  if (dpd <= 90) return LoanStatus.DOUBTFUL; // 61-90
  return LoanStatus.LOSS; // 91+
};

export const generateAmortizationSchedule = (loan: Loan): ScheduleItem[] => {
  if (!loan.loanDisbursementDate) return [];
  
  const startDate = new Date(loan.loanDisbursementDate);
  if (isNaN(startDate.getTime())) return [];

  const schedule: ScheduleItem[] = [];
  
  // Calculate Total Repaid So Far
  const totalPaid = loan.payments
    .filter(p => p.category === 'Loan Instalment' && p.direction === 'In')
    .reduce((s, p) => s + p.amount, 0);
    
  let remainingToPay = totalPaid;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only

  // Helper to determine status for a specific installment
  const getStatus = (due: Date, amount: number): ScheduleItem['status'] => {
    const dueTime = new Date(due);
    dueTime.setHours(0, 0, 0, 0);

    // 1. Fully Paid
    if (remainingToPay >= amount - 1) { // -1 for floating point tolerance
        remainingToPay -= amount;
        return 'Paid';
    } 
    // 2. Partially Paid
    else if (remainingToPay > 0) {
        remainingToPay = 0; // Exhausted
        return 'Partial';
    } 
    // 3. Not Paid yet
    else {
        // If due date is strictly in the past, it's Overdue
        if (today > dueTime) return 'Overdue';
        return 'Pending';
    }
  };

  if (loan.loanType === LoanType.BUSINESS) {
      // 16 Weeks Standard
      const weeklyPayment = loan.principal / 16;
      for (let i = 1; i <= 16; i++) {
          const dueDate = new Date(startDate);
          dueDate.setDate(startDate.getDate() + (i * 7));
          
          const status = getStatus(dueDate, weeklyPayment);

          schedule.push({
              period: `Week ${i}`,
              dueDate: dueDate.toISOString().split('T')[0],
              amount: weeklyPayment,
              status: status,
              loanId: loan.id,
              borrowerName: loan.borrowerName,
              group: loan.groupName
          });
      }
  } else {
      // Agric: 7 Months Total (4 Grace + 3 Installments)
      const monthlyPayment = loan.principal / 3;
      for (let i = 1; i <= 3; i++) {
          const dueDate = new Date(startDate);
          // Month 0 (Disbursed) + 4 grace = End of Month 4.
          // i=1 -> Month 5 payment
          dueDate.setMonth(startDate.getMonth() + 4 + i);
          
          const status = getStatus(dueDate, monthlyPayment);

          schedule.push({
              period: `Month ${4+i}`,
              dueDate: dueDate.toISOString().split('T')[0],
              amount: monthlyPayment,
              status: status,
              loanId: loan.id,
              borrowerName: loan.borrowerName,
              group: loan.groupName
          });
      }
  }
  return schedule;
};
