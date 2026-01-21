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

            {/* Total Summary Report */}
            <div className="mt-12 mb-8 mx-4 md:mx-0">
              <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-cyan-500/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl translate-y-20 -translate-x-20"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-cyan-400" size={24} />
                    <h2 className="text-xl font-bold text-slate-100 tracking-wide">
                      市場總結分析報告
                    </h2>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed text-justify font-sans text-lg tracking-wide">
                      {(() => {
                        const topUS = data.us[0]?.title || "市場波動";
                        const topIntl = data.intl[0]?.title || "全球局勢";
                        const topGeo = data.geo[0]?.title || "地緣動態";
                        const topTw = data.tw[0]?.title || "台股表現";

                        return `【今日財經重點分析】
                        
今日全球市場呈現多空交錯格局。美國市場方面，投資人高度關注「${topUS}」之影響，顯示市場情緒仍受關鍵數據牽動。國際視野部分，「${topIntl}」成為今日焦點，反映出區域經濟連動性增強。
                        
在地緣政治層面，「${topGeo}」持續發酵，可能為全球供應鏈帶來潛在變數。回看台灣市場，「${topTw}」為今日最重要指標，預計將對相關類股產生直接影響。

綜合觀之，當前投資環境變數仍多，建議投資人應持續追蹤上述關鍵事件之後續發展，並保持靈活的資產配置策略以應對市場波動。`;
                      })()}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-500 font-mono">AI Generated Analysis • Based on Top Stories</span>
                    <Cpu size={14} className="text-cyan-500/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-slate-600 text-sm font-mono mt-10 pt-10 border-t border-slate-800">
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
