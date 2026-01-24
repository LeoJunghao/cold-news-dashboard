import { parseStringPromise } from 'xml2js';

export interface MarketStats {
    vix: number;
    stockFnG: number;
    cryptoFnG: number;
    goldSentiment: number;
    // New Macro Indicators
    us10Y: number;
    dollarIndex: number;
    brentCrude: number;
    goldPrice: number;
}

// Generic helper to fetch price from Yahoo Finance Chart API
async function getYahooPrice(symbol: string, fallback: number): Promise<number> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 300 } });
        if (!res.ok) return fallback;
        const data = await res.json();
        const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        return quote !== undefined ? quote : fallback;
    } catch (e) {
        console.error(`Fetch Error for ${symbol}`, e);
        return fallback;
    }
}

// 1. VIX
async function getVIX(): Promise<number> {
    return getYahooPrice('%5EVIX', 20);
}

// New: US 10Y Treasury Yield (^TNX)
async function getUS10Y(): Promise<number> {
    return getYahooPrice('%5ETNX', 4.0);
}

// New: Dollar Index (DX-Y.NYB)
async function getDollarIndex(): Promise<number> {
    return getYahooPrice('DX-Y.NYB', 100);
}

// New: Brent Crude Oil (BZ=F)
async function getBrentCrude(): Promise<number> {
    return getYahooPrice('BZ=F', 80);
}

// New: Gold Price (GC=F)
async function getGoldPrice(): Promise<number> {
    return getYahooPrice('GC=F', 2000);
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

// 3. Stock Fear & Greed (CNN Proxy)
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
    let proxy = 110 - (3 * currentVIX);
    return Math.max(0, Math.min(100, proxy));
}

// 4. MM Gold Sentiment (Proxy: Gold Trend)
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
        let sentiment = 50 + (changePercent * 10);
        return Math.max(10, Math.min(90, sentiment));
    } catch (e) {
        return 50;
    }
}

export async function getMarketStats(): Promise<MarketStats> {
    // Parallel fetch
    const [vix, cryptoData, us10Y, dxy, brent, goldPrice] = await Promise.all([
        getVIX(),
        getCryptoFnG(),
        getUS10Y(),
        getDollarIndex(),
        getBrentCrude(),
        getGoldPrice()
    ]);

    // Dependent stats
    const [stockData, goldData] = await Promise.all([
        getStockFnG(vix),
        getGoldSentiment()
    ]);

    return {
        vix,
        stockFnG: stockData,
        cryptoFnG: cryptoData,
        goldSentiment: goldData,
        us10Y,
        dollarIndex: dxy,
        brentCrude: brent,
        goldPrice
    };
}
