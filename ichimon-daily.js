/* 宅建GYM 一問一答：「今日の10問」＋「連続日数」。2026-09-14 新設（LAB-01/LAB-04）。
 *
 * なぜ：ロールモデル7件（memory/ROLE_MODEL_tools.md）のうち4件以上が持ち、一問一答14面に無かったのが
 *   「今日の分」と「連続日数」。雀トレ /drill の「今日の1問」と同じ型（登録なし・端末内保存・自動で進まない）。
 * どこに出すか：
 *   A. ハブ /ichimon/ ＝本体（日付で決まる10問を、全11分野の○×から出題）
 *   B. 分野ページ13面 ＝結果パネルの直後に「今日の10問」への1行リンクだけ
 *   🔴 表示はすべてこのJSで描く＝静的HTMLの文章を増やさない（AdSense再審査中のニアデュープ対策）。
 * 計測（GA4・oc.js と同じ送り方＝gtag が無くても例外を投げない）：
 *   daily_set_start { set_no, mode: first|resume|replay, from_page }  … 問題を読み込めて出題を始めた時
 *   daily_set_clear { set_no, from_page }                            … その日の10問を初めて解き終えた時（1日1回）
 *   🔴 イベント名は memory/recommendation_ledger.md の10/19判定（daily_set_start）と揃えてある。変えない。
 *   成績（正答数）は送らない＝「記録はどこにも送信しない」既存方針を崩さない。
 * 日替わりの選び方（memory/lessons_learned.md 2026-09-14-07）：
 *   `通算日 % 配列長` は使わない。通し位置 (日×10+k) を、配列長と互いに素な歩幅で並べ替えて取る
 *   ＝ceil(n/10)日で全問に1回ずつ届き、同じ分野が固まって続かない。歩幅は実行時に再計算する。
 * 非同期の安全（~/.claude/CLAUDE.md）：読み込みは世代番号でガード。setTimeout は使わない。
 *   出題・結果・カードの切替では、この部品が持つ要素を全部描き直す。
 * 🔴 編集したら sw.js の CACHE 版数を上げる（JSはキャッシュ優先で配信される）。
 */
(function () {
  var KEY = "tg_daily10_v1";
  var EPOCH = "2026-09-14"; // この日を第1回とする
  var PER_DAY = 10;
  /* ○×形式の分野だけ（計算して選ぶ hoshu / kenpei-yoseki は形式が違うので入れない） */
  var FIELDS = [
    ["/ichimon/gyoho", "宅建業法"],
    ["/ichimon/kenri", "権利関係"],
    ["/ichimon/horei", "法令上の制限"],
    ["/ichimon/zei", "税・その他"],
    ["/ichimon/cooling-off", "クーリング・オフ"],
    ["/ichimon/dairi", "代理"],
    ["/ichimon/ishihyoji", "意思表示"],
    ["/ichimon/jikou", "時効"],
    ["/ichimon/kaihatsu", "開発許可"],
    ["/ichimon/nochiho", "農地法"],
    ["/ichimon/teitouken", "抵当権"]
  ];

  /* ---- 日付 ---------------------------------------------------------------- */
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function dayIndex(key) {
    var p = key.split("-");
    return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  }
  function setNo(key) {
    return dayIndex(key) - dayIndex(EPOCH) + 1;
  }
  function jpDate(key) {
    var p = key.split("-");
    return +p[1] + "月" + +p[2] + "日";
  }

  /* ---- 保存 ---------------------------------------------------------------- */
  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || "{}");
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }
  function save(o) {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {
      /* 保存できなくても解けること優先 */
    }
  }
  function send(name, params) {
    try {
      if (window.gtag) window.gtag("event", name, params);
    } catch (e) {}
  }
  /* 表示用の連続日数：最後に解いた日が今日か昨日でなければ、途切れているので0と見せる */
  function liveStreak(st, today) {
    if (!st.last) return 0;
    var gap = dayIndex(today) - dayIndex(st.last);
    return gap <= 1 ? st.streak || 0 : 0;
  }

  /* ---- 日替わりの10問 ------------------------------------------------------ */
  function gcd(a, b) {
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  function strideOf(n) {
    var s = Math.max(1, Math.round(n * 0.618));
    while (n > 1 && gcd(s, n) !== 1) s++;
    return s;
  }
  function pick(n, key) {
    var d = dayIndex(key) - dayIndex(EPOCH);
    var s = strideOf(n),
      out = [];
    for (var k = 0; k < Math.min(PER_DAY, n); k++) {
      var pos = (((d * PER_DAY + k) % n) + n) % n;
      out.push((pos * s) % n);
    }
    return out;
  }
  window.__daily10pick = pick; // 検算用（コンソールから n日回して全問に届くかを見る）

  /* ---- 分野ページから問題を読む -------------------------------------------- */
  function parsePage(html, field) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var lis = doc.querySelectorAll("#qlist>li");
    var out = [];
    for (var i = 0; i < lis.length; i++) {
      var li = lis[i],
        a = li.getAttribute("data-a");
      if (a !== "0" && a !== "1") continue;
      var q = li.querySelector(".q"),
        e = li.querySelector(".exp");
      if (!q || !e) continue;
      e = e.cloneNode(true);
      var an = e.querySelector(".ans");
      if (an && an.parentNode) an.parentNode.removeChild(an);
      out.push({ id: field[0] + "#" + i, u: field[0], f: field[1], q: q.textContent.trim(), a: a === "1", exp: e.textContent.trim() });
    }
    return out;
  }
  function fetchPool() {
    return Promise.all(
      FIELDS.map(function (f) {
        return fetch(f[0], { credentials: "same-origin" }).then(function (r) {
          if (!r.ok) throw new Error(f[0] + " " + r.status);
          return r.text().then(function (h) {
            return parsePage(h, f);
          });
        });
      })
    ).then(function (lists) {
      return [].concat.apply([], lists);
    });
  }

  /* ---- 見た目（既存トークンと既存の出題部品 .tr/.tbtns/.tnext を使う） ------ */
  var CSS =
    ".d10 .d10-no{font-size:0.9375rem;color:var(--muted);line-height:1.85;margin:0}" +
    ".d10-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:0;list-style:none}" +
    ".d10-chips li{font-size:0.9375rem;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:0;line-height:1.3}" +
    ".d10-chips b{color:var(--brand2);font-size:1.0625rem;margin:0 2px}" +
    ".d10 .d10-msg{font-size:0.9375rem;color:var(--muted);line-height:1.85;margin:12px 0 0}" +
    ".d10 .tr{margin:12px 0 0;padding:0;border:0;background:transparent}" +
    ".d10 .d10-fld{font-size:0.9375rem;color:var(--muted);font-weight:700;line-height:1.3;margin:12px 0 0}" +
    ".d10 .tq{margin-top:4px}" +
    ".d10 .d10-go{display:block;font-weight:700;color:var(--brand2);text-decoration:none;padding:12px 0;min-height:48px;line-height:1.85;font-size:1.0625rem}" +
    ".d10e{margin:12px 0 0}" +
    ".d10e a{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:48px;padding:8px 16px;" +
    "background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--brand);border-radius:12px;" +
    "text-decoration:none;color:var(--brand2);font-weight:700;font-size:1.0625rem;line-height:1.35}" +
    ".d10e .d10e-s{font-size:0.9375rem;color:var(--muted);white-space:nowrap}";
  function addCss() {
    if (document.getElementById("d10css")) return;
    var s = document.createElement("style");
    s.id = "d10css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function pathKey() {
    var p = location.pathname.replace(/index\.html$/, "").replace(/\.html$/, "");
    return p.length > 1 ? p.replace(/\/$/, "") : p;
  }

  /* ---- B. 分野ページ：結果パネルの直後に1行リンク ------------------------- */
  function renderEntry() {
    var res = document.getElementById("tres");
    if (!res || !res.parentNode || document.getElementById("d10e")) return;
    var st = load(),
      today = dayKey(),
      n = liveStreak(st, today);
    var sub = st.last === today ? "今日は解いた" : n ? "連続" + n + "日" : "日替わり";
    var p = document.createElement("p");
    p.className = "d10e";
    p.id = "d10e";
    p.innerHTML = '<a href="/ichimon/#daily10">▸ 今日の10問（全分野から）<span class="d10e-s">' + sub + "</span></a>";
    res.parentNode.insertBefore(p, res.nextSibling);
  }

  /* ---- A. ハブ：本体 ------------------------------------------------------ */
  function renderHub() {
    var art = document.querySelector("article");
    if (!art) return;
    var h2 = art.querySelector(":scope > h2");
    var before = art.querySelector(":scope > .sn") || h2;
    if (!before) return;

    var box = document.createElement("section");
    box.className = "sn d10";
    box.id = "daily10";
    before.parentNode.insertBefore(box, before);

    var gen = 0; // 読み込みの世代。古い読み込みの結果で画面を書き換えない
    var pool = null;
    var S = null; // 出題中の状態 {date, items, i, ok, mode}
    var locked = false;

    function card() {
      gen++;
      S = null;
      var st = load(),
        today = dayKey(),
        run = st.run && st.run.date === today ? st.run : null;
      var n = liveStreak(st, today);
      var doneToday = st.last === today;
      var html =
        '<h2 class="sn-t">今日の10問</h2>' +
        '<p class="d10-no">' + jpDate(today) + "・第" + setNo(today) + "回（全" + FIELDS.length + "分野の○×から日替わり）</p>" +
        '<ul class="d10-chips"><li>連続<b>' + n + "</b>日</li><li>最高<b>" + (st.best || 0) + "</b>日</li></ul>";
      var label;
      if (doneToday) {
        html += '<p class="d10-msg">今日の10問は解き終わりました（' + (st.lastOk != null ? st.lastOk + "問正解" : "記録済み") + "）。次は明日0時に切り替わります。</p>";
        label = "今日の10問をもう一度解く";
      } else if (run && run.i > 0) {
        label = "続きから解く（第" + (run.i + 1) + "問から）";
      } else {
        label = "今日の10問を解く";
      }
      html += '<button type="button" class="tnext" id="d10start">' + label + "</button>";
      html += '<p class="d10-msg" id="d10err" hidden></p>';
      box.innerHTML = html;
      var btn = box.querySelector("#d10start");
      btn.addEventListener("click", function () {
        start(doneToday ? "replay" : run && run.i > 0 ? "resume" : "first");
      });
    }

    function start(mode) {
      var btn = box.querySelector("#d10start");
      if (!btn || btn.disabled) return; // 連打防止
      btn.disabled = true;
      btn.textContent = "問題を読み込み中…";
      var my = ++gen;
      var p = pool ? Promise.resolve(pool) : fetchPool();
      p.then(function (list) {
        if (my !== gen) return; // 途中で描き直された
        if (list.length < PER_DAY) throw new Error("pool " + list.length);
        pool = list;
        var today = dayKey();
        var items = pick(list.length, today).map(function (i) {
          return list[i];
        });
        var st = load();
        var i = 0,
          ok = 0;
        if (mode === "resume" && st.run && st.run.date === today && st.run.ids && st.run.ids.join() === items.map(function (x) { return x.id; }).join()) {
          i = st.run.i;
          ok = st.run.ok;
        } else if (mode === "resume") {
          mode = "first"; // 問題の中身が変わっていたら最初から
        }
        S = { date: today, items: items, i: i, ok: ok, mode: mode, wrong: [] };
        if (mode !== "replay") persist();
        send("daily_set_start", { set_no: setNo(today), mode: mode, from_page: location.pathname });
        if (S.i >= items.length) finish(); // 10問目に答えた直後に離脱していた
        else question();
      }).catch(function () {
        if (my !== gen) return;
        btn.disabled = false;
        btn.textContent = "もう一度読み込む";
        var err = box.querySelector("#d10err");
        if (err) {
          err.textContent = "問題を読み込めませんでした。通信状態を確かめてから、もう一度押してください。";
          err.hidden = false;
        }
      });
    }

    function persist() {
      if (!S || S.mode === "replay") return; // 解き直しは記録を変えない
      var st = load();
      st.run = { date: S.date, ids: S.items.map(function (x) { return x.id; }), i: S.i, ok: S.ok };
      save(st);
    }

    function question() {
      locked = false;
      var c = S.items[S.i],
        total = S.items.length;
      box.innerHTML =
        '<h2 class="sn-t">今日の10問</h2>' +
        '<div class="tr"><div class="tbar"><span>第 <b>' + (S.i + 1) + "</b> / " + total + " 問</span><span>正解 <b>" + S.ok + "</b></span></div>" +
        '<div class="tmeter"><i style="width:' + Math.round((S.i / total) * 100) + '%"></i></div>' +
        '<p class="d10-fld">' + esc(c.f) + "</p>" +
        '<p class="tq">' + esc(c.q) + "</p>" +
        '<div class="tbtns"><button type="button" data-v="1">○ 正しい</button><button type="button" data-v="0">× 誤り</button></div>' +
        '<div class="tfb" hidden aria-live="polite"><div class="tjudge"></div><p class="texp"></p>' +
        '<button type="button" class="tnext">' + (S.i + 1 >= total ? "結果を見る →" : "次の問題へ →") + "</button></div></div>";
      var bs = box.querySelectorAll(".tbtns button");
      for (var k = 0; k < bs.length; k++) {
        bs[k].addEventListener("click", function (e) {
          answer(e.currentTarget.getAttribute("data-v") === "1");
        });
      }
      box.querySelector(".tfb .tnext").addEventListener("click", next);
    }

    function answer(v) {
      if (locked || !S) return; // 二重回答の防止
      locked = true;
      var c = S.items[S.i],
        hit = v === c.a;
      if (hit) S.ok++;
      else S.wrong.push(c);
      var bs = box.querySelectorAll(".tbtns button");
      for (var k = 0; k < bs.length; k++) {
        var bv = bs[k].getAttribute("data-v") === "1";
        bs[k].disabled = true;
        if (bv === c.a) bs[k].className = "right";
        else if (bv === v) bs[k].className = "bad";
      }
      var j = box.querySelector(".tjudge");
      j.textContent = hit ? "◯ 正解！" : "✕ 不正解";
      j.className = "tjudge " + (hit ? "ok" : "ng");
      box.querySelector(".texp").textContent = "正解は「" + (c.a ? "○ 正しい" : "× 誤り") + "」。" + c.exp;
      box.querySelector(".tbar span:last-child b").textContent = S.ok;
      box.querySelector(".tmeter i").style.width = Math.round(((S.i + 1) / S.items.length) * 100) + "%";
      box.querySelector(".tfb").hidden = false;
      /* 答えた時点で「次の問題から」を保存＝解説を読む前に閉じても、戻ると続きから */
      S.i++;
      persist();
      S.i--;
    }

    function next() {
      if (!S || !locked) return;
      if (S.i + 1 >= S.items.length) return finish();
      S.i++;
      question();
    }

    function finish() {
      var st = load();
      var first = S.mode !== "replay" && st.last !== S.date;
      if (first) {
        var gap = st.last ? dayIndex(S.date) - dayIndex(st.last) : 99;
        st.streak = gap === 1 ? (st.streak || 0) + 1 : 1;
        st.best = Math.max(st.best || 0, st.streak);
        st.last = S.date;
        st.lastOk = S.ok;
        send("daily_set_clear", { set_no: setNo(S.date), from_page: location.pathname });
      }
      if (S.mode !== "replay") delete st.run;
      save(st);
      var total = S.items.length,
        rate = Math.round((S.ok / total) * 100);
      var html =
        '<h2 class="sn-t">今日の10問の結果</h2>' +
        '<div class="tr tres"><div class="big">' + rate + "%</div>" +
        '<p class="d10-no">' + total + "問中 " + S.ok + "問 正解" + (S.mode === "replay" ? "（解き直し・記録は変わりません）" : "") + "</p>" +
        '<ul class="d10-chips" style="justify-content:center"><li>連続<b>' + liveStreak(st, dayKey()) + "</b>日</li><li>最高<b>" + (st.best || 0) + "</b>日</li></ul></div>";
      /* 間違えた分野だけ、その分野ページへの入口を出す（同じ分野は1回だけ） */
      var seen = {},
        links = "";
      S.wrong.forEach(function (c) {
        if (seen[c.u]) return;
        seen[c.u] = 1;
        links += '<a class="d10-go" href="' + c.u + '">▸ ' + esc(c.f) + "の一問一答で復習する</a>";
      });
      html += links;
      html += '<button type="button" class="tnext" id="d10close">閉じる</button>';
      S = null;
      box.innerHTML = html;
      box.querySelector("#d10close").addEventListener("click", function () {
        card();
        box.scrollIntoView({ block: "start" });
      });
    }

    card();
    if (location.hash === "#daily10") box.scrollIntoView({ block: "start" });
  }

  function init() {
    addCss();
    if (pathKey() === "/ichimon") renderHub();
    else renderEntry();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
