import { fetchArticleDetail, fetchArticles } from "./zenn";
import { buildSlackPayload, postToSlack } from "./slack";

const KV_KEY_PREFIX = "seen:";
const FETCH_COUNT = 10;

async function processArticles(env: Env): Promise<void> {
    const publicationName = env.PUBLICATION_NAME;
    const webhookUrl = env.SLACK_WEBHOOK_URL;

    const articles = await fetchArticles(publicationName, FETCH_COUNT);

    for (const article of articles) {
        const kvKey = `${KV_KEY_PREFIX}${article.slug}`;
        const seen = await env.FEED_KV.get(kvKey);
        if (seen) {
            continue;
        }

        const detail = await fetchArticleDetail(article.slug);
        const topics = detail.topics.map((t) => t.display_name);
        const payload = buildSlackPayload(article, topics);

        await postToSlack(webhookUrl, payload);
        await env.FEED_KV.put(kvKey, "1");
    }
}

export default {
    async scheduled(_event, env, ctx): Promise<void> {
        ctx.waitUntil(processArticles(env));
    },

    async fetch(req, env): Promise<Response> {
        if (new URL(req.url).pathname === "/__scheduled") {
            await processArticles(env);
            return new Response("OK");
        }
        return new Response("Not Found", { status: 404 });
    },
} satisfies ExportedHandler<Env>;
