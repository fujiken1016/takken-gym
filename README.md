# 宅建GYM

宅建（宅地建物取引士）試験の学習アプリ。4択103問＋○×84問。

## ⚠️ `/ichimon/` は index.html の OXQ を写している（同期が必要）

`/ichimon/{gyoho,kenri,horei,zei}` は分野別の一問一答ページで、問題文・答え・解説は
`index.html` の `const OXQ=[...]` から**分野で絞って複製したもの**（分野別クエリを拾うためのSEO分割）。
静的な `<ol id="qlist">` がHTMLに出ており、そこからページ内のJSがトレーニングを組み立てる。

**`index.html` の OXQ を編集したら、対応する `/ichimon/*.html` の該当問題も直すこと。**
片方だけ直すと、同じ問題が2つのURLで違う答えを返す。問題数も各ページの title / description /
見出し（「○×24問」等）に埋め込んであるので、増減させたときはそこも合わせる。

## 編集のしかた（ビルド不要・2026-08-13にビルド廃止）

**全ページが直接編集**。生成ステップは無い。

- アプリ本体（問題データ・トップページ）＝ `index.html` を直接編集
- 記事・比較ページ等（`blog/`・`courses/`・`kaitou-sokuhou/`）＝ そのファイルを直接編集
- 変更後は `sitemap.xml` と内部リンクの整合も確認する

> 以前は `takken.html`（正本）＋ `build.sh` → `index.html`（生成物）の2ファイル構成だった。
> しかし後述のとおりリポジトリ直下＝公開ディレクトリなので、正本の `takken.html` が
> `https://takken.mainichi-lab.com/takken` として**そのまま配信されていた**（`<head>` 無しの
> 不完全なHTML＝トップページの重複コンテンツ）。`build.sh` の中身は静的な `<head>`/`<script>` を
> 前後に足すだけだったので、それを `index.html` に取り込み、`takken.html` と `build.sh` を削除した。

## 公開（Cloudflare Pages）

`main` に push すると自動再デプロイ。**ビルドコマンドは無し／公開ディレクトリ＝リポジトリ直下**。

### ⚠️ `vercel.json` は消さない（Vercelも今なお自動デプロイしている）

移行前の Vercel プロジェクトが **GitHub連携のまま生きており**、`main` への push ごとに
`takken-gym.vercel.app` へも同時デプロイされている（GitHub の Deployments に `vercel[bot]` の
記録が毎コミット残る）。`vercel.json` はその旧URLを全パス **308** で
`takken.mainichi-lab.com` へ転送するためだけに存在する。

**これを消すと、次の push で `takken-gym.vercel.app` がサイト全文をそのまま配信し始め、
ドメイン丸ごとの重複コンテンツになる。** 現ホスティングが Cloudflare Pages だからといって
「未使用ファイル」として削除しないこと。

根本的に外したいなら、先に Vercel 側でプロジェクトを削除（またはGitHub連携を解除）し、
`takken-gym.vercel.app` が消えたことを確認してから `vercel.json` を消す。

確認コマンド:
```bash
curl -sI https://takken-gym.vercel.app/ | grep -iE '^HTTP|location'
# → 308 / location: https://takken.mainichi-lab.com/ ならリダイレクトは生きている
```

## ⚠️ ソースファイル・非公開ファイルの置き場所

**リポジトリ直下＝そのまま公開ディレクトリ**。つまり
**コミットしたファイルは原則すべてURLとして生きる**（`/build.sh` も `/README.md` も200を返していた）。
Cloudflare Pages にはアップロード除外の仕組み（`.assetsignore` 等）が無く、
出力ディレクトリを分ける以外に「リポジトリにあるが配信しない」を作る方法が無い。

したがってこのリポジトリのルールは：

1. **「配信したくないファイル」はコミットしない**。中間生成物・正本ソース・下書きHTMLを
   リポジトリ内に置かない（`src/` に移しても `/src/...` で配信されるので無意味）。
2. **HTMLは1ファイル＝1公開URL**。「これは正本だから公開されない」は成立しない。
   ページの元ネタが欲しくなったら、別ファイルを作らず git の履歴を使う。
3. 運用ドキュメント（`*.md`）は履歴を残したいのでコミットしたままにし、
   `_headers` の `X-Robots-Tag: noindex` で**検索インデックスからだけ外す**。
   新しい `.md` を足すときは `_headers` を確認する（`/*.md` で一括指定済み）。
4. どうしても公開ディレクトリを分けたくなったら、全サイトファイルを `public/` に移し
   `wrangler.toml` の `pages_build_output_dir` を設定する（未実施・要検討）。

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

廃止した `takken.html` の跡地 `/takken` `/takken.html` は、`_redirects` で `/` へ **301**
（中身がトップページと同一だったため、404ではなく正規URLへ寄せて重複を解消する）。
同種のファイルを消すときも、URLは消さず正規URLへ301すること。

確認コマンド:
```bash
grep -rn 'href="/[^"]*\.html\|mainichi-lab\.com/[^"]*\.html' --include='*.html' --include='*.xml' --include='*.js' .
# → 何も出なければOK（go.jp等の外部リンクは href="https://... なので引っかからない）
```

## /chikaradameshi/（宅建 力試し）のデータについて
- `chikaradameshi/index.html` 内の問題データ（POOL）は **`ichimon/{gyoho,kenri,horei,zei}.html` の qlist が正本**で、そこから抽出して埋め込んだ生成物（2026-08-30時点の84問）。
- ichimon側の問題・解説を修正したら、chikaradameshi側のPOOLも同じ内容に更新すること（qlistの `data-a`／`.q`／`.exp` を正規表現抽出→JSON化して `var POOL=` を差し替え）。

## /chinkan/chikaradameshi/（賃管士 力試し）のデータについて
- `chinkan/chikaradameshi/index.html` 内の問題データ（POOL）は **`chinkan/ichimon/index.html` の qlist が正本**で、そこから抽出して埋め込んだ生成物（2026-08-30時点の30問。gyoho=管理業法13・sub=サブリース6・chintai=民法+借地借家法11にグループ化）。
- ichimon側の問題・解説を修正したら、こちらのPOOLも同じ内容に更新すること（qlistの `data-a`／`data-cat`／`data-law`／`.q`／`.exp` を正規表現抽出→JSON化して `var POOL=` を差し替え）。
- 換算得点は12問の正答率×50の単純換算（賃管士は分野別の公式配点が非公表のため）。判定境界：S≥42／A≥35／B≥27／C。
