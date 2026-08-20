import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchArticles, fetchArticleDetail } from "../zenn";

describe("fetchArticles", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        articles: [
                            {
                                slug: "abc123",
                                emoji: "💠",
                                title: "テスト記事",
                                path: "/ncdc/articles/abc123",
                                published_at: "2026-03-30T10:39:25.312+09:00",
                                user: {
                                    name: "K",
                                    avatar_small_url: "https://example.com/avatar.jpg",
                                },
                            },
                        ],
                    }),
                    { status: 200 },
                ),
            ),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("記事一覧を取得できる", async () => {
        const articles = await fetchArticles("ncdc", 10);
        expect(articles).toHaveLength(1);
        expect(articles[0]?.slug).toBe("abc123");
        expect(articles[0]?.emoji).toBe("💠");
        expect(articles[0]?.title).toBe("テスト記事");
    });

    it("APIエラー時にthrowする", async () => {
        const responseBody = "rate limited".padEnd(600, "!");
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(responseBody, {
                    status: 429,
                    statusText: "Too Many Requests",
                    headers: {
                        "CF-Ray": "abc-NRT",
                        "Retry-After": "900",
                        "X-RateLimit-Limit": "25",
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": "1787221800",
                    },
                }),
            ),
        );
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(fetchArticles("ncdc", 10)).rejects.toThrow(
            "Zenn API failed: 429 Too Many Requests",
        );
        expect(errorSpy).toHaveBeenCalledWith({
            message: "Zenn API request failed",
            operation: "list",
            status: 429,
            statusText: "Too Many Requests",
            retryAfter: "900",
            rateLimitLimit: "25",
            rateLimitRemaining: "0",
            rateLimitReset: "1787221800",
            cfRay: "abc-NRT",
            responseBody: responseBody.slice(0, 512),
        });
    });
});

describe("fetchArticleDetail", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify({
                        article: {
                            topics: [
                                { display_name: "TypeScript" },
                                { display_name: "Cloudflare" },
                            ],
                        },
                    }),
                    { status: 200 },
                ),
            ),
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("記事詳細からトピックを取得できる", async () => {
        const detail = await fetchArticleDetail("abc123");
        expect(detail.topics).toHaveLength(2);
        expect(detail.topics[0]?.display_name).toBe("TypeScript");
    });

    it("APIエラー時にthrowする", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 404 })));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(fetchArticleDetail("notfound")).rejects.toThrow(
            "Zenn API (detail) failed: 404",
        );
        expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({ operation: "detail", responseBody: "error" }),
        );
    });
});
