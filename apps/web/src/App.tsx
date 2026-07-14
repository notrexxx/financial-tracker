import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingUp, ArrowDownRight, Activity, Eye } from 'lucide-react';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from '@clerk/clerk-react';
import { fetchDashboardMetrics } from './lib/api';
import axios from 'axios';

// 1. Reusable Card Component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-surface border border-border rounded-xl shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// 2. The Unified, Pixel-Perfect Dashboard View
const DashboardView = ({ data }: { data: any }) => {
  const { trends, categoryBreakdown } = data;
  const totalIncome = trends.reduce((sum: number, item: any) => sum + item.totalIncome, 0);
  const totalExpense = trends.reduce((sum: number, item: any) => sum + item.totalExpense, 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex justify-between items-center"><h3 className="text-sm text-textMuted">Net Cash Flow</h3><Wallet className="w-4 h-4 text-primary" /></div>
          <div className="text-3xl font-bold text-textMain">${(totalIncome - totalExpense).toLocaleString()}</div>
        </Card>
        <Card>
          <div className="flex justify-between items-center"><h3 className="text-sm text-textMuted">Total Income</h3><TrendingUp className="w-4 h-4 text-income" /></div>
          <div className="text-3xl font-bold text-textMain">${totalIncome.toLocaleString()}</div>
        </Card>
        <Card>
          <div className="flex justify-between items-center"><h3 className="text-sm text-textMuted">Total Expenses</h3><ArrowDownRight className="w-4 h-4 text-expense" /></div>
          <div className="text-3xl font-bold text-textMain">${totalExpense.toLocaleString()}</div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
           <h3 className="text-lg font-semibold text-textMain mb-6">Cash Flow Trends</h3>
           <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ fontWeight: 500 }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                  <Bar dataKey="totalIncome" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="totalExpense" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
             </ResponsiveContainer>
           </div>
        </Card>

        <Card>
            <h3 className="text-lg font-semibold text-textMain mb-6">Expense Distribution</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="totalAmount" stroke="none">
                    {categoryBreakdown.map((entry: any, i: number) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Amount']} />
                  <Legend iconType="circle" layout="vertical" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </Card>
      </div>
    </>
  );
};

// 3. Main App Shell Orchestrator
function App() {
  const [demoMode, setDemoMode] = useState(false);
  const { getToken, userId } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardMetrics', demoMode ? 'demo' : userId],
    queryFn: async () => {
      if (demoMode) {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/analytics/demo-dashboard`);
        return res.data;
      }
      const token = await getToken();
      return fetchDashboardMetrics(token);
    },
    // The query remains disabled until Clerk provides an ID or Demo mode is clicked
    enabled: demoMode || !!userId,
  });

  return (
    <div className="min-h-screen bg-background text-textMain p-8">
      {demoMode ? (
        <div className="max-w-7xl mx-auto">
          <button onClick={() => setDemoMode(false)} className="mb-6 text-primary hover:underline transition-colors">
            ← Back to Login
          </button>
          
          {/* CRITICAL FIX: Safe render check for undefined data */}
          {isLoading || !data ? (
            <div className="flex flex-col items-center py-20 animate-pulse">
              <Activity className="w-12 h-12 text-primary animate-spin" />
              <p className="mt-4 text-textMuted">Loading Demo Data...</p>
            </div>
          ) : isError ? (
             <div className="text-center py-20 text-expense font-bold">Failed to connect to public analytics engine.</div>
          ) : (
            <DashboardView data={data.data} />
          )}
        </div>
      ) : (
        <>
          <SignedOut>
            <div className="flex flex-col items-center justify-center mt-20">
              <SignIn appearance={{ elements: { formButtonPrimary: 'bg-primary hover:bg-blue-600' } }} />
              <button onClick={() => setDemoMode(true)} className="mt-6 flex items-center gap-2 text-textMuted hover:text-primary transition-colors">
                <Eye className="w-4 h-4" /> Continue as Guest (Demo)
              </button>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="max-w-7xl mx-auto">
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Financial Overview</h1>
                  <p className="text-textMuted mt-1">Enterprise portfolio performance and transaction analysis.</p>
                </div>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-10 h-10' } }} />
              </header>
              
              {/* CRITICAL FIX: Safe render check for undefined data */}
              {isLoading || !data ? (
                <div className="flex flex-col items-center py-20 animate-pulse">
                  <Activity className="w-12 h-12 text-primary animate-spin" />
                  <p className="mt-4 text-textMuted">Decrypting Analytics...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-20 text-expense font-bold">Failed to load secure analytics.</div>
              ) : (
                <DashboardView data={data.data} />
              )}
            </div>
          </SignedIn>
        </>
      )}
    </div>
  );
}

export default App;