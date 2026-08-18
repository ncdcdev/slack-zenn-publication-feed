import emojiDataJson from "emoji-datasource/emoji.json";

type EmojiDataEntry = {
    unified: string;
    non_qualified: string | null;
    short_name: string;
    skin_variations?: Record<string, { unified: string }>;
};

type SlackEmojiElement = {
    type: "emoji";
    name: string;
    unicode: string;
};

type SlackTextElement = {
    type: "text";
    text: string;
};

const SKIN_TONE_BY_CODEPOINT = new Map([
    ["1F3FB", 2],
    ["1F3FC", 3],
    ["1F3FD", 4],
    ["1F3FE", 5],
    ["1F3FF", 6],
]);

const slackEmojiByUnicode = new Map<string, Omit<SlackEmojiElement, "type">>();

function addSlackEmoji(entry: EmojiDataEntry, unified: string): void {
    const skinTones = unified
        .split("-")
        .map((codepoint) => SKIN_TONE_BY_CODEPOINT.get(codepoint))
        .filter((skinTone) => skinTone !== undefined);
    const name = [entry.short_name, ...skinTones.map((skinTone) => `skin-tone-${skinTone}`)].join(
        "::",
    );

    slackEmojiByUnicode.set(unified.toLowerCase(), {
        name,
        unicode: unified.toLowerCase(),
    });
}

for (const entry of emojiDataJson as EmojiDataEntry[]) {
    addSlackEmoji(entry, entry.unified);
    if (entry.non_qualified !== null) {
        addSlackEmoji(entry, entry.non_qualified);
    }
    for (const variation of Object.values(entry.skin_variations ?? {})) {
        addSlackEmoji(entry, variation.unified);
    }
}

export function toSlackEmojiElement(emoji: string): SlackEmojiElement | SlackTextElement {
    const unified = Array.from(emoji, (character) => character.codePointAt(0)?.toString(16)).join(
        "-",
    );
    const slackEmoji = slackEmojiByUnicode.get(unified);

    if (slackEmoji === undefined) {
        // 辞書より新しい絵文字でも通知全体を失敗させず、その絵文字だけUnicode表示にする。
        return { type: "text", text: emoji };
    }

    return { type: "emoji", ...slackEmoji };
}
