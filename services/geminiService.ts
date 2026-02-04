
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

export const askPortfolioAssistant = async (query: string, loans: any[]) => {
  // Simplify data to reduce token count while keeping essential info
  const simplifiedData = loans.map(l => {
      const paid = l.payments?.filter((p: any) => p.category === 'Loan Instalment' && p.direction === 'In').reduce((s:number, x:any) => s + x.amount, 0) || 0;
      return {
          id: l.id,
          name: l.borrowerName,
          group: l.groupName,
          officer: l.creditOfficer,
          status: l.status,
          principal: l.principal,
          paid: paid,
          balance: l.principal - paid,
          savings: l.savingsBalance,
          dpd: l.dpd,
          phone: l.phoneNumber
      };
  });

  const prompt = `
    You are the Senior Portfolio Analyst for 'TEKAN PEACE DESK AWAKE'.
    You have direct access to the live loan portfolio data below.
    
    Current Portfolio Data (JSON):
    ${JSON.stringify(simplifiedData)}

    User Question: "${query}"

    Guidelines:
    1. Answer the user's question accurately based STRICTLY on the data provided.
    2. If asked for lists (e.g. "who owes money?"), provide a clean list with names and amounts.
    3. If asked to draft a message (SMS/Letter), write a professional draft using the customer's details.
    4. Perform calculations (sums, averages) if needed.
    5. Format currency as ₦ (Naira).
    6. Be concise, professional, and helpful. 
    7. Use Markdown formatting (bolding, lists) for readability.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    console.error("AI Assistant Error", e);
    return "I'm having trouble analyzing the portfolio right now. Please ensure your API key is valid and you are online.";
  }
};
