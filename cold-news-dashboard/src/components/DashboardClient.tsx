'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap, Copy, TrendingUp, Cpu } from 'lucide-react';
import { NewsSection } from '@/components/NewsSection';
import { Gauge } from '@/components/Gauge';
import type { NewsItem } from '@/lib/news';
import type { MarketStats } from '@/lib/stats';
import { formatNewsForClipboard, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardClientProps {
    initialData: {
        us: NewsItem[];
        intl: NewsItem[];
        geo: NewsItem[];
        tw: NewsItem[];
        crypto: NewsItem[];
    };
    initialStats: MarketStats;
    lastUpdatedStr: string;
}

export function DashboardClient({ initialData, initialStats, lastUpdatedStr }: DashboardClientProps) {
    const [data, setData] = useState(initialData);
    const [stats, setStats] = useState<MarketStats | null>(initialStats);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date(lastUpdatedStr));

    const fetchData = useCallback(async (isForceRefresh = false) => {
        setLoading(true);
        try {
            const forceQuery = isForceRefresh ? '&force=true' : '';
            const timestamp = Date.now();

            const [newsRes, statsRes] = await Promise.all([
                fetch(`/api/news?t=${timestamp}${forceQuery}`, { cache: 'no-store' }),
                fetch(`/api/stats?t=${timestamp}`, { cache: 'no-store' })
            ]);

            if (newsRes.ok && statsRes.ok) {
                const newsJson = await newsRes.json();
                const statsJson = await statsRes.json();
                setData(newsJson);
                setStats(statsJson);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(false);
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleCopy = () => {
        if (!data) return;
        const body = formatNewsForClipboard(data);
        navigator.clipboard.writeText(body).then(() => {
            alert("Analysis copied to clipboard!");
        }).catch(err => {
            console.error('Copy failed', err);
            alert("Failed to copy to clipboard.");
        });
    };

    return (
        <main className="min-h-screen p-4 md:p-8 bg-[#050b14] text-slate-200">
            {/* Header */}
            <header className="sticky top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 px-6 py-3 flex flex-row justify-between items-center shadow-lg backdrop-blur-xl bg-slate-900/90 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <Zap className="text-cyan-400" size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-yellow-400 font-mono tracking-tighter drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]">
                            即時財經新聞摘要
                        </h1>
                        <p className="text-[10px] text-slate-500 font-mono tracking-wider flex items-center gap-2">
                            {lastUpdated.toLocaleString('zh-TW', { hour12: false })}
                            {loading && <span className="text-cyan-500 animate-pulse">Syncing...</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <RefreshCw size={16} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                        <span className="text-sm font-medium tracking-wide hidden sm:inline">REFRESH</span>
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-700/50 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Copy size={16} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        <span className="text-sm font-medium tracking-wide hidden sm:inline">COPY</span>
                    </button>
                </div>
            </header>

            {/* Gauges Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto mb-8"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Gauge
                        label="Fear & Greed (Stock)"
                        value={stats?.stockFnG || 50}
                        loading={loading && !stats}
                    />
                    <Gauge
                        label="VIX Volatility"
                        value={stats?.vix || 20}
                        max={60}
                        unit=""
                        loading={loading && !stats}
                    />
                    <Gauge
                        label="Crypto Fear & Greed"
                        value={stats?.cryptoFnG || 50}
                        loading={loading && !stats}
                    />
                    <Gauge
                        label="Gold Sentiment"
                        value={stats?.goldSentiment || 50}
                        loading={loading && !stats}
                    />
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
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
                <section id="crypto">
                    <NewsSection title="加密貨幣快訊" items={data.crypto} color="emerald" />
                </section>

                {/* Total Summary Report */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-12 mb-8 mx-4 md:mx-0"
                >
                    <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-cyan-500/20 transition-all duration-1000" />
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl translate-y-20 -translate-x-20" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="text-cyan-400" size={24} />
                                <h2 className="text-xl font-bold text-slate-100 tracking-wide">
                                    市場總結分析報告
                                </h2>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-slate-300 leading-relaxed text-justify font-sans text-sm tracking-wide">
                                    {(() => {
                                        const topUS = data.us[0]?.title || "市場波動";
                                        const topIntl = data.intl[0]?.title || "全球局勢";
                                        const topGeo = data.geo[0]?.title || "地緣動態";
                                        const topTw = data.tw[0]?.title || "台股表現";

                                        return `市場分析報告顯示，今日全球金融體系持續受到多重宏觀因素交互影響，投資氛圍呈現謹慎觀望。首要焦點集中於美國市場，「${topUS}」消息一出即引發市場關注。在國際板塊方面，「${topIntl}」亦成為重要風向球。此外，地緣政治風險未曾消退，「${topGeo}」局勢發展仍具不確定性。回歸台灣市場，「${topTw}」議題直接牽動產業鏈敏感神經。建議投資人密切監控後續效應，適度調控資金部位。`;
                                    })()}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <span className="text-xs text-slate-500 font-mono">AI Generated Analysis • Top Stories</span>
                                <Cpu size={14} className="text-cyan-500/50" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="text-center text-slate-600 text-sm font-mono mt-10 pt-10 border-t border-slate-800">
                    Sources: CNN, CNBC, Anue, Yahoo Finance, WSJ, Google News • Priority &lt; 6h • Excludes {'>'} 24h
                </div>
            </div>
        </main>
    );
}
