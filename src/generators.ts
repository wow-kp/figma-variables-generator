import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken, CustomGroup, CustomItem } from "./types";

// ── Color helpers ─────────────────────────────────────────────────────────────

export function getPrimOptions(primitives: Primitives, primGroups: PrimGroup[]) {
  const opts: { ref: string; hex: string; label: string }[] = [];
  primGroups.forEach(g => g.shades.forEach(s => {
    const v = primitives[g.key]?.[s];
    if (v) opts.push({ ref:`{primitives.${g.key}.${s}}`, hex:v, label:`${g.key}.${s}` });
  }));
  opts.push({ ref:"{primitives.base.white}", hex:primitives.base?.white||"#FFFFFF", label:"base.white" });
  opts.push({ ref:"{primitives.base.black}", hex:primitives.base?.black||"#000000", label:"base.black" });
  opts.push({ ref:"custom", hex:"#000000", label:"custom hex" });
  return opts;
}

export function resolveColor(ref: string, primitives: Primitives): string {
  if (!ref) return "#000000";
  if (ref.startsWith("{primitives.")) {
    const parts = ref.replace("{primitives.","").replace("}","").split(".");
    return primitives[parts[0]]?.[parts[1]] || "#000000";
  }
  return ref;
}

function hexToRgb01(hex: string) {
  const h = hex.replace("#","");
  if (h.length === 3) return { r:parseInt(h[0]+h[0],16)/255, g:parseInt(h[1]+h[1],16)/255, b:parseInt(h[2]+h[2],16)/255, a:1 };
  return { r:parseInt(h.slice(0,2),16)/255, g:parseInt(h.slice(2,4),16)/255, b:parseInt(h.slice(4,6),16)/255, a:h.length===8?parseInt(h.slice(6,8),16)/255:1 };
}

function rgbaStrToRgb01(str: string) {
  const m = str.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
  if (m) return { r:+m[1]/255, g:+m[2]/255, b:+m[3]/255, a:m[4]!==undefined?+m[4]:1 };
  return null;
}

function toRgb01(raw: string) {
  if (!raw) return { r:0, g:0, b:0, a:1 };
  if (raw.startsWith("rgba")||raw.startsWith("rgb")) return rgbaStrToRgb01(raw) || { r:0, g:0, b:0, a:1 };
  return hexToRgb01(raw);
}

function rgb01ToHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.round(Math.min(255,Math.max(0,n*255))).toString(16).padStart(2,"0");
  return "#"+c(r)+c(g)+c(b);
}

function toFigmaDTCGColor(rawColor: string) {
  const { r, g, b, a } = toRgb01(rawColor);
  return { colorSpace:"srgb", components:[r,g,b], alpha:a, hex:rgb01ToHex(r,g,b) };
}

// ── DTCG JSON generators ──────────────────────────────────────────────────────

export function genPrimitivesJSON(primGroups: PrimGroup[], primitives: Primitives) {
  const t: Record<string, Record<string, unknown>> = {};
  primGroups.forEach(g => {
    t[g.key] = {};
    g.shades.forEach(s => { const h = primitives[g.key]?.[s]; if (h) t[g.key][s] = { "$type":"color", "$value":toFigmaDTCGColor(h) }; });
  });
  t.base = {
    white: { "$type":"color", "$value":toFigmaDTCGColor(primitives.base?.white||"#FFFFFF") },
    black: { "$type":"color", "$value":toFigmaDTCGColor(primitives.base?.black||"#000000") },
  };
  return JSON.stringify(t, null, 2);
}

export function genColorsJSON(colors: ColorToken[], primitives: Primitives, mode: string) {
  const t: Record<string, Record<string, unknown>> = {};
  colors.forEach(c => {
    if (!t[c.group]) t[c.group] = {};
    const raw = resolveColor(mode==="light" ? c.light : c.dark, primitives);
    t[c.group][c.name] = { "$type":"color", "$value":toFigmaDTCGColor(raw) };
  });
  return JSON.stringify(t, null, 2);
}

export function genSpacingJSON(spacing: SpacingToken[]) { const t: Record<string,unknown>={}; spacing.forEach(s => { t[s.name] = { "$type":"dimension", "$value":{ value:parseFloat(s.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }

export function genTypographyJSON(typography: Typography) { const t: Record<string,Record<string,unknown>>={family:{},size:{},weight:{},"line-height":{}}; typography.families.forEach(f => { t.family[f.name] = { "$type":"fontFamily", "$value":f.value }; }); typography.sizes.forEach(s => { t.size[s.name] = { "$type":"dimension", "$value":{ value:parseFloat(s.value)||0, unit:"px" } }; }); typography.weights.forEach(w => { t.weight[w.name] = { "$type":"number", "$value":parseFloat(w.value)||0 }; }); typography.lineHeights.forEach(l => { t["line-height"][l.name] = { "$type":"number", "$value":parseFloat(l.value)||0 }; }); return JSON.stringify(t,null,2); }

export function genTextStylesJSON(textStyles: TextStyle[]) {
  const t: Record<string, Record<string, unknown>> = {};
  textStyles.forEach(s => {
    if (!t[s.group]) t[s.group] = {};
    t[s.group][s.name] = {
      "$type": "textStyle",
      "$value": {
        fontFamily:       s.fontFamily,
        fontSize:         { value: parseFloat(s.fontSize)         || 16,  unit: "px" },
        fontWeight:       parseFloat(s.fontWeight)  || 400,
        lineHeight:       { value: parseFloat(s.lineHeight)       || 1.5, unit: "MULTIPLIER" },
        letterSpacing:    { value: parseFloat(s.letterSpacing)    || 0,   unit: "px" },
        paragraphSpacing: { value: parseFloat(s.paragraphSpacing) || 0,   unit: "px" },
        textDecoration:   s.textDecoration || "NONE",
      }
    };
  });
  return JSON.stringify(t, null, 2);
}

export function genRadiusJSON(radius: RadiusToken[])       { const t: Record<string,unknown>={}; radius.forEach(r  => { t[r.name] = { "$type":"dimension", "$value":{ value:parseFloat(r.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }
export function genBorderJSON(borders: BorderToken[])      { const t: Record<string,unknown>={}; borders.forEach(b => { t[b.name] = { "$type":"dimension", "$value":{ value:parseFloat(b.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }
export function genShadowsJSON(shadows: ShadowToken[])     { const t: Record<string,unknown>={}; shadows.forEach(s => { t[s.name] = { "$type":"string",    "$value":s.value }; }); return JSON.stringify(t,null,2); }
export function genZIndexJSON(zindex: ZIndexToken[])       { const t: Record<string,unknown>={}; zindex.forEach(z  => { t[z.name] = { "$type":"number",    "$value":parseFloat(z.value)||0 }; }); return JSON.stringify(t,null,2); }
export function genBreakpointsJSON(bps: BreakpointToken[]) { const t: Record<string,unknown>={}; bps.forEach(b     => { t[b.name] = { "$type":"number",    "$value":parseFloat(b.value)||0 }; }); return JSON.stringify(t,null,2); }

export function genCustomJSON(items: CustomItem[], groups: CustomGroup[]) {
  const t: Record<string, unknown>={};
  const flat = groups.length <= 1;
  const groupMap: Record<string, CustomGroup> = {};
  (groups || []).forEach(g => { groupMap[g.name] = g; if (!flat) (t as Record<string, Record<string, unknown>>)[g.name] = {}; });
  items.forEach(i => {
    const g = groupMap[i.group] || groups[0] || { type: "number", unit: "" };
    const isNum = g.type==="number"||g.type==="dimension"||g.type==="duration";
    const val = isNum ? (parseFloat(i.value)||0) : i.value;
    const entry = { "$type":g.type, "$value": g.unit ? { value:val, unit:g.unit } : val };
    if (flat) { t[i.name] = entry; } else { if (!t[i.group]) t[i.group] = {}; (t[i.group] as Record<string, unknown>)[i.name] = entry; }
  });
  return JSON.stringify(t,null,2);
}

// ── CSS variable generators ───────────────────────────────────────────────────

export function genPrimitivesCSS(primGroups: PrimGroup[], primitives: Primitives) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  primGroups.forEach(g => { g.shades.forEach(s => { const h = primitives[g.key]?.[s]; if (h) css += `  --primitives-${g.key}-${s}: ${h};\n`; }); });
  css += `  --primitives-base-white: ${primitives.base?.white||"#FFFFFF"};\n`;
  css += `  --primitives-base-black: ${primitives.base?.black||"#000000"};\n`;
  css += "}\n\n/* ── Utility Classes ── */\n";
  primGroups.forEach(g => { g.shades.forEach(s => { const h = primitives[g.key]?.[s]; if (h) { css += `.bg-${g.key}-${s} { background-color: var(--primitives-${g.key}-${s}); }\n`; css += `.text-${g.key}-${s} { color: var(--primitives-${g.key}-${s}); }\n`; } }); });
  css += `.bg-white { background-color: var(--primitives-base-white); }\n.text-white { color: var(--primitives-base-white); }\n`;
  css += `.bg-black { background-color: var(--primitives-base-black); }\n.text-black { color: var(--primitives-base-black); }\n`;
  return css;
}

export function genColorsCSS(colors: ColorToken[], primitives: Primitives, mode: string) {
  const sel = mode === "dark" ? "[data-theme=\"dark\"]" : ":root";
  let css = `/* ── Custom Properties ── */\n${sel} {\n`;
  colors.forEach(c => { const raw = resolveColor(mode==="light"?c.light:c.dark, primitives); css += `  --color-${c.group}-${c.name}: ${raw};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  const pre = mode === "dark" ? "[data-theme=\"dark\"] " : "";
  colors.forEach(c => {
    css += `${pre}.bg-${c.group}-${c.name} { background-color: var(--color-${c.group}-${c.name}); }\n`;
    css += `${pre}.text-${c.group}-${c.name} { color: var(--color-${c.group}-${c.name}); }\n`;
    css += `${pre}.border-${c.group}-${c.name} { border-color: var(--color-${c.group}-${c.name}); }\n`;
  });
  return css;
}

export function genSpacingCSS(spacing: SpacingToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  spacing.forEach(s => { css += `  --spacing-${s.name}: ${parseFloat(s.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  spacing.forEach(s => {
    css += `.p-${s.name} { padding: var(--spacing-${s.name}); }\n`;
    css += `.px-${s.name} { padding-inline: var(--spacing-${s.name}); }\n`;
    css += `.py-${s.name} { padding-block: var(--spacing-${s.name}); }\n`;
    css += `.m-${s.name} { margin: var(--spacing-${s.name}); }\n`;
    css += `.mx-${s.name} { margin-inline: var(--spacing-${s.name}); }\n`;
    css += `.my-${s.name} { margin-block: var(--spacing-${s.name}); }\n`;
    css += `.gap-${s.name} { gap: var(--spacing-${s.name}); }\n`;
  });
  return css;
}

export function genTypographyCSS(typography: Typography) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  typography.families.forEach(f => { css += `  --font-family-${f.name}: ${f.value};\n`; });
  typography.sizes.forEach(s => { css += `  --font-size-${s.name}: ${parseFloat(s.value)||0}px;\n`; });
  typography.weights.forEach(w => { css += `  --font-weight-${w.name}: ${parseFloat(w.value)||0};\n`; });
  typography.lineHeights.forEach(l => { css += `  --line-height-${l.name}: ${l.value};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  typography.families.forEach(f => { css += `.font-${f.name} { font-family: var(--font-family-${f.name}); }\n`; });
  typography.sizes.forEach(s => { css += `.text-${s.name} { font-size: var(--font-size-${s.name}); }\n`; });
  typography.weights.forEach(w => { css += `.font-${w.name} { font-weight: var(--font-weight-${w.name}); }\n`; });
  typography.lineHeights.forEach(l => { css += `.leading-${l.name} { line-height: var(--line-height-${l.name}); }\n`; });
  return css;
}

export function genTextStylesCSS(textStyles: TextStyle[]) {
  let css = "/* ── Utility Classes ── */\n";
  textStyles.forEach(s => {
    css += `.text-${s.group}-${s.name} {\n`;
    css += `  font-family: ${s.fontFamily};\n  font-size: ${s.fontSize}px;\n  font-weight: ${s.fontWeight};\n  line-height: ${s.lineHeight};\n  letter-spacing: ${parseFloat(s.letterSpacing)||0}px;\n`;
    if (s.textDecoration && s.textDecoration !== "NONE") css += `  text-decoration: ${s.textDecoration.toLowerCase()};\n`;
    css += "}\n";
  });
  return css;
}

export function genRadiusCSS(radius: RadiusToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  radius.forEach(r => { css += `  --radius-${r.name}: ${parseFloat(r.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  radius.forEach(r => { css += `.rounded-${r.name} { border-radius: var(--radius-${r.name}); }\n`; });
  return css;
}

export function genBorderCSS(borders: BorderToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  borders.forEach(b => { css += `  --border-width-${b.name}: ${parseFloat(b.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  borders.forEach(b => { css += `.border-${b.name} { border-width: var(--border-width-${b.name}); }\n`; });
  return css;
}

export function genShadowsCSS(shadows: ShadowToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  shadows.forEach(s => { css += `  --shadow-${s.name}: ${s.value};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  shadows.forEach(s => { css += `.shadow-${s.name} { box-shadow: var(--shadow-${s.name}); }\n`; });
  return css;
}

export function genZIndexCSS(zindex: ZIndexToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  zindex.forEach(z => { css += `  --z-index-${z.name}: ${parseFloat(z.value)||0};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  zindex.forEach(z => { css += `.z-${z.name} { z-index: var(--z-index-${z.name}); }\n`; });
  return css;
}

export function genBreakpointsCSS(bps: BreakpointToken[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  bps.forEach(b => { css += `  --breakpoint-${b.name}: ${parseFloat(b.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  bps.forEach(b => { css += `@media (min-width: ${parseFloat(b.value)||0}px) { .show-${b.name} { display: block; } .hide-${b.name} { display: none; } }\n`; });
  return css;
}

export function genCustomCSS(items: CustomItem[], groups: CustomGroup[], jsonKey: string) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  items.forEach(i => { const g = groups.find(gr=>gr.name===i.group) || groups[0] || {unit:""}; css += `  --${jsonKey}-${i.name}: ${i.value}${g.unit||""};\n`; });
  css += "}\n";
  return css;
}

// ── Tailwind config generators ────────────────────────────────────────────────

export function genPrimitivesTW(primGroups: PrimGroup[], primitives: Primitives) {
  const colors: Record<string, Record<string,string>|string> = {};
  primGroups.forEach(g => { colors[g.key] = {}; g.shades.forEach(s => { const h = primitives[g.key]?.[s]; if (h) (colors[g.key] as Record<string,string>)[s] = h; }); });
  colors.white = primitives.base?.white||"#FFFFFF";
  colors.black = primitives.base?.black||"#000000";
  return JSON.stringify({ theme: { extend: { colors } } }, null, 2);
}

export function genColorsTW(colors: ColorToken[], primitives: Primitives, mode: string) {
  const c: Record<string, Record<string,string>> = {};
  colors.forEach(cl => { if(!c[cl.group])c[cl.group]={}; c[cl.group][cl.name] = resolveColor(mode==="light"?cl.light:cl.dark, primitives); });
  return JSON.stringify({ theme: { extend: { colors: c } } }, null, 2);
}

export function genSpacingTW(spacing: SpacingToken[]) { const s: Record<string,string> = {}; spacing.forEach(sp => { s[sp.name] = `${parseFloat(sp.value)||0}px`; }); return JSON.stringify({ theme: { extend: { spacing: s } } }, null, 2); }

export function genTypographyTW(typography: Typography) {
  const fontFamily: Record<string,string[]> = {}, fontSize: Record<string,string> = {}, fontWeight: Record<string,string> = {}, lineHeight: Record<string,string> = {};
  typography.families.forEach(f => { fontFamily[f.name] = f.value.split(",").map(s=>s.trim()); });
  typography.sizes.forEach(s => { fontSize[s.name] = `${parseFloat(s.value)||0}px`; });
  typography.weights.forEach(w => { fontWeight[w.name] = `${parseFloat(w.value)||0}`; });
  typography.lineHeights.forEach(l => { lineHeight[l.name] = l.value; });
  return JSON.stringify({ theme: { extend: { fontFamily, fontSize, fontWeight, lineHeight } } }, null, 2);
}

export function genRadiusTW(radius: RadiusToken[]) { const r: Record<string,string> = {}; radius.forEach(rd => { r[rd.name] = `${parseFloat(rd.value)||0}px`; }); return JSON.stringify({ theme: { extend: { borderRadius: r } } }, null, 2); }
export function genBorderTW(borders: BorderToken[]) { const b: Record<string,string> = {}; borders.forEach(bd => { b[bd.name] = `${parseFloat(bd.value)||0}px`; }); return JSON.stringify({ theme: { extend: { borderWidth: b } } }, null, 2); }
export function genShadowsTW(shadows: ShadowToken[]) { const s: Record<string,string> = {}; shadows.forEach(sh => { s[sh.name] = sh.value; }); return JSON.stringify({ theme: { extend: { boxShadow: s } } }, null, 2); }
export function genZIndexTW(zindex: ZIndexToken[]) { const z: Record<string,string> = {}; zindex.forEach(zi => { z[zi.name] = `${parseFloat(zi.value)||0}`; }); return JSON.stringify({ theme: { extend: { zIndex: z } } }, null, 2); }
export function genBreakpointsTW(bps: BreakpointToken[]) { const s: Record<string,string> = {}; bps.forEach(b => { s[b.name] = `${parseFloat(b.value)||0}px`; }); return JSON.stringify({ theme: { extend: { screens: s } } }, null, 2); }

// ── Download helpers ──────────────────────────────────────────────────────────

export function dlJSON(json: string, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([json],{type:"application/json"}));
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function dlText(text: string, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text],{type:"text/plain"}));
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
