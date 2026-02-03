
import { UserRole } from "../types";

// Simulated Email Sender
export const sendSystemEmail = async (toEmail: string, subject: string, body: string) => {
  // In a real application, this would call an API endpoint (e.g., SendGrid, AWS SES)
  console.group("📧 [SYSTEM EMAIL SENT]");
  console.log(`TO: ${toEmail}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY: ${body}`);
  console.groupEnd();

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return true;
};

// Simulated Bulk SMS Sender
export const sendBulkSMS = async (recipients: {name: string, phone: string}[], message: string) => {
  // In a real app, this connects to Twilio, Termii, or AfricaTalking
  console.group("📱 [BULK SMS BROADCAST]");
  console.log(`MESSAGE: "${message}"`);
  console.log(`RECIPIENTS (${recipients.length}):`);
  recipients.slice(0, 5).forEach(r => console.log(` - ${r.name} (${r.phone})`));
  if(recipients.length > 5) console.log(` ... and ${recipients.length - 5} others.`);
  console.groupEnd();

  await new Promise(resolve => setTimeout(resolve, 1500));
  return { success: true, count: recipients.length };
};

export const getEmailsByRole = (users: any[], role: UserRole): string[] => {
  return users.filter(u => u.role === role && u.isActive).map(u => u.email);
};
