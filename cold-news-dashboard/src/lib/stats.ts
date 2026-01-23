import { parseStringPromise } from 'xml2js';

export interface MarketStats {
    vix: number;
    stockFnG: number;
    cryptoFnG: number;
    goldSentiment: number;
}

// 1. VIX from Yahoo Finance Chart API
// Fallback/Proxy: Standard requests to query1.finance.yahoo.com often work without token for simple chart data
async function getVIX(): Promise<number> {
    try {
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d', { next: { revalidate: 300 } });
        const data = await res.json();
        const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        return quote || 20; // Default fallback
    } catch (e) {
        console.error("VIX Fetch Error", e);
        return 20;
    }
}

// 2. Crypto Fear & Greed from Alternative.me
async function getCryptoFnG(): Promise<number> {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } });
        const data = await res.json();
        return parseInt(data.data[0].value) || 50;
    } catch (e) {
        console.error("Crypto FnG Error", e);
        return 50;
    }
}

// 3. Stock Fear & Greed
// Try CNN unofficial endpoint. Fallback: Calculate based on VIX.
// VIX 10-15 -> Greed (75-90), VIX 30+ -> Fear (10-25). 
// Simple formula: 100 - ((VIX - 10) * 2.5). confined 0-100.
// This is a "Synthetic" Fear & Greed if API fails.
async function getStockFnG(currentVIX: number): Promise<number> {
    try {
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            const data = await res.json();
            const today = data.fear_and_greed?.score;
            if (today) return Math.round(today);
        }
    } catch (e) {
        // Silently fail to fallback
    }

    // Fallback: VIX Proxy
    // VIX 12 => Score 80
    // VIX 20 => Score 50
    // VIX 35 => Score 10
    // Linear fit roughly: Score = 110 - 3 * VIX
    let proxy = 110 - (3 * currentVIX);
    return Math.max(0, Math.min(100, proxy));
}

// 4. MM Gold Sentiment (Proxy: Gold Trend)
// Fetch Gold Price (GC=F). Compare close to previous close?
// Actually simpler: Relative Strength (RSI) proxy or just Moving Average delta.
// Let's use: (Current Price / 50-day-avg) * 50 as a "Sentiment" 0-100 score?
// Or simpler: Yahoo Quote Change %.
// Score = 50 + (Change% * 10). If up 1% -> 60. Up 2% -> 70.
async function getGoldSentiment(): Promise<number> {
    try {
        // GC=F
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { next: { revalidate: 3600 } });
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;

        if (!price || !prevClose) return 50;

        const changePercent = ((price - prevClose) / prevClose) * 100;

        // Map -3% to +3% change to 0-100 scale centered at 50
        // -3% => 20 (Fear)
        // +3% => 80 (Greed)
        // Formula: 50 + (changePercent * 10)
        let sentiment = 50 + (changePercent * 10);
        return Math.max(10, Math.min(90, sentiment));
    } catch (e) {
        return 50;
    }
}

export async function getMarketStats(): Promise<MarketStats> {
    // 1. Fetch VIX first (needed for stock FnG fallback)
    const vix = await getVIX();

    // 2. Fetch others in parallel
    const [cryptoData, stockData, goldData] = await Promise.all([
        getCryptoFnG(),
        getStockFnG(vix), // Pass VIX as fallback
        getGoldSentiment()
    ]);

    return {
        vix,
        cryptoFnG: cryptoData,
        stockFnG: stockData,
        goldSentiment: goldData
    };
}
