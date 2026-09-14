/* 宅建GYM 専用：一問一答の「分野別の達成度」（登録不要・端末内保存・送信なし）。
 * 2026-09-14 に /oc.js から分離した（中身は 2026-09-07 commit 399a496 のまま・無改変）。
 * 分離の理由＝ /oc.js は全10サイトで同一md5の計測専用ファイルに揃えるため（memory/analytics_snapshot.md
 *   「2026-09-14 oc.js の版ズレ解消」）。このファイルは計測ではないので oc.js に戻さないこと。
 * 読み込み面＝ id="tres" を持つ17面＋ハブ /ichimon/ 。🔴 編集したら sw.js の CACHE 版数を上げる。
 */
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
