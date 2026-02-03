
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, Loan } from '../types';

// TODO: Replace with your actual API key
const API_KEY = 'YOUR_GEMINI_API_KEY';
const genAI = new GoogleGenerativeAI(API_KEY);

// A basic Socratic tutor prompt
const PROMPT = `
  You are a Socratic math tutor. Your goal is to help the user understand and solve the problem on their own.
  Do not give the answer directly. Instead, ask guiding questions and provide hints.
  If the user provides an image, analyze it and use it to guide your questions.
`;

async function getMathHelp(history: Message[], userQuestion: string, userImage?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: PROMPT }] },
        { role: 'model', parts: [{ text: "Okay, I am ready to be a Socratic math tutor. I will not give direct answers, but ask guiding questions." }] },
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      ]
    });

    const imageParts = userImage ? [{ inlineData: { mimeType: 'image/jpeg', data: userImage } }] : [];
    const result = await chat.sendMessageStream([...imageParts, { text: userQuestion }]);

    let text = '';
    for await (const chunk of result.stream) {
      text += chunk.text();
    }

    return text;
  } catch (error) {
    console.error('Error in getMathHelp:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

async function analyzeRisk(loan: Loan): Promise<any> {
    // Mock implementation
    console.log("Analyzing risk for loan:", loan.id);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock data based on loan status
    if (loan.status === 'Loss') {
        return {
            riskScore: 9,
            riskDriver: "Defaulted payments and no recovery.",
            strategy: "Initiate write-off procedures and review collection process for future loans."
        };
    }
    if (loan.dpd > 60) {
        return {
            riskScore: 8,
            riskDriver: "Significant delinquency (over 60 days).",
            strategy: "Immediate and intensive collection efforts required. Consider legal action."
        };
    }
    if (loan.dpd > 30) {
        return {
            riskScore: 6,
            riskDriver: "Early-stage delinquency (over 30 days).",
            strategy: "Increase communication frequency and offer a revised payment plan."
        };
    }
    return {
        riskScore: 3,
        riskDriver: "Consistent on-time payments.",
        strategy: "Maintain standard monitoring. Offer rewards for good payment history."
    };
}

export { getMathHelp, analyzeRisk };
