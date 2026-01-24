import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NewsItem } from './news';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatNewsForClipboard(data: {
    us: NewsItem[];
    intl: NewsItem[];
    geo: NewsItem[];
    tw: NewsItem[];
    crypto: NewsItem[];
}) {
    const formatDate = (date: Date) => {
        return date.toLocaleString('zh-TW', { hour12: false });
    };

    const topUS = data.us[0]?.title || "市場波動";
    const topIntl = data.intl[0]?.title || "全球局勢";
    const topGeo = data.geo[0]?.title || "地緣動態";
    const topTw = data.tw[0]?.title || "台股表現";

    const marketSummary = `市場分析報告顯示，今日全球金融體系持續受到多重宏觀因素交互影響。首要焦點集中於美國市場，「${topUS}」消息一出即引發市場關注。在國際板塊方面，「${topIntl}」亦成為重要風向球。此外，地緣政治風險未曾消退，「${topGeo}」局勢發展仍具不確定性。回歸台灣市場，「${topTw}」議題直接牽動產業鏈敏感神經。`;

    const subject = `財經新聞摘要 - ${formatDate(new Date())}`;
    let body = `${marketSummary}\n\n`;

    const sections = [
        { title: '美國財經焦點', items: data.us },
        { title: '國際財經視野', items: data.intl },
        { title: '全球地緣政治與軍事', items: data.geo },
        { title: '台灣財經要聞', items: data.tw },
        { title: '加密貨幣快訊', items: data.crypto },
    ];

    sections.forEach(section => {
        if (section.items.length > 0) {
            body += `【${section.title}】\n`;
            section.items.forEach((item, index) => {
                body += `${index + 1}. ${item.title}\n`;
                body += `   摘要: ${item.summary}\n\n`;
            });
            body += `----------------------------------------\n\n`;
        }
    });

    body += `Sources: CNN, CNBC, Anue, Yahoo Finance, WSJ, Google News`;
    return body;
}
