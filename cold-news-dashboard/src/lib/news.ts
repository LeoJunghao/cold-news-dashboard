import { parseStringPromise } from 'xml2js';
import { subHours, isAfter } from 'date-fns';

export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    link: string;
    time: string;
    category: string;
    pubDate: number; // Added for sorting
}

const CATEGORIES = {
    us: {
        query: '美國財經 OR 美股 OR 聯準會 OR Fed OR 美債',
        limit: 10,
        name: '美國財經焦點'
    },
    intl: {
        query: '中國經濟 OR 歐洲市場 OR 日韓股市 OR 新興市場 -美國 -台灣',
        limit: 10,
        name: '國際財經視野'
    },
    geo: {
        query: '地緣政治 OR 烏克蘭戰爭 OR 以巴衝突 OR 南海爭議 OR 軍事動態',
        limit: 5,
        name: '全球地緣政治與軍事'
    },
    tw: {
        query: '台股 OR 半導體 OR AI供應鏈 OR 台灣經濟政策',
        limit: 10,
        name: '台灣財經要聞'
    }
};

async function fetchCategoryNews(key: string, config: any): Promise<NewsItem[]> {
    // Use Google News RSS (Taiwan Edition for Chinese results)
    const encodedQuery = encodeURIComponent(config.query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;

    try {
        const res = await fetch(url, { cache: 'no-store' });
        const text = await res.text();
        const result = await parseStringPromise(text);

        if (!result.rss?.channel?.[0]?.item) return [];

        const items = result.rss.channel[0].item;
        const now = new Date();
        const cutoff = subHours(now, 24);

        const newsItems: NewsItem[] = [];

        for (const item of items) {
            const pubDate = new Date(item.pubDate[0]);

            // Filter: Within 24 hours
            if (!isAfter(pubDate, cutoff)) continue;

            // Clean Title: Remove " - Source" suffix which Google News often adds
            let title = item.title[0];
            let source = item.source?.[0]?._ || 'Unknown';

            const sourceMatch = title.match(/(.*) - (.*)$/);
            if (sourceMatch) {
                title = sourceMatch[1];
                // Prefer title's source extraction if missing
                if (source === 'Unknown') source = sourceMatch[2];
            }

            // Summary: Clean HTML tags
            let summary = item.description?.[0] || '';
            summary = summary.replace(/<[^>]+>/g, ''); // Remove tags
            // Decode entities if needed (basic ones)
            summary = summary.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"');

            newsItems.push({
                id: item.guid?.[0]?._ || item.link[0],
                title,
                summary,
                source,
                link: item.link[0],
                time: pubDate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                category: config.name,
                pubDate: pubDate.getTime() // Add timestamp for sorting
            });
        }

        // Sort by date descending (Newest first) to prioritize news within 6 hours
        newsItems.sort((a, b) => b.pubDate - a.pubDate);

        return newsItems.slice(0, config.limit);
    } catch (error) {
        console.error(`Error fetching ${key}:`, error);
        return [];
    }
}

export async function getDashboardNews() {
    const [us, intl, geo, tw] = await Promise.all([
        fetchCategoryNews('us', CATEGORIES.us),
        fetchCategoryNews('intl', CATEGORIES.intl),
        fetchCategoryNews('geo', CATEGORIES.geo),
        fetchCategoryNews('tw', CATEGORIES.tw)
    ]);

    return { us, intl, geo, tw };
}
