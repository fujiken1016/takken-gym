#!/bin/sh
# 公開用 index.html を takken.html(正本) から生成する。引数省略時は同ディレクトリの takken.html。
DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="${1:-$DIR/takken.html}"
[ -f "$SRC" ] || { echo "source not found: $SRC"; exit 1; }
cat > "$DIR/index.html" <<'HEAD'
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="宅建試験の4択103問＋○×84問トレーナー。間隔反復で毎日つづく。ホーム画面に追加すればオフラインでも学習できます。">
<meta name="theme-color" content="#6a1fc7">
<link rel="canonical" href="https://takken.mainichi-lab.com/">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="宅建GYM">
<meta name="mobile-web-app-capable" content="yes">
<meta property="og:type" content="website">
<meta property="og:site_name" content="宅建GYM">
<meta property="og:title" content="宅建GYM — スキマ時間で、宅建に受かる。">
<meta property="og:description" content="4択103問＋○×84問。間違えた問題は自動で復習に回る間隔反復つき。本試験形式の模試も。">
<meta property="og:url" content="https://takken.mainichi-lab.com/">
<meta property="og:image" content="https://takken.mainichi-lab.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<!--GA4-->
</head>
<body>
HEAD
cat "$SRC" >> "$DIR/index.html"
cat >> "$DIR/index.html" <<'FOOT'
<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
</script>
</body>
</html>
FOOT
echo "built $DIR/index.html ($(wc -c < "$DIR/index.html") bytes)"
