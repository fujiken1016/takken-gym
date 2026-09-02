/* 宅建GYM 時間割エンジン（共有）
 * 正本。/jikan-haibun/（シミュレータ）と /chikaradameshi/（本番モード模試）の両方がこの1本を読む。
 * 2ページに計算式を複製すると必ずズレるので、計算はここだけに置く。
 * ⚠️ 編集したら sw.js の CACHE 版数を上げること（fetchはキャッシュ優先）。
 */
(function(){
 "use strict";
 var KEY="takken_jikan_v1";
 var DEF={kubun:"ippan",order:"A",kenri:"std",rev:"25"};

 var BLOCKS={
  kenri:{name:"権利関係",range:"問1〜14",n:14},
  horei:{name:"法令上の制限",range:"問15〜22",n:8},
  zei:{name:"税・価格の評定",range:"問23〜25",n:3},
  gyoho:{name:"宅建業法",range:"問26〜45",n:20},
  menjo:{name:"免除科目",range:"問46〜50",n:5}
 };
 var W={horei:1.15,zei:1.0,gyoho:1.0,menjo:0.7};
 var KW={deep:2.1,std:1.75,cut:1.4};
 var ORDERS={
  A:["menjo","gyoho","horei","zei","kenri"],
  B:["kenri","horei","zei","gyoho","menjo"],
  C:["kenri","gyoho","horei","zei","menjo"]
 };
 var ORDER_LABEL={A:"業法ファースト",B:"問1から順に",C:"権利関係から"};
 var KENRI_LABEL={deep:"権利関係はしっかり解く",std:"権利関係は標準",cut:"権利関係は深追いしない"};

 function fmt(m){var h=Math.floor(m/60),mm=m%60;return h+":"+(mm<10?"0":"")+mm;}

 /* 保存値を正規化する。壊れた値・未知の値は既定へ落とす（localStorage は書き換えられうる） */
 function normalize(s){
  s=s||{};
  var st={};
  st.kubun=(s.kubun==="menjo")?"menjo":"ippan";
  st.order=ORDERS[s.order]?s.order:DEF.order;
  st.kenri=KW[s.kenri]?s.kenri:DEF.kenri;
  var r=parseInt(s.rev,10);
  st.rev=String((r>=5&&r<=60)?r:parseInt(DEF.rev,10));
  return st;
 }

 /* 保存済みの時間割を読む。1つも保存されていなければ null（＝未作成） */
 function read(){
  var raw=null;
  try{raw=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){return null;}
  if(!raw||typeof raw!=="object")return null;
  var any=false;
  for(var k in DEF){if(Object.prototype.hasOwnProperty.call(raw,k)&&raw[k])any=true;}
  if(!any)return null;
  return normalize(raw);
 }

 function save(st){
  try{localStorage.setItem(KEY,JSON.stringify(normalize(st)));return true;}catch(e){return false;}
 }

 function calc(input){
  var st=normalize(input);
  var menjoUser=(st.kubun==="menjo");
  var startMin=menjoUser?(13*60+10):(13*60);
  var endMin=15*60;
  var total=endMin-startMin;
  var rev=parseInt(st.rev,10)||25;
  if(rev>total-30)rev=total-30;
  var avail=total-rev;
  var seq=ORDERS[st.order].slice();
  if(menjoUser)seq=seq.filter(function(b){return b!=="menjo";});
  var w=function(b){return b==="kenri"?KW[st.kenri]:W[b];};
  var units=0;
  seq.forEach(function(b){units+=BLOCKS[b].n*w(b);});
  var raw=seq.map(function(b){return BLOCKS[b].n*w(b)/units*avail;});
  var mins=raw.map(function(x){return Math.floor(x);});
  var used=mins.reduce(function(a,b){return a+b;},0);
  var rest=avail-used;
  var idx=raw.map(function(x,i){return [x-Math.floor(x),i];}).sort(function(a,b){return b[0]-a[0];});
  for(var i=0;i<rest;i++){mins[idx[i%idx.length][1]]++;}
  var rows=[],cps=[],t=startMin,qs=0;
  seq.forEach(function(b,i){
   var s2=t,en=t+mins[i];t=en;qs+=BLOCKS[b].n;
   rows.push({no:i+1,b:b,mins:mins[i],s:s2,e:en,per:(mins[i]/BLOCKS[b].n)});
   cps.push({time:en,text:BLOCKS[b].range+"（"+BLOCKS[b].name+"）まで終わっている"});
  });
  return {st:st,rows:rows,seq:seq,rev:rev,revStart:t,end:endMin,start:startMin,
          total:total,cps:cps,menjoUser:menjoUser,qs:qs};
 }

 /* 一行サマリー（模試側の見出しに使う） */
 function summary(r){
  return (r.menjoUser?"5問免除・45問110分":"一般・50問120分")+"／"+
         ORDER_LABEL[r.st.order]+"／"+KENRI_LABEL[r.st.kenri]+"／見直し"+r.rev+"分";
 }

 window.TakkenJikan={
  KEY:KEY,DEF:DEF,BLOCKS:BLOCKS,ORDERS:ORDERS,
  ORDER_LABEL:ORDER_LABEL,KENRI_LABEL:KENRI_LABEL,
  fmt:fmt,read:read,save:save,calc:calc,normalize:normalize,summary:summary
 };
})();
