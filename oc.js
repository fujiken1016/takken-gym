/* 外部（収益先）への離脱クリックをGA4で実測する。2026-09-02 新設。
 *
 * 背景：8/30に入れた next_step_click は「内部回遊」しか測っておらず、
 * Kindle・note・アフィリという収益に直結する外部リンクが1本も測れていなかった。
 * 9月は判定が11件あり、うち note¥980（9/27）・note¥300（9/30）・Kindle（9/19・9/26）は
 * 「売れない」を「商品が悪い」と読むか「そもそも誰もクリックしていない」と読むかを
 * 切り分ける必要がある。その切り分けに要るのがこのイベント。
 *
 * 送るイベント：
 *   kindle_click { book, from_page }          … Amazon（Kindle商品ページ）
 *   note_click   { note_id, product, from_page } … note.com/fujiken818 の記事
 *   aff_click    { network, item_id, from_page } … A8 / 楽天アフィリ
 *
 * 注意：gtag が未ロード（広告ブロッカー等）でも例外を投げない。UIを壊さないこと優先。
 */
(function () {
  var NOTE_MAP = {
    ne2376058ec7b: "note_takken_980", // 有料¥980 宅建 直前 総点検ノート（判定 9/27）
    n7f126d2e8522: "note_ai_980", // 有料¥980 AI会社化（判定 9/29）
    ne087a09b24d4: "note_iriguchi_300", // 有料¥300 入口商品（判定 9/30）
    n50a7bb4bf933: "note_free_kubun", // 無料・区分所有法（呼び水）
    n574a0c6a6056: "note_free_nochiho" // 無料・農地法（呼び水）
  };

  function send(name, params) {
    try {
      if (window.gtag) window.gtag("event", name, params);
    } catch (e) {
      /* 計測失敗でUIを壊さない */
    }
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      var from = location.pathname;

      if (href.indexOf("amazon.co.jp") > -1) {
        var asin = href.match(/\/dp\/([A-Z0-9]{10})/);
        asin = asin ? asin[1] : "unknown";
        // B0HFW15W4R は 9/2 から chinkan 各面で "chinkan_jobun" として送っており、
        // 途中で値が変わると判定日に系列が割れるので名称を維持する。
        send("kindle_click", {
          book: asin === "B0HFW15W4R" ? "chinkan_jobun" : asin,
          from_page: from
        });
        return;
      }

      if (href.indexOf("note.com/fujiken818") > -1) {
        var k = href.match(/\/n\/(n[0-9a-z]+)/);
        var id = k ? k[1] : "unknown";
        send("note_click", {
          note_id: id,
          product: NOTE_MAP[id] || "note_other",
          from_page: from
        });
        return;
      }

      if (href.indexOf("px.a8.net") > -1) {
        send("aff_click", { network: "a8", item_id: "unknown", from_page: from });
        return;
      }

      if (href.indexOf("hb.afl.rakuten.co.jp") > -1) {
        var r = href.match(/item\.rakuten\.co\.jp%2Fbook%2F(\d+)/i);
        send("aff_click", {
          network: "rakuten",
          item_id: r ? r[1] : "unknown",
          from_page: from
        });
        return;
      }
    },
    true
  );
})();
