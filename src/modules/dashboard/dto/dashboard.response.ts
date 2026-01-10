// Dashboard response DTOs

export class WeeklyGoalDTO {
  id: string;
  title: string;
  description?: string;
  progress: number;
  startDate: string;
  endDate: string;
}

export class QuoteDTO {
  content: string;
  author?: string;
}

export class InvestmentDTO {
  gold: {
    buy: number | null;
    sell: number | null;
  };
  crypto: {
    btc: number | null;
    eth: number | null;
  };
  forex: {
    usdVnd: number | null;
  };
  updatedAt: string;
}

export class NewsDTO {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
}

export class DashboardResponse {
  weeklyGoals: WeeklyGoalDTO[];
  quoteOfTheDay: QuoteDTO | null;
  investment: InvestmentDTO;
  newsToday: NewsDTO[];
  hasMoreNews: boolean;
}

