import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // Fetch the data from your robust NestJS API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('https://financial-tracker-api-mf8f.onrender.com/analytics/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: isLoaded && isSignedIn, // Only run if the user is authenticated
  });

  if (!isLoaded || isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#fff' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ marginRight: '1rem' }} />
        <h2>Error loading financial data.</h2>
      </div>
    );
  }

  const { trends, categoryBreakdown } = data.data;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#ededed', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 'bold' }}>Financial Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* CHART 1: Income vs Expense Trends */}
        <div style={{ backgroundColor: '#171717', padding: '1.5rem', borderRadius: '12px', border: '1px solid #262626' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#a3a3a3' }}>Monthly Cashflow</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="month" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="totalIncome" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalExpense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Expense Breakdown */}
        <div style={{ backgroundColor: '#171717', padding: '1.5rem', borderRadius: '12px', border: '1px solid #262626' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#a3a3a3' }}>Expense Breakdown</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Pie
                  data={categoryBreakdown}
                  dataKey="totalAmount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  // THE TS FIX: safely falling back to 0 if percent is undefined
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}