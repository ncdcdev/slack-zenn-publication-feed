import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSlackPayload, postToSlack } from "../slack";
import type { ZennArticle } from "../zenn";

const WEBHOOK_URL = "https://hooks.slack.com/services/T00/B00/xxx";

const SAMPLE_ARTICLE: ZennArticle = {
    slug: "abc123",
    emoji: "💠",
    title: "テスト記事",
    path: "/ncdc/articles/abc123",
    published_at: "2026-03-30T10:39:25.312+09:00",
    user: {
        name: "K",
        avatar_small_url: "https://example.com/avatar.jpg",
    },
};

const SAMPLE_TOPICS = ["TypeScript", "Cloudflare"];

describe("buildSlackPayload", () => {
    it("Block Kit形式のペイロードを生成する", () => {
        const payload = buildSlackPayload(SAMPLE_ARTICLE, SAMPLE_TOPICS);
        expect(payload.attachments).toHaveLength(1);
        expect(payload.attachments[0]?.color).toBe("#3EA8FF");

        const blocks = payload.attachments[0]?.blocks as {
            type: string;
            text?: { text: string };
        }[];
        expect(blocks).toHaveLength(3);

        // タイトルにリンクと絵文字が含まれる
        const titleBlock = blocks[0]?.text?.text ?? "";
        expect(titleBlock).toContain("💠");
        expect(titleBlock).toContain("テスト記事");
        expect(titleBlock).toContain("https://zenn.dev/ncdc/articles/abc123");
    });

    it("日付がYYYY/MM/DD形式になる", () => {
        const payload = buildSlackPayload(SAMPLE_ARTICLE, SAMPLE_TOPICS);
        const blocks = payload.attachments[0]?.blocks as { elements?: { text?: string }[] }[];
        const contextText = blocks[2]?.elements?.[1]?.text ?? "";
        expect(contextText).toContain("2026/03/30");
    });

    it("トピックがコードブロック形式で含まれる", () => {
        const payload = buildSlackPayload(SAMPLE_ARTICLE, SAMPLE_TOPICS);
        const blocks = payload.attachments[0]?.blocks as { elements?: { text?: string }[] }[];
        const topicText = blocks[1]?.elements?.[0]?.text ?? "";
        expect(topicText).toContain("`TypeScript`");
        expect(topicText).toContain("`Cloudflare`");
    });
});

describe("postToSlack", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("ペイロードをSlackに送信する", async () => {
        const payload = buildSlackPayload(SAMPLE_ARTICLE, SAMPLE_TOPICS);
        await postToSlack(WEBHOOK_URL, payload);

        expect(fetch).toHaveBeenCalledWith(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    });

    it("Slack APIがエラーを返した場合にthrowする", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 500 })));

        const payload = buildSlackPayload(SAMPLE_ARTICLE, SAMPLE_TOPICS);
        await expect(postToSlack(WEBHOOK_URL, payload)).rejects.toThrow(
            "Slack webhook failed: 500",
        );
    });
});
