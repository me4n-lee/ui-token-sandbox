/*
  Look/sandbox/tokens.js — 룩 값의 단일 출처(SSOT).

  경계 (.claude/rules/공통.md §1):
    기획/ = 규칙 — "넥서스에 포신 없음" "채도를 죽이지 않는다". 세계관에서 도출된다.
    여기   = 값   — 0.52 · 0.84 · 0.42. 눈으로만 정해진다. 화면 보고 고친다.

  고치는 법: 이 파일의 숫자만 바꾸고 새로고침. 규칙이 바뀌었으면 기획/ 먼저.
  근거: 기획/01시스템/05색테마.md · 06형태언어.md · 00세계관/05용어사전.md §2.0
*/
var TOKENS = {

  /* 6색 — 세계관이 확정(용어사전 §2.0). 사다리 순서 흰>노>초>빨>파>검.
     ⚠ 여기 있지만 이건 규칙 쪽이다. 순서를 바꾸면 거리·순도·색변환이 다 깨진다. */
  palette: { w: "#f2f2f2", y: "#edcb45", g: "#59b238", r: "#db4a43", b: "#2875c3", k: "#333333" },

  /* 구역 지형 = 그 색의 파스텔판 (05색테마 §1.2).
     채도를 죽이면 노·초·빨·파가 흙빛으로 수렴해 구역 색이 안 읽힌다 → 채도 유지, 밝기만 올린다.
     양 극점은 무채색이라 밝기만으론 안 되므로 직접 지정한다. */
  terrain: { sat: 0.52, light: 0.84, override: { w: "#ebebeb", k: "#4d4d4d" } },

  /* 구역 위 글자색 — 지형에 묻히지 않을 만큼만 */
  label: { w: "#555", y: "#4a4330", g: "#38492f", r: "#4a2f2f", b: "#2f3d4a", k: "#c0c0c0" },

  /* 격자 = 기능적으로 필요한 순간에만 (06형태언어 §3.5).
     평소는 3칸마다 한 줄, 건설 중은 셀 단위. 값은 검정 불투명도. */
  grid: { idle: 0.055, build: 0.14, buildRing: 0.18 },

  /* 못 놓는 곳을 덮는 프로스트 글래스 + 건설 중 전체 옅어짐.
     밝은 구역은 흰 가림, 검 구역은 어두운 가림 — 안 뒤집으면 검 구역에서 하얗게 뜬다. */
  veil: {
    light: { ring: "rgba(0,0,0,.20)",     out: "rgba(255,255,255,.52)", bad: "rgba(198,66,66,.26)", dim: "rgba(255,255,255,.26)" },
    dark:  { ring: "rgba(255,255,255,.26)", out: "rgba(20,20,20,.42)",  bad: "rgba(210,80,80,.30)", dim: "rgba(20,20,20,.22)" },
    blur: 3
  },

  /* 빛이 재료라는 것을 보이는 유일한 장치 (06형태언어 §1·§2). 과하면 지저분하다 */
  aura: { glow: 0.42, blur: 0.16 },

  /* 셀 픽셀 — 화면 폭에 따라. 격자 1칸 = 게임의 1칸 */
  cell: { wide: 40, mid: 26, narrow: 17 }
};

/* ── 지형색 산출: 같은 색상(H) · 채도 sat · 밝기 light ── */
function hexToHsl(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255,
      g = parseInt(hex.slice(3, 5), 16) / 255,
      b = parseInt(hex.slice(5, 7), 16) / 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
  if (d) {
    if (mx === r)      h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = ((b - r) / d + 2);
    else               h = ((r - g) / d + 4);
    h *= 60;
  }
  var l = (mx + mn) / 2;
  return { h: h, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l: l };
}
function hslToHex(h, s, l) {
  var c = (1 - Math.abs(2 * l - 1)) * s, hp = h / 60,
      x = c * (1 - Math.abs((hp % 2) - 1)), m = l - c / 2, t;
  if      (hp < 1) t = [c, x, 0];
  else if (hp < 2) t = [x, c, 0];
  else if (hp < 3) t = [0, c, x];
  else if (hp < 4) t = [0, x, c];
  else if (hp < 5) t = [x, 0, c];
  else             t = [c, 0, x];
  return "#" + t.map(function (v) {
    return ("0" + Math.round((v + m) * 255).toString(16)).slice(-2);
  }).join("");
}
/* 구역 키('w'|'y'|'g'|'r'|'b'|'k') → 지형 hex */
function terrainOf(key) {
  var o = TOKENS.terrain.override[key];
  if (o) return o;
  return hslToHex(hexToHsl(TOKENS.palette[key]).h, TOKENS.terrain.sat, TOKENS.terrain.light);
}

/* ── CSS 변수로 밀어넣기 ──
   미디어쿼리는 JS로 못 쓰므로 <style>을 만들어 끼운다. 그래서 셀 크기도 여기서 온다. */
(function applyTokens() {
  var P = TOKENS.palette, C = TOKENS.cell, G = TOKENS.grid, V = TOKENS.veil;
  var css = ":root{"
    + "--o-w:" + P.w + ";--o-y:" + P.y + ";--o-g:" + P.g + ";"
    + "--o-r:" + P.r + ";--o-b:" + P.b + ";--o-k:" + P.k + ";"
    + "--cell:" + C.wide + "px;"
    + "--grid-idle:rgba(0,0,0," + G.idle + ");"
    + "--grid-build:rgba(0,0,0," + G.build + ");"
    + "--grid-ring:rgba(0,0,0," + G.buildRing + ");"
    + "--veil-blur:" + V.blur + "px;"
    + "--aura-glow:" + TOKENS.aura.glow + ";"
    + "--aura-blur:" + TOKENS.aura.blur + ";"
    + "}"
    + "@media (max-width:1000px){:root{--cell:" + C.mid + "px}}"
    + "@media (max-width:560px){:root{--cell:" + C.narrow + "px}}";
  var el = document.createElement("style");
  el.id = "tokens";
  el.textContent = css;
  document.head.appendChild(el);
})();
