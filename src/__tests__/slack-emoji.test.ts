import { describe, expect, it } from "vitest";
import { toSlackEmojiElement } from "../slack-emoji";

describe("toSlackEmojiElement", () => {
    it("Unicode絵文字をSlack絵文字要素に変換する", () => {
        expect(toSlackEmojiElement("🦁")).toEqual({
            type: "emoji",
            name: "lion_face",
            unicode: "1f981",
        });
    });

    it("スキントーンをSlack絵文字名に含める", () => {
        expect(toSlackEmojiElement("👋🏽")).toEqual({
            type: "emoji",
            name: "wave::skin-tone-4",
            unicode: "1f44b-1f3fd",
        });
    });

    it("辞書にない文字列はテキスト要素にする", () => {
        expect(toSlackEmojiElement("独自絵文字")).toEqual({
            type: "text",
            text: "独自絵文字",
        });
    });
});
