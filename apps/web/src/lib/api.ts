import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
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