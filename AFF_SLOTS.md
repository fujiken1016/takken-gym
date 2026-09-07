# AFF_SLOTS — アフィリエイトスロット一覧

全収益リンクは `data-aff="スロット名"` 属性で識別できる。リンク差し替え時はこの表を正とする。
※ A8の5社・楽天3枠・バリューコマース1枠は**提携済みの実リンクが既に挿入済み**（プレースホルダではない）。差し替えが必要になるのは「リンク切れ」「プログラム終了」「EPCの高い別案件への変更」時のみ。
※ リンクURLそのものの正本は `~/Desktop/claude/affiliate_links.md`。**このファイルは「どのスロットがどのページに実在するか」の正本**。
※ 実態確認コマンド：`grep -rno 'data-aff="[^"]*"' --include='*.html' .`（最終確認 **2026-09-02**・本番HTMLを全42URLでcurl実測して照合）

## 現況サマリ（実測）

| ページ | 収益スロット数 | 内訳 |
|---|---|---|
| `/courses/` | 9 | A8×5・楽天×3・VC×1 |
| `/`（index.html） | 2（JSで動的生成） | A8_ONSUKU（ホーム）・A8_YOTSUYA（演習結果） |
| `/kaitou-sokuhou/` | 1 | A8_YOTSUYA |
| `/chinkan/`（ハブ index.html） | 1 | VC×1（VC_LEC_CHINKAN・§8「独学で走りきれないときの選択肢（講座）」） |
| `/blog/takken-ochita-revenge` | **5** | VC_LEC・A8_YOTSUYA・A8_SQUARE・A8_SMART・A8_ONSUKU（**この記事だけ例外**。リベンジ層向けの「再受講割引6社比較」がページの主目的で、集約先へ送らずその場で比較させる設計。commit 0d9a688。PR表記・`rel="nofollow sponsored noopener"` とも設置済み） |
| `/blog/` の他12記事・`/chinkan/` サブ5ページ | **0** | 記事本文に収益リンクは無い。`/courses/` および `/chinkan/#kouza` へのテキスト誘導のみ |
| `/blog/`（記事一覧ページ） | 0 | AdSenseのみ。`/courses/` へのリンクあり |
| `/ichimon/`＋論点別13本・`/toujitsu-check/`・`/toukei-quiz/`・`/chikaradameshi/`・`/chinkan/ichimon/`・`/chinkan/chikaradameshi/`・`/kaitou-sokuhou/` | **ASP 0**（`/kaitou-sokuhou/` のみ A8_YOTSUYA 1本） | 無料ツール群。**ASPリンクは足さない**（集約先＝`/courses/`・`/chinkan/#kouza` に送る設計を維持）。⚠️ **自社教材リンクは別扱い＝2026-09-07 に全20面へ設置完了**。この行は 2026-09-02 時点で「自社教材リンクとも無し」と書いていたが実態と違っていた（9/3〜9/5 のデザイン是正コミットで18面には既に入っていた）。9/7 に本番20URLをcurl実測して欠けていた2面（`/ichimon/` ハブ・`/kaitou-sokuhou/`）へ設置（commit 2f7e162）。内訳＝宅建面は note ¥980「直前 総点検ノート」`ne2376058ec7b`／`/ichimon/zei` と `/chikaradameshi/` は加えて note ¥300 `ne087a09b24d4`／賃管士面（`/chinkan/*`）は資格が違うので宅建教材を送らず Kindle `B0HFW15W4R`。`/kaitou-sokuhou/` だけは試験前後で読者が入れ替わるため、1枠の中で「試験前の人＝note ¥980／採点後で11/15賃管士に申込済みの人＝Kindle `B0HFW15W4R`」と状態ラベルで分けた |

## A8.net（講座5社）

| スロット名 | 掲載箇所 | リンク種別（A8プログラム） | 現在のa8mat |
|---|---|---|---|
| A8_YOTSUYA | `/courses/`（比較1位カード）・`index.html` 演習結果画面・`/kaitou-sokuhou/` | 四谷学院 通信講座（資料請求） | 4B9XTF+CPUEIQ+5IEI+5ZMCH |
| A8_SQUARE | `/courses/` | 資格スクエア | 4B9XTF+CSTKJM+373C+7CX1E |
| A8_SMART | `/courses/` | SMART合格講座（全日本情報学習振興協会） | 4B9XTF+CTF05E+4LOQ+60OXE |
| A8_ONSUKU | `/courses/`・`index.html` ホーム画面 | オンスク.JP（ウケホーダイ） | 4B9XTF+CR19QA+408S+5YRHE |
| A8_TAISAKU | `/courses/`（補足セクション。料金・申込受付期間が公式ページで確認できないため比較表には入れない） | 資格対策ドットコム 宅建士eラーニング講座（素材ID 065・着地 shikakutaisaku.com/personal/takken.html） | 4B9XTF+CQFU4I+3L4C+6C9LE |

- `index.html` 内は JS の `A8` オブジェクト（`const A8={...}`、約1079行）が正本。`adCard()` が `data-aff="A8_<KEY大文字>"` を自動付与するため、grepでは `data-aff="A8_'+k.toUpperCase()+'"` としか出ない点に注意。
- `A8` オブジェクトには `yotsuya` / `square` / `onsuku` / `smart` の**4キーが定義されているが、実際に `adCard()` で描画されるのは `onsuku`（ホーム）と `yotsuya`（演習結果）の2つだけ**。`square` / `smart` は定義のみで未使用（枠を増やすときの予備）。
- 各リンク直後の `0.gif` インプレッションピクセル（`www10`〜`www18` サブドメイン）もセットで差し替えること。

## バリューコマース（LEC東京リーガルマインド）

| スロット名 | 掲載箇所 | リンク種別 | 現在のリンク |
|---|---|---|---|
| VC_LEC | `/courses/`（比較表内・四谷学院の次のカード） | LEC東京リーガルマインド 商品販売キャンペーン（プログラムID 2044599／報酬 商品購入1.1%） | `ck.jp.ap.valuecommerce.com/servlet/referral?sid=3777672&pid=892677873&vc_url=...www.lec-jp.com%2Ftakken%2F` |
| VC_LEC_CHINKAN | `/chinkan/`（§8「独学で走りきれないときの選択肢（講座）」＝`#kouza`） | 同一プログラム（賃貸不動産経営管理士講座へ着地。2026-08-30 新設） | `ck.jp.ap.valuecommerce.com/servlet/referral?sid=3777672&pid=892677873&vc_url=...www.lec-jp.com%2Fchintai%2F` |

- VCサイトID `3777672`（宅建GYM）。**pid `892677873` はMyLinkで作った現行呼称版**。旧素材 pid `892677870` は文言が旧称「宅地建物取引主任者」なので**使わない**。
- `gifbanner`（1x1計測）とセット。`href` と `gifbanner` の形は変更しない。MyLinkコードはVC側に保存されないため、作り直す場合は `affiliate_links.md` の手順を参照。
- リスティング不可・ITP対応。掲載している講座料金は lec-jp.com の実測値で、**年1回は要確認**（年度で価格改定される）。
- **2枠は同じ sid / pid で、遷移先（`vc_url`）だけが違う**。宅建＝`/takken/`、賃管士＝`/chintai/`。pid は広告スペース単位なので分ける必要はない。
- 🔴 **資料請求は成果対象外**（プログラム詳細に「資料請求¥110」の記載があるがコメントで対象外とされている）。成果条件は**商品購入 税込1.1%・入金確認ベース**のみなので、**どちらの枠でも「資料請求で報酬が出る」旨を書かない**。
- 着地は**講座紹介ページ**（`lec-jp.com/...`）を維持する。オンラインショップ（`online.lec-jp.com`）の商品ページへ直リンクしない。
- 賃管士側の掲載値（コース回数・価格・割引）は 2026-08-30 実測。**価格は lec-jp.com には無く、`online.lec-jp.com/shop/goods/{100266461|100266465|100266456}/` でしか取れない**（cp932デコードが必要）。詳細は `~/Desktop/claude/affiliate_links.md` の 2026-08-30 追記節。

## 楽天アフィリエイト（独学派向けテキスト）

| スロット名 | 掲載箇所 | 商品 | 現在のリンク先 |
|---|---|---|---|
| RAKUTEN_TEXT1 | `/courses/` 書籍セクション | 2026年度版 みんなが欲しかった！宅建士の教科書 | `item.rakuten.co.jp/book/18387271/` |
| RAKUTEN_TEXT2 | `/courses/` 書籍セクション | 同 論点別過去問題集 | `item.rakuten.co.jp/book/18387273/` |
| RAKUTEN_TEXT3 | `/courses/` 書籍セクション | 同 一問一答式過去問題集 | `item.rakuten.co.jp/book/18387272/` |

- 宅建GYMの楽天アフィリエイトID：`56850cef.fb24df26.56850cf0.369d6934`。**IDはサイト単位で発行されるので他サイトのものと統一しない**（成果の帰属がズレる）。
- 形式：`https://hb.afl.rakuten.co.jp/hgc/{ID}/?pc={URLエンコードした商品URL}&m={同}`
- **検索結果ページ（`search.rakuten.co.jp`）へのリンクは新規に作らない**（CVRが低い）。2026-08-12に商品ページ直リンクへ差し替え済み。
- 宅建の3冊は**毎年10月前後に翌年度版が出る**ので、年1回の貼り替えが必要。

## 審査中（通過したら `/courses/` の「審査中」セクションをカードに昇格）

| 予定スロット名 | リンク種別 |
|---|---|
| A8_STUDYING | スタディング 宅建講座（A8審査中・申込 2026/08/04〜。2026-08-30時点も申込中） |
| A8_AGAROOT | アガルート 宅建講座（**未提携**。A8の参加中/申込中/解除のいずれにも無し＝否認済み。2026-08-30実査） |
| A8_FORESIGHT | フォーサイト 宅建講座（A8審査中・申込 2026/08/04〜。2026-08-30時点も申込中） |

- バリューコマースの宅建GYMサイト審査は**通過済み**（VC_LEC として掲載中）。

## 未収益化の枠（伸ばすならここ）

- `/blog/` の記事12本と `/chinkan/` のサブ5ページには `data-aff` が1つも無い。AdSense（`ca-pub-8289616283786904`）とテキスト誘導のみ。
- 記事から直接A8/VCを踏ませるより、集約先（宅建＝`/courses/`、賃管士＝`/chinkan/#kouza`）に送って決めさせる現在の設計は意図的なもの。変更する場合は各記事に `pr-line`（PR表記）が既に入っていることを前提にできる。
- 賃管士レーンの提携は**LEC 1社のみ**（2026-08-30のVC全数調査で、宅建・賃管士の講座プログラムはVCにLECしか存在しないと確認済み）。そのため `/chinkan/#kouza` は「比較」ではなく「1社の事実紹介」として書いてある。**社数が増えるまで比較表の体裁にしない**。

---

## 🔴 楽天リンクを追加するときは必ず「計測ID」を入れる（2026-09-03 制定）

このサイトの計測ID＝**`_RTLink143602`（takken）**。

形式（アフィリID の直後にパスセグメントとして入れる）：

```
https://hb.afl.rakuten.co.jp/ichiba/{アフィリID}/_RTLink143602?pc={URLエンコードした商品URL}&link_type=text
```

- `/hgc/` 形式でも同じ位置に入れれば有効（302 で `/ichiba/` へ引き継がれる。2026-09-03 実測）
- **これが無いと楽天のサイト別レポートに載らず、どのサイトの成果か永久に分からなくなる**
- 全サイトのID対応表と発行手順＝`~/Desktop/claude/affiliate_links.md` の「楽天 計測ID（site_pointback_id）」節

---

## 自社教材の導線（2026-09-07 設置・判定日 10/19）

**ASPアフィリリンクとは別枠。** 76行目の「集約先に送る設計」は A8／バリューコマース＝ASPリンクについての決定であり、
自社教材（note・Kindle）はその対象ではない（2026-09-07 司令塔の裁定）。**ASPリンクは1本も足していない。**

### 設置の原則（次に増やす人はここを読む）
- **置き場所＝演習の完了画面／結果表示より後。** ページ冒頭・本文の途中には入れない（無料ツールを使いに来た人の導線を塞がない）
- **1ページ1枠まで。** 新しいコンポーネントを作らず、各面に既にある `.cta-box`（一問一答系）／`.case` + `.mini`（`/kaitou-sokuhou/`）を再利用する
- **温度を上げない。**「必要な人だけどうぞ」程度。断定的なベネフィット訴求を書かない
- 🔴 **賃管士面（`/chinkan/*`）から宅建教材へ送らない**（資格が違う）。受け皿は Kindle `B0HFW15W4R`（賃管士）
- **note リンクに utm をハードコードしない**＝`oc.js` の `decorateNoteLinks()` が自動付与する（`utm_source=takkengym` 固定・`utm_campaign` は `NOTE_MAP`・`utm_content` はページスラッグ）。手で付けると `utm_source=` 検出で二重付与が抑止され、系列名が割れる
- 計測は `oc.js` が自動で拾う＝note は `note_click{note_id, product, from_page}`／Amazon は `kindle_click{book, from_page}`。**追加のタグ実装は不要**

### 2026-09-07 の実測（本番URLを curl）
| URL | HTTP | 自社教材リンク | ASPリンク |
|---|---|---|---|
| `/ichimon/` | 200 | note ¥980 ×1（**9/7 新設**） | 0（変更なし） |
| `/kaitou-sokuhou/` | 200 | note ¥980 ×1・Kindle `B0HFW15W4R` ×1（**9/7 新設**） | 2（A8_YOTSUYA＋0.gif。**変更前後とも2＝増やしていない**） |
| `/ichimon/` 論点別13本・`/toujitsu-check/`・`/toukei-quiz/`・`/chikaradameshi/`・`/chinkan/ichimon/`・`/chinkan/chikaradameshi/` | 200 | 既に設置済み（9/3〜9/5） | 0 |

リンク先の生存確認（2026-09-07 curl・すべて 200）：
- `https://note.com/fujiken818/n/ne2376058ec7b`（宅建 直前 総点検ノート ¥980）
- `https://www.amazon.co.jp/dp/B0HFW15W4R`（賃管士 条文で確かめる要点ノート）
- `https://www.amazon.co.jp/dp/B0HHMT59G2`（宅建 法改正・¥1,400。**今回は使っていない**＝`/kaitou-sokuhou/` の読者は採点後で令和8年度の法改正教材が用途に合わないため。既に blog 5面に設置済み）

### 検査の結果（2026-09-07）
`bash tools/ship_check.sh <file> --profile web --baseline <同ディレクトリのコピー> --base-url https://takken.mainichi-lab.com/ --repo .`
- `/ichimon/`：**NG 0件**（design_audit 0／記事監査は既存NG 7件が 7→7 で不変／個人情報 0／未リリース名 0／コミット著者クリーン）
- `/kaitou-sokuhou/`：**NG 0件**（design_audit 0／article_audit 0／個人情報 0／未リリース名 0）

375px 実描画（`design_probe.js` を本番オリジンの iframe で実行）：

| URL | 横スクロール | 本文14px未満 | タップ標的48px未満 | 新設リンクの実測 |
|---|---|---|---|---|
| `/ichimon/` | **0px** | **0件**（本文16px／行間30.4px） | **0/31件** | 高さ113px・幅294px・右端336px（枠の右端355pxの内側） |
| `/kaitou-sokuhou/` | **0px** | **0件** | 2/269件（**いずれも本文中の既存インラインリンク**＝「下の『登録講習修了者の扱い』」43px・「公式サイト」43px。今回の変更とは無関係・未是正） | note枠 高さ89px／Kindle枠 高さ118px・ともに幅297px・右端336px（枠の右端355pxの内側） |

- コントラスト警告 3件は両面とも**ヘッダの白文字**で、`design_probe.js` が `background-image`（グラデーション）を読めないことによる既知の誤検出（スクリプト冒頭に明記あり）。今回の変更箇所ではない
- 320px は未計測（レイアウトは既存コンポーネントの再利用で新しい寸法を作っていないため）

### 判定日
**2026-10-19**（10/18 本試験の翌日）。GA4 の `note_click` / `kindle_click` を `from_page` 別に見る。
`/kaitou-sokuhou/` は 10/18 15:00 以降がピークなので、**当日1日だけの数字で判定する**（月次平均に埋もれる）。
