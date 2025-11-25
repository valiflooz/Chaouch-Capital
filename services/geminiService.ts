import { GoogleGenAI } from "@google/genai";
import { Trade } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client once. 
// Note: In a real production app, we should handle the case where key is missing more gracefully in the UI.
const ai = new GoogleGenAI({ apiKey });

export const analyzeTrades = async (trades: Trade[]): Promise<string> => {
  if (!trades || trades.length === 0) {
    return "No trades available to analyze. Please add some trades to your journal first.";
  }

  // Filter last 20 trades to keep context window manageable and relevant
  const recentTrades = trades
    .sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
    .slice(0, 20);

  const tradesJson = JSON.stringify(recentTrades.map(t => ({
    ticker: t.ticker,
    type: t.type,
    pnl: t.pnl,
    setup: t.setup,
    notes: t.notes,
    date: t.exitDate
  })), null, 2);

  const prompt = `
    You are a professional trading psychology coach and risk manager. 
    Analyze the following recent trading journal entries (JSON format).
    
    Data:
    ${tradesJson}

    Please provide a concise but high-impact analysis covering:
    1. **Performance Summary**: Briefly comment on the win rate and PnL trend.
    2. **Pattern Recognition**: Identify any recurring mistakes (e.g., overtrading, poor risk management, specific setups failing) or strengths.
    3. **Actionable Advice**: Give 3 specific bullet points on what I should focus on for my next session to improve.

    Keep the tone professional, direct, and constructive. Use Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert trading mentor designed to help traders improve profitability and discipline."
      }
    });
    
    return response.text || "Analysis could not be generated at this time.";
  } catch (error) {
    console.error("Error analyzing trades:", error);
    return "An error occurred while connecting to the AI analyst. Please try again later.";
  }
};

export const suggestTradeImprovements = async (trade: Trade): Promise<string> => {
    const prompt = `
    Analyze this specific trade and provide brief feedback on the execution based on the notes:
    Ticker: ${trade.ticker}
    PnL: ${trade.pnl}
    Setup: ${trade.setup}
    Notes: ${trade.notes}
    
    Was this a disciplined trade? What could have been done better? Keep it under 50 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No feedback available.";
    } catch (error) {
        return "Could not generate feedback.";
    }
}
