// 運用ドキュメント(.md)と設定ファイルを公開URLから遮断する。
// 背景（2026-08-30 実測）：CF Pages は静的アセットが _redirects より優先されるため、
// _redirects の 404 ルール（明示パス・splat とも）でもドット始まりディレクトリ退避でも
// 既存ファイルを404にできなかった。Functions は静的配信より先に走るのでここで止める。
// 対象パスは _routes.json の include で限定しているため、通常ページはFunctionsを経由しない。
export const onRequest = async (context) => {
  const { pathname } = new URL(context.request.url);
  if (/\.md$/i.test(pathname) || pathname === "/vercel.json" || pathname.startsWith("/.github/")) {
    return new Response("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" },
    });
  }
  return context.next();
};
