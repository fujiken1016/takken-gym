# AFF_SLOTS — アフィリエイトスロット一覧

全収益リンクは `data-aff="スロット名"` 属性で識別できる。リンク差し替え時はこの表を正とする。
※ A8の5社・楽天3枠・バリューコマース1枠は**提携済みの実リンクが既に挿入済み**（プレースホルダではない）。差し替えが必要になるのは「リンク切れ」「プログラム終了」「EPCの高い別案件への変更」時のみ。
※ リンクURLそのものの正本は `~/Desktop/claude/affiliate_links.md`。**このファイルは「どのスロットがどのページに実在するか」の正本**。
※ 実態確認コマンド：`grep -rno 'data-aff="[^"]*"' --include='*.html' .`（最終確認 2026-08-14）

## 現況サマリ（実測）

| ページ | 収益スロット数 | 内訳 |
|---|---|---|
| `/courses/` | 9 | A8×5・楽天×3・VC×1 |
| `/`（index.html） | 2（JSで動的生成） | A8_ONSUKU（ホーム）・A8_YOTSUYA（演習結果） |
| `/kaitou-sokuhou/` | 1 | A8_YOTSUYA |
| `/blog/` 全12記事・`/chinkan/` 全4ページ | **0** | 記事本文に収益リンクは無い。`/courses/` へのテキスト誘導のみ |
| `/blog/`（記事一覧ページ） | 0 | AdSenseのみ。`/courses/` へのリンクあり |

## A8.net（講座5社）

| スロット名 | 掲載箇所 | リンク種別（A8プログラム） | 現在のa8mat |
|---|---|---|---|
| A8_YOTSUYA | `/courses/`（比較1位カード）・`index.html` 演習結果画面・`/kaitou-sokuhou/` | 四谷学院 通信講座（資料請求） | 4B9XTF+CPUEIQ+5IEI+5ZMCH |
| A8_SQUARE | `/courses/` | 資格スクエア | 4B9XTF+CSTKJM+373C+7CX1E |
| A8_SMART | `/courses/` | SMART合格講座（全日本情報学習振興協会） | 4B9XTF+CTF05E+4LOQ+60OXE |
| A8_ONSUKU | `/courses/`・`index.html` ホーム画面 | オンスク.JP（ウケホーダイ） | 4B9XTF+CR19QA+408S+5YRHE |
| A8_TAISAKU | `/courses/`（関連資格セクション。宅建講座ではないので比較表には入れない） | 資格対策ドットコム（FP・金融系） | 4B9XTF+CQFU4I+3L4C+6DC6A |

- `index.html` 内は JS の `A8` オブジェクト（`const A8={...}`、約1079行）が正本。`adCard()` が `data-aff="A8_<KEY大文字>"` を自動付与するため、grepでは `data-aff="A8_'+k.toUpperCase()+'"` としか出ない点に注意。
- `A8` オブジェクトには `yotsuya` / `square` / `onsuku` / `smart` の**4キーが定義されているが、実際に `adCard()` で描画されるのは `onsuku`（ホーム）と `yotsuya`（演習結果）の2つだけ**。`square` / `smart` は定義のみで未使用（枠を増やすときの予備）。
- 各リンク直後の `0.gif` インプレッションピクセル（`www10`〜`www18` サブドメイン）もセットで差し替えること。

## バリューコマース（LEC東京リーガルマインド）

| スロット名 | 掲載箇所 | リンク種別 | 現在のリンク |
|---|---|---|---|
| VC_LEC | `/courses/`（比較表内・四谷学院の次のカード） | LEC東京リーガルマインド 商品販売キャンペーン（プログラムID 2044599／報酬 商品購入1.1%） | `ck.jp.ap.valuecommerce.com/servlet/referral?sid=3777672&pid=892677873&vc_url=...www.lec-jp.com%2Ftakken%2F` |

- VCサイトID `3777672`（宅建GYM）。**pid `892677873` はMyLinkで作った現行呼称版**。旧素材 pid `892677870` は文言が旧称「宅地建物取引主任者」なので**使わない**。
- `gifbanner`（1x1計測）とセット。`href` と `gifbanner` の形は変更しない。MyLinkコードはVC側に保存されないため、作り直す場合は `affiliate_links.md` の手順を参照。
- リスティング不可・ITP対応。掲載している講座料金は lec-jp.com の実測値で、**年1回は要確認**（年度で価格改定される）。

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
| A8_STUDYING | スタディング 宅建講座（A8審査中） |
| A8_AGAROOT | アガルート 宅建講座（A8審査中） |
| A8_FORESIGHT | フォーサイト 宅建講座（A8審査中） |

- バリューコマースの宅建GYMサイト審査は**通過済み**（VC_LEC として掲載中）。

## 未収益化の枠（伸ばすならここ）

- `/blog/` の記事12本と `/chinkan/` の4ページには `data-aff` が1つも無い。AdSense（`ca-pub-8289616283786904`）と `/courses/` へのテキスト誘導のみ。
- 記事から直接A8/VCを踏ませるより、`/courses/` に集約して比較で決めさせる現在の設計は意図的なもの。変更する場合は各記事に `pr-line`（PR表記）が既に入っていることを前提にできる。
