// OKLCH Color Space Utilities
// Full bidirectional conversion: sRGB hex <-> OKLCH
// hex -> linear-sRGB -> XYZ-D65 -> OKLab -> OKLCH
// Based on Bjorn Ottosson's OKLab specification (2020): https://bottosson.github.io/posts/oklab/

function linearize(v) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function delinearize(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function hexToLinearRGB(hex) {
  const h = hex.replace('#', '');
  if (h.length < 6) return [0, 0, 0];
  return [
    linearize(parseInt(h.slice(0, 2), 16) / 255),
    linearize(parseInt(h.slice(2, 4), 16) / 255),
    linearize(parseInt(h.slice(4, 6), 16) / 255),
  ];
}

function linearRGBToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(delinearize(clamp(v)) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

function mul(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

const M_RGB_XYZ = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041],
];
const M_XYZ_RGB = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.9692660, 1.8760108, 0.0415560],
  [0.0556434, -0.2040259, 1.0572252],
];
const M_XYZ_LMS = [
  [0.8189330101, 0.3618667424, -0.1288597137],
  [0.0329845436, 0.9293118715, 0.0361456387],
  [0.0482003018, 0.2643662691, 0.6338517070],
];
const M_LMS_LAB = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
];
const M_LAB_LMS = [
  [1.0000000000, 0.3963377774, 0.2158037573],
  [1.0000000000, -0.1055613458, -0.0638541728],
  [1.0000000000, -0.0894841775, -1.2914855480],
];
const M_LMS_XYZ = [
  [1.2270138511035211, -0.5577999806518222, 0.2812561489664678],
  [-0.0405801784232806, 1.1122568696168302, -0.0716766786656012],
  [-0.0763812845057069, -0.4214819784180127, 1.5861632204407947],
];

/** Hex string -> OKLCH { l, c, h } */
export function hexToOklch(hex) {
  const rgb = hexToLinearRGB(hex);
  const xyz = mul(M_RGB_XYZ, rgb);
  const lms = mul(M_XYZ_LMS, xyz);
  const lmsCbrt = [Math.cbrt(lms[0]), Math.cbrt(lms[1]), Math.cbrt(lms[2])];
  const [L, a, b] = mul(M_LMS_LAB, lmsCbrt);
  const c = Math.sqrt(a * a + b * b);
  const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** OKLCH -> hex string */
export function oklchToHex(l, c, h) {
  const hRad = (h * Math.PI) / 180;
  const lab = [l, c * Math.cos(hRad), c * Math.sin(hRad)];
  const lmsCbrt = mul(M_LAB_LMS, lab);
  const lms = [lmsCbrt[0] ** 3, lmsCbrt[1] ** 3, lmsCbrt[2] ** 3];
  const xyz = mul(M_LMS_XYZ, lms);
  const [r, g, b] = mul(M_XYZ_RGB, xyz);
  return linearRGBToHex(r, g, b);
}

/** WCAG 2.1 relative luminance (sRGB linearised) */
export function relativeLuminance(hex) {
  const [r, g, b] = hexToLinearRGB(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours (always >= 1) */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Adjust `fg` lightness in OKLCH until contrast ratio against `bg` meets `minRatio`.
 * Hue and (scaled) chroma are preserved -- only L changes.
 */
export function ensureContrastOklch(fg, bg, minRatio = 4.5) {
  if (contrastRatio(fg, bg) >= minRatio) return fg;

  const { l: lOrig, c, h } = hexToOklch(fg);
  const bgLum = relativeLuminance(bg);
  const lighten = bgLum < 0.18;

  let lo = lighten ? lOrig : 0;
  let hi = lighten ? 1 : lOrig;
  let result = fg;

  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const distFromMid = Math.abs(mid - 0.5) * 2;
    const chromaScale = Math.max(0, 1 - distFromMid * 1.2);
    const candidate = oklchToHex(mid, c * chromaScale, h);
    if (contrastRatio(candidate, bg) >= minRatio) {
      result = candidate;
      if (lighten) hi = mid; else lo = mid;
    } else {
      if (lighten) lo = mid; else hi = mid;
    }
  }
  return result;
}
