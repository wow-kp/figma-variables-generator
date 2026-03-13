import { useState, useRef, useCallback, useEffect } from "react";

const ALL_TABS = ["Primitives","Colors","Spacing","Typography","Text Styles","Radius","Border","Shadows","Z-Index","Breakpoints"];
const DEFAULT_ENABLED = new Set(ALL_TABS);
const DEFAULT_COLOR_GROUPS = ["brand","surface","text","border","feedback","overlay"];

const INITIAL_PRIM_GROUPS = [
  {id:1,key:"blue",  label:"Blue",  shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#EFF6FF","#DBEAFE","#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8","#1E40AF","#1E3A5F"]},
  {id:2,key:"purple",label:"Purple",shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#F5F3FF","#EDE9FE","#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6","#4C1D95"]},
  {id:3,key:"green", label:"Green", shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#F0FDF4","#DCFCE7","#BBF7D0","#86EFAC","#4ADE80","#22C55E","#16A34A","#15803D","#166534","#14532D"]},
  {id:4,key:"red",   label:"Red",   shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#FFF1F2","#FFE4E6","#FECDD3","#FCA5A5","#F87171","#EF4444","#DC2626","#B91C1C","#991B1B","#7F1D1D"]},
  {id:5,key:"amber", label:"Amber", shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#FFFBEB","#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309","#92400E","#78350F"]},
  {id:6,key:"gray",  label:"Gray",  shades:["50","100","200","300","400","500","600","700","800","900","950"],defaults:["#F9FAFB","#F3F4F6","#E5E7EB","#D1D5DB","#9CA3AF","#6B7280","#4B5563","#374151","#1F2937","#111827","#030712"]},
];

const buildDefaultPrimitives = () => {
  const obj: Record<string,any> = {};
  INITIAL_PRIM_GROUPS.forEach(g => { obj[g.key] = {}; g.shades.forEach((s,i) => { obj[g.key][s] = g.defaults[i]; }); });
  obj.base = { white:"#FFFFFF", black:"#000000" };
  return obj;
};
const buildDefaultPrimGroups = () => INITIAL_PRIM_GROUPS.map(g => ({ id:g.id, key:g.key, label:g.label, shades:[...g.shades] }));

// ── Text Styles ───────────────────────────────────────────────────────────────
const DEFAULT_TS_GROUPS = ["display","heading","body","label","caption","code"];

const defaultTextStyles = [
  {id:1, group:"display", name:"2xl",     fontFamily:"Inter, sans-serif", fontSize:"72", fontWeight:"700", lineHeight:"1.1",  letterSpacing:"-1",   paragraphSpacing:"0", textDecoration:"NONE"},
  {id:2, group:"display", name:"xl",      fontFamily:"Inter, sans-serif", fontSize:"60", fontWeight:"700", lineHeight:"1.1",  letterSpacing:"-0.5", paragraphSpacing:"0", textDecoration:"NONE"},
  {id:3, group:"heading", name:"h1",      fontFamily:"Inter, sans-serif", fontSize:"36", fontWeight:"700", lineHeight:"1.25", letterSpacing:"-0.5", paragraphSpacing:"0", textDecoration:"NONE"},
  {id:4, group:"heading", name:"h2",      fontFamily:"Inter, sans-serif", fontSize:"30", fontWeight:"600", lineHeight:"1.3",  letterSpacing:"-0.3", paragraphSpacing:"0", textDecoration:"NONE"},
  {id:5, group:"heading", name:"h3",      fontFamily:"Inter, sans-serif", fontSize:"24", fontWeight:"600", lineHeight:"1.35", letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:6, group:"heading", name:"h4",      fontFamily:"Inter, sans-serif", fontSize:"20", fontWeight:"600", lineHeight:"1.4",  letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:7, group:"body",    name:"lg",      fontFamily:"Inter, sans-serif", fontSize:"18", fontWeight:"400", lineHeight:"1.6",  letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:8, group:"body",    name:"default", fontFamily:"Inter, sans-serif", fontSize:"16", fontWeight:"400", lineHeight:"1.5",  letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:9, group:"body",    name:"sm",      fontFamily:"Inter, sans-serif", fontSize:"14", fontWeight:"400", lineHeight:"1.5",  letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:10,group:"label",   name:"lg",      fontFamily:"Inter, sans-serif", fontSize:"14", fontWeight:"500", lineHeight:"1.25", letterSpacing:"0.5",  paragraphSpacing:"0", textDecoration:"NONE"},
  {id:11,group:"label",   name:"default", fontFamily:"Inter, sans-serif", fontSize:"12", fontWeight:"500", lineHeight:"1.25", letterSpacing:"0.5",  paragraphSpacing:"0", textDecoration:"NONE"},
  {id:12,group:"label",   name:"sm",      fontFamily:"Inter, sans-serif", fontSize:"11", fontWeight:"500", lineHeight:"1.25", letterSpacing:"1",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:13,group:"caption", name:"default", fontFamily:"Inter, sans-serif", fontSize:"12", fontWeight:"400", lineHeight:"1.4",  letterSpacing:"0",    paragraphSpacing:"0", textDecoration:"NONE"},
  {id:14,group:"code",    name:"default", fontFamily:"Fira Code, monospace", fontSize:"14", fontWeight:"400", lineHeight:"1.6", letterSpacing:"0",  paragraphSpacing:"0", textDecoration:"NONE"},
];

function genTextStylesJSON(textStyles: any[]) {
  const t: Record<string,any> = {};
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

// ── Existing helpers ──────────────────────────────────────────────────────────
const getPrimOptions = (primitives: any, primGroups: any[]) => {
  const opts: any[] = [];
  primGroups.forEach(g => g.shades.forEach((s: string) => {
    const v = primitives[g.key]?.[s];
    if (v) opts.push({ ref:`{primitives.${g.key}.${s}}`, hex:v, label:`${g.key}.${s}` });
  }));
  opts.push({ ref:"{primitives.base.white}", hex:primitives.base?.white||"#FFFFFF", label:"base.white" });
  opts.push({ ref:"{primitives.base.black}", hex:primitives.base?.black||"#000000", label:"base.black" });
  opts.push({ ref:"custom", hex:"#000000", label:"custom hex" });
  return opts;
};
const resolveColor = (ref: string, primitives: any) => {
  if (!ref) return "#000000";
  if (ref.startsWith("{primitives.")) {
    const parts = ref.replace("{primitives.","").replace("}","").split(".");
    return primitives[parts[0]]?.[parts[1]] || "#000000";
  }
  return ref;
};

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
function rgb01ToHex(r: number,g: number,b: number) {
  const c = (n: number) => Math.round(Math.min(255,Math.max(0,n*255))).toString(16).padStart(2,"0");
  return "#"+c(r)+c(g)+c(b);
}
function toFigmaDTCGColor(rawColor: string) {
  const { r, g, b, a } = toRgb01(rawColor);
  return { colorSpace:"srgb", components:[r,g,b], alpha:a, hex:rgb01ToHex(r,g,b) };
}

// ── JSON generators ───────────────────────────────────────────────────────────
function genPrimitivesJSON(primGroups: any[], primitives: any) {
  const t: Record<string,any> = {};
  primGroups.forEach(g => {
    t[g.key] = {};
    g.shades.forEach((s: string) => { const h = primitives[g.key]?.[s]; if (h) t[g.key][s] = { "$type":"color", "$value":toFigmaDTCGColor(h) }; });
  });
  t.base = {
    white: { "$type":"color", "$value":toFigmaDTCGColor(primitives.base?.white||"#FFFFFF") },
    black: { "$type":"color", "$value":toFigmaDTCGColor(primitives.base?.black||"#000000") },
  };
  return JSON.stringify(t, null, 2);
}
function genColorsJSON(colors: any[], primitives: any, mode: string) {
  const t: Record<string,any> = {};
  colors.forEach(c => {
    if (!t[c.group]) t[c.group] = {};
    const raw = resolveColor(mode==="light" ? c.light : c.dark, primitives);
    t[c.group][c.name] = { "$type":"color", "$value":toFigmaDTCGColor(raw) };
  });
  return JSON.stringify(t, null, 2);
}
function genSpacingJSON(spacing: any[])     { const t: any={}; spacing.forEach(s     => { t[s.name]       = { "$type":"dimension", "$value":{ value:parseFloat(s.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }
function genTypographyJSON(typography: any) { const t: any={family:{},size:{},weight:{},"line-height":{}}; typography.families.forEach((f: any)    => { t.family[f.name]         = { "$type":"fontFamily", "$value":f.value }; }); typography.sizes.forEach((s: any)       => { t.size[s.name]           = { "$type":"dimension",  "$value":{ value:parseFloat(s.value)||0, unit:"px" } }; }); typography.weights.forEach((w: any)     => { t.weight[w.name]         = { "$type":"number",     "$value":parseFloat(w.value)||0 }; }); typography.lineHeights.forEach((l: any) => { t["line-height"][l.name] = { "$type":"number",     "$value":parseFloat(l.value)||0 }; }); return JSON.stringify(t,null,2); }
function genRadiusJSON(radius: any[])       { const t: any={}; radius.forEach(r       => { t[r.name]       = { "$type":"dimension", "$value":{ value:parseFloat(r.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }
function genBorderJSON(borders: any[])      { const t: any={}; borders.forEach(b      => { t[b.name]       = { "$type":"dimension", "$value":{ value:parseFloat(b.value)||0, unit:"px" } }; }); return JSON.stringify(t,null,2); }
function genCustomJSON(items: any[], groups: any[]) {
  const t: any={};
  const flat = groups.length <= 1;
  const groupMap: Record<string,any> = {};
  (groups || []).forEach((g: any) => { groupMap[g.name] = g; if (!flat) t[g.name] = {}; });
  items.forEach(i => {
    const g = groupMap[i.group] || groups[0] || { type: "number", unit: "" };
    const isNum = g.type==="number"||g.type==="dimension"||g.type==="duration";
    const val = isNum ? (parseFloat(i.value)||0) : i.value;
    const entry = { "$type":g.type, "$value": g.unit ? { value:val, unit:g.unit } : val };
    if (flat) { t[i.name] = entry; } else { if (!t[i.group]) t[i.group] = {}; t[i.group][i.name] = entry; }
  });
  return JSON.stringify(t,null,2);
}
function genShadowsJSON(shadows: any[])     { const t: any={}; shadows.forEach(s      => { t[s.name]       = { "$type":"string",    "$value":s.value }; });                                    return JSON.stringify(t,null,2); }
function genZIndexJSON(zindex: any[])       { const t: any={}; zindex.forEach(z        => { t[z.name]       = { "$type":"number",    "$value":parseFloat(z.value)||0 }; });                    return JSON.stringify(t,null,2); }
function genBreakpointsJSON(bps: any[])     { const t: any={}; bps.forEach(b           => { t[b.name]       = { "$type":"number",    "$value":parseFloat(b.value)||0 }; });                    return JSON.stringify(t,null,2); }

function dlJSON(json: string, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([json],{type:"application/json"}));
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
function dlText(text: string, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text],{type:"text/plain"}));
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── CSS variables generators ─────────────────────────────────────────────────
function genPrimitivesCSS(primGroups: any[], primitives: any) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  primGroups.forEach(g => { g.shades.forEach((s: string) => { const h = primitives[g.key]?.[s]; if (h) css += `  --primitives-${g.key}-${s}: ${h};\n`; }); });
  css += `  --primitives-base-white: ${primitives.base?.white||"#FFFFFF"};\n`;
  css += `  --primitives-base-black: ${primitives.base?.black||"#000000"};\n`;
  css += "}\n\n/* ── Utility Classes ── */\n";
  primGroups.forEach(g => { g.shades.forEach((s: string) => { const h = primitives[g.key]?.[s]; if (h) { css += `.bg-${g.key}-${s} { background-color: var(--primitives-${g.key}-${s}); }\n`; css += `.text-${g.key}-${s} { color: var(--primitives-${g.key}-${s}); }\n`; } }); });
  css += `.bg-white { background-color: var(--primitives-base-white); }\n.text-white { color: var(--primitives-base-white); }\n`;
  css += `.bg-black { background-color: var(--primitives-base-black); }\n.text-black { color: var(--primitives-base-black); }\n`;
  return css;
}
function genColorsCSS(colors: any[], primitives: any, mode: string) {
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
function genSpacingCSS(spacing: any[]) {
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
function genTypographyCSS(typography: any) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  typography.families.forEach((f: any) => { css += `  --font-family-${f.name}: ${f.value};\n`; });
  typography.sizes.forEach((s: any) => { css += `  --font-size-${s.name}: ${parseFloat(s.value)||0}px;\n`; });
  typography.weights.forEach((w: any) => { css += `  --font-weight-${w.name}: ${parseFloat(w.value)||0};\n`; });
  typography.lineHeights.forEach((l: any) => { css += `  --line-height-${l.name}: ${l.value};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  typography.families.forEach((f: any) => { css += `.font-${f.name} { font-family: var(--font-family-${f.name}); }\n`; });
  typography.sizes.forEach((s: any) => { css += `.text-${s.name} { font-size: var(--font-size-${s.name}); }\n`; });
  typography.weights.forEach((w: any) => { css += `.font-${w.name} { font-weight: var(--font-weight-${w.name}); }\n`; });
  typography.lineHeights.forEach((l: any) => { css += `.leading-${l.name} { line-height: var(--line-height-${l.name}); }\n`; });
  return css;
}
function genTextStylesCSS(textStyles: any[]) {
  let css = "/* ── Utility Classes ── */\n";
  textStyles.forEach(s => {
    css += `.text-${s.group}-${s.name} {\n`;
    css += `  font-family: ${s.fontFamily};\n  font-size: ${s.fontSize}px;\n  font-weight: ${s.fontWeight};\n  line-height: ${s.lineHeight};\n  letter-spacing: ${parseFloat(s.letterSpacing)||0}px;\n`;
    if (s.textDecoration && s.textDecoration !== "NONE") css += `  text-decoration: ${s.textDecoration.toLowerCase()};\n`;
    css += "}\n";
  });
  return css;
}
function genRadiusCSS(radius: any[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  radius.forEach(r => { css += `  --radius-${r.name}: ${parseFloat(r.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  radius.forEach(r => { css += `.rounded-${r.name} { border-radius: var(--radius-${r.name}); }\n`; });
  return css;
}
function genBorderCSS(borders: any[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  borders.forEach(b => { css += `  --border-width-${b.name}: ${parseFloat(b.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  borders.forEach(b => { css += `.border-${b.name} { border-width: var(--border-width-${b.name}); }\n`; });
  return css;
}
function genShadowsCSS(shadows: any[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  shadows.forEach(s => { css += `  --shadow-${s.name}: ${s.value};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  shadows.forEach(s => { css += `.shadow-${s.name} { box-shadow: var(--shadow-${s.name}); }\n`; });
  return css;
}
function genZIndexCSS(zindex: any[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  zindex.forEach(z => { css += `  --z-index-${z.name}: ${parseFloat(z.value)||0};\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  zindex.forEach(z => { css += `.z-${z.name} { z-index: var(--z-index-${z.name}); }\n`; });
  return css;
}
function genBreakpointsCSS(bps: any[]) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  bps.forEach(b => { css += `  --breakpoint-${b.name}: ${parseFloat(b.value)||0}px;\n`; });
  css += "}\n\n/* ── Utility Classes ── */\n";
  bps.forEach(b => { css += `@media (min-width: ${parseFloat(b.value)||0}px) { .show-${b.name} { display: block; } .hide-${b.name} { display: none; } }\n`; });
  return css;
}
function genCustomCSS(items: any[], groups: any[], jsonKey: string) {
  let css = "/* ── Custom Properties ── */\n:root {\n";
  items.forEach(i => { const g = groups.find((gr: any)=>gr.name===i.group) || groups[0] || {unit:""}; css += `  --${jsonKey}-${i.name}: ${i.value}${g.unit||""};\n`; });
  css += "}\n";
  return css;
}

// ── Tailwind config generators ───────────────────────────────────────────────
function genPrimitivesTW(primGroups: any[], primitives: any) {
  const colors: any = {};
  primGroups.forEach(g => { colors[g.key] = {}; g.shades.forEach((s: string) => { const h = primitives[g.key]?.[s]; if (h) colors[g.key][s] = h; }); });
  colors.white = primitives.base?.white||"#FFFFFF";
  colors.black = primitives.base?.black||"#000000";
  return JSON.stringify({ theme: { extend: { colors } } }, null, 2);
}
function genColorsTW(colors: any[], primitives: any, mode: string) {
  const c: any = {};
  colors.forEach(cl => { if(!c[cl.group])c[cl.group]={}; c[cl.group][cl.name] = resolveColor(mode==="light"?cl.light:cl.dark, primitives); });
  return JSON.stringify({ theme: { extend: { colors: c } } }, null, 2);
}
function genSpacingTW(spacing: any[]) { const s: any = {}; spacing.forEach(sp => { s[sp.name] = `${parseFloat(sp.value)||0}px`; }); return JSON.stringify({ theme: { extend: { spacing: s } } }, null, 2); }
function genTypographyTW(typography: any) {
  const fontFamily: any = {}, fontSize: any = {}, fontWeight: any = {}, lineHeight: any = {};
  typography.families.forEach((f: any) => { fontFamily[f.name] = f.value.split(",").map((s: string)=>s.trim()); });
  typography.sizes.forEach((s: any) => { fontSize[s.name] = `${parseFloat(s.value)||0}px`; });
  typography.weights.forEach((w: any) => { fontWeight[w.name] = `${parseFloat(w.value)||0}`; });
  typography.lineHeights.forEach((l: any) => { lineHeight[l.name] = l.value; });
  return JSON.stringify({ theme: { extend: { fontFamily, fontSize, fontWeight, lineHeight } } }, null, 2);
}
function genRadiusTW(radius: any[]) { const r: any = {}; radius.forEach(rd => { r[rd.name] = `${parseFloat(rd.value)||0}px`; }); return JSON.stringify({ theme: { extend: { borderRadius: r } } }, null, 2); }
function genBorderTW(borders: any[]) { const b: any = {}; borders.forEach(bd => { b[bd.name] = `${parseFloat(bd.value)||0}px`; }); return JSON.stringify({ theme: { extend: { borderWidth: b } } }, null, 2); }
function genShadowsTW(shadows: any[]) { const s: any = {}; shadows.forEach(sh => { s[sh.name] = sh.value; }); return JSON.stringify({ theme: { extend: { boxShadow: s } } }, null, 2); }
function genZIndexTW(zindex: any[]) { const z: any = {}; zindex.forEach(zi => { z[zi.name] = `${parseFloat(zi.value)||0}`; }); return JSON.stringify({ theme: { extend: { zIndex: z } } }, null, 2); }
function genBreakpointsTW(bps: any[]) { const s: any = {}; bps.forEach(b => { s[b.name] = `${parseFloat(b.value)||0}px`; }); return JSON.stringify({ theme: { extend: { screens: s } } }, null, 2); }

// ── Default data ──────────────────────────────────────────────────────────────
const defaultColors = [
  {id:1, group:"brand",   name:"primary",        light:"{primitives.blue.600}",   dark:"{primitives.blue.400}",   description:"Primary brand color"},
  {id:2, group:"brand",   name:"primary-hover",  light:"{primitives.blue.700}",   dark:"{primitives.blue.300}",   description:"Hover state for primary"},
  {id:3, group:"brand",   name:"primary-subtle", light:"{primitives.blue.50}",    dark:"{primitives.blue.900}",   description:"Subtle tint background"},
  {id:4, group:"brand",   name:"secondary",      light:"{primitives.purple.600}", dark:"{primitives.purple.400}", description:"Secondary brand color"},
  {id:5, group:"brand",   name:"accent",         light:"{primitives.amber.500}",  dark:"{primitives.amber.400}",  description:"Accent / highlight"},
  {id:6, group:"surface", name:"page",           light:"{primitives.gray.50}",    dark:"{primitives.gray.950}",   description:"Page background"},
  {id:7, group:"surface", name:"default",        light:"{primitives.base.white}", dark:"{primitives.gray.900}",   description:"Card / panel"},
  {id:8, group:"surface", name:"raised",         light:"{primitives.base.white}", dark:"{primitives.gray.800}",   description:"Dropdown / popover"},
  {id:9, group:"surface", name:"sunken",         light:"{primitives.gray.100}",   dark:"{primitives.gray.950}",   description:"Input / code bg"},
  {id:10,group:"surface", name:"hover",          light:"{primitives.gray.100}",   dark:"{primitives.gray.800}",   description:"Hover background"},
  {id:11,group:"surface", name:"disabled",       light:"{primitives.gray.100}",   dark:"{primitives.gray.800}",   description:"Disabled state bg"},
  {id:12,group:"text",    name:"primary",        light:"{primitives.gray.900}",   dark:"{primitives.gray.50}",    description:"Main body text"},
  {id:13,group:"text",    name:"secondary",      light:"{primitives.gray.600}",   dark:"{primitives.gray.400}",   description:"Supporting text"},
  {id:14,group:"text",    name:"tertiary",       light:"{primitives.gray.400}",   dark:"{primitives.gray.600}",   description:"Placeholder / hint"},
  {id:15,group:"text",    name:"disabled",       light:"{primitives.gray.300}",   dark:"{primitives.gray.700}",   description:"Disabled text"},
  {id:16,group:"text",    name:"inverse",        light:"{primitives.base.white}", dark:"{primitives.gray.900}",   description:"Text on dark surfaces"},
  {id:17,group:"text",    name:"link",           light:"{primitives.blue.600}",   dark:"{primitives.blue.400}",   description:"Hyperlink"},
  {id:18,group:"border",  name:"default",        light:"{primitives.gray.200}",   dark:"{primitives.gray.700}",   description:"Default border"},
  {id:19,group:"border",  name:"strong",         light:"{primitives.gray.300}",   dark:"{primitives.gray.600}",   description:"Emphasized border"},
  {id:20,group:"border",  name:"subtle",         light:"{primitives.gray.100}",   dark:"{primitives.gray.800}",   description:"Subtle border"},
  {id:21,group:"border",  name:"brand",          light:"{primitives.blue.600}",   dark:"{primitives.blue.400}",   description:"Focus ring / active"},
  {id:22,group:"feedback",name:"error",          light:"{primitives.red.500}",    dark:"{primitives.red.400}",    description:"Error"},
  {id:23,group:"feedback",name:"error-subtle",   light:"{primitives.red.50}",     dark:"{primitives.red.900}",    description:"Error bg"},
  {id:24,group:"feedback",name:"success",        light:"{primitives.green.500}",  dark:"{primitives.green.400}",  description:"Success"},
  {id:25,group:"feedback",name:"success-subtle", light:"{primitives.green.50}",   dark:"{primitives.green.900}",  description:"Success bg"},
  {id:26,group:"feedback",name:"warning",        light:"{primitives.amber.500}",  dark:"{primitives.amber.400}",  description:"Warning"},
  {id:27,group:"feedback",name:"warning-subtle", light:"{primitives.amber.50}",   dark:"{primitives.amber.900}",  description:"Warning bg"},
  {id:28,group:"feedback",name:"info",           light:"{primitives.blue.500}",   dark:"{primitives.blue.400}",   description:"Info"},
  {id:29,group:"feedback",name:"info-subtle",    light:"{primitives.blue.50}",    dark:"{primitives.blue.900}",   description:"Info bg"},
  {id:30,group:"overlay", name:"scrim",          light:"rgba(0,0,0,0.5)",         dark:"rgba(0,0,0,0.7)",         description:"Modal backdrop"},
];
const defaultSpacing     = [{id:1,name:"0",value:"0"},{id:2,name:"px",value:"1"},{id:3,name:"0-5",value:"2"},{id:4,name:"1",value:"4"},{id:5,name:"1-5",value:"6"},{id:6,name:"2",value:"8"},{id:7,name:"2-5",value:"10"},{id:8,name:"3",value:"12"},{id:9,name:"4",value:"16"},{id:10,name:"5",value:"20"},{id:11,name:"6",value:"24"},{id:12,name:"8",value:"32"},{id:13,name:"10",value:"40"},{id:14,name:"12",value:"48"},{id:15,name:"16",value:"64"},{id:16,name:"20",value:"80"},{id:17,name:"24",value:"96"},{id:18,name:"32",value:"128"}];
const defaultTypography  = { families:[{id:101,name:"sans",value:"Inter, system-ui, sans-serif"},{id:102,name:"mono",value:"'Fira Code', monospace"}], sizes:[{id:201,name:"xs",value:"12"},{id:202,name:"sm",value:"14"},{id:203,name:"base",value:"16"},{id:204,name:"lg",value:"18"},{id:205,name:"xl",value:"20"},{id:206,name:"2xl",value:"24"},{id:207,name:"3xl",value:"30"},{id:208,name:"4xl",value:"36"},{id:209,name:"5xl",value:"48"},{id:210,name:"6xl",value:"60"}], weights:[{id:301,name:"regular",value:"400"},{id:302,name:"medium",value:"500"},{id:303,name:"semibold",value:"600"},{id:304,name:"bold",value:"700"}], lineHeights:[{id:401,name:"tight",value:"1.25"},{id:402,name:"snug",value:"1.375"},{id:403,name:"normal",value:"1.5"},{id:404,name:"relaxed",value:"1.625"},{id:405,name:"loose",value:"2"}] };
const defaultRadius      = [{id:1,name:"none",value:"0"},{id:2,name:"sm",value:"4"},{id:3,name:"md",value:"6"},{id:4,name:"lg",value:"8"},{id:5,name:"xl",value:"12"},{id:6,name:"2xl",value:"16"},{id:7,name:"3xl",value:"24"},{id:8,name:"full",value:"9999"}];
const defaultBorders     = [{id:1,name:"none",value:"0"},{id:2,name:"thin",value:"1"},{id:3,name:"default",value:"2"},{id:4,name:"thick",value:"4"}];
const defaultShadows     = [{id:1,name:"xs",value:"0px 1px 3px 0px rgba(0,0,0,0.18)"},{id:2,name:"sm",value:"0px 2px 6px 0px rgba(0,0,0,0.20)"},{id:3,name:"md",value:"0px 4px 12px 0px rgba(0,0,0,0.22)"},{id:4,name:"lg",value:"0px 8px 24px 0px rgba(0,0,0,0.24)"},{id:5,name:"xl",value:"0px 16px 40px 0px rgba(0,0,0,0.26)"},{id:6,name:"2xl",value:"0px 24px 64px 0px rgba(0,0,0,0.30)"}];
const defaultZIndex      = [{id:1,name:"base",value:"0"},{id:2,name:"raised",value:"10"},{id:3,name:"dropdown",value:"100"},{id:4,name:"sticky",value:"200"},{id:5,name:"overlay",value:"300"},{id:6,name:"modal",value:"400"},{id:7,name:"toast",value:"500"},{id:8,name:"tooltip",value:"600"}];
const defaultBreakpoints = [{id:1,name:"xs",value:"0",max:"567"},{id:2,name:"sm",value:"567",max:"767"},{id:3,name:"md",value:"767",max:"991"},{id:4,name:"lg",value:"991",max:""}];

let _id = 500;
function initIdCounter() {
  try {
    const raw = localStorage.getItem("figma-variables-generator");
    if (!raw) return;
    const s = JSON.parse(raw);
    const collect = (arr: any[]) => arr?.forEach((i: any) => { if (i?.id > _id) _id = i.id; });
    collect(s.primGroups); collect(s.colors); collect(s.spacing); collect(s.textStyles);
    collect(s.radius); collect(s.borders); collect(s.shadows); collect(s.zindex); collect(s.breakpoints);
    s.typography?.families && collect(s.typography.families);
    s.typography?.sizes && collect(s.typography.sizes);
    s.typography?.weights && collect(s.typography.weights);
    s.typography?.lineHeights && collect(s.typography.lineHeights);
    s.customCollections?.forEach((cc: any) => { if (cc?.id > _id) _id = cc.id; collect(cc.items); });
  } catch { /* ignore */ }
}
initIdCounter();
const uid = () => ++_id;

const matchesSearch = (q: string, ...fields: string[]) => { if (!q) return true; const lq = q.toLowerCase(); return fields.some(f => f && f.toLowerCase().includes(lq)); };

const TS_DECORATION_OPTIONS = ["NONE","UNDERLINE","STRIKETHROUGH"];
const FONT_FAMILIES = [
  {label:"Inter", value:"Inter, sans-serif"},
  {label:"Roboto", value:"Roboto, sans-serif"},
  {label:"Open Sans", value:"Open Sans, sans-serif"},
  {label:"Lato", value:"Lato, sans-serif"},
  {label:"Montserrat", value:"Montserrat, sans-serif"},
  {label:"Poppins", value:"Poppins, sans-serif"},
  {label:"Nunito", value:"Nunito, sans-serif"},
  {label:"Raleway", value:"Raleway, sans-serif"},
  {label:"Work Sans", value:"Work Sans, sans-serif"},
  {label:"DM Sans", value:"DM Sans, sans-serif"},
  {label:"Plus Jakarta Sans", value:"Plus Jakarta Sans, sans-serif"},
  {label:"Source Sans 3", value:"Source Sans 3, sans-serif"},
  {label:"Manrope", value:"Manrope, sans-serif"},
  {label:"Outfit", value:"Outfit, sans-serif"},
  {label:"Space Grotesk", value:"Space Grotesk, sans-serif"},
  {label:"Arial", value:"Arial, sans-serif"},
  {label:"Helvetica Neue", value:"Helvetica Neue, sans-serif"},
  {label:"SF Pro Display", value:"SF Pro Display, sans-serif"},
  {label:"Playfair Display", value:"Playfair Display, serif"},
  {label:"Merriweather", value:"Merriweather, serif"},
  {label:"Lora", value:"Lora, serif"},
  {label:"PT Serif", value:"PT Serif, serif"},
  {label:"Libre Baskerville", value:"Libre Baskerville, serif"},
  {label:"EB Garamond", value:"EB Garamond, serif"},
  {label:"Crimson Text", value:"Crimson Text, serif"},
  {label:"Georgia", value:"Georgia, serif"},
  {label:"Times New Roman", value:"Times New Roman, serif"},
  {label:"Fira Code", value:"Fira Code, monospace"},
  {label:"JetBrains Mono", value:"JetBrains Mono, monospace"},
  {label:"Source Code Pro", value:"Source Code Pro, monospace"},
  {label:"IBM Plex Mono", value:"IBM Plex Mono, monospace"},
  {label:"Roboto Mono", value:"Roboto Mono, monospace"},
  {label:"Courier New", value:"Courier New, monospace"},
  {label:"Menlo", value:"Menlo, monospace"},
  {label:"Inconsolata", value:"Inconsolata, monospace"},
  {label:"system-ui", value:"system-ui, sans-serif"},
  {label:"cursive", value:"cursive"},
];

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = (extra: any={}) => ({background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:6,padding:"9px 12px",fontSize:13,color:"var(--text-primary)",outline:"none",boxSizing:"border-box" as const,...extra});
const delBtn: any = {background:"none",border:"none",color:"var(--danger-text)",cursor:"pointer"};
const dupBtn: any = {background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:14,padding:0,lineHeight:1,title:"Duplicate"};
const rowBase: any = {padding:"8px 0",borderBottom:"1px solid var(--border-row)"};
const colHdr: any = {display:"flex",alignItems:"center",gap:8,padding:"0 0 8px",borderBottom:"1px solid var(--border-section)",marginBottom:4,paddingLeft:10};
const hdrStyle: any = {fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--text-secondary)",padding:"10px 0 6px",display:"flex",alignItems:"center",gap:8};
const tabBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid var(--border-input)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer"} as const;
const tabAddBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid var(--accent)",background:"var(--bg-accent-subtle)",color:"var(--accent-text)",cursor:"pointer"} as const;
const tabResetBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid var(--danger-border)",background:"var(--danger-bg)",color:"var(--danger-text)",cursor:"pointer"} as const;

// ── Shared components ─────────────────────────────────────────────────────────
function AddRowBtn({ onClick, label, disabled }: any) {
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px dashed var(--accent)",background:"var(--bg-accent-subtle)",color:"var(--accent-text)",cursor:disabled?"default":"pointer",opacity:disabled?0.4:1,marginTop:6,width:"100%",textAlign:"left"}}>{label}</button>;
}
function TabHeader({ title, description, actions, search, onSearch }: any) {
  return (
    <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid var(--border-section)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <span style={{fontSize:15,fontWeight:600}}>{title}</span>
        {actions && <div style={{flexShrink:0}}>{actions}</div>}
      </div>
      {description && <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:4}}>{description}</div>}
      {onSearch && <div style={{marginTop:10,position:"relative"}}>
        <input value={search||""} onChange={e=>onSearch(e.target.value)} placeholder="Filter tokens…" style={{width:"100%",background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:6,padding:"7px 30px 7px 12px",fontSize:12,color:"var(--text-primary)",outline:"none",boxSizing:"border-box"}} />
        {search && <button onClick={()=>onSearch("")} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text-secondary)",cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>}
      </div>}
    </div>
  );
}
function DragHandle({ onMouseEnter, onMouseLeave }: any) {
  return <div title="Drag to reorder" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{cursor:"grab",padding:"0 4px",color:"var(--text-secondary)",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>&#8959;</div>;
}
function useDraggable(setList: any) {
  const dragId = useRef<any>(null), overId = useRef<any>(null);
  const onDragStart = useCallback((id: any) => { dragId.current = id; }, []);
  const onDragOver  = useCallback((e: any, id: any) => { e.preventDefault(); overId.current = id; }, []);
  const onDrop = useCallback(() => {
    if (dragId.current===null||overId.current===null||dragId.current===overId.current) return;
    setList((prev: any[]) => {
      const from=prev.findIndex(i=>i.id===dragId.current), to=prev.findIndex(i=>i.id===overId.current);
      if(from===-1||to===-1) return prev;
      const next=[...prev]; const [item]=next.splice(from,1); next.splice(to,0,item); return next;
    });
    dragId.current=null; overId.current=null;
  }, [setList]);
  const onDragEnd = useCallback(() => { dragId.current=null; overId.current=null; }, []);
  return { onDragStart, onDragOver, onDrop, onDragEnd };
}
const GROUP_DRAG_TYPE = "application/x-group-drag";
function useGroupDrag(setList: any, mode: "string"|"id" = "string") {
  const onDragStart = useCallback((e: React.DragEvent, key: string) => {
    e.dataTransfer.setData(GROUP_DRAG_TYPE, key);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  }, []);
  const makeDropZone = useCallback((targetKey: string) => ({
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes(GROUP_DRAG_TYPE)) { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).style.borderTop = "2px solid var(--accent)"; } },
    onDragLeave: (e: React.DragEvent) => { (e.currentTarget as HTMLElement).style.borderTop = ""; },
    onDrop: (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.borderTop = "";
      const fromKey = e.dataTransfer.getData(GROUP_DRAG_TYPE);
      if (!fromKey || fromKey === targetKey) return;
      e.preventDefault(); e.stopPropagation();
      if (mode === "string") {
        setList((prev: string[]) => { const f=prev.indexOf(fromKey), t=prev.indexOf(targetKey); if(f<0||t<0)return prev; const n=[...prev]; const[m]=n.splice(f,1); n.splice(t,0,m); return n; });
      } else {
        setList((prev: any[]) => { const f=prev.findIndex((i: any)=>String(i.id)===fromKey), t=prev.findIndex((i: any)=>String(i.id)===targetKey); if(f<0||t<0)return prev; const n=[...prev]; const[m]=n.splice(f,1); n.splice(t,0,m); return n; });
      }
    },
  }), [setList, mode]);
  return { onDragStart, makeDropZone };
}
const PREVIEW_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const _measureCanvas = document.createElement("canvas");
function measureTextWidth(text: string, font: string) {
  const ctx = _measureCanvas.getContext("2d")!;
  ctx.font = font;
  return ctx.measureText(text).width;
}
function TextPreview({ style }: any) {
  const fontSize = (parseFloat(style.fontSize) || 16) + "px";
  const font = `${style.fontWeight} ${fontSize} ${style.fontFamily}`;
  const fullWidth = measureTextWidth(PREVIEW_TEXT, font);
  const w = Math.ceil(fullWidth / 2) + 8;
  return (
    <div style={{overflow:"hidden",padding:"4px 0",width:"100%",maxWidth:"100%"}} onMouseDown={e=>e.stopPropagation()} onDragStart={e=>e.stopPropagation()}>
      <span style={{fontFamily:style.fontFamily,fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:(parseFloat(style.letterSpacing)||0)+"px",textDecoration:style.textDecoration==="UNDERLINE"?"underline":style.textDecoration==="STRIKETHROUGH"?"line-through":"none",color:"var(--text-primary)",opacity:0.9,userSelect:"text",cursor:"text",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",wordBreak:"break-word",maxWidth:w}}>{PREVIEW_TEXT}</span>
    </div>
  );
}

const chkStyle: any = {accentColor:"#4f46e5",width:14,height:14,cursor:"pointer",flexShrink:0};
function DraggableRow({ id, dragHandlers, children, checked, onCheck }: any) {
  const [over, setOver] = useState(false), [hov, setHov] = useState(false);
  return (
    <div draggable={hov}
      onDragStart={() => dragHandlers.onDragStart(id)}
      onDragOver={(e: any) => { dragHandlers.onDragOver(e,id); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { dragHandlers.onDrop(); setOver(false); }}
      onDragEnd={() => { dragHandlers.onDragEnd(); setOver(false); }}
      style={{...rowBase,background:over?"var(--bg-drag-over)":checked?"var(--bg-selected)":"transparent",borderLeft:over?"2px solid var(--accent)":"2px solid transparent",paddingLeft:over?6:8,cursor:hov?"grab":"default",display:"flex",alignItems:"center",gap:8}}>
      {onCheck !== undefined && <input type="checkbox" checked={!!checked} onChange={()=>onCheck(id)} style={chkStyle} />}
      <DragHandle onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} />
      <div style={{flex:1}}>{children}</div>
    </div>
  );
}
function InlineLabel({ value, onCommit, prefix="", style={} }: any) {
  const [editing, setEditing] = useState(false), [val, setVal] = useState(value);
  if (editing) return <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>{if(e.key==="Enter"){onCommit(val);setEditing(false);}if(e.key==="Escape")setEditing(false);}} style={{background:"var(--bg-input)",border:"1px solid var(--accent)",borderRadius:4,padding:"2px 6px",color:"var(--text-primary)",outline:"none",width:66,fontFamily:"monospace",...style}} />;
  return <span onClick={() => { setVal(value); setEditing(true); }} title="Click to rename" style={{cursor:"pointer",borderBottom:"1px dashed var(--text-disabled)",paddingBottom:1,...style}}>{prefix}{value}</span>;
}
function PrimSelector({ value, primitives, primGroups, onChange, mode }: any) {
  const opts = getPrimOptions(primitives, primGroups);
  const isCustom = !value.startsWith("{primitives.");
  const resolved = resolveColor(value, primitives);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:20,height:20,borderRadius:4,background:resolved,border:"1px solid var(--border-input)",flexShrink:0}} />
        <span style={{fontSize:11,color:"var(--text-secondary)",fontFamily:"monospace"}}>{isCustom ? resolved : value.replace("{primitives.","").replace("}","")}</span>
      </div>
      <select value={isCustom?"custom":value} onChange={e=>{const v=e.target.value;if(v==="custom"){onChange(resolved);}else{onChange(v);}}} style={{background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:6,padding:"8px 10px",fontSize:12,color:"var(--text-secondary)",outline:"none",cursor:"pointer"}}>
        <optgroup label={"-- "+mode+" mode --"}>{opts.map(o=><option key={o.ref} value={o.ref} style={{background:"var(--bg-input)"}}>{o.label}</option>)}</optgroup>
      </select>
      {isCustom && <div style={{display:"flex",gap:6,alignItems:"center"}}><input type="color" value={resolved} onChange={e=>onChange(e.target.value)} style={{width:32,height:32,border:"none",background:"none",cursor:"pointer",padding:0}} /><input value={value} onChange={e=>onChange(e.target.value)} placeholder="#000000 or rgba(...)" style={{flex:1,background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:6,padding:"8px 10px",fontSize:12,color:"var(--text-primary)",outline:"none",fontFamily:"monospace"}} /></div>}
    </div>
  );
}

// ── Shadow components (unchanged) ─────────────────────────────────────────────
function parseShadow(str: string) {
  if (!str) return { x:0,y:4,blur:8,spread:0,color:"rgba(0,0,0,0.20)",inset:false };
  const inset=/\binset\b/.test(str), clean=str.replace(/\binset\b/,"").trim();
  const rgba=clean.match(/rgba?\([^)]+\)/), hex=clean.match(/#[0-9a-fA-F]{3,8}/);
  const color=rgba?rgba[0]:hex?hex[0]:"rgba(0,0,0,0.20)";
  const nums=clean.replace(color,"").trim().split(/\s+/).map(v=>parseFloat(v)||0);
  return { x:nums[0]||0,y:nums[1]||4,blur:nums[2]||8,spread:nums[3]||0,color,inset };
}
function buildShadow({ x,y,blur,spread,color,inset }: any) { return (inset?"inset ":"")+x+"px "+y+"px "+blur+"px "+spread+"px "+color; }
function ShadowSwatch({ value, active, onClick }: any) {
  return <div onClick={onClick} style={{width:64,height:40,background:"var(--shadow-preview-bg)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,boxSizing:"border-box",border:active?"2px solid var(--accent)":"2px solid transparent"}}><div style={{width:36,height:22,borderRadius:5,background:"var(--shadow-inner-bg)",boxShadow:value}} /></div>;
}
function ShadowSlider({ label, value, min, max, onChange }: any) {
  return <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"var(--text-secondary)",width:52,flexShrink:0}}>{label}</span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1,accentColor:"#4f46e5",cursor:"pointer"}} /><input type="number" value={value} onChange={e=>onChange(Number(e.target.value)||0)} style={inp({width:52,padding:"4px 6px",fontSize:11,textAlign:"center",fontFamily:"monospace"})} /><span style={{fontSize:11,color:"var(--text-secondary)",width:16,flexShrink:0}}>px</span></div>;
}
function ShadowPicker({ value, onChange }: any) {
  const p=parseShadow(value), set=(field: string,val: any)=>onChange(buildShadow({...p,[field]:val}));
  return <div style={{display:"flex",gap:20,alignItems:"center",background:"var(--bg-sunken)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"16px 20px",margin:"4px 0 10px 0"}}><div style={{width:110,height:90,background:"var(--shadow-preview-bg)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:64,height:44,borderRadius:7,background:"var(--shadow-inner-bg)",boxShadow:value}} /></div><div style={{flex:1,display:"flex",flexDirection:"column",gap:9}}><ShadowSlider label="X offset" value={p.x} min={-80} max={80} onChange={(v: any)=>set("x",v)} /><ShadowSlider label="Y offset" value={p.y} min={-80} max={80} onChange={(v: any)=>set("y",v)} /><ShadowSlider label="Blur" value={p.blur} min={0} max={120} onChange={(v: any)=>set("blur",v)} /><ShadowSlider label="Spread" value={p.spread} min={-40} max={60} onChange={(v: any)=>set("spread",v)} /><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"var(--text-secondary)",width:52,flexShrink:0}}>Color</span><input value={p.color} onChange={e=>set("color",e.target.value)} style={inp({flex:1,fontFamily:"monospace",fontSize:11,padding:"5px 8px"})} /><label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--text-tertiary)",cursor:"pointer",flexShrink:0,userSelect:"none"}}><input type="checkbox" checked={p.inset} onChange={e=>set("inset",e.target.checked)} style={{accentColor:"#4f46e5"}} />inset</label></div></div></div>;
}
function ShadowRow({ sh, dragHandlers, onChangeName, onChangeValue, onDelete, onDuplicate, checked, onCheck }: any) {
  const [open,setOpen]=useState(false), [hov,setHov]=useState(false);
  return <div style={{borderBottom:"1px solid var(--border-row)"}}><div draggable onDragStart={()=>dragHandlers.onDragStart(sh.id)} onDragOver={(e: any)=>dragHandlers.onDragOver(e,sh.id)} onDrop={()=>dragHandlers.onDrop()} onDragEnd={()=>dragHandlers.onDragEnd()} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0 8px 8px",cursor:hov?"grab":"default",background:checked?"var(--bg-selected)":"transparent"}}>{onCheck !== undefined && <input type="checkbox" checked={!!checked} onChange={()=>onCheck(sh.id)} style={chkStyle} />}<DragHandle onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} /><span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0,width:72}}>shadow /</span><input value={sh.name} onChange={e=>onChangeName(e.target.value)} style={inp({width:140,flexShrink:0})} /><input value={sh.value} onChange={e=>onChangeValue(e.target.value)} style={inp({flex:1,fontFamily:"monospace",fontSize:12,minWidth:0})} /><ShadowSwatch value={sh.value} active={open} onClick={()=>setOpen((o: boolean)=>!o)} /><button onClick={onDuplicate} style={dupBtn}>⧉</button><button onClick={onDelete} style={{...delBtn,fontSize:18,flexShrink:0}}>x</button></div>{open && <ShadowPicker value={sh.value} onChange={onChangeValue} />}</div>;
}

// ── Download panel ────────────────────────────────────────────────────────────
function DownloadPanel({ enabled, primGroups, primitives, colors, spacing, typography, textStyles, radius, borders, shadows, zindex, breakpoints, customCollections }: any) {
  const [fmt, setFmt] = useState<"dtcg"|"css"|"tailwind">("dtcg");

  const dtcgFiles = [
    { tab:"Primitives",   label:"primitives.json",     name:"primitives.json",     gen:() => genPrimitivesJSON(primGroups,primitives)     },
    { tab:"Colors",       label:"colors-light.json",   name:"colors-light.json",   gen:() => genColorsJSON(colors,primitives,"light")     },
    { tab:"Colors",       label:"colors-dark.json",    name:"colors-dark.json",    gen:() => genColorsJSON(colors,primitives,"dark")      },
    { tab:"Spacing",      label:"spacing.json",        name:"spacing.json",        gen:() => genSpacingJSON(spacing)                      },
    { tab:"Typography",   label:"typography.json",     name:"typography.json",     gen:() => genTypographyJSON(typography)                },
    { tab:"Text Styles",  label:"text-styles.json",    name:"text-styles.json",    gen:() => genTextStylesJSON(textStyles)                },
    { tab:"Radius",       label:"radius.json",         name:"radius.json",         gen:() => genRadiusJSON(radius)                        },
    { tab:"Border",       label:"border-width.json",   name:"border-width.json",   gen:() => genBorderJSON(borders)                       },
    { tab:"Shadows",      label:"shadows.json",        name:"shadows.json",        gen:() => genShadowsJSON(shadows)                      },
    { tab:"Z-Index",      label:"z-index.json",        name:"z-index.json",        gen:() => genZIndexJSON(zindex)                        },
    { tab:"Breakpoints",  label:"breakpoints.json",    name:"breakpoints.json",    gen:() => genBreakpointsJSON(breakpoints)              },
    ...(customCollections||[]).map((c: any) => ({ tab:c.name, label:c.jsonKey+".json", name:c.jsonKey+".json", gen:()=>genCustomJSON(c.items,c.groups) })),
  ];
  const cssFiles = [
    { tab:"Primitives",   label:"primitives.css",      name:"primitives.css",      gen:() => genPrimitivesCSS(primGroups,primitives)      },
    { tab:"Colors",       label:"colors-light.css",    name:"colors-light.css",    gen:() => genColorsCSS(colors,primitives,"light")      },
    { tab:"Colors",       label:"colors-dark.css",     name:"colors-dark.css",     gen:() => genColorsCSS(colors,primitives,"dark")       },
    { tab:"Spacing",      label:"spacing.css",         name:"spacing.css",         gen:() => genSpacingCSS(spacing)                       },
    { tab:"Typography",   label:"typography.css",      name:"typography.css",      gen:() => genTypographyCSS(typography)                 },
    { tab:"Text Styles",  label:"text-styles.css",     name:"text-styles.css",     gen:() => genTextStylesCSS(textStyles)                 },
    { tab:"Radius",       label:"radius.css",          name:"radius.css",          gen:() => genRadiusCSS(radius)                         },
    { tab:"Border",       label:"border-width.css",    name:"border-width.css",    gen:() => genBorderCSS(borders)                        },
    { tab:"Shadows",      label:"shadows.css",         name:"shadows.css",         gen:() => genShadowsCSS(shadows)                       },
    { tab:"Z-Index",      label:"z-index.css",         name:"z-index.css",         gen:() => genZIndexCSS(zindex)                         },
    { tab:"Breakpoints",  label:"breakpoints.css",     name:"breakpoints.css",     gen:() => genBreakpointsCSS(breakpoints)               },
    ...(customCollections||[]).map((c: any) => ({ tab:c.name, label:c.jsonKey+".css", name:c.jsonKey+".css", gen:()=>genCustomCSS(c.items,c.groups,c.jsonKey) })),
  ];
  const twFiles = [
    { tab:"Primitives",   label:"primitives.tw.json",  name:"primitives.tw.json",  gen:() => genPrimitivesTW(primGroups,primitives)       },
    { tab:"Colors",       label:"colors-light.tw.json",name:"colors-light.tw.json",gen:() => genColorsTW(colors,primitives,"light")       },
    { tab:"Colors",       label:"colors-dark.tw.json", name:"colors-dark.tw.json", gen:() => genColorsTW(colors,primitives,"dark")        },
    { tab:"Spacing",      label:"spacing.tw.json",     name:"spacing.tw.json",     gen:() => genSpacingTW(spacing)                        },
    { tab:"Typography",   label:"typography.tw.json",  name:"typography.tw.json",  gen:() => genTypographyTW(typography)                  },
    { tab:"Radius",       label:"radius.tw.json",      name:"radius.tw.json",      gen:() => genRadiusTW(radius)                          },
    { tab:"Border",       label:"border.tw.json",      name:"border.tw.json",      gen:() => genBorderTW(borders)                         },
    { tab:"Shadows",      label:"shadows.tw.json",     name:"shadows.tw.json",     gen:() => genShadowsTW(shadows)                        },
    { tab:"Z-Index",      label:"z-index.tw.json",     name:"z-index.tw.json",     gen:() => genZIndexTW(zindex)                          },
    { tab:"Breakpoints",  label:"screens.tw.json",     name:"screens.tw.json",     gen:() => genBreakpointsTW(breakpoints)                },
  ];

  const allFiles = (fmt === "dtcg" ? dtcgFiles : fmt === "css" ? cssFiles : twFiles).filter(f => enabled.has(f.tab));
  const [checked, setChecked] = useState(() => new Set(allFiles.map(f => f.name)));
  const allChecked = allFiles.length > 0 && checked.size === allFiles.length;
  const toggle = (name: string) => setChecked(prev => { const next=new Set(prev); next.has(name)?next.delete(name):next.add(name); return next; });
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(allFiles.map(f => f.name)));
  const downloadSelected = () => allFiles.filter(f => checked.has(f.name)).forEach(f => {
    const content = f.gen();
    f.name.endsWith(".css") ? dlText(content, f.name) : dlJSON(content, f.name);
  });

  const fmtBtnStyle = (active: boolean) => ({fontSize:11,padding:"5px 10px",borderRadius:5,border:"1px solid "+(active?"var(--accent)":"var(--border-input)"),background:active?"var(--accent)":"transparent",color:active?"#fff":"var(--text-secondary)",cursor:"pointer",fontWeight:active?600:400});

  return (
    <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:16,minWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
      {fmt === "dtcg" && <div style={{background:"var(--bg-sunken)",border:"1px solid var(--border-section)",borderRadius:7,padding:"10px 12px",marginBottom:12,fontSize:11,color:"var(--text-secondary)",lineHeight:1.7}}>
        <b style={{color:"var(--text-tertiary)"}}>How to import into Figma:</b><br />
        1. Open the Local Variables panel<br />
        2. Use the plugin's <b style={{color:"var(--accent-highlight)"}}>Import Variables</b> tab<br />
        3. For <b style={{color:"var(--accent-highlight)"}}>Text Styles</b>: ensure fonts are installed locally
      </div>}
      <div style={{display:"flex",gap:4,marginBottom:12}}>
        <button onClick={()=>{setFmt("dtcg");setChecked(new Set());}} style={fmtBtnStyle(fmt==="dtcg")}>DTCG JSON</button>
        <button onClick={()=>{setFmt("css");setChecked(new Set());}} style={fmtBtnStyle(fmt==="css")}>CSS Variables</button>
        <button onClick={()=>{setFmt("tailwind");setChecked(new Set());}} style={fmtBtnStyle(fmt==="tailwind")}>Tailwind</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",marginBottom:4,borderRadius:6,background:"var(--bg-sunken)",border:"1px solid var(--border-section)"}}>
        <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{accentColor:"#4f46e5",width:14,height:14,cursor:"pointer",flexShrink:0}} />
        <span style={{fontSize:12,color:"var(--text-tertiary)",flex:1}}>{allChecked ? "Deselect all" : "Select all"}</span>
        <span style={{fontSize:11,color:"var(--text-secondary)"}}>{checked.size} / {allFiles.length} selected</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:12}}>
        {allFiles.map(f => (
          <label key={f.name} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,cursor:"pointer",background:checked.has(f.name)?"var(--bg-selected)":"transparent"}}>
            <input type="checkbox" checked={checked.has(f.name)} onChange={() => toggle(f.name)} style={{accentColor:"#4f46e5",width:14,height:14,cursor:"pointer",flexShrink:0}} />
            <span style={{fontSize:12,color:checked.has(f.name)?"var(--text-muted)":"var(--text-disabled)",fontFamily:"monospace",flex:1}}>{f.label}</span>
            <span style={{fontSize:11,color:"var(--text-disabled)"}}>{f.tab}</span>
          </label>
        ))}
      </div>
      <button onClick={downloadSelected} disabled={checked.size===0} style={{width:"100%",padding:"9px 0",borderRadius:7,border:"none",background:checked.size===0?"var(--bg-input)":"var(--accent)",color:checked.size===0?"var(--text-disabled)":"#fff",fontWeight:600,fontSize:13,cursor:checked.size===0?"not-allowed":"pointer"}}>
        ↓ Download {checked.size} file{checked.size!==1?"s":""}
      </button>
    </div>
  );
}

// ── localStorage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = "figma-variables-generator";
function loadSaved() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const saved = useRef(loadSaved()).current;
  const [tab, setTab]                   = useState(saved?.tab || "Primitives");
  const [enabledTabs, setEnabledTabs]   = useState(() => saved?.enabledTabs ? new Set<string>(saved.enabledTabs) : DEFAULT_ENABLED);
  const [primGroups,  setPrimGroups]    = useState(() => saved?.primGroups || buildDefaultPrimGroups());
  const [primitives,  setPrimitives]    = useState(() => saved?.primitives || buildDefaultPrimitives());
  const [colorGroups, setColorGroups]   = useState(saved?.colorGroups || DEFAULT_COLOR_GROUPS);
  const [colors,      setColors]        = useState(saved?.colors || defaultColors);
  const [spacing,     setSpacing]       = useState(saved?.spacing || defaultSpacing);
  const [typography,  setTypography]    = useState(saved?.typography || defaultTypography);
  const [textStyles,  setTextStyles]    = useState(saved?.textStyles || defaultTextStyles);
  const [tsGroups,    setTsGroups]      = useState(saved?.tsGroups || DEFAULT_TS_GROUPS);
  const [radius,      setRadius]        = useState(saved?.radius || defaultRadius);
  const [borders,     setBorders]       = useState(saved?.borders || defaultBorders);
  const [shadows,     setShadows]       = useState(saved?.shadows || defaultShadows);
  const [zindex,      setZIndex]        = useState(saved?.zindex || defaultZIndex);
  const [breakpoints, setBreakpoints]   = useState(saved?.breakpoints || defaultBreakpoints);
  const [customCollections, setCustomCollections] = useState<any[]>(saved?.customCollections || []);
  const [showPreview,      setShowPreview]      = useState(false);
  const [showDl,           setShowDl]           = useState(false);
  const [theme, setTheme] = useState<"dark"|"light">(() => saved?.theme || "dark");
  const [copied,           setCopied]           = useState(false);
  const [importError,      setImportError]      = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const fileRef = useRef<any>();
  const ccDragRef = useRef<Record<number, { dragId: number|null, overId: number|null }>>({});

  const toggleSelect = useCallback((id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSelectAll = useCallback((ids: number[]) => setSelected(prev => {
    const n = new Set(prev); const all = ids.every(id => n.has(id));
    ids.forEach(id => all ? n.delete(id) : n.add(id)); return n;
  }), []);
  const selectAllChk = (ids: number[]) => {
    const all = ids.length > 0 && ids.every(id => selected.has(id));
    return <input type="checkbox" checked={all} onChange={() => toggleSelectAll(ids)} style={chkStyle} />;
  };

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  const historyRef = useRef<any[]>([]);
  const historyPos = useRef(-1);
  const isUndoRedo = useRef(false);
  const MAX_HISTORY = 100;

  const getSnapshot = useCallback(() => ({
    tab, enabledTabs: [...enabledTabs], primGroups, primitives, colorGroups, colors,
    spacing, typography, textStyles, tsGroups, radius, borders, shadows, zindex, breakpoints, customCollections,
  }), [tab, enabledTabs, primGroups, primitives, colorGroups, colors, spacing, typography, textStyles, tsGroups, radius, borders, shadows, zindex, breakpoints, customCollections]);

  const applySnapshot = useCallback((s: any) => {
    isUndoRedo.current = true;
    setTab(s.tab); setEnabledTabs(new Set(s.enabledTabs));
    setPrimGroups(s.primGroups); setPrimitives(s.primitives);
    setColorGroups(s.colorGroups); setColors(s.colors);
    setSpacing(s.spacing); setTypography(s.typography);
    setTextStyles(s.textStyles); setTsGroups(s.tsGroups);
    setRadius(s.radius); setBorders(s.borders); setShadows(s.shadows);
    setZIndex(s.zindex); setBreakpoints(s.breakpoints);
    setCustomCollections(s.customCollections);
  }, []);

  const undo = useCallback(() => {
    if (historyPos.current <= 0) return;
    historyPos.current--;
    applySnapshot(historyRef.current[historyPos.current]);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyPos.current >= historyRef.current.length - 1) return;
    historyPos.current++;
    applySnapshot(historyRef.current[historyPos.current]);
  }, [applySnapshot]);

  const canUndo = historyPos.current > 0;
  const canRedo = historyPos.current < historyRef.current.length - 1;

  // Push to history & save to localStorage on state change
  useEffect(() => {
    const snap = getSnapshot();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({...snap, theme})); } catch { /* quota exceeded */ }
    if (isUndoRedo.current) { isUndoRedo.current = false; return; }
    const h = historyRef.current;
    // Truncate any redo states
    if (historyPos.current < h.length - 1) h.splice(historyPos.current + 1);
    h.push(snap);
    if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
    historyPos.current = h.length - 1;
  }, [getSnapshot, theme]);

  // Apply theme via data attribute (CSS variables defined in index.css)
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  // Keyboard shortcuts: Ctrl+Z / Cmd+Z = undo, Ctrl+Shift+Z / Cmd+Shift+Z = redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
      if (e.key === "Escape") setSelected(new Set());
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const allTabs = [...ALL_TABS, ...customCollections.map((c: any) => c.name)];

  const addCustomCollection = () => {
    const id = uid();
    const name = "Custom " + id;
    setCustomCollections(cc => [...cc, { id, name, jsonKey: "custom-" + id, items: [], groups: [{ name: "default", type: "number", unit: "", locked: false }], locked: false }]);
    setEnabledTabs(prev => { const next = new Set(prev); next.add(name); return next; });
    setTab(name);
  };
  const updateCustomCollection = (id: number, field: string, val: any) =>
    setCustomCollections(cc => cc.map(c => c.id === id ? { ...c, [field]: val } : c));
  const deleteCustomCollection = (id: number) => {
    const c = customCollections.find(x => x.id === id);
    if (!c) return;
    setCustomCollections(cc => cc.filter(x => x.id !== id));
    setEnabledTabs(prev => { const next = new Set(prev); next.delete(c.name); return next; });
    if (tab === c.name) setTab(ALL_TABS[0]);
  };
  const updateCustomItem = (collId: number, itemId: number, field: string, val: string) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, items: c.items.map((i: any) => i.id === itemId ? { ...i, [field]: val } : i) } : c));
  const deleteCustomItem = (collId: number, itemId: number) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, items: c.items.filter((i: any) => i.id !== itemId) } : c));
  const dupCustomItem = (collId: number, itemId: number) =>
    setCustomCollections(cc => cc.map(c => { if (c.id !== collId) return c; const idx=c.items.findIndex((i: any)=>i.id===itemId); if(idx<0)return c; const copy={...c.items[idx],id:uid(),name:c.items[idx].name+" copy"}; const items=[...c.items]; items.splice(idx+1,0,copy); return {...c,items}; }));
  const addCustomItem = (collId: number, group: string) =>
    setCustomCollections(cc => cc.map(c => {
      if (c.id !== collId) return c;
      const g = c.groups.find((gr: any) => gr.name === group) || c.groups[0];
      const defVal = g.type === "color" ? "{primitives.blue.600}" : g.type === "fontFamily" ? "Inter, sans-serif" : "0";
      return { ...c, items: [...c.items, { id: uid(), name: "new", group, value: defVal }] };
    }));
  const addCustomGroup = (collId: number) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: [...(c.groups || []), { name: "group-" + uid(), type: "number", unit: "", locked: false }] } : c));
  const renameCustomGroup = (collId: number, oldName: string, newName: string) => {
    const t = newName.trim(); if (!t) return;
    setCustomCollections(cc => cc.map(c => {
      if (c.id !== collId) return c;
      if (c.groups.some((g: any) => g.name === t) && t !== oldName) return c;
      return { ...c, groups: c.groups.map((g: any) => g.name === oldName ? { ...g, name: t } : g), items: c.items.map((i: any) => i.group === oldName ? { ...i, group: t } : i) };
    }));
  };
  const updateCustomGroup = (collId: number, groupName: string, field: string, val: string) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: c.groups.map((g: any) => g.name === groupName ? { ...g, [field]: val } : g) } : c));
  const deleteCustomGroup = (collId: number, groupName: string) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: c.groups.filter((g: any) => g.name !== groupName), items: c.items.filter((i: any) => i.group !== groupName) } : c));

  const toggleTab = (t: string) => setEnabledTabs(prev => {
    const next = new Set(prev);
    if (next.has(t)) { next.delete(t); if (tab===t) { const fb=allTabs.find(x=>next.has(x)); if(fb) setTab(fb); } }
    else { next.add(t); setTab(t); }
    return next;
  });

  const colorDrag      = useDraggable(setColors);
  const spacingDrag    = useDraggable(setSpacing);
  const textStylesDrag = useDraggable(setTextStyles);
  const radiusDrag     = useDraggable(setRadius);
  const borderDrag     = useDraggable(setBorders);
  const shadowDrag     = useDraggable(setShadows);
  const zDrag          = useDraggable(setZIndex);
  const breakpointDrag = useDraggable(setBreakpoints);
  const typFamDrag     = useDraggable((l: any) => setTypography((t: any) => ({...t,families:l})));
  const typSizeDrag    = useDraggable((l: any) => setTypography((t: any) => ({...t,sizes:l})));
  const typWgtDrag     = useDraggable((l: any) => setTypography((t: any) => ({...t,weights:l})));
  const typLhDrag      = useDraggable((l: any) => setTypography((t: any) => ({...t,lineHeights:l})));
  const typoDragMap: any = { families:typFamDrag, sizes:typSizeDrag, weights:typWgtDrag, lineHeights:typLhDrag };
  const primGroupDrag   = useGroupDrag(setPrimGroups, "id");
  const colorGroupDrag  = useGroupDrag(setColorGroups, "string");
  const tsGroupDrag     = useGroupDrag(setTsGroups, "string");

  const updateTextStyle = (id: number, field: string, val: string) =>
    setTextStyles(ts => ts.map(s => s.id===id ? {...s,[field]:val} : s));
  const deleteTextStyle = (id: number) =>
    setTextStyles(ts => ts.filter(s => s.id!==id));
  const dupTextStyle = (id: number) =>
    setTextStyles(ts => { const idx=ts.findIndex(s=>s.id===id); if(idx<0)return ts; const copy={...ts[idx],id:uid(),name:ts[idx].name+" copy"}; const next=[...ts]; next.splice(idx+1,0,copy); return next; });
  const addTextStyle = (group: string) =>
    setTextStyles(ts => [...ts, {id:uid(),group,name:"new",fontFamily:"Inter, sans-serif",fontSize:"16",fontWeight:"400",lineHeight:"1.5",letterSpacing:"0",paragraphSpacing:"0",textDecoration:"NONE"}]);
  const addTsGroup = () => { const g="group-"+uid(); setTsGroups(gs=>[...gs,g]); };
  const renameTsGroup = (o: string, n: string) => {
    const t=n.trim(); if(!t||(tsGroups.includes(t)&&t!==o)) return;
    setTsGroups(gs=>gs.map(x=>x===o?t:x)); setTextStyles(ts=>ts.map(s=>s.group===o?{...s,group:t}:s));
  };
  const deleteTsGroup = (g: string) => { setTsGroups(gs=>gs.filter(x=>x!==g)); setTextStyles(ts=>ts.filter(s=>s.group!==g)); };

  const previewJSON = () => {
    if (tab==="Primitives")   return genPrimitivesJSON(primGroups, primitives);
    if (tab==="Colors")       return "// Light mode\n"+genColorsJSON(colors,primitives,"light")+"\n\n// Dark mode\n"+genColorsJSON(colors,primitives,"dark");
    if (tab==="Spacing")      return genSpacingJSON(spacing);
    if (tab==="Typography")   return genTypographyJSON(typography);
    if (tab==="Text Styles")  return genTextStylesJSON(textStyles);
    if (tab==="Radius")       return genRadiusJSON(radius);
    if (tab==="Border")       return genBorderJSON(borders);
    if (tab==="Shadows")      return genShadowsJSON(shadows);
    if (tab==="Z-Index")      return genZIndexJSON(zindex);
    if (tab==="Breakpoints")  return genBreakpointsJSON(breakpoints);
    const cc = customCollections.find(c => c.name === tab);
    if (cc) return genCustomJSON(cc.items, cc.groups);
    return "";
  };

  const copy = () => { navigator.clipboard.writeText(previewJSON()); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const handleReset = () => {
    setPrimGroups(buildDefaultPrimGroups()); setPrimitives(buildDefaultPrimitives());
    setColors(defaultColors); setColorGroups(DEFAULT_COLOR_GROUPS);
    setSpacing(defaultSpacing); setTypography(defaultTypography);
    setTextStyles(defaultTextStyles); setTsGroups(DEFAULT_TS_GROUPS);
    setRadius(defaultRadius); setBorders(defaultBorders); setShadows(defaultShadows);
    setZIndex(defaultZIndex); setBreakpoints(defaultBreakpoints);
    setCustomCollections([]); setEnabledTabs(new Set(ALL_TABS)); setTab("Primitives");
    setShowResetConfirm(false); setImportError("");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const handleImport = (e: any) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      try {
        const data = JSON.parse(ev.target.result); setImportError("");
        if (tab==="Primitives") {
          if (data.primitives) { const ng: any[]=[],np: any={}; let gi=900; Object.entries(data.primitives).forEach(([k,v]: any)=>{ if(k==="$description")return; if(k==="base"){np.base={};Object.entries(v).forEach(([kk,vv]: any)=>{if(vv?.["$value"])np.base[kk]=vv["$value"]});return;} if(typeof v==="object"){const sh=Object.keys(v).filter((s: string)=>v[s]?.["$value"]);ng.push({id:gi++,key:k,label:k.charAt(0).toUpperCase()+k.slice(1),shades:sh});np[k]={};sh.forEach((s: string)=>{np[k][s]=v[s]["$value"]});}}); if(ng.length){setPrimGroups(ng);setPrimitives(np);} else setImportError("No primitives found in file."); }
          else setImportError("No primitives found in file.");
        }
        else if (tab==="Colors") {
          if (data.color) { const cols: any[]=[]; let id=1000; const grps=new Set<string>(); Object.entries(data.color).forEach(([g,tokens]: any)=>{if(typeof tokens!=="object"||tokens["$value"])return;grps.add(g);Object.entries(tokens).forEach(([n,t]: any)=>{if(t["$value"])cols.push({id:id++,group:g,name:n,light:t["$value"],dark:t["$extensions"]?.mode?.dark||t["$value"],description:t["$description"]||""});})}); if(cols.length){setColors(cols);setColorGroups([...grps]);} else setImportError("No color tokens found in file."); }
          else setImportError("No color tokens found in file.");
        }
        else if (tab==="Spacing") {
          if (data.spacing) { const sp: any[]=[]; let id=2000; Object.entries(data.spacing).forEach(([n,t]: any)=>{if(t["$value"])sp.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})}); if(sp.length)setSpacing(sp); else setImportError("No spacing tokens found in file."); }
          else setImportError("No spacing tokens found in file.");
        }
        else if (tab==="Border") {
          if (data["border-width"]) { const b: any[]=[]; let id=3500; Object.entries(data["border-width"]).forEach(([n,t]: any)=>{if(t["$value"])b.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})}); if(b.length)setBorders(b); else setImportError("No border tokens found in file."); }
          else setImportError("No border tokens found in file.");
        }
        else if (tab==="Radius") {
          if (data.radius) { const r: any[]=[]; let id=3000; Object.entries(data.radius).forEach(([n,t]: any)=>{if(t["$value"])r.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})}); if(r.length)setRadius(r); else setImportError("No radius tokens found in file."); }
          else setImportError("No radius tokens found in file.");
        }
        else if (tab==="Text Styles") {
          const ts: any[]=[]; let id=9900; const grps: string[]=[];
          Object.entries(data).forEach(([g,tokens]: any)=>{
            if(typeof tokens!=="object")return;
            const hasTextStyles=Object.values(tokens).some((t: any)=>t&&t["$type"]==="textStyle");
            if(!hasTextStyles)return;
            if(!grps.includes(g))grps.push(g);
            Object.entries(tokens).forEach(([n,t]: any)=>{
              if(t["$type"]!=="textStyle"||!t["$value"])return;
              const v=t["$value"];
              ts.push({id:id++,group:g,name:n,fontFamily:v.fontFamily||"Inter, sans-serif",fontSize:String(typeof v.fontSize==="object"?v.fontSize.value:v.fontSize||16),fontWeight:String(v.fontWeight||400),lineHeight:String(typeof v.lineHeight==="object"?v.lineHeight.value:v.lineHeight||1.5),letterSpacing:String(typeof v.letterSpacing==="object"?v.letterSpacing.value:v.letterSpacing||0),paragraphSpacing:String(typeof v.paragraphSpacing==="object"?v.paragraphSpacing.value:v.paragraphSpacing||0),textDecoration:v.textDecoration||"NONE"});
            });
          });
          if(ts.length){setTextStyles(ts);setTsGroups(grps);} else setImportError("No text styles found in file.");
        }
        else if (tab==="Typography") { setImportError("Typography import not yet supported."); }
        else if (tab==="Shadows") { setImportError("Shadows import not yet supported."); }
        else if (tab==="Z-Index") { setImportError("Z-Index import not yet supported."); }
        else if (tab==="Breakpoints") { setImportError("Breakpoints import not yet supported."); }
        else {
          const cc = customCollections.find(c => c.name === tab);
          if (cc) {
            const key = Object.keys(data).find(k => k !== "$description") || cc.jsonKey;
            const tokens = data[key] || data;
            const items: any[] = []; let id = 8000;
            Object.entries(tokens).forEach(([n, t]: any) => {
              if (t?.["$value"] !== undefined) {
                const val = typeof t["$value"] === "object" ? String(t["$value"].value) : String(t["$value"]);
                items.push({ id: id++, name: n, value: val });
              }
            });
            if (items.length) {
              setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, items } : c));
            } else setImportError("No tokens found in file.");
          }
        }
      } catch { setImportError("Invalid JSON."); }
    };
    reader.readAsText(file); e.target.value="";
  };

  const updateColor = (id: number, f: string, v: any) => setColors(c => c.map(i => i.id===id ? {...i,[f]:v} : i));
  const dupColor    = (id: number) => setColors(c => { const idx=c.findIndex(i=>i.id===id); if(idx<0)return c; const copy={...c[idx],id:uid(),name:c[idx].name+" copy"}; const next=[...c]; next.splice(idx+1,0,copy); return next; });
  const updateList  = (setter: any, id: number, f: string, v: any) => setter((prev: any[]) => prev.map(i => i.id===id ? {...i,[f]:v} : i));
  const deleteList  = (setter: any, id: number) => setter((prev: any[]) => prev.filter(i => i.id!==id));
  const dupInList   = (setter: any, id: number) => setter((prev: any[]) => { const idx=prev.findIndex(i=>i.id===id); if(idx<0)return prev; const copy={...prev[idx],id:uid(),name:prev[idx].name+" copy"}; const next=[...prev]; next.splice(idx+1,0,copy); return next; });

  const renamePrimGroup = (oldKey: string, newLabel: string) => {
    const t=newLabel.trim(); if(!t)return; const nk=t.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    if(!nk||(nk!==oldKey&&primGroups.some(g=>g.key===nk)))return;
    setPrimGroups(gs=>gs.map(g=>g.key===oldKey?{...g,key:nk,label:t}:g));
    setPrimitives((p: any)=>{const n={...p};n[nk]=n[oldKey];if(nk!==oldKey)delete n[oldKey];return n;});
    setColors(cs=>cs.map(c=>({...c,light:c.light.replace("{primitives."+oldKey+".","{primitives."+nk+"."),dark:c.dark.replace("{primitives."+oldKey+".","{primitives."+nk+".")})));
  };
  const deletePrimGroup = (key: string) => { setPrimGroups(gs=>gs.filter(g=>g.key!==key)); setPrimitives((p: any)=>{const n={...p};delete n[key];return n;}); };
  const addPrimGroup    = () => { const key="palette"+uid(); setPrimGroups(gs=>[...gs,{id:uid(),key,label:"New Palette",shades:["500"]}]); setPrimitives((p: any)=>({...p,[key]:{"500":"#808080"}})); };
  const addShade        = (gk: string) => { setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:[...g.shades,"new"]}:g)); setPrimitives((p: any)=>({...p,[gk]:{...p[gk],new:"#808080"}})); };
  const removeShade     = (gk: string, s: string) => { setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:g.shades.filter((x: string)=>x!==s)}:g)); setPrimitives((p: any)=>{const n={...p,[gk]:{...p[gk]}};delete n[gk][s];return n;}); };
  const renameShade     = (gk: string, os: string, ns: string) => {
    const t=ns.trim(); if(!t||t===os)return; if(primGroups.find(g=>g.key===gk)?.shades.includes(t))return;
    setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:g.shades.map((s: string)=>s===os?t:s)}:g));
    setPrimitives((p: any)=>{const n={...p,[gk]:{...p[gk]}};n[gk][t]=n[gk][os];delete n[gk][os];return n;});
    setColors(cs=>cs.map(c=>({...c,light:c.light.replace("{primitives."+gk+"."+os+"}","{primitives."+gk+"."+t+"}"),dark:c.dark.replace("{primitives."+gk+"."+os+"}","{primitives."+gk+"."+t+"}")})));
  };
  const addColorGroup    = () => setColorGroups((g: string[])=>[...g,"group-"+uid()]);
  const renameColorGroup = (o: string, n: string) => { const t=n.trim(); if(!t||(colorGroups.includes(t)&&t!==o))return; setColorGroups((g: string[])=>g.map((x: string)=>x===o?t:x)); setColors(c=>c.map(i=>i.group===o?{...i,group:t}:i)); };
  const deleteColorGroup = (n: string) => { setColorGroups((g: string[])=>g.filter((x: string)=>x!==n)); setColors(c=>c.filter(i=>i.group!==n)); };
  const groupedColors = colorGroups.reduce((a: any, g: string) => { a[g]=colors.filter(c=>c.group===g); return a; }, {});
  const bpRange = (b: any) => (b.value?">= "+b.value+"px":"0")+(b.max?" and < "+b.max+"px":"");
  const groupedTextStyles = tsGroups.reduce((a: any, g: string) => { a[g]=textStyles.filter(s=>s.group===g); return a; }, {});


  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const bulkDelete = () => {
    const ids = selected;
    if (tab==="Colors")      setColors(c=>c.filter(i=>!ids.has(i.id)));
    else if (tab==="Spacing")     setSpacing(s=>s.filter(i=>!ids.has(i.id)));
    else if (tab==="Typography")  setTypography((t: any)=>({...t,families:t.families.filter((i: any)=>!ids.has(i.id)),sizes:t.sizes.filter((i: any)=>!ids.has(i.id)),weights:t.weights.filter((i: any)=>!ids.has(i.id)),lineHeights:t.lineHeights.filter((i: any)=>!ids.has(i.id))}));
    else if (tab==="Text Styles") setTextStyles(ts=>ts.filter(s=>!ids.has(s.id)));
    else if (tab==="Radius")      setRadius(r=>r.filter(i=>!ids.has(i.id)));
    else if (tab==="Border")      setBorders(b=>b.filter(i=>!ids.has(i.id)));
    else if (tab==="Shadows")     setShadows(s=>s.filter(i=>!ids.has(i.id)));
    else if (tab==="Z-Index")     setZIndex(z=>z.filter(i=>!ids.has(i.id)));
    else if (tab==="Breakpoints") setBreakpoints(b=>b.filter(i=>!ids.has(i.id)));
    else { const cc=customCollections.find(c=>c.name===tab); if(cc) setCustomCollections(ccs=>ccs.map(c=>c.id===cc.id?{...c,items:c.items.filter((i: any)=>!ids.has(i.id))}:c)); }
    setSelected(new Set());
  };
  const bulkApply = (field: string, value: any) => {
    const ids = selected;
    if (tab==="Colors")      setColors(c=>c.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Text Styles") setTextStyles(ts=>ts.map(s=>ids.has(s.id)?{...s,[field]:value}:s));
    else if (tab==="Spacing")     setSpacing(s=>s.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Radius")      setRadius(r=>r.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Border")      setBorders(b=>b.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Z-Index")     setZIndex(z=>z.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Breakpoints") setBreakpoints(b=>b.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else { const cc=customCollections.find(c=>c.name===tab); if(cc) setCustomCollections(ccs=>ccs.map(c=>c.id===cc.id?{...c,items:c.items.map((i: any)=>ids.has(i.id)?{...i,[field]:value}:i)}:c)); }
  };


  const [tabResetConfirm, setTabResetConfirm] = useState(false);
  const resetTab = () => {
    if (tab==="Primitives")  { setPrimGroups(buildDefaultPrimGroups()); setPrimitives(buildDefaultPrimitives()); }
    else if (tab==="Colors")      { setColors(defaultColors); setColorGroups(DEFAULT_COLOR_GROUPS); }
    else if (tab==="Spacing")     { setSpacing(defaultSpacing); }
    else if (tab==="Typography")  { setTypography(defaultTypography); }
    else if (tab==="Text Styles") { setTextStyles(defaultTextStyles); setTsGroups(DEFAULT_TS_GROUPS); }
    else if (tab==="Radius")      { setRadius(defaultRadius); }
    else if (tab==="Border")      { setBorders(defaultBorders); }
    else if (tab==="Shadows")     { setShadows(defaultShadows); }
    else if (tab==="Z-Index")     { setZIndex(defaultZIndex); }
    else if (tab==="Breakpoints") { setBreakpoints(defaultBreakpoints); }
    else {
      const cc = customCollections.find(c => c.name === tab);
      if (cc) {
        const newName = "Custom " + cc.id;
        setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, name: newName, jsonKey: "custom-" + cc.id, items: [], groups: [{ name: "default", type: "number", unit: "", locked: false }], locked: false } : c));
        setEnabledTabs(prev => { const next = new Set(prev); next.delete(cc.name); next.add(newName); return next; });
        setTab(newName);
      }
    }
    setTabResetConfirm(false);
  };

  const tabActionBtns = <>{importError && <span style={{fontSize:12,color:"var(--danger-text)"}}>{importError}</span>}
    <button onClick={()=>fileRef.current.click()} style={tabBtnStyle}>Import JSON</button>
    <button onClick={()=>setShowPreview(v=>!v)} style={tabBtnStyle}>{showPreview?"Hide Preview":"Preview JSON"}</button>
    <button onClick={copy} style={tabBtnStyle}>{copied?"Copied!":"Copy JSON"}</button>
    {tabResetConfirm ? <>
      <span style={{fontSize:12,color:"var(--danger-text)"}}>Reset {tab}?</span>
      <button onClick={resetTab} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"none",background:"var(--danger-btn)",color:"#fff",cursor:"pointer",fontWeight:600}}>Yes</button>
      <button onClick={()=>setTabResetConfirm(false)} style={tabBtnStyle}>Cancel</button>
    </> : <button onClick={()=>setTabResetConfirm(true)} style={tabResetBtnStyle}>Reset</button>}
  </>;
  const tabActions = (extra?: any) => <div style={{display:"flex",gap:8,alignItems:"center"}}>{tabActionBtns}{extra}</div>;

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",background:"var(--bg-page)",minHeight:"100vh",color:"var(--text-primary)",display:"flex",flexDirection:"column",width:"100%",boxSizing:"border-box",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"var(--bg-card)",borderBottom:"1px solid var(--border-struct)",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:16,fontWeight:600}}>Figma Variables Generator</div>
          <div style={{fontSize:12,color:"var(--text-secondary)",marginTop:2}}>Builds DTCG JSON for Figma native Variables + Text Styles import</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} style={{fontSize:16,padding:"6px 10px",borderRadius:6,border:"1px solid var(--border-input)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer",lineHeight:1}}>{theme === "dark" ? "\u2600" : "\u263E"}</button>
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{fontSize:16,padding:"6px 10px",borderRadius:6,border:"1px solid var(--border-input)",background:"var(--bg-input)",color:canUndo?"var(--accent-text)":"var(--text-disabled)",cursor:canUndo?"pointer":"default",opacity:canUndo?1:0.4,lineHeight:1}}>↩</button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" style={{fontSize:16,padding:"6px 10px",borderRadius:6,border:"1px solid var(--border-input)",background:"var(--bg-input)",color:canRedo?"var(--accent-text)":"var(--text-disabled)",cursor:canRedo?"pointer":"default",opacity:canRedo?1:0.4,lineHeight:1}}>↪</button>
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport} />
          {showResetConfirm ? (
            <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--danger-alert-bg)",border:"1px solid var(--danger-border)",borderRadius:6,padding:"4px 10px"}}>
              <span style={{fontSize:12,color:"var(--danger-text)"}}>Reset everything?</span>
              <button onClick={handleReset} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"none",background:"var(--danger-btn)",color:"#fff",cursor:"pointer",fontWeight:600}}>Yes, reset</button>
              <button onClick={()=>setShowResetConfirm(false)} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"1px solid var(--border-input)",background:"transparent",color:"var(--text-muted)",cursor:"pointer"}}>Cancel</button>
            </div>
          ) : (
            <button onClick={()=>setShowResetConfirm(true)} style={{fontSize:13,padding:"8px 14px",borderRadius:6,border:"1px solid var(--danger-border)",background:"var(--danger-bg)",color:"var(--danger-text)",cursor:"pointer"}}>Reset</button>
          )}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowDl(v=>!v)} style={{fontSize:13,padding:"8px 14px",borderRadius:6,border:"1px solid var(--border-input)",background:"var(--bg-input)",color:"var(--text-secondary)",cursor:"pointer"}}>Download Files {showDl?"▴":"▾"}</button>
            {showDl && (
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,zIndex:200}}>
                <div onClick={()=>setShowDl(false)} style={{position:"fixed",inset:0,zIndex:-1}} />
                <DownloadPanel enabled={enabledTabs} primGroups={primGroups} primitives={primitives} colors={colors} spacing={spacing} typography={typography} textStyles={textStyles} radius={radius} borders={borders} shadows={shadows} zindex={zindex} breakpoints={breakpoints} customCollections={customCollections} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden",width:"100%"}}>

        {/* Sidebar */}
        <div style={{width:160,background:"var(--bg-card)",borderRight:"1px solid var(--border-struct)",paddingTop:12,flexShrink:0,display:"flex",flexDirection:"column"}}>
          {allTabs.map(t => {
            const enabled=enabledTabs.has(t), active=tab===t;
            return (
              <div key={t} style={{display:"flex",alignItems:"center"}}>
                <button onClick={()=>{
                  // Auto-save unsaved custom collection/group settings when switching away
                  const curr = customCollections.find(c => c.name === tab);
                  if (curr) {
                    if (!curr.locked) updateCustomCollection(curr.id, "locked", true);
                    const unlocked = curr.groups?.some((gr: any) => gr.locked === false);
                    if (unlocked) setCustomCollections(ccs => ccs.map(c => c.id !== curr.id ? c : { ...c, groups: c.groups.map((gr: any) => ({ ...gr, locked: true })) }));
                  }
                  setTab(t);setTabResetConfirm(false);setSelected(new Set());setSearch("");
                }} style={{flex:1,textAlign:"left",padding:"10px 14px",fontSize:13,fontWeight:active?600:400,cursor:"pointer",border:"none",background:active?"var(--accent)":"transparent",color:active?"#fff":enabled?"var(--text-secondary)":"var(--text-disabled)",transition:"all 0.15s"}}>{t}</button>
                <div onClick={()=>toggleTab(t)} title={enabled?"Exclude from export":"Include in export"} style={{width:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,paddingRight:10,paddingLeft:4,alignSelf:"stretch"}}>
                  <div style={{width:24,height:14,borderRadius:9999,background:enabled?"var(--accent)":"var(--toggle-off-bg)",border:"1px solid "+(enabled?"var(--accent)":"var(--text-disabled)"),position:"relative"}}>
                    <div style={{position:"absolute",top:2,left:enabled?10:2,width:9,height:9,borderRadius:"50%",background:enabled?"var(--toggle-on-knob)":"var(--toggle-off-knob)",transition:"left 0.2s"}} />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={addCustomCollection} style={{margin:"8px 14px",padding:"8px 0",fontSize:12,borderRadius:6,border:"1px dashed var(--accent)",background:"var(--bg-accent-subtle)",color:"var(--accent-text)",cursor:"pointer"}}>+ Add Collection</button>
        </div>

        {/* Content */}
        <div style={{flex:1,overflowX:"hidden",overflowY:"auto",padding:28,minWidth:0,boxSizing:"border-box"}}>

          {/* PRIMITIVES */}
          {tab==="Primitives" && (
            <div>
              <TabHeader title="Primitive Colors" description="Raw palette. Click a name to rename. Never apply directly to layers."
                actions={tabActions(<button onClick={addPrimGroup} style={tabAddBtnStyle}>+ Add Palette</button>)} search={search} onSearch={setSearch} />
              {primGroups.filter((g: any) => matchesSearch(search, g.label, g.key, ...g.shades)).map((g: any) => (
                <div key={g.id} {...primGroupDrag.makeDropZone(String(g.id))} style={{marginBottom:32}}>
                  <div style={hdrStyle}><div draggable onDragStart={e=>primGroupDrag.onDragStart(e,String(g.id))} style={{cursor:"grab",padding:"0 4px",color:"var(--text-secondary)",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>⌿</div><InlineLabel value={g.label} prefix="primitives / " onCommit={(nl: string)=>renamePrimGroup(g.key,nl)} /><div style={{flex:1,height:1,background:"var(--border-section)"}} /><button onClick={()=>deletePrimGroup(g.key)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete palette</button></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-start"}}>
                    {g.shades.map((shade: string) => (
                      <div key={shade} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{position:"relative",width:56,height:56}}>
                          <div style={{width:56,height:56,borderRadius:10,background:primitives[g.key]?.[shade]||"#808080",border:"1px solid var(--border-input)"}} />
                          <input type="color" value={primitives[g.key]?.[shade]||"#808080"} onChange={e=>setPrimitives((p: any)=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}} />
                        </div>
                        <InlineLabel value={shade} onCommit={(ns: string)=>renameShade(g.key,shade,ns)} style={{fontSize:11,color:"var(--text-secondary)",textAlign:"center"}} />
                        <input value={primitives[g.key]?.[shade]||""} onChange={e=>setPrimitives((p: any)=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} style={{width:66,background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:4,padding:"4px 5px",fontSize:10,color:"var(--text-muted)",textAlign:"center",outline:"none",fontFamily:"monospace"}} />
                        <button onClick={()=>removeShade(g.key,shade)} style={{...delBtn,fontSize:11,padding:0,lineHeight:1}}>x</button>
                      </div>
                    ))}
                    <div style={{display:"flex",alignItems:"center",height:56}}><button onClick={()=>addShade(g.key)} style={{height:56,width:40,borderRadius:10,border:"1px dashed var(--border-input)",background:"transparent",color:"var(--text-secondary)",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div>
                  </div>
                </div>
              ))}
              <div style={{marginBottom:28}}>
                <div style={hdrStyle}><span>primitives / Base</span><div style={{flex:1,height:1,background:"var(--border-section)"}} /></div>
                <div style={{display:"flex",gap:12}}>
                  {["white","black"].map(k => (
                    <div key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{position:"relative",width:56,height:56}}>
                        <div style={{width:56,height:56,borderRadius:10,background:primitives.base?.[k]||"#000",border:"1px solid var(--border-input)"}} />
                        <input type="color" value={primitives.base?.[k]||"#000000"} onChange={e=>setPrimitives((p: any)=>({...p,base:{...p.base,[k]:e.target.value}}))} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}} />
                      </div>
                      <div style={{fontSize:11,color:"var(--text-secondary)"}}>{k}</div>
                      <input value={primitives.base?.[k]||""} onChange={e=>setPrimitives((p: any)=>({...p,base:{...p.base,[k]:e.target.value}}))} style={{width:66,background:"var(--bg-input)",border:"1px solid var(--border-input)",borderRadius:4,padding:"4px 5px",fontSize:10,color:"var(--text-muted)",textAlign:"center",outline:"none",fontFamily:"monospace"}} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COLORS */}
          {tab==="Colors" && (
            <div>
              <TabHeader title="Semantic Color Tokens" description="Downloads as two files: colors-light.json and colors-dark.json."
                actions={tabActions(<button onClick={addColorGroup} style={tabAddBtnStyle}>+ Add Group</button>)} search={search} onSearch={setSearch} />
              {colorGroups.map((g: string) => {
                const filtered = groupedColors[g].filter((c: any) => matchesSearch(search, g, c.name, c.description, c.light, c.dark));
                if (search && filtered.length === 0) return null;
                return (
                <div key={g} {...colorGroupDrag.makeDropZone(g)} style={{marginBottom:28}}>
                  <div style={hdrStyle}><div draggable onDragStart={e=>colorGroupDrag.onDragStart(e,g)} style={{cursor:"grab",padding:"0 4px",color:"var(--text-secondary)",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>⌿</div><InlineLabel value={g} prefix="color / " onCommit={(n: string)=>renameColorGroup(g,n)} /><div style={{flex:1,height:1,background:"var(--border-section)"}} /><button onClick={()=>{const nn=g+" copy";setColorGroups(gs=>{const idx=gs.indexOf(g);const next=[...gs];next.splice(idx+1,0,nn);return next;});setColors(c=>[...c,...c.filter(i=>i.group===g).map(i=>({...i,id:uid(),group:nn}))]);}} style={{...dupBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={()=>deleteColorGroup(g)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button></div>
                  {filtered.length===0 && <div style={{fontSize:12,color:"var(--text-secondary)",padding:"8px 4px",fontStyle:"italic"}}>No tokens yet.</div>}
                  {filtered.length > 0 && (
                    <div>
                      <div style={colHdr}>
                        {selectAllChk(filtered.map((c: any)=>c.id))}
                        <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                        <div style={{flex:1,display:"grid",gridTemplateColumns:"110px 150px 1fr 1fr 32px",gap:10}}>
                        {["Group","Name","Light","Dark",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                        </div>
                      </div>
                      {filtered.map((c: any) => (
                        <DraggableRow key={c.id} id={c.id} dragHandlers={colorDrag} checked={selected.has(c.id)} onCheck={toggleSelect}>
                          <div style={{display:"grid",gridTemplateColumns:"110px 150px 1fr 1fr 32px",gap:10,alignItems:"start"}}>
                            <select value={c.group} onChange={e=>updateColor(c.id,"group",e.target.value)} style={inp({width:"100%"})}>{colorGroups.map((g2: string)=><option key={g2}>{g2}</option>)}</select>
                            <div><input value={c.name} onChange={e=>updateColor(c.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} /><input value={c.description} onChange={e=>updateColor(c.id,"description",e.target.value)} placeholder="Description" style={inp({width:"100%",boxSizing:"border-box",marginTop:6,fontSize:11,color:"var(--text-secondary)",padding:"6px 10px",border:"1px solid var(--border-section)"})} /></div>
                            <PrimSelector value={c.light} primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"light",v)} mode="Light" />
                            <PrimSelector value={c.dark}  primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"dark",v)}  mode="Dark" />
                            <div style={{display:"flex",gap:2,paddingTop:8}}><button onClick={()=>dupColor(c.id)} style={dupBtn}>⧉</button><button onClick={()=>setColors((c2: any[])=>c2.filter(i=>i.id!==c.id))} style={{...delBtn,fontSize:18}}>x</button></div>
                          </div>
                        </DraggableRow>
                      ))}
                    </div>
                  )}
                  <AddRowBtn onClick={()=>setColors((c: any[])=>[...c,{id:uid(),group:g,name:"new-color",light:"{primitives.blue.600}",dark:"{primitives.blue.400}",description:""}])} label={"+ Add token to "+g} />
                </div>
              );})}
            </div>
          )}

          {/* SPACING */}
          {tab==="Spacing" && (
            <div>
              <TabHeader title="Spacing Tokens" description="4px base scale. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={colHdr}>
                {selectAllChk(spacing.map((s: any)=>s.id))}
                <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                <div style={{flex:1,display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 32px",gap:10}}>
                {["Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                </div>
              </div>
              {spacing.filter((sp: any) => matchesSearch(search, sp.name, sp.value)).map((sp: any) => (
                <DraggableRow key={sp.id} id={sp.id} dragHandlers={spacingDrag} checked={selected.has(sp.id)} onCheck={toggleSelect}>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--text-secondary)"}}>spacing /</span>
                    <input value={sp.name} onChange={e=>updateList(setSpacing,sp.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={sp.value} onChange={e=>updateList(setSpacing,sp.id,"value",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>px</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:14,background:"#4f46e5",borderRadius:3,opacity:0.7,width:Math.min(parseInt(sp.value)||0,220)+"px",minWidth:2}} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>{sp.value}px</span></div>
                    <div style={{display:"flex",gap:2}}><button onClick={()=>dupInList(setSpacing,sp.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteList(setSpacing,sp.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setSpacing((s: any[])=>[...s,{id:uid(),name:"new",value:"0"}])} label="+ Add spacing token" />
            </div>
          )}

          {/* TYPOGRAPHY */}
          {tab==="Typography" && (
            <div>
              <TabHeader title="Typography Tokens" description="Font families, sizes, weights and line heights. For composite text styles, use the Text Styles tab." actions={tabActions()} search={search} onSearch={setSearch} />
              {[["families","font / family",""],["sizes","font / size","px"],["weights","font / weight",""],["lineHeights","font / line-height",""]].map(([key,label,unit]) => (
                <div key={key} style={{marginBottom:28}}>
                  <div style={{marginBottom:8}}><span style={{fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",color:"var(--text-secondary)"}}>{label} — drag to reorder</span></div>
                  <div style={colHdr}>
                    {selectAllChk((typography as any)[key].map((i: any)=>i.id))}
                    <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                    <div style={{flex:1,display:"grid",gridTemplateColumns:"180px 1fr 32px",gap:10}}>
                    {["Name","Value",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                    </div>
                  </div>
                  {(typography as any)[key].filter((item: any) => matchesSearch(search, item.name, item.value)).map((item: any) => (
                    <DraggableRow key={item.id} id={item.id} dragHandlers={typoDragMap[key]} checked={selected.has(item.id)} onCheck={toggleSelect}>
                      <div style={{display:"grid",gridTemplateColumns:"180px 1fr 32px",gap:10,alignItems:"center"}}>
                        <input value={item.name} onChange={e=>setTypography((t: any)=>({...t,[key]:t[key].map((i: any)=>i.id===item.id?{...i,name:e.target.value}:i)}))} style={inp()} />
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>{key==="families" ? (
                          <select value={item.value} onChange={e=>setTypography((t: any)=>({...t,[key]:t[key].map((i: any)=>i.id===item.id?{...i,value:e.target.value}:i)}))} style={inp({width:"100%",fontSize:11,padding:"8px 6px",fontFamily:item.value})}>
                            {FONT_FAMILIES.map(f=><option key={f.value} value={f.value} style={{fontFamily:f.value}}>{f.label}</option>)}
                            {!FONT_FAMILIES.some(f=>f.value===item.value) && <option value={item.value}>{item.value}</option>}
                          </select>
                        ) : (
                          <input value={item.value} onChange={e=>setTypography((t: any)=>({...t,[key]:t[key].map((i: any)=>i.id===item.id?{...i,value:e.target.value}:i)}))} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} />
                        )}{unit && <span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0}}>{unit}</span>}</div>
                        <div style={{display:"flex",gap:2}}><button onClick={()=>setTypography((t: any)=>{const arr=[...t[key]];const idx=arr.findIndex((i: any)=>i.id===item.id);if(idx<0)return t;arr.splice(idx+1,0,{...arr[idx],id:uid(),name:arr[idx].name+" copy"});return{...t,[key]:arr};})} style={dupBtn}>⧉</button><button onClick={()=>setTypography((t: any)=>({...t,[key]:t[key].filter((i: any)=>i.id!==item.id)}))} style={{...delBtn,fontSize:18}}>x</button></div>
                      </div>
                    </DraggableRow>
                  ))}
                  <AddRowBtn onClick={()=>setTypography((t: any)=>({...t,[key]:[...t[key],{id:uid(),name:"new",value:""}]}))} label={"+ Add "+label.split(" / ").slice(1).join(" ")+" token"} />
                </div>
              ))}
            </div>
          )}

          {/* TEXT STYLES */}
          {tab==="Text Styles" && (
            <div>
              <TabHeader title="Text Styles"
                description="Composite typography styles — each defines a full font stack. Exports as text-styles.json for the plugin importer."
                actions={tabActions(<button onClick={addTsGroup} style={tabAddBtnStyle}>+ Add Group</button>)} search={search} onSearch={setSearch} />

              {tsGroups.map((g: string) => {
                const filteredTs = (groupedTextStyles[g]||[]).filter((s: any) => matchesSearch(search, g, s.name, s.fontFamily, s.fontSize, s.fontWeight));
                if (search && filteredTs.length === 0) return null;
                return (
                <div key={g} {...tsGroupDrag.makeDropZone(g)} style={{marginBottom:32}}>
                  <div style={hdrStyle}>
                    <div draggable onDragStart={e=>tsGroupDrag.onDragStart(e,g)} style={{cursor:"grab",padding:"0 4px",color:"var(--text-secondary)",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>⌿</div>
                    <InlineLabel value={g} prefix="text / " onCommit={(n: string)=>renameTsGroup(g,n)} />
                    <div style={{flex:1,height:1,background:"var(--border-section)"}} />
                    <button onClick={()=>{const nn=g+" copy";setTsGroups(gs=>{const idx=gs.indexOf(g);const next=[...gs];next.splice(idx+1,0,nn);return next;});setTextStyles(ts=>[...ts,...ts.filter(s=>s.group===g).map(s=>({...s,id:uid(),group:nn,name:s.name+" copy"}))]);}} style={{...dupBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={()=>deleteTsGroup(g)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
                  </div>

                  {/* Column headers */}
                  <div style={colHdr}>
                    {selectAllChk(filteredTs.map((s: any)=>s.id))}
                    <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                    <div style={{flex:1,display:"grid",gridTemplateColumns:"80px minmax(70px,130px) 55px 56px 100px 110px 140px 100px 1fr 32px",gap:6}}>
                    {["Name","Font Family","Size (px)","Weight","Line Height (em)","Letter Spacing (%)","Paragraph Spacing (px)","Decoration","Preview",""].map((h,i)=><div key={i} style={{fontSize:10,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</div>)}
                    </div>
                  </div>

                  {filteredTs.map((s: any) => (
                    <DraggableRow key={s.id} id={s.id} dragHandlers={textStylesDrag} checked={selected.has(s.id)} onCheck={toggleSelect}>
                      <div style={{display:"grid",gridTemplateColumns:"80px minmax(70px,130px) 55px 56px 100px 110px 140px 100px 1fr 32px",gap:6,alignItems:"center"}}>

                        {/* Name */}
                        <input value={s.name} onChange={e=>updateTextStyle(s.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />

                        {/* Font family */}
                        <select value={s.fontFamily} onChange={e=>updateTextStyle(s.id,"fontFamily",e.target.value)} style={inp({width:"100%",fontSize:11,padding:"8px 6px",fontFamily:s.fontFamily})}>
                          {FONT_FAMILIES.map(f=><option key={f.value} value={f.value} style={{fontFamily:f.value}}>{f.label}</option>)}
                          {!FONT_FAMILIES.some(f=>f.value===s.fontFamily) && <option value={s.fontFamily}>{s.fontFamily}</option>}
                        </select>

                        {/* Font size */}
                        <div style={{display:"flex",gap:3,alignItems:"center"}}>
                          <input value={s.fontSize} onChange={e=>updateTextStyle(s.id,"fontSize",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace",fontSize:11})} />
                        </div>

                        {/* Font weight */}
                        <input value={s.fontWeight} onChange={e=>updateTextStyle(s.id,"fontWeight",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace",fontSize:11})} />

                        {/* Line height */}
                        <input value={s.lineHeight} onChange={e=>updateTextStyle(s.id,"lineHeight",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace",fontSize:11})} />

                        {/* Letter spacing */}
                        <div style={{display:"flex",gap:3,alignItems:"center"}}>
                          <input value={s.letterSpacing} onChange={e=>updateTextStyle(s.id,"letterSpacing",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace",fontSize:11})} />
                        </div>

                        {/* Paragraph spacing */}
                        <div style={{display:"flex",gap:3,alignItems:"center"}}>
                          <input value={s.paragraphSpacing} onChange={e=>updateTextStyle(s.id,"paragraphSpacing",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace",fontSize:11})} />
                        </div>

                        {/* Text decoration */}
                        <select value={s.textDecoration} onChange={e=>updateTextStyle(s.id,"textDecoration",e.target.value)} style={inp({width:"100%",fontSize:11,padding:"8px 6px"})}>
                          {TS_DECORATION_OPTIONS.map(d=><option key={d} value={d}>{d.charAt(0)+d.slice(1).toLowerCase()}</option>)}
                        </select>

                        {/* Live preview */}
                        <TextPreview style={s} />

                        {/* Delete */}
                        <div style={{display:"flex",gap:2}}><button onClick={()=>dupTextStyle(s.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteTextStyle(s.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                      </div>
                    </DraggableRow>
                  ))}

                  <AddRowBtn onClick={()=>addTextStyle(g)} label={"+ Add style to "+g} />
                </div>
                );
              })}

              {tsGroups.length === 0 && <div style={{fontSize:13,color:"var(--text-secondary)",fontStyle:"italic",padding:"32px 0",textAlign:"center"}}>No groups yet. Click "+ Add Group" to start.</div>}
            </div>
          )}

          {/* RADIUS */}
          {tab==="Radius" && (
            <div>
              <TabHeader title="Border Radius Tokens" description="Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 0 8px 8px"}}>{selectAllChk(radius.map((r: any)=>r.id))}<span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>Select all</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:20,paddingLeft:8}}>
                {radius.filter((r: any) => matchesSearch(search, r.name, r.value)).map((r: any) => (
                  <div key={r.id} draggable onDragStart={()=>radiusDrag.onDragStart(r.id)} onDragOver={(e: any)=>radiusDrag.onDragOver(e,r.id)} onDrop={()=>radiusDrag.onDrop()} onDragEnd={()=>radiusDrag.onDragEnd()} style={{background:selected.has(r.id)?"var(--bg-selected)":"var(--bg-card)",border:"1px solid "+(selected.has(r.id)?"var(--accent)":"var(--border-struct)"),borderRadius:12,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:120,boxSizing:"border-box",cursor:"grab",position:"relative"}}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleSelect(r.id)} style={{...chkStyle,position:"absolute",top:8,left:8}} />
                    <div style={{width:60,height:60,background:"#4f46e5",opacity:0.75,borderRadius:Math.min(parseInt(r.value)||0,30)+"px",flexShrink:0}} />
                    <input value={r.name} onChange={e=>updateList(setRadius,r.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",textAlign:"center",padding:"7px 8px"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center",width:"100%"}}><input value={r.value} onChange={e=>updateList(setRadius,r.id,"value",e.target.value)} style={inp({flex:1,width:0,textAlign:"center",fontFamily:"monospace",padding:"7px 8px"})} /><span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0}}>px</span></div>
                    <div style={{display:"flex",gap:2}}><button onClick={()=>dupInList(setRadius,r.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteList(setRadius,r.id)} style={{...delBtn,fontSize:12}}>Remove</button></div>
                  </div>
                ))}
              </div>
              <AddRowBtn onClick={()=>setRadius((r: any[])=>[...r,{id:uid(),name:"new",value:"0"}])} label="+ Add radius token" />
            </div>
          )}

          {/* BORDER */}
          {tab==="Border" && (
            <div>
              <TabHeader title="Border Width Tokens" description="Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={colHdr}>
                {selectAllChk(borders.map((b: any)=>b.id))}
                <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                <div style={{flex:1,display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 32px",gap:10}}>
                {["Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                </div>
              </div>
              {borders.filter((b: any) => matchesSearch(search, b.name, b.value)).map((b: any) => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={borderDrag} checked={selected.has(b.id)} onCheck={toggleSelect}>
                  <div style={{display:"grid",gridTemplateColumns:"80px 1fr 1fr 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--text-secondary)"}}>border /</span>
                    <input value={b.name} onChange={e=>updateList(setBorders,b.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.value} onChange={e=>updateList(setBorders,b.id,"value",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"var(--text-secondary)"}}>px</span></div>
                    <div style={{display:"flex",alignItems:"center"}}><div style={{width:80,height:Math.max(parseInt(b.value)||0,1),maxHeight:20,background:"#4f46e5",borderRadius:2,opacity:0.8}} /></div>
                    <div style={{display:"flex",gap:2}}><button onClick={()=>dupInList(setBorders,b.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteList(setBorders,b.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setBorders((b: any[])=>[...b,{id:uid(),name:"new",value:"1"}])} label="+ Add border token" />
            </div>
          )}

          {/* SHADOWS */}
          {tab==="Shadows" && (
            <div>
              <TabHeader title="Shadow Tokens" description="Drag to reorder. Click the swatch to open the shadow picker." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 0 8px 8px",borderBottom:"1px solid var(--border-section)",marginBottom:4}}>
                {selectAllChk(shadows.map((s: any)=>s.id))}
                <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                <span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",flexShrink:0,width:72}}>Prefix</span>
                <span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",flexShrink:0,width:140}}>Name</span>
                <span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",flex:1}}>Value</span>
                <span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",flexShrink:0,width:80}}>Preview</span>
                <span style={{flexShrink:0,width:32}}></span>
              </div>
              {shadows.filter((sh: any) => matchesSearch(search, sh.name, sh.value)).map((sh: any) => (
                <ShadowRow key={sh.id} sh={sh} dragHandlers={shadowDrag}
                  onChangeName={(v: string)=>updateList(setShadows,sh.id,"name",v)}
                  onChangeValue={(v: string)=>updateList(setShadows,sh.id,"value",v)}
                  onDelete={()=>deleteList(setShadows,sh.id)}
                  onDuplicate={()=>dupInList(setShadows,sh.id)}
                  checked={selected.has(sh.id)} onCheck={toggleSelect} />
              ))}
              <AddRowBtn onClick={()=>setShadows((s: any[])=>[...s,{id:uid(),name:"new",value:"0px 4px 12px 0px rgba(0,0,0,0.20)"}])} label="+ Add shadow token" />
            </div>
          )}

          {/* Z-INDEX */}
          {tab==="Z-Index" && (
            <div>
              <TabHeader title="Z-Index Tokens" description="Stacking order reference. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={colHdr}>
                {selectAllChk(zindex.map((z: any)=>z.id))}
                <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                <div style={{flex:1,display:"grid",gridTemplateColumns:"100px 1fr 1fr 32px",gap:10}}>
                {["Prefix","Name","Value",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                </div>
              </div>
              {zindex.filter((z: any) => matchesSearch(search, z.name, z.value)).map((z: any) => (
                <DraggableRow key={z.id} id={z.id} dragHandlers={zDrag} checked={selected.has(z.id)} onCheck={toggleSelect}>
                  <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--text-secondary)"}}>z-index /</span>
                    <input value={z.name} onChange={e=>updateList(setZIndex,z.id,"name",e.target.value)} style={inp()} />
                    <input value={z.value} onChange={e=>updateList(setZIndex,z.id,"value",e.target.value)} style={inp({fontFamily:"monospace"})} />
                    <div style={{display:"flex",gap:2}}><button onClick={()=>dupInList(setZIndex,z.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteList(setZIndex,z.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setZIndex((z: any[])=>[...z,{id:uid(),name:"new",value:"0"}])} label="+ Add z-index token" />
            </div>
          )}

          {/* BREAKPOINTS */}
          {tab==="Breakpoints" && (
            <div>
              <TabHeader title="Breakpoint Tokens" description="Min-width based. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div style={colHdr}>
                {selectAllChk(breakpoints.map((b: any)=>b.id))}
                <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                <div style={{flex:1,display:"grid",gridTemplateColumns:"100px 1fr 1fr 1fr 1fr 32px",gap:10}}>
                {["Prefix","Name","Min (px)","Max (px)","Range",""].map((h,i)=><div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                </div>
              </div>
              {breakpoints.filter((b: any) => matchesSearch(search, b.name, b.value, b.max)).map((b: any) => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={breakpointDrag} checked={selected.has(b.id)} onCheck={toggleSelect}>
                  <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 1fr 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--text-secondary)"}}>breakpoint /</span>
                    <input value={b.name} onChange={e=>updateList(setBreakpoints,b.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.value} onChange={e=>{
                      const v = e.target.value;
                      setBreakpoints(list => { const ri = list.findIndex((bp: any) => bp.id === b.id); return list.map((bp: any, i: number) => {
                        if (i === ri) return { ...bp, value: v };
                        if (i === ri - 1) return { ...bp, max: v };
                        return bp;
                      }); });
                    }} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0}}>px</span></div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.max} onChange={e=>{
                      const v = e.target.value;
                      setBreakpoints(list => { const ri = list.findIndex((bp: any) => bp.id === b.id); return list.map((bp: any, i: number) => {
                        if (i === ri) return { ...bp, max: v };
                        if (i === ri + 1) return { ...bp, value: v };
                        return bp;
                      }); });
                    }} placeholder="none" style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0}}>px</span></div>
                    <div style={{fontSize:12,color:"var(--text-secondary)",fontFamily:"monospace"}}>{bpRange(b)}</div>
                    <div style={{display:"flex",gap:2}}><button onClick={()=>dupInList(setBreakpoints,b.id)} style={dupBtn}>⧉</button><button onClick={()=>deleteList(setBreakpoints,b.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setBreakpoints((b: any[])=>[...b,{id:uid(),name:"new",value:"",max:""}])} label="+ Add breakpoint token" />
            </div>
          )}

          {/* CUSTOM COLLECTIONS */}
          {customCollections.map((cc: any) => tab === cc.name && (
            <div key={cc.id}>
              <TabHeader title={cc.name} description={`Custom collection — exports as ${cc.jsonKey}.json`}
                actions={tabActions(<button onClick={() => addCustomGroup(cc.id)} disabled={!cc.locked} style={{...tabAddBtnStyle, opacity: cc.locked ? 1 : 0.4, cursor: cc.locked ? "pointer" : "default"}}>+ Add Group</button>)} search={search} onSearch={setSearch} />

              {/* Collection settings */}
              <div style={{display:"flex",gap:12,marginBottom:20,padding:12,background:"var(--bg-card)",borderRadius:8,border:"1px solid var(--border-section)",flexWrap:"wrap",alignItems:"center"}}>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"var(--text-secondary)"}}>
                  Tab Name
                  <input value={cc.name} disabled={cc.locked} onChange={e => {
                    const old = cc.name;
                    const nv = e.target.value;
                    setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, name: nv } : c));
                    setEnabledTabs(prev => { const next = new Set(prev); if (next.has(old)) { next.delete(old); next.add(nv); } return next; });
                    setTab(nv);
                  }} style={inp({ width: 120, opacity: cc.locked ? 0.5 : 1 })} />
                </label>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"var(--text-secondary)"}}>
                  JSON Key
                  <input value={cc.jsonKey} disabled={cc.locked} onChange={e => updateCustomCollection(cc.id, "jsonKey", e.target.value)} style={inp({ width: 120, fontFamily: "monospace", opacity: cc.locked ? 0.5 : 1 })} />
                </label>
                <div style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
                  {cc.locked ? (
                    cc.items.length === 0 && <button onClick={() => updateCustomCollection(cc.id, "locked", false)} style={tabBtnStyle}>Edit</button>
                  ) : (
                    <button onClick={() => updateCustomCollection(cc.id, "locked", true)} style={tabAddBtnStyle}>Save</button>
                  )}
                  <button onClick={() => deleteCustomCollection(cc.id)} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid var(--danger-border)",background:"var(--danger-bg)",color:"var(--danger-text)",cursor:"pointer"}}>Delete Collection</button>
                </div>
              </div>

              {(cc.groups || []).map((g: any) => {
                const allGroupItems = cc.items.filter((i: any) => i.group === g.name);
                const groupItems = allGroupItems.filter((i: any) => matchesSearch(search, g.name, i.name, i.value));
                if (search && groupItems.length === 0) return null;
                const singleGroup = cc.groups.length <= 1;
                const gLocked = g.locked !== false;
                const valueTypeSelect = <select value={g.type + (g.unit ? "|" + g.unit : "")} disabled={gLocked} onChange={e => {
                  const [type, unit = ""] = e.target.value.split("|");
                  updateCustomGroup(cc.id, g.name, "type", type);
                  updateCustomGroup(cc.id, g.name, "unit", unit);
                }} style={inp({ width: 150, fontSize: 10, padding: "4px 6px", opacity: gLocked ? 0.5 : 1 })}>
                  <optgroup label="Unitless">
                    <option value="number">Number</option>
                    <option value="string">String</option>
                    <option value="color">Color</option>
                    <option value="fontFamily">Font Family</option>
                    <option value="fontWeight">Font Weight</option>
                  </optgroup>
                  <optgroup label="Dimension (length)">
                    <option value="dimension|px">Dimension — px</option>
                    <option value="dimension|rem">Dimension — rem</option>
                    <option value="dimension|em">Dimension — em</option>
                    <option value="dimension|%">Dimension — %</option>
                    <option value="dimension|vw">Dimension — vw</option>
                    <option value="dimension|vh">Dimension — vh</option>
                  </optgroup>
                  <optgroup label="Duration">
                    <option value="duration|ms">Duration — ms</option>
                    <option value="duration|s">Duration — s</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="number|deg">Number — deg</option>
                    <option value="cubicBezier">Cubic Bezier</option>
                  </optgroup>
                </select>;
                const groupSaveEdit = gLocked ? (
                  groupItems.length === 0 && <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", false)} style={{...tabBtnStyle,fontSize:10,padding:"4px 8px"}}>Edit</button>
                ) : (
                  <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", true)} style={{...tabAddBtnStyle,fontSize:10,padding:"4px 8px"}}>Save</button>
                );
                return (
                  <div key={g.name} onDragOver={!singleGroup ? (e: any)=>{ if(e.dataTransfer.types.includes(GROUP_DRAG_TYPE)){e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).style.borderTop="2px solid var(--accent)";}} : undefined} onDragLeave={!singleGroup ? (e: any)=>{(e.currentTarget as HTMLElement).style.borderTop="";} : undefined} onDrop={!singleGroup ? (e: any)=>{(e.currentTarget as HTMLElement).style.borderTop="";const from=e.dataTransfer.getData(GROUP_DRAG_TYPE);if(!from||from===g.name)return;e.preventDefault();e.stopPropagation();setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const gs=[...c.groups];const fi=gs.findIndex((x: any)=>x.name===from),ti=gs.findIndex((x: any)=>x.name===g.name);if(fi<0||ti<0)return c;const[m]=gs.splice(fi,1);gs.splice(ti,0,m);return{...c,groups:gs};}));} : undefined} style={{marginBottom:28}}>
                    {singleGroup ? (
                      <div style={{...hdrStyle,justifyContent:"space-between"}}>
                        <span style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em"}}>Value Type</span>
                        {valueTypeSelect}
                        {groupSaveEdit}
                        <div style={{flex:1}} />
                      </div>
                    ) : (
                      <div style={hdrStyle}>
                        <div draggable onDragStart={(e: any)=>{e.dataTransfer.setData(GROUP_DRAG_TYPE,g.name);e.dataTransfer.effectAllowed="move";e.stopPropagation();}} style={{cursor:"grab",padding:"0 4px",color:"var(--text-secondary)",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>⌿</div>
                        <InlineLabel value={g.name} prefix={cc.jsonKey + " / "} onCommit={(n: string) => renameCustomGroup(cc.id, g.name, n)} />
                        {valueTypeSelect}
                        {groupSaveEdit}
                        <div style={{flex:1,height:1,background:"var(--border-section)"}} />
                        <button onClick={() => { const nn=g.name+" copy"; setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const idx=c.groups.findIndex((gr: any)=>gr.name===g.name);const newGroups=[...c.groups];newGroups.splice(idx+1,0,{...g,name:nn,locked:g.locked});const newItems=[...c.items,...c.items.filter((i: any)=>i.group===g.name).map((i: any)=>({...i,id:uid(),group:nn}))];return{...c,groups:newGroups,items:newItems};})); }} style={{...dupBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={() => deleteCustomGroup(cc.id, g.name)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
                      </div>
                    )}
                    {groupItems.length === 0 && <div style={{fontSize:12,color:"var(--text-secondary)",padding:"8px 4px",fontStyle:"italic"}}>No tokens yet.</div>}
                    {groupItems.length > 0 && (
                      <div>
                        <div style={colHdr}>
                          {selectAllChk(groupItems.map((i: any)=>i.id))}
                          <div style={{padding:"0 4px",fontSize:14,flexShrink:0,visibility:"hidden"}}>⌿</div>
                          <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr 32px",gap:10}}>
                          {["Name","Value",""].map((h,i) => <div key={i} style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                          </div>
                        </div>
                        {groupItems.map((item: any) => (
                          <DraggableRow key={item.id} id={item.id} checked={selected.has(item.id)} onCheck={toggleSelect} dragHandlers={{
                            onDragStart: (id: number) => { if (!ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; ccDragRef.current[cc.id].dragId = id; },
                            onDragOver: (e: any, id: number) => { e.preventDefault(); if (!ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; ccDragRef.current[cc.id].overId = id; },
                            onDrop: () => {
                              const d = ccDragRef.current[cc.id]; if (!d) return;
                              const from = d.dragId, to = d.overId;
                              if (from == null || to == null || from === to) return;
                              setCustomCollections(ccs => ccs.map(c => {
                                if (c.id !== cc.id) return c;
                                const items = [...c.items];
                                const fi = items.findIndex((i: any) => i.id === from);
                                const ti = items.findIndex((i: any) => i.id === to);
                                if (fi < 0 || ti < 0) return c;
                                const [moved] = items.splice(fi, 1);
                                items.splice(ti, 0, moved);
                                return { ...c, items };
                              }));
                            },
                            onDragEnd: () => { if (ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; },
                          }}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 32px",gap:10,alignItems:"center"}}>
                              <input value={item.name} onChange={e => updateCustomItem(cc.id, item.id, "name", e.target.value)} style={inp({ width: "100%", boxSizing: "border-box" })} />
                              {g.type === "color" ? (
                                <PrimSelector value={item.value} primitives={primitives} primGroups={primGroups} onChange={(v: string) => updateCustomItem(cc.id, item.id, "value", v)} mode="Value" />
                              ) : g.type === "fontFamily" ? (
                                <select value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} style={inp({ width: "100%", fontSize: 11, padding: "8px 6px", fontFamily: item.value })}>
                                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.label}</option>)}
                                  {!FONT_FAMILIES.some(f => f.value === item.value) && <option value={item.value}>{item.value}</option>}
                                </select>
                              ) : (
                                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                  <input value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} style={inp({ width: "100%", boxSizing: "border-box", fontFamily: "monospace" })} />
                                  {g.unit && <span style={{fontSize:12,color:"var(--text-secondary)",flexShrink:0}}>{g.unit}</span>}
                                </div>
                              )}
                              <div style={{display:"flex",gap:2}}><button onClick={() => dupCustomItem(cc.id, item.id)} style={dupBtn}>⧉</button><button onClick={() => deleteCustomItem(cc.id, item.id)} style={{...delBtn,fontSize:18}}>x</button></div>
                            </div>
                          </DraggableRow>
                        ))}
                      </div>
                    )}
                    <AddRowBtn onClick={() => addCustomItem(cc.id, g.name)} label={`+ Add ${cc.jsonKey} token`} disabled={!cc.locked || !gLocked} />
                  </div>
                );
              })}
            </div>
          ))}

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{position:"fixed",bottom:0,left:161,right:0,background:"var(--bg-input)",border:"1px solid var(--accent)",borderRadius:"10px 10px 0 0",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 -4px 24px rgba(0,0,0,0.5)",zIndex:1000,flexWrap:"wrap"}}>
              <span style={{fontSize:13,fontWeight:600,color:"var(--accent-text)",flexShrink:0}}>{selected.size} selected</span>
              <div style={{width:1,height:20,background:"var(--border-input)",flexShrink:0}} />
              {(tab==="Colors") && <>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Group <select onChange={e=>{if(e.target.value)bulkApply("group",e.target.value);e.target.value="";}} style={inp({width:100,fontSize:11,padding:"4px 6px"})}><option value="">—</option>{colorGroups.map(g=><option key={g} value={g}>{g}</option>)}</select></label>
              </>}
              {(tab==="Text Styles") && <>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Font <select onChange={e=>{if(e.target.value)bulkApply("fontFamily",e.target.value);e.target.value="";}} style={inp({width:130,fontSize:11,padding:"4px 6px"})}><option value="">—</option>{FONT_FAMILIES.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Size <input type="number" min="1" placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as any).value){bulkApply("fontSize",(e.target as any).value);(e.target as any).value="";}}} style={inp({width:50,fontSize:11,padding:"4px 6px"})} /></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Weight <select onChange={e=>{if(e.target.value)bulkApply("fontWeight",e.target.value);e.target.value="";}} style={inp({width:70,fontSize:11,padding:"4px 6px"})}><option value="">—</option>{["100","200","300","400","500","600","700","800","900"].map(w=><option key={w} value={w}>{w}</option>)}</select></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>L.Height <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as any).value){bulkApply("lineHeight",(e.target as any).value);(e.target as any).value="";}}} style={inp({width:50,fontSize:11,padding:"4px 6px"})} /></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>L.Space <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as any).value){bulkApply("letterSpacing",(e.target as any).value);(e.target as any).value="";}}} style={inp({width:50,fontSize:11,padding:"4px 6px"})} /></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>P.Space <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as any).value){bulkApply("paragraphSpacing",(e.target as any).value);(e.target as any).value="";}}} style={inp({width:50,fontSize:11,padding:"4px 6px"})} /></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Decoration <select onChange={e=>{if(e.target.value)bulkApply("textDecoration",e.target.value);e.target.value="";}} style={inp({width:100,fontSize:11,padding:"4px 6px"})}><option value="">—</option>{["NONE","UNDERLINE","STRIKETHROUGH"].map(d=><option key={d} value={d}>{d}</option>)}</select></label>
                <label style={{fontSize:11,color:"var(--text-secondary)",display:"flex",gap:4,alignItems:"center"}}>Group <select onChange={e=>{if(e.target.value)bulkApply("group",e.target.value);e.target.value="";}} style={inp({width:100,fontSize:11,padding:"4px 6px"})}><option value="">—</option>{tsGroups.map(g=><option key={g} value={g}>{g}</option>)}</select></label>
              </>}
              <div style={{flex:1}} />
              <button onClick={bulkDelete} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"1px solid var(--danger-border)",background:"var(--danger-bg)",color:"var(--danger-text)",cursor:"pointer"}}>Delete</button>
              <button onClick={()=>setSelected(new Set())} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"1px solid var(--border-input)",background:"transparent",color:"var(--text-secondary)",cursor:"pointer"}}>Clear (Esc)</button>
            </div>
          )}

        </div>

        {/* JSON Preview */}
        {showPreview && (
          <div style={{width:420,background:"var(--bg-preview)",borderLeft:"1px solid var(--border-struct)",display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid var(--border-struct)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600}}>{tab} — DTCG JSON</span>
              <span style={{fontSize:11,color:"var(--text-secondary)"}}>Figma native format</span>
            </div>
            <pre style={{flex:1,overflow:"auto",padding:16,fontSize:11,color:"var(--json-green)",fontFamily:"monospace",lineHeight:1.6,margin:0}}>{previewJSON()}</pre>
          </div>
        )}

      </div>
    </div>
  );
}