import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken, FontFamily } from "./types";

export const ALL_TABS = ["Primitives","Colors","Spacing","Typography","Text Styles","Radius","Border","Shadows","Z-Index","Breakpoints"];
export const DEFAULT_ENABLED = new Set(ALL_TABS);
export const DEFAULT_COLOR_GROUPS = ["brand","surface","text","border","feedback","overlay"];
export const DEFAULT_TS_GROUPS = ["display","heading","body","label","caption","code"];
export const STORAGE_KEY = "figma-variables-generator";

const INITIAL_PRIM_GROUPS = [
  {id:1,key:"blue",  label:"Blue",  shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#EFF6FF","#DBEAFE","#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#2563EB","#1D4ED8","#1E40AF","#1E3A5F"]},
  {id:2,key:"purple",label:"Purple",shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#F5F3FF","#EDE9FE","#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#7C3AED","#6D28D9","#5B21B6","#4C1D95"]},
  {id:3,key:"green", label:"Green", shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#F0FDF4","#DCFCE7","#BBF7D0","#86EFAC","#4ADE80","#22C55E","#16A34A","#15803D","#166534","#14532D"]},
  {id:4,key:"red",   label:"Red",   shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#FFF1F2","#FFE4E6","#FECDD3","#FCA5A5","#F87171","#EF4444","#DC2626","#B91C1C","#991B1B","#7F1D1D"]},
  {id:5,key:"amber", label:"Amber", shades:["50","100","200","300","400","500","600","700","800","900"],      defaults:["#FFFBEB","#FEF3C7","#FDE68A","#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309","#92400E","#78350F"]},
  {id:6,key:"gray",  label:"Gray",  shades:["50","100","200","300","400","500","600","700","800","900","950"],defaults:["#F9FAFB","#F3F4F6","#E5E7EB","#D1D5DB","#9CA3AF","#6B7280","#4B5563","#374151","#1F2937","#111827","#030712"]},
];

export const buildDefaultPrimitives = (): Primitives => {
  const obj: Primitives = {};
  INITIAL_PRIM_GROUPS.forEach(g => { obj[g.key] = {}; g.shades.forEach((s,i) => { obj[g.key][s] = g.defaults[i]; }); });
  obj.base = { white:"#FFFFFF", black:"#000000" };
  return obj;
};

export const buildDefaultPrimGroups = (): PrimGroup[] =>
  INITIAL_PRIM_GROUPS.map(g => ({ id:g.id, key:g.key, label:g.label, shades:[...g.shades] }));

export const defaultTextStyles: TextStyle[] = [
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

export const defaultColors: ColorToken[] = [
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

export const defaultSpacing: SpacingToken[] = [{id:1,name:"0",value:"0"},{id:2,name:"px",value:"1"},{id:3,name:"0-5",value:"2"},{id:4,name:"1",value:"4"},{id:5,name:"1-5",value:"6"},{id:6,name:"2",value:"8"},{id:7,name:"2-5",value:"10"},{id:8,name:"3",value:"12"},{id:9,name:"4",value:"16"},{id:10,name:"5",value:"20"},{id:11,name:"6",value:"24"},{id:12,name:"8",value:"32"},{id:13,name:"10",value:"40"},{id:14,name:"12",value:"48"},{id:15,name:"16",value:"64"},{id:16,name:"20",value:"80"},{id:17,name:"24",value:"96"},{id:18,name:"32",value:"128"}];

export const defaultTypography: Typography = { families:[{id:101,name:"sans",value:"Inter, system-ui, sans-serif"},{id:102,name:"mono",value:"'Fira Code', monospace"}], sizes:[{id:201,name:"xs",value:"12"},{id:202,name:"sm",value:"14"},{id:203,name:"base",value:"16"},{id:204,name:"lg",value:"18"},{id:205,name:"xl",value:"20"},{id:206,name:"2xl",value:"24"},{id:207,name:"3xl",value:"30"},{id:208,name:"4xl",value:"36"},{id:209,name:"5xl",value:"48"},{id:210,name:"6xl",value:"60"}], weights:[{id:301,name:"regular",value:"400"},{id:302,name:"medium",value:"500"},{id:303,name:"semibold",value:"600"},{id:304,name:"bold",value:"700"}], lineHeights:[{id:401,name:"tight",value:"1.25"},{id:402,name:"snug",value:"1.375"},{id:403,name:"normal",value:"1.5"},{id:404,name:"relaxed",value:"1.625"},{id:405,name:"loose",value:"2"}] };

export const defaultRadius: RadiusToken[] = [{id:1,name:"none",value:"0"},{id:2,name:"sm",value:"4"},{id:3,name:"md",value:"6"},{id:4,name:"lg",value:"8"},{id:5,name:"xl",value:"12"},{id:6,name:"2xl",value:"16"},{id:7,name:"3xl",value:"24"},{id:8,name:"full",value:"9999"}];

export const defaultBorders: BorderToken[] = [{id:1,name:"none",value:"0"},{id:2,name:"thin",value:"1"},{id:3,name:"default",value:"2"},{id:4,name:"thick",value:"4"}];

export const defaultShadows: ShadowToken[] = [{id:1,name:"xs",value:"0px 1px 3px 0px rgba(0,0,0,0.18)"},{id:2,name:"sm",value:"0px 2px 6px 0px rgba(0,0,0,0.20)"},{id:3,name:"md",value:"0px 4px 12px 0px rgba(0,0,0,0.22)"},{id:4,name:"lg",value:"0px 8px 24px 0px rgba(0,0,0,0.24)"},{id:5,name:"xl",value:"0px 16px 40px 0px rgba(0,0,0,0.26)"},{id:6,name:"2xl",value:"0px 24px 64px 0px rgba(0,0,0,0.30)"}];

export const defaultZIndex: ZIndexToken[] = [{id:1,name:"base",value:"0"},{id:2,name:"raised",value:"10"},{id:3,name:"dropdown",value:"100"},{id:4,name:"sticky",value:"200"},{id:5,name:"overlay",value:"300"},{id:6,name:"modal",value:"400"},{id:7,name:"toast",value:"500"},{id:8,name:"tooltip",value:"600"}];

export const defaultBreakpoints: BreakpointToken[] = [{id:1,name:"xs",value:"0",max:"567"},{id:2,name:"sm",value:"567",max:"767"},{id:3,name:"md",value:"767",max:"991"},{id:4,name:"lg",value:"991",max:""}];

export const TS_DECORATION_OPTIONS = ["NONE","UNDERLINE","STRIKETHROUGH"];

export const FONT_FAMILIES: FontFamily[] = [
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

let _id = 500;
export function initIdCounter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    const collect = (arr: { id: number }[]) => arr?.forEach(i => { if (i?.id > _id) _id = i.id; });
    collect(s.primGroups); collect(s.colors); collect(s.spacing); collect(s.textStyles);
    collect(s.radius); collect(s.borders); collect(s.shadows); collect(s.zindex); collect(s.breakpoints);
    s.typography?.families && collect(s.typography.families);
    s.typography?.sizes && collect(s.typography.sizes);
    s.typography?.weights && collect(s.typography.weights);
    s.typography?.lineHeights && collect(s.typography.lineHeights);
    s.customCollections?.forEach((cc: { id: number; items: { id: number }[] }) => { if (cc?.id > _id) _id = cc.id; collect(cc.items); });
  } catch { /* ignore */ }
}
export const uid = () => ++_id;

export const matchesSearch = (q: string, ...fields: string[]) => {
  if (!q) return true;
  const lq = q.toLowerCase();
  return fields.some(f => f && f.toLowerCase().includes(lq));
};

export function loadSaved() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

// ── Validation helpers ──────────────────────────────────────────────────────

/** Auto-format a hex color: expand shorthand (fff -> #ffffff), add # if missing */
export function normalizeHex(raw: string): string {
  const s = raw.trim();
  if (!s || s.startsWith("rgb") || s.startsWith("hsl") || s.startsWith("{")) return s;
  const bare = s.startsWith("#") ? s.slice(1) : s;
  if (/^[0-9a-fA-F]{3}$/.test(bare)) return "#" + bare[0]+bare[0]+bare[1]+bare[1]+bare[2]+bare[2];
  if (/^[0-9a-fA-F]{4}$/.test(bare)) return "#" + bare[0]+bare[0]+bare[1]+bare[1]+bare[2]+bare[2]+bare[3]+bare[3];
  if (/^[0-9a-fA-F]{6}$/.test(bare)) return "#" + bare;
  if (/^[0-9a-fA-F]{8}$/.test(bare)) return "#" + bare;
  return s;
}

/** Validates that a string is a valid CSS identifier (for JSON keys, CSS var names) */
export const isValidCSSIdentifier = (s: string) => /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(s);

/** Sanitize a number input: returns "" for empty, clamped string for valid numbers, or previous value for NaN */
export function sanitizeNumberInput(raw: string, prev: string, min?: number, max?: number): string {
  if (raw === "" || raw === "-") return raw;
  const n = Number(raw);
  if (isNaN(n)) return prev;
  if (min !== undefined && n < min) return String(min);
  if (max !== undefined && n > max) return String(max);
  return raw;
}

/** Find duplicate token names within a list, returns Set of duplicated names */
export function findDuplicateNames<T extends { name: string }>(items: T[]): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (key && seen.has(key)) dupes.add(key);
    seen.add(key);
  }
  return dupes;
}

/** Find duplicate names within grouped items */
export function findDuplicateNamesInGroups<T extends { name: string; group: string }>(items: T[]): Set<string> {
  const byGroup: Record<string, string[]> = {};
  const dupes = new Set<string>();
  for (const item of items) {
    const g = item.group;
    if (!byGroup[g]) byGroup[g] = [];
    const key = item.name.trim().toLowerCase();
    if (key && byGroup[g].includes(key)) dupes.add(key);
    byGroup[g].push(key);
  }
  return dupes;
}
