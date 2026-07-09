import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, ArrowDownRight, Activity } from 'lucide-react';
import { fetchDashboardMetrics } from './lib/api';

const DEMO_USER_ID = 'd0b74a2f-fe21-4a20-9de2-c32faec848b5';

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardMetrics', DEMO_USER_ID],
    queryFn: () => fetchDashboardMetrics(DEMO_USER_ID),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Activity className="w-12 h-12 text-primary animate-spin" />
          <p className="text-textMuted font-medium">Aggregating Financial Data...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-6 bg-surface border border-red-500/20 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-expense mb-2">Connection Error</h2>
          <p className="text-textMuted">Failed to connect to the analytics engine. Ensure your NestJS server is running on port 3000.</p>
        </div>
      </div>
    );
  }

  const { trends, categoryBreakdown } = data.data;

  // Calculate high-level KPIs from the aggregated data
  const totalHistoricalIncome = trends.reduce((sum, item) => sum + item.totalIncome, 0);
  const totalHistoricalExpense = trends.reduce((sum, item) => sum + item.totalExpense, 0);
  const netWorthDelta = totalHistoricalIncome - totalHistoricalExpense;

  // Reusable UI Card Component mimicking shadcn/ui
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-surface border border-border rounded-xl shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-textMain tracking-tight">Financial Overview</h1>
        <p className="text-textMuted mt-1">Enterprise portfolio performance and transaction analysis.</p>
      </header>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-textMuted">Net Cash Flow</h3>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-textMain">
            ${netWorthDelta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-textMuted">Total Income (YTD)</h3>
            <TrendingUp className="w-4 h-4 text-income" />
          </div>
          <div className="text-3xl font-bold text-textMain">
            ${totalHistoricalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-textMuted">Total Expenses (YTD)</h3>
            <ArrowDownRight className="w-4 h-4 text-expense" />
          </div>
          <div className="text-3xl font-bold text-textMain">
            ${totalHistoricalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Time-Series Bar Chart (Spans 2 columns on large screens) */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-textMain mb-6">Cash Flow Trends</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ fontWeight: 500 }}
                  // Fix: Relaxed strict typing to bypass Recharts internal generic limitations
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="totalIncome" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalExpense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Breakdown Donut Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-textMain mb-6">Expense Distribution</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="totalAmount"
                  stroke="none"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  // Fix: Relaxed strict typing to bypass Recharts internal generic limitations
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default App;