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
        expect(payload).toEqual({
            attachments: [
                {
                    color: "#3EA8FF",
                    blocks: [
                        {
                            type: "rich_text",
                            elements: [
                                {
                                    type: "rich_text_section",
                                    elements: [
                                        {
                                            type: "emoji",
                                            name: "diamond_shape_with_a_dot_inside",
                                            unicode: "1f4a0",
                                        },
                                        { type: "text", text: " " },
                                        {
                                            type: "link",
                                            url: "https://zenn.dev/ncdc/articles/abc123",
                                            text: "テスト記事",
                                            style: { bold: true },
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "context",
                            elements: [
                                {
                                    type: "mrkdwn",
                                    text: "`TypeScript`  `Cloudflare`",
                                },
                            ],
                        },
                        {
                            type: "context",
                            elements: [
                                {
                                    type: "image",
                                    image_url: "https://example.com/avatar.jpg",
                                    alt_text: "K",
                                },
                                {
                                    type: "mrkdwn",
                                    text: "*K*  |  2026/03/30",
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("タイトルのSlack記法を装飾として解釈させない", () => {
        const title =
            "ぼくのかんがえたさいきょうのCornixせってい ~最小限の運指で全ての操作を完結させ、モニターを1枚減らせた究極のキーマップ~";
        const payload = buildSlackPayload({ ...SAMPLE_ARTICLE, emoji: "🦁", title }, SAMPLE_TOPICS);

        expect(payload.attachments[0]?.blocks[0]).toEqual({
            type: "rich_text",
            elements: [
                {
                    type: "rich_text_section",
                    elements: [
                        {
                            type: "emoji",
                            name: "lion_face",
                            unicode: "1f981",
                        },
                        { type: "text", text: " " },
                        {
                            type: "link",
                            url: "https://zenn.dev/ncdc/articles/abc123",
                            text: title,
                            style: { bold: true },
                        },
                    ],
                },
            ],
        });
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
