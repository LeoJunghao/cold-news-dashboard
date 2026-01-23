import { Zap } from "lucide-react";

interface GaugeProps {
    value: number;
    min?: number;
    max?: number;
    label: string;
    unit?: string;
    loading?: boolean;
}

export function Gauge({ value, min = 0, max = 100, label, unit = "", loading = false }: GaugeProps) {
    // Normalize value to 0-100 for gauge calculation
    const normalizedValue = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
    const rotation = (normalizedValue / 100) * 180 - 90; // -90deg to +90deg

    // Color logic
    let color = "text-cyan-400";
    let strokeColor = "#22d3ee";

    if (label.includes("Greed")) {
        if (value < 25) { color = "text-red-500"; strokeColor = "#ef4444"; } // Extreme Fear
        else if (value < 45) { color = "text-orange-400"; strokeColor = "#fb923c"; } // Fear
        else if (value > 75) { color = "text-green-500"; strokeColor = "#22c55e"; } // Extreme Greed
        else if (value > 55) { color = "text-emerald-400"; strokeColor = "#34d399"; } // Greed
        else { color = "text-slate-200"; strokeColor = "#e2e8f0"; } // Neutral
    }

    // VIX: Lower is better (Green), Higher is worse (Red)
    if (label.includes("VIX")) {
        if (value < 15) { color = "text-green-500"; strokeColor = "#22c55e"; }
        else if (value < 25) { color = "text-slate-200"; strokeColor = "#e2e8f0"; }
        else { color = "text-red-500"; strokeColor = "#ef4444"; }
    }

    // MM Gold: Higher > Optimistic?
    // Assume 0-100 logic roughly maps similarly to Fear/Greed for sentiment gauges

    return (
        <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center relative min-h-[140px] border border-white/5 bg-slate-900/40">
            <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 text-center h-4 flex items-center">
                {label}
            </h3>

            {loading ? (
                <div className="animate-pulse w-full h-20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                </div>
            ) : (
                <div className="relative w-32 h-16 overflow-hidden mt-2">
                    {/* Gauge Background Arc */}
                    <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-800 box-border"></div>

                    {/* Color Arc (CSS conic gradient approach or SVG) - Simple simplified approach: */}
                    {/* Just use the needle for now, or a simple semi-circle SVG */}
                    <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full">
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={strokeColor} strokeWidth="8" strokeDasharray="126" strokeDashoffset={126 - (126 * normalizedValue / 100)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>

                    {/* Needle */}
                    <div
                        className="absolute bottom-0 left-1/2 w-[2px] h-full origin-bottom transition-transform duration-1000 ease-out"
                        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                    >
                        <div className="w-full h-[85%] bg-white shadow-[0_0_10px_white] rounded-full"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-200 rounded-full shadow-lg border-2 border-slate-800"></div>
                    </div>
                </div>
            )}

            {/* Value Display */}
            <div className={`mt-2 text-2xl font-bold font-mono ${color} tracking-tighter shadow-cyan-500/50`}>
                {loading ? '--' : value.toFixed(1)}
                <span className="text-xs ml-1 opacity-50 text-slate-400 font-sans">{unit}</span>
            </div>

            {/* State Text */}
            <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">
                {getLabelForValue(label, value, !!loading)}
            </div>
        </div>
    );
}

function getLabelForValue(type: string, val: number, loading: boolean): string {
    if (loading) return "LOADING";
    if (type.includes("VIX")) {
        if (val < 15) return "CALM";
        if (val < 25) return "NORMAL";
        return "HIGH VOLATILITY";
    }
    // Fear & Greed / Sentiment
    if (val < 25) return "EXTREME FEAR";
    if (val < 45) return "FEAR";
    if (val < 55) return "NEUTRAL";
    if (val < 75) return "GREED";
    return "EXTREME GREED";
}
