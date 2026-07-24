# 宅建GYM

宅建（宅地建物取引士）試験の学習アプリ。4択100問＋○×80問。単一の静的HTML（`index.html`）。

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

更新したら `index.html` を差し替えてcommit→pushするだけで自動再デプロイ。
