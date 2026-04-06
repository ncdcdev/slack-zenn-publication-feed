# slack-zenn-publication-feed

Zenn Publicationの新着記事をSlackに通知するCloudflare Worker。

5分間隔でZenn APIから記事を取得し、未通知の記事をSlack Block Kitでリッチに投稿します。KVで既読管理を行い、重複通知を防ぎます。

## Slackの投稿イメージ

![](https://github.com/user-attachments/assets/bdcd93eb-76bf-447a-a260-d6c196b712f5)

- 記事の絵文字とタイトル(リンク付き)
- トピックタグ
- 著者アイコン、著者名、投稿日

## セットアップ

### 前提

- Cloudflareアカウント
- Slack Incoming Webhook URL

### 1. KV Namespaceの作成

```sh
npx wrangler kv namespace create <任意の名前>
```

### 2. 既存記事のシード(初回配信防止)

```sh
node scripts/seed-kv.mjs <PUBLICATION_NAME> > /tmp/seed.json
npx wrangler kv bulk put --namespace-id <KV_NAMESPACE_ID> --remote /tmp/seed.json
```

### 3. Cloudflare Git連携

1. Cloudflareダッシュボード → Workers & Pages → Create → Import from GitHub
2. リポジトリを接続
3. デプロイコマンド: `npx wrangler deploy`

### 4. ダッシュボードで設定

Workers → Bindings で以下を設定:

| 変数名    | 種別         | 値                   |
| --------- | ------------ | -------------------- |
| `FEED_KV` | KV Namespace | 作成したKV Namespace |

Workers → Settings → Variables and Secrets で以下を設定:

| 変数名              | 種別     | 値                             |
| ------------------- | -------- | ------------------------------ |
| `PUBLICATION_NAME`  | Variable | Zenn Publication名(例: `ncdc`) |
| `SLACK_WEBHOOK_URL` | Secret   | Slack Incoming Webhook URL     |

### 5. 動作確認

Workers → Observability → Invocation Logで実行ログを確認できます。

## 開発

```sh
npm install
npm run dev
# 別ターミナルで
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

ローカル開発時は`.dev.vars`に変数を設定:

```
PUBLICATION_NAME=ncdc
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
```

## License

[MIT](LICENSE)
