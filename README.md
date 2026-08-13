# 宅建GYM

宅建（宅地建物取引士）試験の学習アプリ。4択100問＋○×80問。

## ⚠️ 編集前に必ず読む：`index.html` を直接編集しない

**`index.html` は `build.sh` が `takken.html` から生成する成果物**。正本は `takken.html`。
`index.html` を直接編集すると次のビルドで**変更が消える**（2026-08-13に実際に踏んだ罠）。

```bash
# アプリ本体を変更するとき
vim takken.html   # ← 正本はこっち
./build.sh        # → index.html が生成される
```

- アプリ本体（問題データ・トップページ）＝ `takken.html` を編集 → `build.sh` を実行
- 記事・比較ページ等の独立ページ（`blog/`・`courses/`・`kaitou-sokuhou/`）＝ そのファイルを直接編集でOK
- 変更後は `sitemap.xml` と内部リンクの整合も確認する

## 公開（Vercel・安定URL）
1. GitHubで空リポジトリを作成
2. このフォルダをpush（下記）
3. https://vercel.com/new でそのリポジトリをImport → **Deploy**（設定変更不要・静的検出）
4. `https://<プロジェクト名>.vercel.app` が発行される

```bash
git remote add origin https://github.com/<ユーザー名>/takken-gym.git
git branch -M main
git push -u origin main
```

更新は上記のとおり `takken.html` を編集 → `./build.sh` → commit→push で自動再デプロイ。

## URLの正規化ルール

**正規URL＝`.html` を付けない形**（ホスティングは Cloudflare Pages）。
Cloudflare Pages が `/about.html` → `/about` へ **308** で自動リダイレクトするため、
`.html` 付きURLは常にリダイレクト元であり、canonical・sitemap に書いてはいけない。

| 種類 | 正規（200） | 書いてはいけない（308） |
|---|---|---|
| 記事 | `/blog/takken-hokaisei-2026` | `/blog/takken-hokaisei-2026.html` |
| 固定ページ | `/about` `/privacy` `/disclaimer` `/contact` | `/about.html` など |
| ディレクトリ | `/` `/courses/` `/kaitou-sokuhou/` | `/courses`（末尾スラッシュ無しは308） |

新しいページを足すときは、`<link rel="canonical">` / `og:url` / `sitemap.xml` /
内部リンク / `sw.js` の `ASSETS` を**すべて `.html` 無し**で書く。
`_redirects` の `.html` エントリは外部の古いリンク救済用なので消さない（ただし
**転送先は必ず `.html` 無しの正規URL**にする。リダイレクトの連鎖を作らないため）。

確認コマンド:
```bash
grep -rn 'href="/[^"]*\.html\|mainichi-lab\.com/[^"]*\.html' --include='*.html' --include='*.xml' --include='*.js' .
# → 何も出なければOK（go.jp等の外部リンクは href="https://... なので引っかからない）
```
