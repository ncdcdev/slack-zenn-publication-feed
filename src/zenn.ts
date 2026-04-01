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

export async function fetchArticles(
    publicationName: string,
    count: number,
): Promise<ZennArticle[]> {
    const url = `https://zenn.dev/api/articles?publication_name=${encodeURIComponent(publicationName)}&order=latest&count=${count}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Zenn API failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as ZennListResponse;
    return data.articles;
}

export async function fetchArticleDetail(slug: string): Promise<ZennArticleDetail> {
    const url = `https://zenn.dev/api/articles/${encodeURIComponent(slug)}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Zenn API (detail) failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as ZennDetailResponse;
    return data.article;
}
