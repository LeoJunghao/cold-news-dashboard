'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Zap, Globe, TrendingUp, Cpu } from 'lucide-react';
import { NewsSection } from '@/components/NewsSection';
import type { NewsItem } from '@/lib/news';

export default function Dashboard() {
  const [data, setData] = useState<{
    us: NewsItem[];
    intl: NewsItem[];
    geo: NewsItem[];
    tw: NewsItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Initial load



  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#050b14] text-slate-200">
      {/* Header */}
      <header className="sticky top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-6 py-3 flex flex-row justify-between items-center shadow-lg backdrop-blur-xl bg-slate-900/90">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            <Zap className="text-cyan-400" size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-100 tracking-tight">
              即時財經新聞摘要
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">
              {lastUpdated ? lastUpdated.toLocaleString('zh-TW', { hour12: false }) : 'Waiting for sync...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw size={16} className={`transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="text-sm font-medium tracking-wide hidden sm:inline">{loading ? 'SYNCING...' : 'REFRESH'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-6 space-y-8 pb-12">
        {!data && loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-mono animate-pulse">Initializing Data Stream...</p>
          </div>
        ) : data ? (
          <>
            <section id="us">
              <NewsSection title="美國財經焦點" items={data.us} color="cyan" />
            </section>
            <section id="intl">
              <NewsSection title="國際財經視野" items={data.intl} color="blue" />
            </section>
            <section id="geo">
              <NewsSection title="全球地緣政治與軍事" items={data.geo} color="purple" />
            </section>
            <section id="tw">
              <NewsSection title="台灣財經要聞" items={data.tw} color="cyan" />
            </section>

            <div className="text-center text-slate-600 text-sm font-mono mt-20 pt-10 border-t border-slate-800">
              Sources: CNN, CNBC, Anue, Yahoo Finance, WSJ, Google News • Priority &lt; 6h • Excludes {'>'} 24h
            </div>
          </>
        ) : (
          <div className="text-center text-red-400 py-20">
            System Error: Unable to fetch data stream.
          </div>
        )}
      </div>
    </main>
  );
}
