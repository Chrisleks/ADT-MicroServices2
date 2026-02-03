
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRisk = async (loan: any) => {
  const prompt = `
    Act as a senior credit risk analyst for a microfinance institution.
    Analyze the credit risk for the following borrower:
    
    Borrower Name: ${loan.borrowerName}
    Loan Product: ${loan.loanType}
    Principal Amount: ${loan.principal}
    Current Savings: ${loan.savingsBalance}
    Repayment Status: ${loan.status}
    Days Past Due: ${loan.dpd}
    Loan Cycle: ${loan.loanCycle}
    Group: ${loan.groupName}

    Based on this limited data, analyze the risk.
    
    Return a STRICT JSON object with the following fields:
    {
      "riskScore": number (1-10, where 10 is highest risk),
      "riskDriver": string (The main factor contributing to the risk, max 10 words),
      "strategy": string (A specific, actionable strategy for the field officer to mitigate this risk or manage the client, max 25 words)
    }
    
    Do not include markdown code blocks. Just the JSON string.
  `;

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
     });
     
     const text = response.text || '{}';
     const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
     return JSON.parse(jsonStr);
  } catch (e) {
     console.error("Risk Analysis Failed", e);
     return { 
         riskScore: 5, 
         riskDriver: 'Analysis Unavailable', 
         strategy: 'Manual Review Required due to connection error.' 
     };
  }
};
