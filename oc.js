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
 *
 * 2026-09-02 追加：note リンクへの utm 自動付与（decorateNoteLinks）。
 *   9/2の初売上で「どこから来た人が買ったか」が4手段とも追えなかったため。
 *   🔴 HTML側の href には utm を書かない。ここで一元的に付ける
 *      （新しいnoteリンクを足しても自動で付く／規則を変えるときも1ファイルで済む）。
 *   規則の正本＝ ~/Desktop/claude/memory/analytics_snapshot.md
 *              「## note流入の計測（2026-09-02確立）」§utm命名規則
 */
(function () {
  /* Kindle の ASIN → GA4 に送る book の名前。載っていない ASIN は ASIN のまま送る。 */
  var BOOK_MAP = {
    B0HFW15W4R: "chinkan_jobun", // 第1弾 賃管士 条文で確かめる要点ノート（¥700・KU対象）
    B0HHMT59G2: "takken_houkaisei" // 第3弾 宅建 法改正ノート【令和8年度】（¥1,400・KDPセレクト非登録）
  };

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
        // B0HHMT59G2（第3弾・宅建 法改正ノート）は 2026-09-03 の導線設置が初出＝
        // 過去データが無いので、最初から読める名前で送る。
        send("kindle_click", {
          book: BOOK_MAP[asin] || asin,
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

      /* バリューコマース。ck. が離脱クリック用、ad. は表示計測の img なので拾わない */
      if (href.indexOf("ck.jp.ap.valuecommerce.com") > -1) {
        var v = href.match(/[?&]pid=(\d+)/);
        send("aff_click", {
          network: "vc",
          item_id: v ? v[1] : "unknown",
          from_page: from
        });
        return;
      }
    },
    true
  );

  /* ---- note リンクへの utm 付与 ----------------------------------------
   * utm_source   = takkengym（このサイト固定）
   * utm_medium   = owned_site（自社サイトからの送客。data-utm-medium で個別上書き可）
   * utm_campaign = 送客先の商品＝上の NOTE_MAP の値（note_click の product と同じ値）
   * utm_content  = 送り出したページのスラッグ（note_click の from_page と対になる）
   * ※ note側にリファラ／流入元レポートは存在しない（2026-09-02 実測で確認）。
   *   実際に読めるのは自社側の note_click イベントの方。utm は
   *   「noteが将来レポートを出した時／URLを人が見た時」のための保険として付ける。
   * -------------------------------------------------------------------- */
  var UTM_SOURCE = "takkengym";

  function pageSlug() {
    var p = location.pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
    p = p.replace(/^\/+|\/+$/g, "").replace(/[\/.]/g, "_");
    return p || "home";
  }

  function decorateNoteLinks() {
    var slug = pageSlug();
    var list = document.querySelectorAll('a[href*="note.com/fujiken818"]');
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var href = a.getAttribute("href") || "";
      if (href.indexOf("utm_source=") > -1) continue; // 二重付与しない
      var k = href.match(/\/n\/(n[0-9a-z]+)/);
      var camp = (k && NOTE_MAP[k[1]]) || "note_other";
      var med = a.getAttribute("data-utm-medium") || "owned_site";
      a.setAttribute(
        "href",
        href +
          (href.indexOf("?") > -1 ? "&" : "?") +
          "utm_source=" + UTM_SOURCE +
          "&utm_medium=" + med +
          "&utm_campaign=" + camp +
          "&utm_content=" + slug
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", decorateNoteLinks);
  } else {
    decorateNoteLinks();
  }
})();
