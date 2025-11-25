export enum TradeType {
  LONG = 'Long',
  SHORT = 'Short'
}

export enum TradeStatus {
  WIN = 'Win',
  LOSS = 'Loss',
  BREAK_EVEN = 'Break Even',
  OPEN = 'Open'
}

export interface Trade {
  id: string;
  ticker: string;
  entryDate: string; // ISO string
  exitDate: string; // ISO string
  type: TradeType;
  bias?: 'Bearish' | 'Bullish';
  entryPrice: number;
  stopLoss?: number;
  exitPrice: number;
  quantity: number;
  fees: number;
  setup: string;
  poi?: string;
  target?: string;
  initialRisk?: number; // The dollar amount risked
  rMultiple?: number;   // The calculated R return
  notes: string;
  pnl: number; // Calculated net PnL
  pnlPercentage: number;
  status: TradeStatus;
  screenshotUrl?: string;
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}