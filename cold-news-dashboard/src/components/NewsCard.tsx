import { ExternalLink, Sparkles } from 'lucide-react';
import type { NewsItem } from '@/lib/news';

export function NewsCard({ item }: { item: NewsItem }) {
    // Construct Gemini query URL
    // Currently Gemini doesn't officially support ?q= deep linking for all users, but we try standard pattern or fallback to just opening it.
    const query = encodeURIComponent(`請分析這則新聞並提供更多背景：${item.title}`);
    const geminiUrl = "https://gemini.google.com/app";
    // User asked to "Call Gemini". Since we can't auto-execute, we provide the tool. 
    // Maybe just open the search? 

    return (
        <div className="glass-panel p-4 rounded-xl transition-all hover:scale-[1.02] hover:shadow-cyan-500/10 group">
            <div className="flex justify-between items-start gap-4">
                <h3 className="font-semibold text-base text-slate-100 leading-tight mb-2 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                </h3>
            </div>

            <p className="text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                {item.summary}
            </p>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
                <span className="text-xs text-slate-500 font-medium bg-slate-800/50 px-2 py-1 rounded">
                    {item.source}
                </span>

                <div className="flex gap-2">
                    <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                        title="閱讀原文"
                    >
                        <ExternalLink size={14} />
                        原文
                    </a>

                    <a
                        href={geminiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 text-cyan-400 hover:text-cyan-200 transition-all rounded-full bg-cyan-950/30 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                        title="使用 Gemini 分析這則新聞"
                        onClick={(e) => {
                            // Optional: Copy to clipboard for easy pasting since URL param might not work
                            navigator.clipboard.writeText(`請分析這則新聞：${item.title}`);
                            alert("已複製新聞標題，請在 Gemini 視窗中貼上查詢！");
                        }}
                    >
                        <Sparkles size={16} />
                    </a>
                </div>
            </div>
        </div>
    );
}
