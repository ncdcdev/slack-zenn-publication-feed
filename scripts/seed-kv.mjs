/**
 * 既存記事のslugをKVに一括書き込みするためのJSONを生成するスクリプト
 * デプロイ前に実行して初回配信を防ぐ
 *
 * Usage:
 *   node scripts/seed-kv.mjs > /tmp/seed.json
 *   npx wrangler kv bulk put --namespace-id <KV_NAMESPACE_ID> /tmp/seed.json
 */

const KV_KEY_PREFIX = "seen:";

async function fetchAllSlugs(publicationName) {
    const slugs = [];
    let page = 1;
    while (true) {
        const url = `https://zenn.dev/api/articles?publication_name=${publicationName}&order=latest&count=100&page=${page}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Zenn API failed: ${res.status}`);
        }
        const data = await res.json();
        if (data.articles.length === 0) break;
        slugs.push(...data.articles.map((a) => a.slug));
        if (data.articles.length < 100) break;
        page++;
    }
    return slugs;
}

const slugs = await fetchAllSlugs("ncdc");
const entries = slugs.map((slug) => ({ key: `${KV_KEY_PREFIX}${slug}`, value: "1" }));
console.log(JSON.stringify(entries));
