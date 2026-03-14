'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient, supabaseEnvMessage } from '../lib/supabase';

export default function Home() {
  const [testData, setTestData] = useState(null);
  const [status, setStatus] = useState('Loading test API...');
  const [supabaseInfo, setSupabaseInfo] = useState({ status: supabaseEnvMessage });
  const supabaseClient = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let canceled = false;

    async function loadTestApi() {
      setStatus('Fetching test API...');
      try {
        const response = await fetch('/api/test');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!canceled) {
          setTestData(json);
          setStatus('Test API response loaded');
        }
      } catch (error) {
        if (!canceled) {
          setTestData(null);
          setStatus(`Failed to load test API: ${error.message}`);
        }
      }
    }

    loadTestApi();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    async function loadSupabaseInfo() {
      if (!supabaseClient) {
        setSupabaseInfo({ status: 'Set NEXT_PUBLIC_SUPABASE_URL and anon key to enable Supabase.' });
        return;
      }

      setSupabaseInfo((prev) => ({ ...prev, status: 'Checking Supabase auth & test data...' }));

      try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        const { data: itemData, error: itemError } = await supabaseClient
          .from('test_items')
          .select('id,label,active')
          .limit(3);

        if (!canceled) {
          setSupabaseInfo({
            status: sessionData?.session ? 'Supabase session found' : 'No active Supabase session',
            session: sessionData?.session ?? null,
            sessionError: sessionError?.message ?? null,
            sampleItems: itemData ?? [],
            sampleItemsError: itemError?.message ?? null,
          });
        }
      } catch (error) {
        if (!canceled) {
          setSupabaseInfo({
            status: 'Supabase client failed',
            error: error instanceof Error ? error.message : 'unknown',
          });
        }
      }
    }

    loadSupabaseInfo();

    return () => {
      canceled = true;
    };
  }, [supabaseClient]);

  return (
    <main className="hero">
      <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>Next.js Test API + Supabase</h1>
      <p style={{ fontSize: '1.125rem', maxWidth: 640 }} aria-live="polite">
        {status}
      </p>
      {testData && (
        <section style={{ textAlign: 'left', maxWidth: 640 }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Test API Response</h2>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto' }}>
            {JSON.stringify(testData, null, 2)}
          </pre>
        </section>
      )}
      <section style={{ textAlign: 'left', maxWidth: 640, marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Supabase status</h2>
        <p>{supabaseInfo.status}</p>
        {supabaseInfo.error && <p style={{ color: '#dc2626' }}>{supabaseInfo.error}</p>}
        {supabaseInfo.session && (
          <pre style={{ background: '#e2e8f0', padding: '0.75rem', borderRadius: '0.5rem' }}>
            {JSON.stringify(supabaseInfo.session, null, 2)}
          </pre>
        )}
        {supabaseInfo.sampleItems && supabaseInfo.sampleItems.length > 0 && (
          <div>
            <h3 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Sample rows</h3>
            <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem' }}>
              {JSON.stringify(supabaseInfo.sampleItems, null, 2)}
            </pre>
          </div>
        )}
        {supabaseInfo.sampleItemsError && (
          <p style={{ color: '#dc2626' }}>{supabaseInfo.sampleItemsError}</p>
        )}
      </section>
    </main>
  );
}
