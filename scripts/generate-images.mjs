// Генератор иллюстраций меню (SVG). Запуск: node scripts/generate-images.mjs
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join('public', 'images');
fs.mkdirSync(OUT, { recursive: true });

function shell(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="60%">
    <stop offset="0%" stop-color="#4a3218" stop-opacity="0.85"/>
    <stop offset="70%" stop-color="#241a0e" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#14100c" stop-opacity="0"/>
  </radialGradient>
  <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
    <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.5"/>
  </filter>
  ${inner.defs || ''}
</defs>
<circle cx="256" cy="240" r="250" fill="url(#bg)"/>
<ellipse cx="256" cy="446" rx="165" ry="24" fill="#000" opacity="0.45"/>
${inner.body}
</svg>`;
}

/* ---------- Шаурма в лаваше ---------- */
function wrap(o) {
  const c = o || {};
  const cheese = c.cheese;
  const meat = c.meat || '#8f4a1f';
  const sauce = c.sauce || '#f3d27a';
  const greens = c.greens || '#6fbb3f';
  const size = c.scale || 1;

  const filling = `
    <path d="M-34 -60 C 6 -70, 30 -30, 30 6 C 30 44, 2 66, -30 60 C -52 -8, -52 -40, -34 -60 Z" fill="${meat}"/>
    <path d="M-30 10 C -6 6, 18 16, 22 40 C 10 58, -14 60, -28 46 Z" fill="#5e2f12"/>
    <path d="M-36 -56 C -12 -64, 12 -50, 16 -30 C -2 -22, -24 -28, -36 -34 Z" fill="${greens}"/>
    <path d="M-24 30 C -6 26, 14 34, 20 52 C 4 64, -16 60, -24 46 Z" fill="${greens}"/>
    <circle cx="-2" cy="-8" r="12" fill="#e2392b"/>
    <circle cx="12" cy="18" r="10" fill="#e2392b"/>
    ${cheese ? '<path d="M-30 -20 C -6 -30, 16 -14, 20 6 C 4 16, -18 10, -30 -2 Z" fill="' + cheese + '"/>' : ''}
    <path d="M-20 -40 C -2 -46, 14 -34, 12 -20 C 0 -14, -14 -20, -20 -26 Z" fill="${sauce}" opacity="0.95"/>`;

  return shell({
    defs: `
  <linearGradient id="tort" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="#f8cf8d"/><stop offset="45%" stop-color="#e8ab5c"/><stop offset="100%" stop-color="#c07f38"/>
  </linearGradient>
  <linearGradient id="toast" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#a2622a" stop-opacity="0.55"/><stop offset="100%" stop-color="#7c4416" stop-opacity="0.25"/>
  </linearGradient>
  <radialGradient id="endcap" cx="40%" cy="35%" r="75%">
    <stop offset="0%" stop-color="#fbe6c2"/><stop offset="100%" stop-color="#dcae6c"/>
  </radialGradient>
  <clipPath id="endClip"><ellipse cx="188" cy="0" rx="26" ry="66"/></clipPath>`,
    body: `
<g transform="translate(256 250) rotate(-20) scale(${size})" filter="url(#shadow)">
  <rect x="-215" y="-78" width="430" height="156" rx="76" fill="url(#tort)"/>
  <rect x="-215" y="-78" width="430" height="156" rx="76" fill="url(#toast)" opacity="0.5"/>

  <g opacity="0.5">
    <ellipse cx="-120" cy="-40" rx="46" ry="20" fill="#8a5220" opacity="0.45"/>
    <ellipse cx="20" cy="38" rx="54" ry="18" fill="#8a5220" opacity="0.35"/>
    <ellipse cx="110" cy="-30" rx="34" ry="14" fill="#8a5220" opacity="0.4"/>
    <ellipse cx="-30" cy="-52" rx="30" ry="12" fill="#8a5220" opacity="0.3"/>
  </g>

  <g stroke="#9c5c22" stroke-opacity="0.45" stroke-width="6" stroke-linecap="round" fill="none">
    <path d="M-180 -30 C -120 -48, -80 -12, -20 -34"/>
    <path d="M-170 18 C -110 2, -60 44, 10 20"/>
    <path d="M-150 52 C -80 40, -20 66, 60 48"/>
  </g>

  <ellipse cx="188" cy="0" rx="30" ry="74" fill="url(#endcap)"/>
  <ellipse cx="188" cy="0" rx="24" ry="66" fill="#c98d4a"/>
  <g clip-path="url(#endClip)" transform="translate(188 0)">
    ${filling}
  </g>
  <ellipse cx="188" cy="0" rx="30" ry="74" fill="none" stroke="#a96c28" stroke-width="3" stroke-opacity="0.6"/>

  <ellipse cx="-206" cy="0" rx="22" ry="62" fill="#e9b571"/>
  <ellipse cx="-206" cy="0" rx="15" ry="50" fill="#d29b57"/>

  <rect x="-130" y="-74" width="230" height="14" rx="7" fill="#fff" opacity="0.28"/>
  <path d="M-175 -66 C -60 -96, 90 -90, 175 -58" stroke="#fff" stroke-opacity="0.2" stroke-width="10" fill="none"/>

  <g stroke="#fff" stroke-opacity="0.18" stroke-width="7" fill="none" stroke-linecap="round">
    <path d="M-90 -110 C -104 -140, -78 -156, -92 -186"/>
    <path d="M10 -116 C -4 -146, 22 -162, 8 -192"/>
    <path d="M110 -108 C 96 -138, 122 -154, 108 -184"/>
  </g>
</g>`,
  });
}

/* ---------- Донер в пите ---------- */
function pita(o) {
  const c = o || {};
  return shell({
    defs: `
  <linearGradient id="pitaG" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#fbdfae"/><stop offset="55%" stop-color="#e5b573"/><stop offset="100%" stop-color="#b8803f"/>
  </linearGradient>
  <linearGradient id="pocket" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#5e2f12"/><stop offset="100%" stop-color="#3a1a08"/>
  </linearGradient>
  <clipPath id="pocketClip">
    <path d="M-160 10 C -160 -120, 160 -120, 160 10 C 160 60, -160 60, -160 10 Z"/>
  </clipPath>`,
    body: `
<g transform="translate(256 290)" filter="url(#shadow)">
  <ellipse cx="0" cy="66" rx="185" ry="42" fill="#000" opacity="0.35"/>
  <path d="M-178 8 C -178 -128, 178 -128, 178 8 C 178 96, 120 148, 0 148 C -120 148, -178 96, -178 8 Z" fill="url(#pitaG)"/>
  <path d="M-160 6 C -160 -112, 160 -112, 160 6 C 160 40, -160 40, -160 6 Z" fill="url(#pocket)"/>
  <g clip-path="url(#pocketClip)">
    <path d="M-150 -20 C -60 -60, 40 -62, 150 -18 L150 30 L-150 30 Z" fill="${c.cheese || '#7a3c17'}"/>
    <g fill="#6fbb3f">
      <path d="M-130 -8 C -110 -34, -84 -10, -60 -26 C -40 -6, -16 -30, 6 -12 C 28 -32, 52 -8, 74 -24 C 96 -4, 122 -26, 140 -6 L140 6 L-130 6 Z"/>
    </g>
    <g fill="#e2392b">
      <circle cx="-96" cy="-18" r="14"/><circle cx="-30" cy="-26" r="12"/><circle cx="44" cy="-20" r="13"/><circle cx="104" cy="-24" r="11"/>
    </g>
    <g fill="#f3d27a" opacity="0.9">
      <path d="M-120 0 C -60 18, 60 18, 120 0 L120 10 C 60 26, -60 26, -120 10 Z"/>
    </g>
    <g fill="#8f4a1f">
      <path d="M-80 -40 C -50 -56, -10 -40, 20 -50 C 50 -60, 80 -42, 110 -48 L110 -30 L-80 -30 Z"/>
    </g>
  </g>
  <path d="M-178 8 C -178 -128, 178 -128, 178 8" fill="none" stroke="#c08a48" stroke-width="5" stroke-opacity="0.55"/>
  <ellipse cx="-60" cy="-96" rx="52" ry="18" fill="#fff" opacity="0.22"/>
</g>`,
  });
}

/* ---------- Картофель фри ---------- */
function fries() {
  return shell({
    defs: `
  <linearGradient id="fr" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffe08a"/><stop offset="60%" stop-color="#f0b54a"/><stop offset="100%" stop-color="#cf8b22"/>
  </linearGradient>
  <linearGradient id="cart" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#ef4b34"/><stop offset="100%" stop-color="#9e1a0f"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 280)" filter="url(#shadow)">
  <g>
    ${[-96, -66, -36, -4, 28, 58, 86].map(function (x, i) {
      const h = 150 + (i % 4) * 30;
      return '<rect x="' + x + '" y="' + (-h - 40) + '" width="30" height="' + h + '" rx="14" fill="url(#fr)" transform="rotate(' + (i * 4 - 12) + ' ' + x + ' 0)" stroke="#d99a2b" stroke-opacity="0.35" stroke-width="2"/>';
    }).join('')}
  </g>
  <path d="M-128 -30 L128 -30 L100 160 L-100 160 Z" fill="url(#cart)"/>
  <path d="M-128 -30 L128 -30 L118 8 L-118 8 Z" fill="#ff6a4d" opacity="0.95"/>
  <ellipse cx="0" cy="-30" rx="128" ry="24" fill="#7a1409" opacity="0.55"/>
  <ellipse cx="0" cy="-34" rx="112" ry="18" fill="#4a0b05" opacity="0.5"/>
  <path d="M-96 44 L96 44" stroke="#fff" stroke-opacity="0.55" stroke-width="5"/>
  <text x="0" y="116" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="40" font-weight="800" fill="#fff" opacity="0.95">FRY</text>
</g>`,
  });
}

/* ---------- Наггетсы ---------- */
function nuggets() {
  return shell({
    defs: `
  <linearGradient id="ng" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0%" stop-color="#ffd98a"/><stop offset="45%" stop-color="#e0a24d"/><stop offset="100%" stop-color="#a2652a"/>
  </linearGradient>
  <radialGradient id="plate" cx="50%" cy="35%" r="65%">
    <stop offset="0%" stop-color="#fbf7f0"/><stop offset="100%" stop-color="#b9aea0"/>
  </radialGradient>`,
    body: `
<g transform="translate(256 300)" filter="url(#shadow)">
  <ellipse cx="0" cy="82" rx="205" ry="56" fill="url(#plate)"/>
  <ellipse cx="0" cy="76" rx="182" ry="44" fill="#efe7da"/>
  <g>
    <g transform="translate(-96 16) rotate(-16)"><path d="M-62 -6 C -66 -44, 10 -66, 56 -34 C 84 -14, 62 26, 18 30 C -24 34, -56 22, -62 -6 Z" fill="url(#ng)"/></g>
    <g transform="translate(10 42) rotate(9)"><path d="M-64 -4 C -68 -44, 12 -68, 58 -34 C 86 -14, 64 26, 20 30 C -24 34, -58 22, -64 -4 Z" fill="url(#ng)"/></g>
    <g transform="translate(100 4) rotate(-7)"><path d="M-56 -4 C -60 -40, 10 -60, 50 -30 C 76 -12, 56 24, 16 28 C -20 30, -50 20, -56 -4 Z" fill="url(#ng)"/></g>
    <g transform="translate(-18 -46) rotate(5)"><path d="M-56 -4 C -60 -38, 8 -58, 48 -30 C 72 -12, 54 22, 14 26 C -20 28, -50 18, -56 -4 Z" fill="url(#ng)"/></g>
  </g>
  <g fill="#8a5220" opacity="0.5">
    <circle cx="-52" cy="4" r="4.5"/><circle cx="16" cy="26" r="4"/><circle cx="70" cy="-2" r="4.5"/>
    <circle cx="-6" cy="-38" r="4"/><circle cx="104" cy="16" r="3.5"/><circle cx="-84" cy="18" r="3.5"/>
    <circle cx="40" cy="8" r="3"/>
  </g>
  <g fill="#fff" opacity="0.35">
    <ellipse cx="-60" cy="-18" rx="20" ry="8"/><ellipse cx="30" cy="-8" rx="18" ry="7"/>
  </g>
</g>`,
  });
}

/* ---------- Луковые кольца ---------- */
function rings() {
  return shell({
    defs: `
  <linearGradient id="ring" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#ffe3a0"/><stop offset="55%" stop-color="#e2a44d"/><stop offset="100%" stop-color="#a86a22"/>
  </linearGradient>
  <linearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#fff6e2"/><stop offset="100%" stop-color="#f0dcbb"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 290)" filter="url(#shadow)">
  <g transform="translate(-104 66) rotate(-10) scale(1.1)">
    <ellipse cx="0" cy="0" rx="94" ry="38" fill="url(#ring)"/>
    <ellipse cx="0" cy="-6" rx="56" ry="20" fill="url(#inner)"/>
  </g>
  <g transform="translate(84 78) rotate(8) scale(1.05)">
    <ellipse cx="0" cy="0" rx="86" ry="34" fill="url(#ring)"/>
    <ellipse cx="0" cy="-6" rx="50" ry="18" fill="url(#inner)"/>
  </g>
  <g transform="translate(-8 8) scale(1.2)">
    <ellipse cx="0" cy="0" rx="100" ry="40" fill="url(#ring)"/>
    <ellipse cx="0" cy="-7" rx="60" ry="22" fill="url(#inner)"/>
  </g>
  <g transform="translate(-26 -66) rotate(-12) scale(1.05)">
    <ellipse cx="0" cy="0" rx="78" ry="32" fill="url(#ring)"/>
    <ellipse cx="0" cy="-6" rx="46" ry="17" fill="url(#inner)"/>
  </g>
  <g transform="translate(60 -30) rotate(10) scale(0.95)">
    <ellipse cx="0" cy="0" rx="66" ry="26" fill="url(#ring)"/>
    <ellipse cx="0" cy="-4" rx="38" ry="14" fill="url(#inner)"/>
  </g>
</g>`,
  });
}

/* ---------- Соусы ---------- */
function sauce(color) {
  return shell({
    defs: `
  <linearGradient id="cup" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#cfc6b8"/>
  </linearGradient>
  <radialGradient id="sauceG" cx="42%" cy="30%" r="75%">
    <stop offset="0%" stop-color="${color.light}"/><stop offset="100%" stop-color="${color.dark}"/>
  </radialGradient>`,
    body: `
<g transform="translate(256 300)" filter="url(#shadow)">
  <path d="M-140 -20 L140 -20 L106 150 L-106 150 Z" fill="url(#cup)"/>
  <path d="M-140 -20 L140 -20 L130 24 L-130 24 Z" fill="#ffffff" opacity="0.6"/>
  <ellipse cx="0" cy="-20" rx="140" ry="40" fill="#ebe3d6"/>
  <ellipse cx="0" cy="-20" rx="122" ry="32" fill="url(#sauceG)"/>
  <ellipse cx="-38" cy="-30" rx="34" ry="11" fill="#fff" opacity="0.4"/>
  <path d="M-92 -6 C -50 8, 50 8, 92 -6" stroke="#fff" stroke-opacity="0.35" stroke-width="5" fill="none"/>
  <path d="M-96 74 L96 74" stroke="#dfd7c9" stroke-width="6" stroke-linecap="round"/>
</g>`,
  });
}

/* ---------- Кола ---------- */
function cola() {
  return shell({
    defs: `
  <linearGradient id="drinkC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#7a3517"/><stop offset="100%" stop-color="#2a0d04"/>
  </linearGradient>
  <linearGradient id="glassS" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0.06"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 292)" filter="url(#shadow)">
  <rect x="-26" y="-186" width="22" height="110" rx="11" fill="#ef4b34" transform="rotate(10)"/>
  <path d="M-100 -120 L100 -120 L80 140 L-80 140 Z" fill="url(#drinkC)"/>
  <path d="M-100 -120 L100 -120 L80 140 L-80 140 Z" fill="url(#glassS)"/>
  <ellipse cx="0" cy="-120" rx="100" ry="26" fill="#9a5024"/>
  <ellipse cx="0" cy="-120" rx="84" ry="20" fill="#5e2a10"/>
  <g fill="#ffffff" opacity="0.55">
    <rect x="-56" y="-108" width="40" height="34" rx="8" transform="rotate(-12)"/>
    <rect x="10" y="-96" width="34" height="30" rx="8" transform="rotate(14)"/>
  </g>
  <g fill="#ffffff" opacity="0.4">
    <circle cx="-46" cy="46" r="6"/><circle cx="26" cy="82" r="5"/><circle cx="-12" cy="12" r="5"/><circle cx="52" cy="24" r="4"/>
  </g>
  <path d="M-84 -108 L-72 120" stroke="#fff" stroke-opacity="0.4" stroke-width="10" stroke-linecap="round"/>
</g>`,
  });
}

/* ---------- Айран ---------- */
function bottle() {
  return shell({
    defs: `
  <linearGradient id="btl" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="55%" stop-color="#f2f1ea"/><stop offset="100%" stop-color="#c3c0b4"/>
  </linearGradient>
  <linearGradient id="btlL" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#a9dcf5"/><stop offset="100%" stop-color="#4a97c4"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 286)" filter="url(#shadow)">
  <path d="M-54 -168 L54 -168 L54 -120 C 96 -96, 104 30, 90 140 L-90 140 C -104 30, -96 -96, -54 -120 Z" fill="url(#btl)"/>
  <rect x="-58" y="-186" width="116" height="28" rx="13" fill="#e8412f"/>
  <rect x="-90" y="-34" width="180" height="104" rx="18" fill="url(#btlL)"/>
  <text x="0" y="30" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="38" font-weight="800" fill="#fff">AYRAN</text>
  <path d="M-46 -114 C -66 24, -58 96, -52 128" stroke="#fff" stroke-opacity="0.8" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M-70 -120 C -80 20, -74 80, -70 110" stroke="#fff" stroke-opacity="0.35" stroke-width="6" fill="none" stroke-linecap="round"/>
</g>`,
  });
}

/* ---------- Чай ---------- */
function tea() {
  return shell({
    defs: `
  <linearGradient id="cupp" x1="0" y1="0" x2="0.2" y2="1">
    <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#d5cec0"/>
  </linearGradient>
  <linearGradient id="teaG" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#c4762a"/><stop offset="100%" stop-color="#6d3208"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 306)" filter="url(#shadow)">
  <ellipse cx="0" cy="104" rx="175" ry="38" fill="#f2ede3"/>
  <ellipse cx="0" cy="99" rx="132" ry="27" fill="#ded6c8"/>
  <path d="M-108 -36 L108 -36 C 108 78, 66 132, 0 132 C -66 132, -108 78, -108 -36 Z" fill="url(#cupp)"/>
  <ellipse cx="0" cy="-36" rx="108" ry="33" fill="#e9e3d8"/>
  <ellipse cx="0" cy="-36" rx="90" ry="25" fill="url(#teaG)"/>
  <ellipse cx="-30" cy="-44" rx="30" ry="9" fill="#fff" opacity="0.25"/>
  <path d="M108 -10 C 168 -10, 168 66, 104 68" stroke="#efeae0" stroke-width="18" fill="none" stroke-linecap="round"/>
  <g stroke="#ffffff" stroke-opacity="0.6" stroke-width="8" fill="none" stroke-linecap="round">
    <path d="M-40 -84 C -54 -114, -26 -130, -40 -160"/>
    <path d="M4 -90 C -10 -120, 18 -136, 4 -166"/>
    <path d="M48 -84 C 34 -114, 62 -130, 48 -160"/>
  </g>
</g>`,
  });
}

/* ---------- Морс ---------- */
function morse() {
  return shell({
    defs: `
  <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#e12b4c"/><stop offset="100%" stop-color="#6e0b1e"/>
  </linearGradient>
  <linearGradient id="glS" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
  </linearGradient>`,
    body: `
<g transform="translate(256 292)" filter="url(#shadow)">
  <path d="M-96 -112 L96 -112 L78 140 L-78 140 Z" fill="url(#mg)"/>
  <path d="M-96 -112 L96 -112 L78 140 L-78 140 Z" fill="url(#glS)"/>
  <ellipse cx="0" cy="-112" rx="96" ry="27" fill="#c21f3c"/>
  <g>
    <circle cx="-34" cy="-116" r="18" fill="#9c0f24"/>
    <circle cx="16" cy="-108" r="15" fill="#b3162d"/>
    <circle cx="50" cy="-120" r="12" fill="#9c0f24"/>
    <circle cx="-2" cy="-126" r="10" fill="#b3162d"/>
  </g>
  <g fill="#ffffff" opacity="0.45">
    <circle cx="-40" cy="36" r="6"/><circle cx="28" cy="76" r="5"/><circle cx="-10" cy="6" r="5"/>
  </g>
  <path d="M-80 -100 L-62 122" stroke="#fff" stroke-opacity="0.4" stroke-width="10" stroke-linecap="round"/>
</g>`,
  });
}

const IMAGES = {
  'shawarma-classic': wrap({}),
  'shawarma-beef': wrap({ meat: '#6b3313', greens: '#63ae37', tortilla: ['#f6c884', '#c98b45'] }),
  'shawarma-spicy': wrap({ sauce: '#ff5a2b', greens: '#5fae35', meat: '#7a3712' }),
  'shawarma-cheese': wrap({ cheese: '#ffd76e' }),
  'shawarma-xxl': wrap({ scale: 1.08, tortilla: ['#fbd79b', '#d09652'] }),
  'shawarma-veg': wrap({ meat: '#6b8f3a', greens: '#7fcb4a', sauce: '#f5e3b0' }),
  'doner-pita': pita({ cheese: '#8f4a1f' }),
  'doner-cheese': pita({ cheese: '#ffd76e' }),
  'fries': fries(),
  'nuggets': nuggets(),
  'onion-rings': rings(),
  'sauce-garlic': sauce({ light: '#fffef8', dark: '#e6dbc2' }),
  'sauce-spicy': sauce({ light: '#ff7a55', dark: '#b81a0c' }),
  'sauce-cheese': sauce({ light: '#ffdb7d', dark: '#d68f18' }),
  'cola': cola(),
  'ayran': bottle(),
  'tea': tea(),
  'morse': morse(),
};

for (const entry of Object.entries(IMAGES)) {
  fs.writeFileSync(path.join(OUT, entry[0] + '.svg'), entry[1], 'utf8');
}
console.log('Сгенерировано файлов:', Object.keys(IMAGES).length, '->', OUT);
