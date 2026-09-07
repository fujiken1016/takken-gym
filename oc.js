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
        /* 著者ページ（/stores/author/<ID> と旧形式 /<name>/e/<ID>）は商品ページではないので
         * 別イベントで送る。2026-09-04 追加：著者ページ B0HHN73G2M の採番を実測し、
         * /about から導線を張ったため。ここで先に返さないと下の /dp/ 抽出が外れて
         * kindle_click{book:"unknown"} に落ち、Kindle本のクリック系列が汚れる。 */
        if (href.indexOf("/stores/author/") > -1 || /\/e\/B0[A-Z0-9]{8}/.test(href)) {
          send("author_click", { author: "fujikken", from_page: from });
          return;
        }
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

/* ============================================================================
 * §3 学習の進捗（登録不要・localStorage）。2026-09-07 新設。
 *
 * なぜ入れたか：ロールモデル8件を実測したところ（ROLE_MODEL_takken.md）、
 *   「学習履歴・達成度」を持つのは 宅建試験ドットコム／スタディング／オンスク／TAC の4件で、
 *   宅建GYM は一問一答17面すべてで localStorage 使用0＝結果がリロードで消えていた。
 *   宅建試験ドットコムは同じ仕組みで登録者104,500人を積んでいる（2026-09-07 実測）。
 * どこを改善したか：上記4件は**全部 会員登録が要る**。ここは登録不要・端末内のみで完結させる。
 *   送信も同期もしない（外部に出ない＝プライバシーの既存方針を崩さない）。
 *
 * 動作：
 *   A. 一問一答/クイズ面（#tres を持つ17面）＝結果パネルが出た瞬間に成績を保存する。
 *   B. ハブ /ichimon/ ＝保存済みの成績を分野ごとのメーターで表示する。
 * 設計上の注意（CLAUDE.md「非同期・共有状態の安全」）：
 *   - setTimeout を使わない。MutationObserver で #tres の hidden 属性だけを見る
 *     ＝モード切替で別画面のDOMを書きに行く経路を作らない。
 *   - localStorage が使えない環境（プライベートモード等）でも例外を投げない。UIを壊さない。
 * ========================================================================== */
(function () {
  var KEY = "tg_ichimon_v1";

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }
  function save(o) {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {
      /* 保存できなくても演習は続けられること優先 */
    }
  }
  /* 末尾スラッシュを落として鍵をそろえる（/ichimon/gyoho と /ichimon/gyoho/ を同じ扱いに） */
  function keyOf(p) {
    p = (p || location.pathname).replace(/index\.html$/, "").replace(/\.html$/, "");
    return p.length > 1 ? p.replace(/\/$/, "") : p;
  }

  /* ---- A. 結果が出たら保存する ------------------------------------------ */
  function hookResult() {
    var res = document.getElementById("tres");
    var sub = document.getElementById("rSub");
    if (!res || !sub) return;

    function label() {
      /* 結果パネルの見出し「宅建業法・一問一答の結果」から取る */
      var d = res.querySelector("div");
      var t = d ? (d.textContent || "").trim().replace(/の結果$/, "") : "";
      if (t) return t;
      var h1 = document.querySelector("h1");
      return h1 ? (h1.textContent || "").split("｜")[0].trim() : "一問一答";
    }
    /* その面の全問数。「間違えた問題だけもう一度」の周回と全問通しを区別するために要る */
    function fullCount() {
      return document.querySelectorAll("#qlist>li").length;
    }
    function record() {
      /* rSub は「24問中 18問 正解」の形。取れなければ何もしない（推測で書かない） */
      var m = (sub.textContent || "").match(/(\d+)\s*問中\s*(\d+)\s*問/);
      if (!m) return;
      var total = parseInt(m[1], 10),
        ok = parseInt(m[2], 10);
      if (!total || ok > total) return;
      var all = load();
      var k = keyOf();
      var prev = all[k] || {};
      var full = fullCount();
      /* 🔴 正答率は「全問通し」のときだけ更新する。
       * 「間違えた15問だけもう一度」で12/15を取ると、全24問の分野が80%に見えてしまい、
       * 達成度が実力より高く出る。復習周回は日付と回数だけ進める。 */
      var isFull = !full || total === full;
      var rec = {
        label: label(),
        ok: isFull ? ok : prev.ok,
        total: isFull ? total : prev.total,
        ts: Date.now(),
        runs: (prev.runs || 0) + 1
      };
      if (rec.total) {
        var rate = rec.ok / rec.total;
        rec.best = prev.best && prev.best > rate ? prev.best : rate;
      }
      /* 復習周回しかしていない面（全問通しが一度も無い）は分母が無いので保存しない */
      if (!rec.total) return;
      all[k] = rec;
      save(all);
    }

    if (!res.hidden) record();
    try {
      new MutationObserver(function () {
        if (!res.hidden) record();
      }).observe(res, { attributes: true, attributeFilter: ["hidden"] });
    } catch (e) {
      /* MutationObserver が無い環境では初回判定だけで諦める */
    }
  }

  /* ---- B. ハブで達成度を見せる ------------------------------------------ */
  /* 表示順は本試験の配点順。ラベルは保存値が無いときのフォールバック */
  var HUB = [
    ["/ichimon/gyoho", "宅建業法"],
    ["/ichimon/kenri", "権利関係"],
    ["/ichimon/horei", "法令上の制限"],
    ["/ichimon/zei", "税・その他"],
    ["/ichimon/cooling-off", "クーリング・オフ"],
    ["/ichimon/dairi", "代理"],
    ["/ichimon/hoshu", "報酬"],
    ["/ichimon/ishihyoji", "意思表示"],
    ["/ichimon/jikou", "時効"],
    ["/ichimon/kaihatsu", "開発許可"],
    ["/ichimon/kenpei-yoseki", "建蔽率・容積率"],
    ["/ichimon/nochiho", "農地法"],
    ["/ichimon/teitouken", "抵当権"]
  ];

  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getMonth() + 1 + "月" + d.getDate() + "日";
  }

  function renderHub() {
    if (keyOf() !== "/ichimon") return;
    var art = document.querySelector("article");
    if (!art) return;
    var anchor = art.querySelector("h2");
    if (!anchor) return;

    var all = load();
    var done = HUB.filter(function (r) {
      return all[r[0]] && all[r[0]].total;
    });

    var box = document.createElement("section");
    box.className = "sn";

    var html =
      '<h2 class="sn-t">あなたの達成度</h2>' +
      '<p class="sn-lead">解いた結果はこの端末の中だけに残ります。' +
      "会員登録もメールアドレスも不要で、どこにも送信していません。</p>";

    if (!done.length) {
      html +=
        '<p class="sn-note">まだ記録がありません。下の分野をひとつ解くと、' +
        "ここに正答率が残って、次に来たとき続きから復習できます。</p>";
      box.innerHTML = html;
      anchor.parentNode.insertBefore(box, anchor);
      return;
    }

    var sumOk = 0,
      sumTot = 0;
    done.forEach(function (r) {
      sumOk += all[r[0]].ok;
      sumTot += all[r[0]].total;
    });
    var overall = Math.round((sumOk / sumTot) * 100);
    html +=
      '<p class="sn-note" style="margin-bottom:10px">記録した' +
      done.length +
      "分野の合計は <b>" +
      sumTot +
      "問中 " +
      sumOk +
      "問（" +
      overall +
      "%）</b>です。</p>";

    HUB.forEach(function (r) {
      var d = all[r[0]];
      if (!d || !d.total) return;
      var rate = Math.round((d.ok / d.total) * 100);
      /* 数値は「％」だけを名前の右に置き、内訳と日付は次の行に落とす。
       * 内訳まで右に nowrap で並べると、320px で分野名の欄が潰れて1文字ずつ折れた
       *（2026-09-07 実測：行の高さが 76px→228px）。 */
      html +=
        '<a class="sn-row" href="' +
        r[0] +
        '"><span class="sn-head"><span class="sn-name">' +
        (d.label || r[1]) +
        '</span><span class="sn-val">' +
        rate +
        '%</span></span><span class="sn-meter"><i style="width:' +
        rate +
        '%"></i></span><span class="sn-sub">' +
        d.total +
        "問中 " +
        d.ok +
        "問・最後に解いたのは" +
        fmtDate(d.ts) +
        "</span></a>";
    });

    /* まだ解いていない分野も出す。「次に何をやるか」が決まらないと再訪しない */
    var yet = HUB.filter(function (r) {
      return !all[r[0]] || !all[r[0]].total;
    });
    if (yet.length) {
      /* 全部の分野名を並べると375pxで何行にも折れるので、次の1件だけを名指しする */
      html +=
        '<a class="sn-row sn-yet" href="' +
        yet[0][0] +
        '"><span class="sn-head"><span class="sn-name">次は「' +
        yet[0][1] +
        "」（未着手 あと" +
        yet.length +
        '分野）</span><span class="sn-val">解く →</span></span></a>';
    }

    html +=
      '<span class="sn-foot"><span class="sn-note">記録はこの端末のみ。' +
      "ブラウザのデータを消すと一緒に消えます。</span>" +
      '<button type="button" class="sn-clear">記録を消す</button></span>';

    box.innerHTML = html;
    anchor.parentNode.insertBefore(box, anchor);

    var btn = box.querySelector(".sn-clear");
    if (btn) {
      btn.addEventListener("click", function () {
        if (!window.confirm("この端末に保存した達成度の記録を消します。よろしいですか？")) return;
        try {
          localStorage.removeItem(KEY);
        } catch (e) {}
        /* 部分更新をせず、この節が持つ要素を丸ごと作り直す（CLAUDE.md 共有DOMの原則） */
        var p = box.parentNode;
        if (p) p.removeChild(box);
        renderHub();
      });
    }
  }

  function init() {
    hookResult();
    renderHub();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
