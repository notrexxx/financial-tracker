import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
  withCredentials: true,
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

export const fetchDashboardMetrics = async (userId: string): Promise<DashboardPayload> => {
  const response = await api.get(`/analytics/dashboard?userId=${userId}`);
  return response.data;
};