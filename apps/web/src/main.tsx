import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, 
      staleTime: 1000 * 60 * 5, 
    },
  },
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root')!;

if (!PUBLISHABLE_KEY) {
  ReactDOM.createRoot(rootElement).render(
    <div style={{ padding: '3rem', fontFamily: 'system-ui', color: '#ff4d4f', backgroundColor: '#141414', height: '100vh' }}>
      <h2>⚠️ Critical Vercel Build Error</h2>
      <p>The React app compiled, but Vite injected <strong>undefined</strong> for the Clerk Key.</p>
      <p>To fix this immediately:</p>
      <ol style={{ lineHeight: '1.8', color: '#e5e5e5' }}>
        <li>Go to Vercel Settings → Environment Variables.</li>
        <li>Make sure the key is exactly <strong>VITE_CLERK_PUBLISHABLE_KEY</strong>.</li>
        <li>Edit the variable and make sure the <strong>Production</strong> checkbox is checked.</li>
        <li>Go to the Deployments tab, click the 3 dots, and hit <strong>Redeploy (Do not use build cache)</strong>.</li>
      </ol>
    </div>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ClerkProvider>
    </React.StrictMode>,
  );
}