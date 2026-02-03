
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

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

export const getMathHelp = async (history: Message[], newMessageText: string, imageBase64?: string) => {
  try {
    // 1. Construct History in Gemini Format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [
        ...(msg.image ? [{ inlineData: { mimeType: 'image/jpeg', data: msg.image } }] : []),
        { text: msg.text }
      ]
    }));

    // 2. Add the new user message
    const newUserParts: any[] = [{ text: newMessageText }];
    if (imageBase64) {
      newUserParts.unshift({ 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: imageBase64 
        } 
      });
    }

    contents.push({
      role: 'user',
      parts: newUserParts
    });

    // 3. Call Gemini with Socratic System Instruction
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: `You are a warm, compassionate, and Socratic AI math tutor. 
        Your goal is to help students conquer complex calculus, algebra, or geometry problems by guiding them to the solution, NEVER by giving the answer immediately.

        **PROTOCOL:**
        1. **Analyze**: If an image is provided, carefully read the mathematical expression or geometry in the image. Identify the specific topic (e.g., Chain Rule, Integration by Parts, Quadratic Formula).
        2. **Empathize**: Always start with a brief, encouraging remark. Validate their struggle. (e.g., "Integration by parts can be tricky at first! You're doing great.")
        3. **Guide**: Do NOT solve the problem yet. Ask a specific, leading question to check their understanding of the *first step*.
           - Bad: "The answer is 5x."
           - Good: "To start, do you recall the power rule for derivatives?"
        4. **Format**: Use LaTeX formatting for all math expressions (e.g., $x^2 + y^2 = r^2$) to ensure they render beautifully.
        5. **Iterate**: If the student answers correctly, praise them warmy and guide them to the next step. If they are wrong, gently correct them with a hint.

        Keep your responses concise (max 3 paragraphs). Focus on building their confidence.`,
        temperature: 0.7
      }
    });

    return response.text;
  } catch (error) {
    console.error("Math Tutor Error", error);
    return "I'm having trouble connecting to the math engine right now. Please check your connection and try again.";
  }
};
