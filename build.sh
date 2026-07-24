#!/bin/sh
# 正本(scratchpadのtakken.html)から公開用index.htmlを生成する
SRC="$1"
[ -z "$SRC" ] && { echo "usage: build.sh <takken.html>"; exit 1; }
cat > index.html <<'HEAD'
<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="宅建試験の4択103問＋○×84問トレーナー。間隔反復で毎日つづく。ホーム画面に追加すればオフラインでも学習できます。">
<meta name="theme-color" content="#6a1fc7">
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
<meta property="og:url" content="https://takken-gym.vercel.app/">
<meta property="og:image" content="https://takken-gym.vercel.app/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
HEAD
cat "$SRC" >> index.html
cat >> index.html <<'FOOT'
<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}
</script>
</body>
</html>
FOOT
echo "built index.html ($(wc -c < index.html) bytes)"
