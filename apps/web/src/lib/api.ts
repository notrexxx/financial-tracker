import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
});

export interface TrendData {
  month: string;
  totalIncome: number;
  totalExpense: number;
}

export interface CategoryData {
  name: string;
  color: string;
  totalAmount: number;
}

export interface DashboardPayload {
  success: boolean;
  data: {
    trends: TrendData[];
    categoryBreakdown: CategoryData[];
  };
}

// Ensure the token is passed and injected into the Authorization header
export const fetchDashboardMetrics = async (token: string | null): Promise<DashboardPayload> => {
  if (!token) throw new Error("Authentication token is missing.");

  const response = await api.get('/analytics/dashboard', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};