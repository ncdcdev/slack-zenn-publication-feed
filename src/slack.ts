import type { ZennArticle } from "./zenn";

type SlackAttachment = {
    color: string;
    blocks: unknown[];
};

type SlackPayload = {
    attachments: SlackAttachment[];
};

export function buildSlackPayload(article: ZennArticle, topics: string[]): SlackPayload {
    const url = `https://zenn.dev${article.path}`;
    const d = new Date(article.published_at);
    const pubDate = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

    return {
        attachments: [
            {
                color: "#3EA8FF",
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: `${article.emoji} *<${url}|${article.title}>*`,
                        },
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: topics.map((t) => `\`${t}\``).join("  "),
                            },
                        ],
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "image",
                                image_url: article.user.avatar_small_url,
                                alt_text: article.user.name,
                            },
                            {
                                type: "mrkdwn",
                                text: `*${article.user.name}*  |  ${pubDate}`,
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

export async function postToSlack(webhookUrl: string, payload: SlackPayload): Promise<void> {
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Slack webhook failed: ${res.status} ${body}`);
    }
}
