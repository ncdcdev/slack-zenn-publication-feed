export type ZennArticle = {
    slug: string;
    emoji: string;
    title: string;
    path: string;
    published_at: string;
    user: {
        name: string;
        avatar_small_url: string;
    };
};

export type ZennArticleDetail = {
    topics: { display_name: string }[];
};

type ZennListResponse = {
    articles: ZennArticle[];
};

type ZennDetailResponse = {
    article: ZennArticleDetail;
};

type ZennApiOperation = "list" | "detail";

async function throwZennApiError(res: Response, operation: ZennApiOperation): Promise<never> {
    const responseBody = (await res.text()).slice(0, 512);

    console.error({
        message: "Zenn API request failed",
        operation,
        status: res.status,
        statusText: res.statusText,
        retryAfter: res.headers.get("Retry-After"),
        rateLimitLimit: res.headers.get("RateLimit-Limit") ?? res.headers.get("X-RateLimit-Limit"),
        rateLimitRemaining:
            res.headers.get("RateLimit-Remaining") ?? res.headers.get("X-RateLimit-Remaining"),
        rateLimitReset: res.headers.get("RateLimit-Reset") ?? res.headers.get("X-RateLimit-Reset"),
        cfRay: res.headers.get("CF-Ray"),
        responseBody,
    });

    const detail = operation === "detail" ? " (detail)" : "";
    throw new Error(`Zenn API${detail} failed: ${res.status} ${res.statusText}`);
}

export async function fetchArticles(
    publicationName: string,
    count: number,
): Promise<ZennArticle[]> {
    const url = `https://zenn.dev/api/articles?publication_name=${encodeURIComponent(publicationName)}&order=latest&count=${count}`;
    const res = await fetch(url);
    if (!res.ok) {
        await throwZennApiError(res, "list");
    }
    const data = (await res.json()) as ZennListResponse;
    return data.articles;
}

export async function fetchArticleDetail(slug: string): Promise<ZennArticleDetail> {
    const url = `https://zenn.dev/api/articles/${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (!res.ok) {
        await throwZennApiError(res, "detail");
    }
    const data = (await res.json()) as ZennDetailResponse;
    return data.article;
}
