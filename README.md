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
