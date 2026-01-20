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

  const currentTime = lastUpdated ? lastUpdated.toLocaleTimeString('zh-TW') : '--:--:--';

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#050b14] text-slate-200">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-2xl backdrop-blur-xl bg-slate-900/80">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Zap className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 neon-text tracking-tight">
              COLDNEWS <span className="font-thin text-white">DASHBOARD</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Real-time Intellgience</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-500 uppercase tracking-wider">System Time</div>
            <div className="font-mono text-cyan-400 text-lg tabular-nums">{currentTime}</div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw size={18} className={`transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="font-medium tracking-wide">{loading ? 'SYNCING...' : 'REFRESH'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-32 space-y-12 pb-20">
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
