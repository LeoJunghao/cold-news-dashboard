import { NewsCard } from './NewsCard';
import type { NewsItem } from '@/lib/news';

interface SectionProps {
    title: string;
    items: NewsItem[];
    color: string;
}

export function NewsSection({ title, items, color }: SectionProps) {
    // Map color to Tailwind classes or styles
    const borderColor = color === 'cyan' ? 'border-cyan-500/30' :
        color === 'blue' ? 'border-blue-500/30' :
            color === 'purple' ? 'border-purple-500/30' : 'border-slate-500/30';

    const titleColor = color === 'cyan' ? 'text-cyan-400' :
        color === 'blue' ? 'text-blue-400' :
            color === 'purple' ? 'text-purple-400' : 'text-slate-400';

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${borderColor}`}>
                <div className={`w-1 h-5 rounded-full ${color === 'cyan' ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' :
                    color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' :
                        color === 'purple' ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' :
                            color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                                'bg-slate-500'}`} />
                <h2 className={`text-lg font-bold tracking-wider uppercase ${titleColor}`}>
                    {title} <span className="text-slate-600 text-xs ml-2 font-mono">({items.length})</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((item) => (
                    <NewsCard key={item.id} item={item} />
                ))}
                {items.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
                        No recent news found in this category (24h).
                    </div>
                )}
            </div>
        </div>
    );
}
