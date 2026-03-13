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
function genCustomJSON(items: any[], type: string, unit: string) {
  const t: any={};
  const isNum = type==="number"||type==="dimension"||type==="duration";
  items.forEach(i => {
    const val = isNum ? (parseFloat(i.value)||0) : i.value;
    t[i.name] = { "$type":type, "$value": unit ? { value:val, unit } : val };
  });
  return JSON.stringify(t,null,2);
}
function genShadowsJSON(shadows: any[])     { const t: any={}; shadows.forEach(s      => { t[s.name]       = { "$type":"string",    "$value":s.value }; });                                    return JSON.stringify(t,null,2); }
function genZIndexJSON(zindex: any[])       { const t: any={}; zindex.forEach(z        => { t[z.name]       = { "$type":"number",    "$value":parseFloat(z.value)||0 }; });                    return JSON.stringify(t,null,2); }
function genBreakpointsJSON(bps: any[])     { const t: any={}; bps.forEach(b           => { t[b.name]       = { "$type":"number",    "$value":parseFloat(b.value)||0 }; });                    return JSON.stringify(t,null,2); }

function dlJSON(json: string, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([json],{type:"application/json"}));
  a.download = filename; a.click();
}

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
const defaultTypography  = { families:[{id:1,name:"sans",value:"Inter, system-ui, sans-serif"},{id:2,name:"mono",value:"'Fira Code', monospace"}], sizes:[{id:1,name:"xs",value:"12"},{id:2,name:"sm",value:"14"},{id:3,name:"base",value:"16"},{id:4,name:"lg",value:"18"},{id:5,name:"xl",value:"20"},{id:6,name:"2xl",value:"24"},{id:7,name:"3xl",value:"30"},{id:8,name:"4xl",value:"36"},{id:9,name:"5xl",value:"48"},{id:10,name:"6xl",value:"60"}], weights:[{id:1,name:"regular",value:"400"},{id:2,name:"medium",value:"500"},{id:3,name:"semibold",value:"600"},{id:4,name:"bold",value:"700"}], lineHeights:[{id:1,name:"tight",value:"1.25"},{id:2,name:"snug",value:"1.375"},{id:3,name:"normal",value:"1.5"},{id:4,name:"relaxed",value:"1.625"},{id:5,name:"loose",value:"2"}] };
const defaultRadius      = [{id:1,name:"none",value:"0"},{id:2,name:"sm",value:"4"},{id:3,name:"md",value:"6"},{id:4,name:"lg",value:"8"},{id:5,name:"xl",value:"12"},{id:6,name:"2xl",value:"16"},{id:7,name:"3xl",value:"24"},{id:8,name:"full",value:"9999"}];
const defaultBorders     = [{id:1,name:"none",value:"0"},{id:2,name:"thin",value:"1"},{id:3,name:"default",value:"2"},{id:4,name:"thick",value:"4"}];
const defaultShadows     = [{id:1,name:"xs",value:"0px 1px 3px 0px rgba(0,0,0,0.18)"},{id:2,name:"sm",value:"0px 2px 6px 0px rgba(0,0,0,0.20)"},{id:3,name:"md",value:"0px 4px 12px 0px rgba(0,0,0,0.22)"},{id:4,name:"lg",value:"0px 8px 24px 0px rgba(0,0,0,0.24)"},{id:5,name:"xl",value:"0px 16px 40px 0px rgba(0,0,0,0.26)"},{id:6,name:"2xl",value:"0px 24px 64px 0px rgba(0,0,0,0.30)"}];
const defaultZIndex      = [{id:1,name:"base",value:"0"},{id:2,name:"raised",value:"10"},{id:3,name:"dropdown",value:"100"},{id:4,name:"sticky",value:"200"},{id:5,name:"overlay",value:"300"},{id:6,name:"modal",value:"400"},{id:7,name:"toast",value:"500"},{id:8,name:"tooltip",value:"600"}];
const defaultBreakpoints = [{id:1,name:"xs",value:"0",max:"567"},{id:2,name:"sm",value:"567",max:"767"},{id:3,name:"md",value:"767",max:"991"},{id:4,name:"lg",value:"991",max:""}];

let _id = 500;
const uid = () => ++_id;

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = (extra: any={}) => ({background:"#1a1a2e",border:"1px solid #333",borderRadius:6,padding:"9px 12px",fontSize:13,color:"#fff",outline:"none",...extra});
const delBtn: any = {background:"none",border:"none",color:"#f87171",cursor:"pointer"};
const rowBase: any = {padding:"8px 0",borderBottom:"1px solid #14141e"};
const hdrStyle: any = {fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",color:"#777",padding:"10px 0 6px",display:"flex",alignItems:"center",gap:8};

// ── Shared components ─────────────────────────────────────────────────────────
function AddRowBtn({ onClick, label }: any) {
  return <button onClick={onClick} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px dashed #4f46e5",background:"#1a1a3e",color:"#a5b4fc",cursor:"pointer",marginTop:6,width:"100%",textAlign:"left"}}>{label}</button>;
}
function TabHeader({ title, description, actions }: any) {
  return (
    <div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #1e1e30"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <span style={{fontSize:15,fontWeight:600}}>{title}</span>
        {actions && <div style={{flexShrink:0}}>{actions}</div>}
      </div>
      {description && <div style={{fontSize:13,color:"#777",marginTop:4}}>{description}</div>}
    </div>
  );
}
function DragHandle({ onMouseEnter, onMouseLeave }: any) {
  return <div title="Drag to reorder" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{cursor:"grab",padding:"0 4px",color:"#777",fontSize:14,userSelect:"none",display:"flex",alignItems:"center",flexShrink:0}}>&#8959;</div>;
}
function useDraggable(list: any[], setList: any) {
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
      <span style={{fontFamily:style.fontFamily,fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:(parseFloat(style.letterSpacing)||0)+"px",textDecoration:style.textDecoration==="UNDERLINE"?"underline":style.textDecoration==="STRIKETHROUGH"?"line-through":"none",color:"#fff",opacity:0.9,userSelect:"text",cursor:"text",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",wordBreak:"break-word",maxWidth:w}}>{PREVIEW_TEXT}</span>
    </div>
  );
}

function DraggableRow({ id, dragHandlers, children }: any) {
  const [over, setOver] = useState(false), [hov, setHov] = useState(false);
  return (
    <div draggable={hov}
      onDragStart={() => dragHandlers.onDragStart(id)}
      onDragOver={(e: any) => { dragHandlers.onDragOver(e,id); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { dragHandlers.onDrop(); setOver(false); }}
      onDragEnd={() => { dragHandlers.onDragEnd(); setOver(false); }}
      style={{...rowBase,background:over?"#1a1a3a":"transparent",borderLeft:over?"2px solid #4f46e5":"2px solid transparent",paddingLeft:over?6:8,cursor:hov?"grab":"default",display:"flex",alignItems:"center",gap:8}}>
      <DragHandle onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} />
      <div style={{flex:1}}>{children}</div>
    </div>
  );
}
function InlineLabel({ value, onCommit, prefix="", style={} }: any) {
  const [editing, setEditing] = useState(false), [val, setVal] = useState(value);
  if (editing) return <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={()=>setEditing(false)} onKeyDown={e=>{if(e.key==="Enter"){onCommit(val);setEditing(false);}if(e.key==="Escape")setEditing(false);}} style={{background:"#1a1a2e",border:"1px solid #4f46e5",borderRadius:4,padding:"2px 6px",color:"#fff",outline:"none",width:66,fontFamily:"monospace",...style}} />;
  return <span onClick={() => { setVal(value); setEditing(true); }} title="Click to rename" style={{cursor:"pointer",borderBottom:"1px dashed #444",paddingBottom:1,...style}}>{prefix}{value}</span>;
}
function PrimSelector({ value, primitives, primGroups, onChange, mode }: any) {
  const opts = getPrimOptions(primitives, primGroups);
  const isCustom = !value.startsWith("{primitives.");
  const resolved = resolveColor(value, primitives);
  const [showCustom, setShowCustom] = useState(isCustom);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:20,height:20,borderRadius:4,background:resolved,border:"1px solid #333",flexShrink:0}} />
        <span style={{fontSize:11,color:"#777",fontFamily:"monospace"}}>{isCustom ? resolved : value.replace("{primitives.","").replace("}","")}</span>
      </div>
      <select value={isCustom?"custom":value} onChange={e=>{const v=e.target.value;if(v==="custom"){setShowCustom(true);onChange(resolved);}else{setShowCustom(false);onChange(v);}}} style={{background:"#1a1a2e",border:"1px solid #333",borderRadius:6,padding:"8px 10px",fontSize:12,color:"#777",outline:"none",cursor:"pointer"}}>
        <optgroup label={"-- "+mode+" mode --"}>{opts.map(o=><option key={o.ref} value={o.ref} style={{background:"#1a1a2e"}}>{o.label}</option>)}</optgroup>
      </select>
      {showCustom && <div style={{display:"flex",gap:6,alignItems:"center"}}><input type="color" value={resolved} onChange={e=>onChange(e.target.value)} style={{width:32,height:32,border:"none",background:"none",cursor:"pointer",padding:0}} /><input value={value} onChange={e=>onChange(e.target.value)} placeholder="#000000 or rgba(...)" style={{flex:1,background:"#1a1a2e",border:"1px solid #333",borderRadius:6,padding:"8px 10px",fontSize:12,color:"#fff",outline:"none",fontFamily:"monospace"}} /></div>}
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
  return <div onClick={onClick} style={{width:64,height:40,background:"#c8cad8",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,boxSizing:"border-box",border:active?"2px solid #4f46e5":"2px solid transparent"}}><div style={{width:36,height:22,borderRadius:5,background:"#ffffff",boxShadow:value}} /></div>;
}
function ShadowSlider({ label, value, min, max, onChange }: any) {
  return <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"#777",width:52,flexShrink:0}}>{label}</span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} style={{flex:1,accentColor:"#4f46e5",cursor:"pointer"}} /><input type="number" value={value} onChange={e=>onChange(Number(e.target.value)||0)} style={inp({width:52,padding:"4px 6px",fontSize:11,textAlign:"center",fontFamily:"monospace"})} /><span style={{fontSize:11,color:"#777",width:16,flexShrink:0}}>px</span></div>;
}
function ShadowPicker({ value, onChange }: any) {
  const p=parseShadow(value), set=(field: string,val: any)=>onChange(buildShadow({...p,[field]:val}));
  return <div style={{display:"flex",gap:20,alignItems:"center",background:"#0f0f1a",border:"1px solid #2a2a3e",borderRadius:10,padding:"16px 20px",margin:"4px 0 10px 0"}}><div style={{width:110,height:90,background:"#c8cad8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:64,height:44,borderRadius:7,background:"#ffffff",boxShadow:value}} /></div><div style={{flex:1,display:"flex",flexDirection:"column",gap:9}}><ShadowSlider label="X offset" value={p.x} min={-80} max={80} onChange={(v: any)=>set("x",v)} /><ShadowSlider label="Y offset" value={p.y} min={-80} max={80} onChange={(v: any)=>set("y",v)} /><ShadowSlider label="Blur" value={p.blur} min={0} max={120} onChange={(v: any)=>set("blur",v)} /><ShadowSlider label="Spread" value={p.spread} min={-40} max={60} onChange={(v: any)=>set("spread",v)} /><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:11,color:"#777",width:52,flexShrink:0}}>Color</span><input value={p.color} onChange={e=>set("color",e.target.value)} style={inp({flex:1,fontFamily:"monospace",fontSize:11,padding:"5px 8px"})} /><label style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#888",cursor:"pointer",flexShrink:0,userSelect:"none"}}><input type="checkbox" checked={p.inset} onChange={e=>set("inset",e.target.checked)} style={{accentColor:"#4f46e5"}} />inset</label></div></div></div>;
}
function ShadowRow({ sh, dragHandlers, onChangeName, onChangeValue, onDelete }: any) {
  const [open,setOpen]=useState(false), [hov,setHov]=useState(false);
  return <div style={{borderBottom:"1px solid #14141e"}}><div draggable onDragStart={()=>dragHandlers.onDragStart(sh.id)} onDragOver={(e: any)=>dragHandlers.onDragOver(e,sh.id)} onDrop={()=>dragHandlers.onDrop()} onDragEnd={()=>dragHandlers.onDragEnd()} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0 8px 8px",cursor:hov?"grab":"default"}}><DragHandle onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} /><span style={{fontSize:12,color:"#777",flexShrink:0,width:72}}>shadow /</span><input value={sh.name} onChange={e=>onChangeName(e.target.value)} style={inp({width:140,flexShrink:0})} /><input value={sh.value} onChange={e=>onChangeValue(e.target.value)} style={inp({flex:1,fontFamily:"monospace",fontSize:12,minWidth:0})} /><ShadowSwatch value={sh.value} active={open} onClick={()=>setOpen((o: boolean)=>!o)} /><button onClick={onDelete} style={{...delBtn,fontSize:18,flexShrink:0}}>x</button></div>{open && <ShadowPicker value={sh.value} onChange={onChangeValue} />}</div>;
}

// ── Download panel ────────────────────────────────────────────────────────────
function DownloadPanel({ enabled, primGroups, primitives, colors, spacing, typography, textStyles, radius, borders, shadows, zindex, breakpoints, customCollections }: any) {
  const allFiles = [
    { tab:"Primitives",   label:"primitives.json",     name:"primitives.json",     json:() => genPrimitivesJSON(primGroups,primitives)     },
    { tab:"Colors",       label:"colors-light.json",   name:"colors-light.json",   json:() => genColorsJSON(colors,primitives,"light")     },
    { tab:"Colors",       label:"colors-dark.json",    name:"colors-dark.json",    json:() => genColorsJSON(colors,primitives,"dark")      },
    { tab:"Spacing",      label:"spacing.json",        name:"spacing.json",        json:() => genSpacingJSON(spacing)                      },
    { tab:"Typography",   label:"typography.json",     name:"typography.json",     json:() => genTypographyJSON(typography)                },
    { tab:"Text Styles",  label:"text-styles.json",    name:"text-styles.json",    json:() => genTextStylesJSON(textStyles)                },
    { tab:"Radius",       label:"radius.json",         name:"radius.json",         json:() => genRadiusJSON(radius)                        },
    { tab:"Border",       label:"border-width.json",   name:"border-width.json",   json:() => genBorderJSON(borders)                       },
    { tab:"Shadows",      label:"shadows.json",        name:"shadows.json",        json:() => genShadowsJSON(shadows)                      },
    { tab:"Z-Index",      label:"z-index.json",        name:"z-index.json",        json:() => genZIndexJSON(zindex)                        },
    { tab:"Breakpoints",  label:"breakpoints.json",    name:"breakpoints.json",    json:() => genBreakpointsJSON(breakpoints)              },
    ...(customCollections||[]).map((c: any) => ({ tab:c.name, label:c.jsonKey+".json", name:c.jsonKey+".json", json:()=>genCustomJSON(c.items,c.type,c.unit) })),
  ].filter(f => enabled.has(f.tab));

  const [checked, setChecked] = useState(() => new Set(allFiles.map(f => f.name)));
  const allChecked = checked.size === allFiles.length;
  const toggle = (name: string) => setChecked(prev => { const next=new Set(prev); next.has(name)?next.delete(name):next.add(name); return next; });
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(allFiles.map(f => f.name)));
  const downloadSelected = () => allFiles.filter(f => checked.has(f.name)).forEach(f => dlJSON(f.json(), f.name));

  return (
    <div style={{background:"#111118",border:"1px solid #2a2a3e",borderRadius:10,padding:16,minWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
      <div style={{background:"#0a0a14",border:"1px solid #1e1e30",borderRadius:7,padding:"10px 12px",marginBottom:12,fontSize:11,color:"#777",lineHeight:1.7}}>
        <b style={{color:"#888"}}>How to import into Figma:</b><br />
        1. Open the Local Variables panel<br />
        2. Use the plugin's <b style={{color:"#a78bfa"}}>Import Variables</b> tab<br />
        3. For <b style={{color:"#a78bfa"}}>Text Styles</b>: ensure fonts are installed locally
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",marginBottom:4,borderRadius:6,background:"#0f0f1a",border:"1px solid #1e1e30"}}>
        <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{accentColor:"#4f46e5",width:14,height:14,cursor:"pointer",flexShrink:0}} />
        <span style={{fontSize:12,color:"#888",flex:1}}>{allChecked ? "Deselect all" : "Select all"}</span>
        <span style={{fontSize:11,color:"#777"}}>{checked.size} / {allFiles.length} selected</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:2,marginBottom:12}}>
        {allFiles.map(f => (
          <label key={f.name} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 8px",borderRadius:6,cursor:"pointer",background:checked.has(f.name)?"#14142a":"transparent"}}>
            <input type="checkbox" checked={checked.has(f.name)} onChange={() => toggle(f.name)} style={{accentColor:"#4f46e5",width:14,height:14,cursor:"pointer",flexShrink:0}} />
            <span style={{fontSize:12,color:checked.has(f.name)?"#ccc":"#555",fontFamily:"monospace",flex:1}}>{f.label}</span>
            <span style={{fontSize:11,color:"#333"}}>{f.tab}</span>
          </label>
        ))}
      </div>
      <button onClick={downloadSelected} disabled={checked.size===0} style={{width:"100%",padding:"9px 0",borderRadius:7,border:"none",background:checked.size===0?"#1e1e2e":"#4f46e5",color:checked.size===0?"#444":"#fff",fontWeight:600,fontSize:13,cursor:checked.size===0?"not-allowed":"pointer"}}>
        ↓ Download {checked.size} file{checked.size!==1?"s":""}
      </button>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]                   = useState("Primitives");
  const [enabledTabs, setEnabledTabs]   = useState(DEFAULT_ENABLED);
  const [primGroups,  setPrimGroups]    = useState(buildDefaultPrimGroups);
  const [primitives,  setPrimitives]    = useState(buildDefaultPrimitives);
  const [colorGroups, setColorGroups]   = useState(DEFAULT_COLOR_GROUPS);
  const [colors,      setColors]        = useState(defaultColors);
  const [spacing,     setSpacing]       = useState(defaultSpacing);
  const [typography,  setTypography]    = useState(defaultTypography);
  const [textStyles,  setTextStyles]    = useState(defaultTextStyles);
  const [tsGroups,    setTsGroups]      = useState(DEFAULT_TS_GROUPS);
  const [radius,      setRadius]        = useState(defaultRadius);
  const [borders,     setBorders]       = useState(defaultBorders);
  const [shadows,     setShadows]       = useState(defaultShadows);
  const [zindex,      setZIndex]        = useState(defaultZIndex);
  const [breakpoints, setBreakpoints]   = useState(defaultBreakpoints);
  const [customCollections, setCustomCollections] = useState<any[]>([]);
  const [showPreview,      setShowPreview]      = useState(false);
  const [showDl,           setShowDl]           = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [importError,      setImportError]      = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef<any>();

  const allTabs = [...ALL_TABS, ...customCollections.map((c: any) => c.name)];

  const addCustomCollection = () => {
    const id = uid();
    const name = "Custom " + id;
    setCustomCollections(cc => [...cc, { id, name, jsonKey: "custom-" + id, type: "number", unit: "", items: [], locked: false }]);
    setEnabledTabs(prev => { const next = new Set(prev); next.add(name); return next; });
    setTab(name);
  };
  const updateCustomCollection = (id: number, field: string, val: any) =>
    setCustomCollections(cc => cc.map(c => c.id === id ? { ...c, [field]: val } : c));
  const renameCustomCollection = (id: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || allTabs.includes(trimmed)) return;
    setCustomCollections(cc => cc.map(c => {
      if (c.id !== id) return c;
      return { ...c, name: trimmed };
    }));
    setEnabledTabs(prev => {
      const old = customCollections.find(c => c.id === id)?.name;
      const next = new Set(prev);
      if (old && next.has(old)) { next.delete(old); next.add(trimmed); }
      return next;
    });
    if (tab === customCollections.find(c => c.id === id)?.name) setTab(trimmed);
  };
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
  const addCustomItem = (collId: number) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, items: [...c.items, { id: uid(), name: "new", value: c.type === "color" ? "{primitives.blue.600}" : c.type === "fontFamily" ? "Inter, sans-serif" : "0" }] } : c));

  const toggleTab = (t: string) => setEnabledTabs(prev => {
    const next = new Set(prev);
    if (next.has(t)) { next.delete(t); if (tab===t) { const fb=allTabs.find(x=>next.has(x)); if(fb) setTab(fb); } }
    else { next.add(t); setTab(t); }
    return next;
  });

  const colorDrag      = useDraggable(colors,      setColors);
  const spacingDrag    = useDraggable(spacing,      setSpacing);
  const textStylesDrag = useDraggable(textStyles,   setTextStyles);
  const radiusDrag     = useDraggable(radius,       setRadius);
  const borderDrag     = useDraggable(borders,      setBorders);
  const shadowDrag     = useDraggable(shadows,      setShadows);
  const zDrag          = useDraggable(zindex,       setZIndex);
  const breakpointDrag = useDraggable(breakpoints,  setBreakpoints);
  const typFamDrag     = useDraggable(typography.families,    (l: any) => setTypography((t: any) => ({...t,families:l})));
  const typSizeDrag    = useDraggable(typography.sizes,       (l: any) => setTypography((t: any) => ({...t,sizes:l})));
  const typWgtDrag     = useDraggable(typography.weights,     (l: any) => setTypography((t: any) => ({...t,weights:l})));
  const typLhDrag      = useDraggable(typography.lineHeights, (l: any) => setTypography((t: any) => ({...t,lineHeights:l})));
  const typoDragMap: any = { families:typFamDrag, sizes:typSizeDrag, weights:typWgtDrag, lineHeights:typLhDrag };

  const updateTextStyle = (id: number, field: string, val: string) =>
    setTextStyles(ts => ts.map(s => s.id===id ? {...s,[field]:val} : s));
  const deleteTextStyle = (id: number) =>
    setTextStyles(ts => ts.filter(s => s.id!==id));
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
    if (cc) return genCustomJSON(cc.items, cc.type, cc.unit);
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
  const updateList  = (setter: any, id: number, f: string, v: any) => setter((prev: any[]) => prev.map(i => i.id===id ? {...i,[f]:v} : i));
  const deleteList  = (setter: any, id: number) => setter((prev: any[]) => prev.filter(i => i.id!==id));

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
      if (cc) setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, items: [] } : c));
    }
    setTabResetConfirm(false);
  };

  const tabBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #333",background:"#1a1a2e",color:"#777",cursor:"pointer"} as const;
  const tabAddBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #4f46e5",background:"#1a1a3e",color:"#a5b4fc",cursor:"pointer"} as const;
  const tabResetBtnStyle = {fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #7f1d1d",background:"#1a0a0a",color:"#f87171",cursor:"pointer"} as const;
  const tabActionBtns = <>{importError && <span style={{fontSize:12,color:"#f87171"}}>{importError}</span>}
    <button onClick={()=>fileRef.current.click()} style={tabBtnStyle}>Import JSON</button>
    <button onClick={()=>setShowPreview(v=>!v)} style={tabBtnStyle}>{showPreview?"Hide Preview":"Preview JSON"}</button>
    <button onClick={copy} style={tabBtnStyle}>{copied?"Copied!":"Copy JSON"}</button>
    {tabResetConfirm ? <>
      <span style={{fontSize:12,color:"#f87171"}}>Reset {tab}?</span>
      <button onClick={resetTab} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:600}}>Yes</button>
      <button onClick={()=>setTabResetConfirm(false)} style={tabBtnStyle}>Cancel</button>
    </> : <button onClick={()=>setTabResetConfirm(true)} style={tabResetBtnStyle}>Reset</button>}
  </>;
  const tabActions = (extra?: any) => <div style={{display:"flex",gap:8,alignItems:"center"}}>{tabActionBtns}{extra}</div>;

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",background:"#0a0a0f",minHeight:"100vh",color:"#fff",display:"flex",flexDirection:"column",width:"100%",boxSizing:"border-box",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"#111118",borderBottom:"1px solid #222230",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:16,fontWeight:600}}>Figma Variables Generator</div>
          <div style={{fontSize:12,color:"#777",marginTop:2}}>Builds DTCG JSON for Figma native Variables + Text Styles import</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport} />
          {showResetConfirm ? (
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#2a1a1a",border:"1px solid #7f1d1d",borderRadius:6,padding:"4px 10px"}}>
              <span style={{fontSize:12,color:"#f87171"}}>Reset everything?</span>
              <button onClick={handleReset} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:600}}>Yes, reset</button>
              <button onClick={()=>setShowResetConfirm(false)} style={{fontSize:12,padding:"5px 10px",borderRadius:5,border:"1px solid #333",background:"transparent",color:"#aaa",cursor:"pointer"}}>Cancel</button>
            </div>
          ) : (
            <button onClick={()=>setShowResetConfirm(true)} style={{fontSize:13,padding:"8px 14px",borderRadius:6,border:"1px solid #7f1d1d",background:"#1a0a0a",color:"#f87171",cursor:"pointer"}}>Reset</button>
          )}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowDl(v=>!v)} style={{fontSize:13,padding:"8px 14px",borderRadius:6,border:"1px solid #333",background:"#1a1a2e",color:"#777",cursor:"pointer"}}>Download Files {showDl?"▴":"▾"}</button>
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
        <div style={{width:160,background:"#111118",borderRight:"1px solid #222230",paddingTop:12,flexShrink:0,display:"flex",flexDirection:"column"}}>
          {allTabs.map(t => {
            const enabled=enabledTabs.has(t), active=tab===t;
            return (
              <div key={t} style={{display:"flex",alignItems:"center"}}>
                <button onClick={()=>{setTab(t);setTabResetConfirm(false);}} style={{flex:1,textAlign:"left",padding:"10px 14px",fontSize:13,fontWeight:active?600:400,cursor:"pointer",border:"none",background:active?"#4f46e5":"transparent",color:active?"#fff":enabled?"#777":"#444",transition:"all 0.15s"}}>{t}</button>
                <div onClick={()=>toggleTab(t)} title={enabled?"Exclude from export":"Include in export"} style={{width:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,paddingRight:10,paddingLeft:4,alignSelf:"stretch"}}>
                  <div style={{width:24,height:14,borderRadius:9999,background:enabled?"#4f46e5":"#2a2a3a",border:"1px solid "+(enabled?"#4f46e5":"#444"),position:"relative"}}>
                    <div style={{position:"absolute",top:2,left:enabled?10:2,width:9,height:9,borderRadius:"50%",background:enabled?"#fff":"#555",transition:"left 0.2s"}} />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={addCustomCollection} style={{margin:"8px 14px",padding:"8px 0",fontSize:12,borderRadius:6,border:"1px dashed #4f46e5",background:"#1a1a3e",color:"#a5b4fc",cursor:"pointer"}}>+ Add Collection</button>
        </div>

        {/* Content */}
        <div style={{flex:1,overflow:"auto",padding:28,minWidth:0,boxSizing:"border-box"}}>

          {/* PRIMITIVES */}
          {tab==="Primitives" && (
            <div>
              <TabHeader title="Primitive Colors" description="Raw palette. Click a name to rename. Never apply directly to layers."
                actions={tabActions(<button onClick={addPrimGroup} style={tabAddBtnStyle}>+ Add Palette</button>)} />
              {primGroups.map((g: any) => (
                <div key={g.id} style={{marginBottom:32}}>
                  <div style={hdrStyle}><InlineLabel value={g.label} prefix="primitives / " onCommit={(nl: string)=>renamePrimGroup(g.key,nl)} /><div style={{flex:1,height:1,background:"#1e1e30"}} /><button onClick={()=>deletePrimGroup(g.key)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete palette</button></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-start"}}>
                    {g.shades.map((shade: string) => (
                      <div key={shade} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{position:"relative",width:56,height:56}}>
                          <div style={{width:56,height:56,borderRadius:10,background:primitives[g.key]?.[shade]||"#808080",border:"1px solid #333"}} />
                          <input type="color" value={primitives[g.key]?.[shade]||"#808080"} onChange={e=>setPrimitives((p: any)=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}} />
                        </div>
                        <InlineLabel value={shade} onCommit={(ns: string)=>renameShade(g.key,shade,ns)} style={{fontSize:11,color:"#777",textAlign:"center"}} />
                        <input value={primitives[g.key]?.[shade]||""} onChange={e=>setPrimitives((p: any)=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} style={{width:66,background:"#1a1a2e",border:"1px solid #333",borderRadius:4,padding:"4px 5px",fontSize:10,color:"#aaa",textAlign:"center",outline:"none",fontFamily:"monospace"}} />
                        <button onClick={()=>removeShade(g.key,shade)} style={{...delBtn,fontSize:11,padding:0,lineHeight:1}}>x</button>
                      </div>
                    ))}
                    <div style={{display:"flex",alignItems:"center",height:56}}><button onClick={()=>addShade(g.key)} style={{height:56,width:40,borderRadius:10,border:"1px dashed #333",background:"transparent",color:"#777",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button></div>
                  </div>
                </div>
              ))}
              <div style={{marginBottom:28}}>
                <div style={hdrStyle}><span>primitives / Base</span><div style={{flex:1,height:1,background:"#1e1e30"}} /></div>
                <div style={{display:"flex",gap:12}}>
                  {["white","black"].map(k => (
                    <div key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{position:"relative",width:56,height:56}}>
                        <div style={{width:56,height:56,borderRadius:10,background:primitives.base?.[k]||"#000",border:"1px solid #333"}} />
                        <input type="color" value={primitives.base?.[k]||"#000000"} onChange={e=>setPrimitives((p: any)=>({...p,base:{...p.base,[k]:e.target.value}}))} style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer"}} />
                      </div>
                      <div style={{fontSize:11,color:"#777"}}>{k}</div>
                      <input value={primitives.base?.[k]||""} onChange={e=>setPrimitives((p: any)=>({...p,base:{...p.base,[k]:e.target.value}}))} style={{width:66,background:"#1a1a2e",border:"1px solid #333",borderRadius:4,padding:"4px 5px",fontSize:10,color:"#aaa",textAlign:"center",outline:"none",fontFamily:"monospace"}} />
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
                actions={tabActions(<button onClick={addColorGroup} style={tabAddBtnStyle}>+ Add Group</button>)} />
              {colorGroups.map((g: string) => (
                <div key={g} style={{marginBottom:28}}>
                  <div style={hdrStyle}><InlineLabel value={g} prefix="color / " onCommit={(n: string)=>renameColorGroup(g,n)} /><div style={{flex:1,height:1,background:"#1e1e30"}} /><button onClick={()=>deleteColorGroup(g)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button></div>
                  {groupedColors[g].length===0 && <div style={{fontSize:12,color:"#777",padding:"8px 4px",fontStyle:"italic"}}>No tokens yet.</div>}
                  {groupedColors[g].length > 0 && (
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"28px 110px 150px 1fr 1fr 32px",gap:10,padding:"4px 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                        {["","Group","Name","Light","Dark",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                      </div>
                      {groupedColors[g].map((c: any) => (
                        <DraggableRow key={c.id} id={c.id} dragHandlers={colorDrag}>
                          <div style={{display:"grid",gridTemplateColumns:"110px 150px 1fr 1fr 32px",gap:10,alignItems:"start"}}>
                            <select value={c.group} onChange={e=>updateColor(c.id,"group",e.target.value)} style={inp({width:"100%"})}>{colorGroups.map((g2: string)=><option key={g2}>{g2}</option>)}</select>
                            <div><input value={c.name} onChange={e=>updateColor(c.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} /><input value={c.description} onChange={e=>updateColor(c.id,"description",e.target.value)} placeholder="Description" style={inp({width:"100%",boxSizing:"border-box",marginTop:6,fontSize:11,color:"#777",padding:"6px 10px",border:"1px solid #222"})} /></div>
                            <PrimSelector value={c.light} primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"light",v)} mode="Light" />
                            <PrimSelector value={c.dark}  primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"dark",v)}  mode="Dark" />
                            <button onClick={()=>setColors((c2: any[])=>c2.filter(i=>i.id!==c.id))} style={{...delBtn,fontSize:18,paddingTop:8}}>x</button>
                          </div>
                        </DraggableRow>
                      ))}
                    </div>
                  )}
                  <AddRowBtn onClick={()=>setColors((c: any[])=>[...c,{id:uid(),group:g,name:"new-color",light:"{primitives.blue.600}",dark:"{primitives.blue.400}",description:""}])} label={"+ Add token to "+g} />
                </div>
              ))}
            </div>
          )}

          {/* SPACING */}
          {tab==="Spacing" && (
            <div>
              <TabHeader title="Spacing Tokens" description="4px base scale. Drag to reorder." actions={tabActions()} />
              <div style={{display:"grid",gridTemplateColumns:"28px 80px 160px 160px 1fr 32px",gap:10,padding:"0 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {spacing.map((sp: any) => (
                <DraggableRow key={sp.id} id={sp.id} dragHandlers={spacingDrag}>
                  <div style={{display:"grid",gridTemplateColumns:"80px 160px 160px 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#777"}}>spacing /</span>
                    <input value={sp.name} onChange={e=>updateList(setSpacing,sp.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={sp.value} onChange={e=>updateList(setSpacing,sp.id,"value",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"#777"}}>px</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{height:14,background:"#4f46e5",borderRadius:3,opacity:0.7,width:Math.min(parseInt(sp.value)||0,220)+"px",minWidth:2}} /><span style={{fontSize:12,color:"#777"}}>{sp.value}px</span></div>
                    <button onClick={()=>deleteList(setSpacing,sp.id)} style={{...delBtn,fontSize:18}}>x</button>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setSpacing((s: any[])=>[...s,{id:uid(),name:"new",value:"0"}])} label="+ Add spacing token" />
            </div>
          )}

          {/* TYPOGRAPHY */}
          {tab==="Typography" && (
            <div>
              <TabHeader title="Typography Tokens" description="Font families, sizes, weights and line heights. For composite text styles, use the Text Styles tab." actions={tabActions()} />
              {[["families","font / family",""],["sizes","font / size","px"],["weights","font / weight",""],["lineHeights","font / line-height",""]].map(([key,label,unit]) => (
                <div key={key} style={{marginBottom:28}}>
                  <div style={{marginBottom:8}}><span style={{fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.07em",color:"#777"}}>{label} — drag to reorder</span></div>
                  <div style={{display:"grid",gridTemplateColumns:"28px 180px 1fr 32px",gap:10,padding:"0 0 6px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                    {["","Name","Value",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                  </div>
                  {(typography as any)[key].map((item: any) => (
                    <DraggableRow key={item.id} id={item.id} dragHandlers={typoDragMap[key]}>
                      <div style={{display:"grid",gridTemplateColumns:"180px 1fr 32px",gap:10,alignItems:"center"}}>
                        <input value={item.name} onChange={e=>setTypography((t: any)=>({...t,[key]:t[key].map((i: any)=>i.id===item.id?{...i,name:e.target.value}:i)}))} style={inp()} />
                        <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={item.value} onChange={e=>setTypography((t: any)=>({...t,[key]:t[key].map((i: any)=>i.id===item.id?{...i,value:e.target.value}:i)}))} style={inp({width:"100%",boxSizing:"border-box",fontFamily:key==="families"?"inherit":"monospace"})} />{unit && <span style={{fontSize:12,color:"#777",flexShrink:0}}>{unit}</span>}</div>
                        <button onClick={()=>setTypography((t: any)=>({...t,[key]:t[key].filter((i: any)=>i.id!==item.id)}))} style={{...delBtn,fontSize:18}}>x</button>
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
                actions={tabActions(<button onClick={addTsGroup} style={tabAddBtnStyle}>+ Add Group</button>)} />

              {tsGroups.map((g: string) => (
                <div key={g} style={{marginBottom:32}}>
                  <div style={hdrStyle}>
                    <InlineLabel value={g} prefix="text / " onCommit={(n: string)=>renameTsGroup(g,n)} />
                    <div style={{flex:1,height:1,background:"#1e1e30"}} />
                    <button onClick={()=>deleteTsGroup(g)} style={{...delBtn,fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
                  </div>

                  {/* Column headers */}
                  <div style={{display:"grid",gridTemplateColumns:"28px 100px 180px 54px 60px 64px 64px 64px 110px minmax(80px,1fr) 32px",gap:8,padding:"4px 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4,alignItems:"center"}}>
                    {["","Name","Font Family","Size","Weight","L.Height","L.Space","P.Space","Decoration","Preview",""].map((h,i)=><div key={i} style={{fontSize:10,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
                  </div>

                  {groupedTextStyles[g] && groupedTextStyles[g].map((s: any) => (
                    <DraggableRow key={s.id} id={s.id} dragHandlers={textStylesDrag}>
                      <div style={{display:"grid",gridTemplateColumns:"100px 180px 54px 60px 64px 64px 64px 110px minmax(80px,1fr) 32px",gap:8,alignItems:"center"}}>

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
                        <button onClick={()=>deleteTextStyle(s.id)} style={{...delBtn,fontSize:18}}>x</button>
                      </div>
                    </DraggableRow>
                  ))}

                  <AddRowBtn onClick={()=>addTextStyle(g)} label={"+ Add style to "+g} />
                </div>
              ))}

              {tsGroups.length === 0 && <div style={{fontSize:13,color:"#777",fontStyle:"italic",padding:"32px 0",textAlign:"center"}}>No groups yet. Click "+ Add Group" to start.</div>}
            </div>
          )}

          {/* RADIUS */}
          {tab==="Radius" && (
            <div>
              <TabHeader title="Border Radius Tokens" description="Drag to reorder." actions={tabActions()} />
              <div style={{display:"flex",flexWrap:"wrap",gap:20,paddingLeft:8}}>
                {radius.map((r: any) => (
                  <div key={r.id} draggable onDragStart={()=>radiusDrag.onDragStart(r.id)} onDragOver={(e: any)=>radiusDrag.onDragOver(e,r.id)} onDrop={()=>radiusDrag.onDrop()} onDragEnd={()=>radiusDrag.onDragEnd()} style={{background:"#111118",border:"1px solid #222230",borderRadius:12,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:14,width:120,boxSizing:"border-box",cursor:"grab"}}>
                    <div style={{width:60,height:60,background:"#4f46e5",opacity:0.75,borderRadius:Math.min(parseInt(r.value)||0,30)+"px",flexShrink:0}} />
                    <input value={r.name} onChange={e=>updateList(setRadius,r.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",textAlign:"center",padding:"7px 8px"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center",width:"100%"}}><input value={r.value} onChange={e=>updateList(setRadius,r.id,"value",e.target.value)} style={inp({flex:1,width:0,textAlign:"center",fontFamily:"monospace",padding:"7px 8px"})} /><span style={{fontSize:12,color:"#777",flexShrink:0}}>px</span></div>
                    <button onClick={()=>deleteList(setRadius,r.id)} style={{...delBtn,fontSize:12}}>Remove</button>
                  </div>
                ))}
              </div>
              <AddRowBtn onClick={()=>setRadius((r: any[])=>[...r,{id:uid(),name:"new",value:"0"}])} label="+ Add radius token" />
            </div>
          )}

          {/* BORDER */}
          {tab==="Border" && (
            <div>
              <TabHeader title="Border Width Tokens" description="Drag to reorder." actions={tabActions()} />
              <div style={{display:"grid",gridTemplateColumns:"28px 80px 160px 160px 1fr 32px",gap:10,padding:"0 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {borders.map((b: any) => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={borderDrag}>
                  <div style={{display:"grid",gridTemplateColumns:"80px 160px 160px 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#777"}}>border /</span>
                    <input value={b.name} onChange={e=>updateList(setBorders,b.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.value} onChange={e=>updateList(setBorders,b.id,"value",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"#777"}}>px</span></div>
                    <div style={{display:"flex",alignItems:"center"}}><div style={{width:80,height:Math.max(parseInt(b.value)||0,1),maxHeight:20,background:"#4f46e5",borderRadius:2,opacity:0.8}} /></div>
                    <button onClick={()=>deleteList(setBorders,b.id)} style={{...delBtn,fontSize:18}}>x</button>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setBorders((b: any[])=>[...b,{id:uid(),name:"new",value:"1"}])} label="+ Add border token" />
            </div>
          )}

          {/* SHADOWS */}
          {tab==="Shadows" && (
            <div>
              <TabHeader title="Shadow Tokens" description="Drag to reorder. Click the swatch to open the shadow picker." actions={tabActions()} />
              <div style={{display:"grid",gridTemplateColumns:"38px 72px 140px 1fr 80px 32px",gap:10,padding:"0 0 8px 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Value","Preview",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {shadows.map((sh: any) => (
                <ShadowRow key={sh.id} sh={sh} dragHandlers={shadowDrag}
                  onChangeName={(v: string)=>updateList(setShadows,sh.id,"name",v)}
                  onChangeValue={(v: string)=>updateList(setShadows,sh.id,"value",v)}
                  onDelete={()=>deleteList(setShadows,sh.id)} />
              ))}
              <AddRowBtn onClick={()=>setShadows((s: any[])=>[...s,{id:uid(),name:"new",value:"0px 4px 12px 0px rgba(0,0,0,0.20)"}])} label="+ Add shadow token" />
            </div>
          )}

          {/* Z-INDEX */}
          {tab==="Z-Index" && (
            <div>
              <TabHeader title="Z-Index Tokens" description="Stacking order reference. Drag to reorder." actions={tabActions()} />
              <div style={{display:"grid",gridTemplateColumns:"28px 100px 180px 180px 1fr 32px",gap:10,padding:"0 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Value","",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {zindex.map((z: any) => (
                <DraggableRow key={z.id} id={z.id} dragHandlers={zDrag}>
                  <div style={{display:"grid",gridTemplateColumns:"100px 180px 180px 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#777"}}>z-index /</span>
                    <input value={z.name} onChange={e=>updateList(setZIndex,z.id,"name",e.target.value)} style={inp()} />
                    <input value={z.value} onChange={e=>updateList(setZIndex,z.id,"value",e.target.value)} style={inp({fontFamily:"monospace"})} />
                    <div /><button onClick={()=>deleteList(setZIndex,z.id)} style={{...delBtn,fontSize:18}}>x</button>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setZIndex((z: any[])=>[...z,{id:uid(),name:"new",value:"0"}])} label="+ Add z-index token" />
            </div>
          )}

          {/* BREAKPOINTS */}
          {tab==="Breakpoints" && (
            <div>
              <TabHeader title="Breakpoint Tokens" description="Min-width based. Drag to reorder." actions={tabActions()} />
              <div style={{display:"grid",gridTemplateColumns:"28px 100px 140px 140px 140px 1fr 32px",gap:10,padding:"0 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Min (px)","Max (px)","Range",""].map((h,i)=><div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>
              {breakpoints.map((b: any) => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={breakpointDrag}>
                  <div style={{display:"grid",gridTemplateColumns:"100px 140px 140px 140px 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#777"}}>breakpoint /</span>
                    <input value={b.name} onChange={e=>updateList(setBreakpoints,b.id,"name",e.target.value)} style={inp({width:"100%",boxSizing:"border-box"})} />
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.value} onChange={e=>updateList(setBreakpoints,b.id,"value",e.target.value)} style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"#777",flexShrink:0}}>px</span></div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><input value={b.max} onChange={e=>updateList(setBreakpoints,b.id,"max",e.target.value)} placeholder="none" style={inp({width:"100%",boxSizing:"border-box",fontFamily:"monospace"})} /><span style={{fontSize:12,color:"#777",flexShrink:0}}>px</span></div>
                    <div style={{fontSize:12,color:"#777",fontFamily:"monospace"}}>{bpRange(b)}</div>
                    <button onClick={()=>deleteList(setBreakpoints,b.id)} style={{...delBtn,fontSize:18}}>x</button>
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
                actions={tabActions(<button onClick={() => addCustomItem(cc.id)} style={tabAddBtnStyle}>+ Add Token</button>)} />

              {/* Collection settings */}
              <div style={{display:"flex",gap:12,marginBottom:20,padding:12,background:"#111118",borderRadius:8,border:"1px solid #1e1e30",flexWrap:"wrap",alignItems:"center"}}>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"#777"}}>
                  Tab Name
                  <input value={cc.name} disabled={cc.locked} onChange={e => {
                    const old = cc.name;
                    const nv = e.target.value;
                    setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, name: nv } : c));
                    setEnabledTabs(prev => { const next = new Set(prev); if (next.has(old)) { next.delete(old); next.add(nv); } return next; });
                    setTab(nv);
                  }} style={inp({ width: 120, opacity: cc.locked ? 0.5 : 1 })} />
                </label>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"#777"}}>
                  JSON Key
                  <input value={cc.jsonKey} disabled={cc.locked} onChange={e => updateCustomCollection(cc.id, "jsonKey", e.target.value)} style={inp({ width: 120, fontFamily: "monospace", opacity: cc.locked ? 0.5 : 1 })} />
                </label>
                <label style={{display:"flex",gap:6,alignItems:"center",fontSize:12,color:"#777"}}>
                  Value Type
                  <select value={cc.type + (cc.unit ? "|" + cc.unit : "")} disabled={cc.locked} onChange={e => {
                    const [type, unit = ""] = e.target.value.split("|");
                    updateCustomCollection(cc.id, "type", type);
                    updateCustomCollection(cc.id, "unit", unit);
                  }} style={inp({ width: 160, fontSize: 11, padding: "8px 6px", opacity: cc.locked ? 0.5 : 1 })}>
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
                  </select>
                </label>
                <div style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
                  {cc.locked ? (
                    cc.items.length === 0 && <button onClick={() => updateCustomCollection(cc.id, "locked", false)} style={tabBtnStyle}>Edit</button>
                  ) : (
                    <button onClick={() => updateCustomCollection(cc.id, "locked", true)} style={tabAddBtnStyle}>Save</button>
                  )}
                  <button onClick={() => deleteCustomCollection(cc.id)} style={{fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #7f1d1d",background:"#1a0a0a",color:"#f87171",cursor:"pointer"}}>Delete Collection</button>
                </div>
              </div>

              {/* Column headers */}
              <div style={{display:"grid",gridTemplateColumns:"28px 100px 1fr 1fr 32px",gap:10,padding:"0 0 8px",borderBottom:"1px solid #1e1e30",marginBottom:4}}>
                {["","Prefix","Name","Value",""].map((h,i) => <div key={i} style={{fontSize:11,color:"#777",fontWeight:600,textTransform:"uppercase"}}>{h}</div>)}
              </div>

              {cc.items.map((item: any) => (
                <DraggableRow key={item.id} id={item.id} dragHandlers={{
                  onDragStart: (id: number) => { (cc as any)._dragId = id; },
                  onDragOver: (e: any, id: number) => { e.preventDefault(); (cc as any)._overId = id; },
                  onDrop: () => {
                    const from = (cc as any)._dragId, to = (cc as any)._overId;
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
                  onDragEnd: () => { (cc as any)._dragId = null; (cc as any)._overId = null; },
                }}>
                  <div style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 32px",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#777"}}>{cc.jsonKey} /</span>
                    <input value={item.name} onChange={e => updateCustomItem(cc.id, item.id, "name", e.target.value)} style={inp({ width: "100%", boxSizing: "border-box" })} />
                    {cc.type === "color" ? (
                      <PrimSelector value={item.value} primitives={primitives} primGroups={primGroups} onChange={(v: string) => updateCustomItem(cc.id, item.id, "value", v)} mode="Value" />
                    ) : cc.type === "fontFamily" ? (
                      <select value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} style={inp({ width: "100%", fontSize: 11, padding: "8px 6px", fontFamily: item.value })}>
                        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.label}</option>)}
                        {!FONT_FAMILIES.some(f => f.value === item.value) && <option value={item.value}>{item.value}</option>}
                      </select>
                    ) : (
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} style={inp({ width: "100%", boxSizing: "border-box", fontFamily: "monospace" })} />
                        {cc.unit && <span style={{fontSize:12,color:"#777",flexShrink:0}}>{cc.unit}</span>}
                      </div>
                    )}
                    <button onClick={() => deleteCustomItem(cc.id, item.id)} style={{...delBtn,fontSize:18}}>x</button>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={() => addCustomItem(cc.id)} label={`+ Add ${cc.jsonKey} token`} />
            </div>
          ))}

        </div>

        {/* JSON Preview */}
        {showPreview && (
          <div style={{width:420,background:"#0d0d18",borderLeft:"1px solid #222230",display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #222230",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:600}}>{tab} — DTCG JSON</span>
              <span style={{fontSize:11,color:"#777"}}>Figma native format</span>
            </div>
            <pre style={{flex:1,overflow:"auto",padding:16,fontSize:11,color:"#4ade80",fontFamily:"monospace",lineHeight:1.6,margin:0}}>{previewJSON()}</pre>
          </div>
        )}

      </div>
    </div>
  );
}