import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken, CustomCollection } from "./types";
import { ALL_TABS, DEFAULT_ENABLED, DEFAULT_COLOR_GROUPS, DEFAULT_TS_GROUPS, STORAGE_KEY, buildDefaultPrimitives, buildDefaultPrimGroups, defaultTextStyles, defaultColors, defaultSpacing, defaultTypography, defaultRadius, defaultBorders, defaultShadows, defaultZIndex, defaultBreakpoints, TS_DECORATION_OPTIONS, FONT_FAMILIES, initIdCounter, uid, matchesSearch, loadSaved, isValidCSSIdentifier, sanitizeNumberInput, findDuplicateNames, findDuplicateNamesInGroups } from "./defaults";
import { genPrimitivesJSON, genColorsJSON, genSpacingJSON, genTypographyJSON, genTextStylesJSON, genRadiusJSON, genBorderJSON, genShadowsJSON, genZIndexJSON, genBreakpointsJSON, genCustomJSON } from "./generators";
import { useDraggable, useGroupDrag, GROUP_DRAG_TYPE } from "./hooks";
import { AddRowBtn, TabHeader, DraggableRow, InlineLabel, PrimSelector, TextPreview, ShadowRow } from "./components";
import { DownloadPanel } from "./DownloadPanel";

initIdCounter();

export default function App() {
  const saved = useRef(loadSaved()).current;
  const [tab, setTab]                   = useState(saved?.tab || "Primitives");
  const [enabledTabs, setEnabledTabs]   = useState<Set<string>>(() => saved?.enabledTabs ? new Set<string>(saved.enabledTabs) : DEFAULT_ENABLED);
  const [primGroups,  setPrimGroups]    = useState<PrimGroup[]>(() => saved?.primGroups || buildDefaultPrimGroups());
  const [primitives,  setPrimitives]    = useState<Primitives>(() => saved?.primitives || buildDefaultPrimitives());
  const [colorGroups, setColorGroups]   = useState<string[]>(saved?.colorGroups || DEFAULT_COLOR_GROUPS);
  const [colors,      setColors]        = useState<ColorToken[]>(saved?.colors || defaultColors);
  const [spacing,     setSpacing]       = useState<SpacingToken[]>(saved?.spacing || defaultSpacing);
  const [typography,  setTypography]    = useState<Typography>(saved?.typography || defaultTypography);
  const [textStyles,  setTextStyles]    = useState<TextStyle[]>(saved?.textStyles || defaultTextStyles);
  const [tsGroups,    setTsGroups]      = useState<string[]>(saved?.tsGroups || DEFAULT_TS_GROUPS);
  const [radius,      setRadius]        = useState<RadiusToken[]>(saved?.radius || defaultRadius);
  const [borders,     setBorders]       = useState<BorderToken[]>(saved?.borders || defaultBorders);
  const [shadows,     setShadows]       = useState<ShadowToken[]>(saved?.shadows || defaultShadows);
  const [zindex,      setZIndex]        = useState<ZIndexToken[]>(saved?.zindex || defaultZIndex);
  const [breakpoints, setBreakpoints]   = useState<BreakpointToken[]>(saved?.breakpoints || defaultBreakpoints);
  const [customCollections, setCustomCollections] = useState<CustomCollection[]>(saved?.customCollections || []);
  const [showPreview,      setShowPreview]      = useState(false);
  const [showDl,           setShowDl]           = useState(false);
  const [theme, setTheme] = useState<"dark"|"light">(() => saved?.theme || "dark");
  const [copied,           setCopied]           = useState(false);
  const [importError,      setImportError]      = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const ccDragRef = useRef<Record<number, { dragId: number|null; overId: number|null }>>({});

  const toggleSelect = useCallback((id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const toggleSelectAll = useCallback((ids: number[]) => setSelected(prev => {
    const n = new Set(prev); const all = ids.every(id => n.has(id));
    ids.forEach(id => all ? n.delete(id) : n.add(id)); return n;
  }), []);
  const selectAllChk = (ids: number[]) => {
    const all = ids.length > 0 && ids.every(id => selected.has(id));
    return <input type="checkbox" checked={all} onChange={() => toggleSelectAll(ids)} className="chk" />;
  };

  // ── Undo / Redo ──────────────────────────────────────────────────────────────
  const historyRef = useRef<unknown[]>([]);
  const historyPos = useRef(-1);
  const isUndoRedo = useRef(false);
  const MAX_HISTORY = 100;

  const getSnapshot = useCallback(() => ({
    tab, enabledTabs: [...enabledTabs], primGroups, primitives, colorGroups, colors,
    spacing, typography, textStyles, tsGroups, radius, borders, shadows, zindex, breakpoints, customCollections,
  }), [tab, enabledTabs, primGroups, primitives, colorGroups, colors, spacing, typography, textStyles, tsGroups, radius, borders, shadows, zindex, breakpoints, customCollections]);

  const applySnapshot = useCallback((s: ReturnType<typeof getSnapshot> & { enabledTabs: string[] }) => {
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
    applySnapshot(historyRef.current[historyPos.current] as any);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (historyPos.current >= historyRef.current.length - 1) return;
    historyPos.current++;
    applySnapshot(historyRef.current[historyPos.current] as any);
  }, [applySnapshot]);

  const canUndo = historyPos.current > 0;
  const canRedo = historyPos.current < historyRef.current.length - 1;

  useEffect(() => {
    const snap = getSnapshot();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({...snap, theme})); setSaveError(""); } catch { setSaveError("Storage full — changes won't persist after reload. Export your files to avoid data loss."); }
    if (isUndoRedo.current) { isUndoRedo.current = false; return; }
    const h = historyRef.current;
    if (historyPos.current < h.length - 1) h.splice(historyPos.current + 1);
    h.push(snap);
    if (h.length > MAX_HISTORY) h.splice(0, h.length - MAX_HISTORY);
    historyPos.current = h.length - 1;
  }, [getSnapshot, theme]);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

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

  const allTabs = useMemo(() => [...ALL_TABS, ...customCollections.map(c => c.name)], [customCollections]);

  // ── Custom collection CRUD ──────────────────────────────────────────────────
  const addCustomCollection = () => {
    const id = uid();
    const name = "Custom " + id;
    setCustomCollections(cc => [...cc, { id, name, jsonKey: "custom-" + id, items: [], groups: [{ name: "default", type: "number", unit: "", locked: false }], locked: false }]);
    setEnabledTabs(prev => { const next = new Set(prev); next.add(name); return next; });
    setTab(name);
  };
  const updateCustomCollection = (id: number, field: string, val: unknown) =>
    setCustomCollections(cc => cc.map(c => c.id === id ? { ...c, [field]: val } : c));
  const deleteCustomCollection = (id: number) => {
    const c = customCollections.find(x => x.id === id);
    if (!c) return;
    setCustomCollections(cc => cc.filter(x => x.id !== id));
    setEnabledTabs(prev => { const next = new Set(prev); next.delete(c.name); return next; });
    if (tab === c.name) setTab(ALL_TABS[0]);
  };
  const updateCustomItem = (collId: number, itemId: number, field: string, val: string) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, [field]: val } : i) } : c));
  const deleteCustomItem = (collId: number, itemId: number) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
  const dupCustomItem = (collId: number, itemId: number) =>
    setCustomCollections(cc => cc.map(c => { if (c.id !== collId) return c; const idx=c.items.findIndex(i=>i.id===itemId); if(idx<0)return c; const copy={...c.items[idx],id:uid(),name:c.items[idx].name+" copy"}; const items=[...c.items]; items.splice(idx+1,0,copy); return {...c,items}; }));
  const addCustomItem = (collId: number, group: string) =>
    setCustomCollections(cc => cc.map(c => {
      if (c.id !== collId) return c;
      const g = c.groups.find(gr => gr.name === group) || c.groups[0];
      const defVal = g.type === "color" ? "{primitives.blue.600}" : g.type === "fontFamily" ? "Inter, sans-serif" : "0";
      return { ...c, items: [...c.items, { id: uid(), name: "new", group, value: defVal }] };
    }));
  const addCustomGroup = (collId: number) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: [...(c.groups || []), { name: "group-" + uid(), type: "number", unit: "", locked: false }] } : c));
  const renameCustomGroup = (collId: number, oldName: string, newName: string) => {
    const t = newName.trim(); if (!t) return;
    setCustomCollections(cc => cc.map(c => {
      if (c.id !== collId) return c;
      if (c.groups.some(g => g.name === t) && t !== oldName) return c;
      return { ...c, groups: c.groups.map(g => g.name === oldName ? { ...g, name: t } : g), items: c.items.map(i => i.group === oldName ? { ...i, group: t } : i) };
    }));
  };
  const updateCustomGroup = (collId: number, groupName: string, field: string, val: unknown) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: c.groups.map(g => g.name === groupName ? { ...g, [field]: val } : g) } : c));
  const deleteCustomGroup = (collId: number, groupName: string) =>
    setCustomCollections(cc => cc.map(c => c.id === collId ? { ...c, groups: c.groups.filter(g => g.name !== groupName), items: c.items.filter(i => i.group !== groupName) } : c));

  const toggleTab = (t: string) => setEnabledTabs(prev => {
    const next = new Set(prev);
    if (next.has(t)) { next.delete(t); if (tab===t) { const fb=allTabs.find(x=>next.has(x)); if(fb) setTab(fb); } }
    else { next.add(t); setTab(t); }
    return next;
  });

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const colorDrag      = useDraggable(setColors as any);
  const spacingDrag    = useDraggable(setSpacing as any);
  const textStylesDrag = useDraggable(setTextStyles as any);
  const radiusDrag     = useDraggable(setRadius as any);
  const borderDrag     = useDraggable(setBorders as any);
  const shadowDrag     = useDraggable(setShadows as any);
  const zDrag          = useDraggable(setZIndex as any);
  const breakpointDrag = useDraggable(setBreakpoints as any);
  const typFamDrag     = useDraggable((l: any) => setTypography(t => ({...t,families:l(t.families)})));
  const typSizeDrag    = useDraggable((l: any) => setTypography(t => ({...t,sizes:l(t.sizes)})));
  const typWgtDrag     = useDraggable((l: any) => setTypography(t => ({...t,weights:l(t.weights)})));
  const typLhDrag      = useDraggable((l: any) => setTypography(t => ({...t,lineHeights:l(t.lineHeights)})));
  const typoDragMap: Record<string, ReturnType<typeof useDraggable>> = { families:typFamDrag, sizes:typSizeDrag, weights:typWgtDrag, lineHeights:typLhDrag };
  const primGroupDrag   = useGroupDrag(setPrimGroups as any, "id");
  const colorGroupDrag  = useGroupDrag(setColorGroups as any, "string");
  const tsGroupDrag     = useGroupDrag(setTsGroups as any, "string");

  // ── Text style CRUD ─────────────────────────────────────────────────────────
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

  // ── Memoized computed data ──────────────────────────────────────────────────
  const previewJSON = useMemo(() => {
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
  }, [tab, primGroups, primitives, colors, spacing, typography, textStyles, radius, borders, shadows, zindex, breakpoints, customCollections]);

  const groupedColors = useMemo(() =>
    colorGroups.reduce<Record<string, ColorToken[]>>((a, g) => { a[g]=colors.filter(c=>c.group===g); return a; }, {}),
  [colorGroups, colors]);

  const groupedTextStyles = useMemo(() =>
    tsGroups.reduce<Record<string, TextStyle[]>>((a, g) => { a[g]=textStyles.filter(s=>s.group===g); return a; }, {}),
  [tsGroups, textStyles]);

  const copy = () => { navigator.clipboard.writeText(previewJSON); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  // ── Duplicate name detection ──────────────────────────────────────────────
  const dupeSpacing = useMemo(() => findDuplicateNames(spacing), [spacing]);
  const dupeRadius = useMemo(() => findDuplicateNames(radius), [radius]);
  const dupeBorders = useMemo(() => findDuplicateNames(borders), [borders]);
  const dupeShadows = useMemo(() => findDuplicateNames(shadows), [shadows]);
  const dupeZIndex = useMemo(() => findDuplicateNames(zindex), [zindex]);
  const dupeBreakpoints = useMemo(() => findDuplicateNames(breakpoints), [breakpoints]);
  const dupeColors = useMemo(() => findDuplicateNamesInGroups(colors), [colors]);
  const dupeTextStyles = useMemo(() => findDuplicateNamesInGroups(textStyles), [textStyles]);

  const isDupe = (name: string, dupes: Set<string>) => dupes.has(name.trim().toLowerCase());

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPrimGroups(buildDefaultPrimGroups()); setPrimitives(buildDefaultPrimitives());
    setColors(defaultColors); setColorGroups([...DEFAULT_COLOR_GROUPS]);
    setSpacing([...defaultSpacing]); setTypography({...defaultTypography});
    setTextStyles([...defaultTextStyles]); setTsGroups([...DEFAULT_TS_GROUPS]);
    setRadius([...defaultRadius]); setBorders([...defaultBorders]); setShadows([...defaultShadows]);
    setZIndex([...defaultZIndex]); setBreakpoints([...defaultBreakpoints]);
    setCustomCollections([]); setEnabledTabs(new Set(ALL_TABS)); setTab("Primitives");
    setShowResetConfirm(false); setImportError("");
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      let data: any;
      try { data = JSON.parse((ev.target as FileReader).result as string); }
      catch (err) { setImportError("Invalid JSON: " + (err instanceof Error ? err.message : "parse error")); return; }
      if (typeof data !== "object" || data === null || Array.isArray(data)) { setImportError("Expected a JSON object, got " + (Array.isArray(data) ? "array" : typeof data) + "."); return; }
      setImportError("");
      try {
        if (tab==="Primitives") {
          if (!data.primitives || typeof data.primitives !== "object") { setImportError("Expected top-level \"primitives\" key with color groups."); return; }
          const ng: PrimGroup[]=[],np: Primitives={}; let gi=900;
          Object.entries(data.primitives).forEach(([k,v]: [string,any])=>{
            if(k.startsWith("$"))return;
            if(k==="base"){np.base={};if(typeof v==="object")Object.entries(v).forEach(([kk,vv]: [string,any])=>{if(vv?.["$value"])np.base[kk]=vv["$value"]});return;}
            if(typeof v!=="object"){return;}
            const sh=Object.keys(v).filter(s=>!s.startsWith("$")&&v[s]?.["$value"]);
            if(sh.length===0)return;
            ng.push({id:gi++,key:k,label:k.charAt(0).toUpperCase()+k.slice(1),shades:sh});np[k]={};sh.forEach(s=>{np[k][s]=v[s]["$value"]});
          });
          if(ng.length){setPrimGroups(ng);setPrimitives(np);} else setImportError("No color groups with $value tokens found under \"primitives\".");
        }
        else if (tab==="Colors") {
          const root = data.color || data.colors;
          if (!root || typeof root !== "object") { setImportError("Expected top-level \"color\" or \"colors\" key with grouped tokens."); return; }
          const cols: ColorToken[]=[]; let id=1000; const grps=new Set<string>();
          Object.entries(root).forEach(([g,tokens]: [string,any])=>{if(typeof tokens!=="object"||tokens["$value"])return;grps.add(g);Object.entries(tokens).forEach(([n,t]: [string,any])=>{if(t?.["$value"])cols.push({id:id++,group:g,name:n,light:t["$value"],dark:t["$extensions"]?.mode?.dark||t["$value"],description:t["$description"]||""});})});
          if(cols.length){setColors(cols);setColorGroups([...grps]);} else setImportError("No tokens with $value found under color groups.");
        }
        else if (tab==="Spacing") {
          if (!data.spacing || typeof data.spacing !== "object") { setImportError("Expected top-level \"spacing\" key with $value tokens."); return; }
          const sp: SpacingToken[]=[]; let id=2000; Object.entries(data.spacing).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)sp.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})});
          if(sp.length)setSpacing(sp); else setImportError("No tokens with $value found under \"spacing\".");
        }
        else if (tab==="Border") {
          if (!data["border-width"] || typeof data["border-width"] !== "object") { setImportError("Expected top-level \"border-width\" key with $value tokens."); return; }
          const b: BorderToken[]=[]; let id=3500; Object.entries(data["border-width"]).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)b.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})});
          if(b.length)setBorders(b); else setImportError("No tokens with $value found under \"border-width\".");
        }
        else if (tab==="Radius") {
          if (!data.radius || typeof data.radius !== "object") { setImportError("Expected top-level \"radius\" key with $value tokens."); return; }
          const r: RadiusToken[]=[]; let id=3000; Object.entries(data.radius).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)r.push({id:id++,name:n,value:String(t["$value"]).replace("px","")})});
          if(r.length)setRadius(r); else setImportError("No tokens with $value found under \"radius\".");
        }
        else if (tab==="Text Styles") {
          const ts: TextStyle[]=[]; let id=9900; const grps: string[]=[];
          Object.entries(data).forEach(([g,tokens]: [string,any])=>{
            if(typeof tokens!=="object"||g.startsWith("$"))return;
            const hasTextStyles=Object.values(tokens).some((t: any)=>t&&t["$type"]==="textStyle");
            if(!hasTextStyles)return;
            if(!grps.includes(g))grps.push(g);
            Object.entries(tokens).forEach(([n,t]: [string,any])=>{
              if(t?.["$type"]!=="textStyle"||!t?.["$value"])return;
              const v=t["$value"];
              ts.push({id:id++,group:g,name:n,fontFamily:v.fontFamily||"Inter, sans-serif",fontSize:String(typeof v.fontSize==="object"?v.fontSize.value:v.fontSize||16),fontWeight:String(v.fontWeight||400),lineHeight:String(typeof v.lineHeight==="object"?v.lineHeight.value:v.lineHeight||1.5),letterSpacing:String(typeof v.letterSpacing==="object"?v.letterSpacing.value:v.letterSpacing||0),paragraphSpacing:String(typeof v.paragraphSpacing==="object"?v.paragraphSpacing.value:v.paragraphSpacing||0),textDecoration:v.textDecoration||"NONE"});
            });
          });
          if(ts.length){setTextStyles(ts);setTsGroups(grps);} else setImportError("No groups with $type: \"textStyle\" tokens found. Expected { groupName: { styleName: { $type: \"textStyle\", $value: {...} } } }.");
        }
        else if (tab==="Typography") {
          const fam: SpacingToken[]=[], sz: SpacingToken[]=[], wt: SpacingToken[]=[], lh: SpacingToken[]=[]; let id=5000;
          const src = data.family || data.font?.family;
          if(src&&typeof src==="object") Object.entries(src).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)fam.push({id:id++,name:n,value:typeof t["$value"]==="object"?String(t["$value"].value):String(t["$value"])});});
          const srcSz = data.size || data.font?.size;
          if(srcSz&&typeof srcSz==="object") Object.entries(srcSz).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)sz.push({id:id++,name:n,value:String(typeof t["$value"]==="object"?t["$value"].value:t["$value"]).replace("px","")});});
          const srcWt = data.weight || data.font?.weight;
          if(srcWt&&typeof srcWt==="object") Object.entries(srcWt).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)wt.push({id:id++,name:n,value:String(t["$value"])});});
          const srcLh = data["line-height"] || data.font?.["line-height"];
          if(srcLh&&typeof srcLh==="object") Object.entries(srcLh).forEach(([n,t]: [string,any])=>{if(t?.["$value"]!=null)lh.push({id:id++,name:n,value:String(t["$value"])});});
          if(fam.length||sz.length||wt.length||lh.length) setTypography({families:fam.length?fam:typography.families,sizes:sz.length?sz:typography.sizes,weights:wt.length?wt:typography.weights,lineHeights:lh.length?lh:typography.lineHeights});
          else setImportError("No typography tokens found. Expected keys: family/size/weight/line-height (or nested under font.*).");
        }
        else if (tab==="Shadows") {
          const sh: ShadowToken[]=[]; let id=6000;
          Object.entries(data).forEach(([n,t]: [string,any])=>{if(!n.startsWith("$")&&t?.["$value"]!=null)sh.push({id:id++,name:n,value:String(t["$value"])});});
          if(sh.length) setShadows(sh); else setImportError("No tokens with $value found at the top level.");
        }
        else if (tab==="Z-Index") {
          const zi: ZIndexToken[]=[]; let id=7000;
          const src = data["z-index"] || data.zindex || data;
          if(typeof src==="object") Object.entries(src).forEach(([n,t]: [string,any])=>{if(!n.startsWith("$")&&t?.["$value"]!=null)zi.push({id:id++,name:n,value:String(t["$value"])});});
          if(zi.length) setZIndex(zi); else setImportError("No z-index tokens found. Expected keys: z-index, zindex, or top-level $value tokens.");
        }
        else if (tab==="Breakpoints") {
          const bp: BreakpointToken[]=[]; let id=7500;
          const src = data.breakpoints || data.screens || data;
          if(typeof src!=="object") { setImportError("No breakpoint data found. Expected keys: breakpoints, screens, or top-level $value tokens."); return; }
          const entries = Object.entries(src).filter(([n,t]: [string,any])=>!n.startsWith("$")&&t?.["$value"]!=null);
          entries.forEach(([n,t]: [string,any],i)=>{bp.push({id:id++,name:n,value:String(typeof t["$value"]==="object"?t["$value"].value:t["$value"]).replace("px",""),max:i<entries.length-1?String(typeof (entries[i+1][1] as any)["$value"]==="object"?(entries[i+1][1] as any)["$value"].value:(entries[i+1][1] as any)["$value"]).replace("px",""):""});});
          if(bp.length) setBreakpoints(bp); else setImportError("No breakpoint tokens with $value found.");
        }
        else {
          const cc = customCollections.find(c => c.name === tab);
          if (cc) {
            const key = Object.keys(data).find(k => !k.startsWith("$")) || cc.jsonKey;
            const tokens = data[key] || data;
            if(typeof tokens!=="object") { setImportError("No valid token object found in file."); return; }
            const items: { id: number; name: string; group: string; value: string }[] = []; let id = 8000;
            Object.entries(tokens).forEach(([n, t]: [string, any]) => {
              if (!n.startsWith("$") && t?.["$value"] !== undefined) {
                const val = typeof t["$value"] === "object" ? String(t["$value"].value) : String(t["$value"]);
                items.push({ id: id++, name: n, value: val, group: cc.groups[0]?.name || "default" });
              }
            });
            if (items.length) {
              setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, items } : c));
            } else setImportError("No tokens with $value found in \"" + key + "\".");
          }
        }
      } catch (err) { setImportError("Import failed: " + (err instanceof Error ? err.message : "unknown error")); }
    };
    reader.readAsText(file);
  };

  // ── Generic list helpers ────────────────────────────────────────────────────
  const updateColor = (id: number, f: string, v: string) => setColors(c => c.map(i => i.id===id ? {...i,[f]:v} : i));
  const dupColor    = (id: number) => setColors(c => { const idx=c.findIndex(i=>i.id===id); if(idx<0)return c; const copy={...c[idx],id:uid(),name:c[idx].name+" copy"}; const next=[...c]; next.splice(idx+1,0,copy); return next; });
  const updateList  = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, f: string, v: string) => setter(prev => prev.map(i => i.id===id ? {...i,[f]:v} : i));
  const deleteList  = <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => setter(prev => prev.filter(i => i.id!==id));
  const dupInList   = <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => setter(prev => { const idx=prev.findIndex(i=>i.id===id); if(idx<0)return prev; const copy={...prev[idx],id:uid(),name:prev[idx].name+" copy"}; const next=[...prev]; next.splice(idx+1,0,copy); return next; });

  // ── Primitives CRUD ─────────────────────────────────────────────────────────
  const renamePrimGroup = (oldKey: string, newLabel: string) => {
    const t=newLabel.trim(); if(!t)return; const nk=t.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");
    if(!nk||(nk!==oldKey&&primGroups.some(g=>g.key===nk)))return;
    setPrimGroups(gs=>gs.map(g=>g.key===oldKey?{...g,key:nk,label:t}:g));
    setPrimitives(p=>{const n={...p};n[nk]=n[oldKey];if(nk!==oldKey)delete n[oldKey];return n;});
    setColors(cs=>cs.map(c=>({...c,light:c.light.replace("{primitives."+oldKey+".","{primitives."+nk+"."),dark:c.dark.replace("{primitives."+oldKey+".","{primitives."+nk+".")})));
  };
  const deletePrimGroup = (key: string) => { setPrimGroups(gs=>gs.filter(g=>g.key!==key)); setPrimitives(p=>{const n={...p};delete n[key];return n;}); };
  const addPrimGroup    = () => { const key="palette"+uid(); setPrimGroups(gs=>[...gs,{id:uid(),key,label:"New Palette",shades:["500"]}]); setPrimitives(p=>({...p,[key]:{"500":"#808080"}})); };
  const addShade        = (gk: string) => { setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:[...g.shades,"new"]}:g)); setPrimitives(p=>({...p,[gk]:{...p[gk],new:"#808080"}})); };
  const removeShade     = (gk: string, s: string) => { setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:g.shades.filter(x=>x!==s)}:g)); setPrimitives(p=>{const n={...p,[gk]:{...p[gk]}};delete n[gk][s];return n;}); };
  const renameShade     = (gk: string, os: string, ns: string) => {
    const t=ns.trim(); if(!t||t===os)return; if(primGroups.find(g=>g.key===gk)?.shades.includes(t))return;
    setPrimGroups(gs=>gs.map(g=>g.key===gk?{...g,shades:g.shades.map(s=>s===os?t:s)}:g));
    setPrimitives(p=>{const n={...p,[gk]:{...p[gk]}};n[gk][t]=n[gk][os];delete n[gk][os];return n;});
    setColors(cs=>cs.map(c=>({...c,light:c.light.replace("{primitives."+gk+"."+os+"}","{primitives."+gk+"."+t+"}"),dark:c.dark.replace("{primitives."+gk+"."+os+"}","{primitives."+gk+"."+t+"}")})));
  };
  const addColorGroup    = () => setColorGroups(g=>[...g,"group-"+uid()]);
  const renameColorGroup = (o: string, n: string) => { const t=n.trim(); if(!t||(colorGroups.includes(t)&&t!==o))return; setColorGroups(g=>g.map(x=>x===o?t:x)); setColors(c=>c.map(i=>i.group===o?{...i,group:t}:i)); };
  const deleteColorGroup = (n: string) => { setColorGroups(g=>g.filter(x=>x!==n)); setColors(c=>c.filter(i=>i.group!==n)); };
  const bpRange = (b: BreakpointToken) => (b.value?">= "+b.value+"px":"0")+(b.max?" and < "+b.max+"px":"");

  // ── Bulk actions ────────────────────────────────────────────────────────────
  const bulkDelete = () => {
    const ids = selected;
    if (tab==="Colors")      setColors(c=>c.filter(i=>!ids.has(i.id)));
    else if (tab==="Spacing")     setSpacing(s=>s.filter(i=>!ids.has(i.id)));
    else if (tab==="Typography")  setTypography(t=>({...t,families:t.families.filter(i=>!ids.has(i.id)),sizes:t.sizes.filter(i=>!ids.has(i.id)),weights:t.weights.filter(i=>!ids.has(i.id)),lineHeights:t.lineHeights.filter(i=>!ids.has(i.id))}));
    else if (tab==="Text Styles") setTextStyles(ts=>ts.filter(s=>!ids.has(s.id)));
    else if (tab==="Radius")      setRadius(r=>r.filter(i=>!ids.has(i.id)));
    else if (tab==="Border")      setBorders(b=>b.filter(i=>!ids.has(i.id)));
    else if (tab==="Shadows")     setShadows(s=>s.filter(i=>!ids.has(i.id)));
    else if (tab==="Z-Index")     setZIndex(z=>z.filter(i=>!ids.has(i.id)));
    else if (tab==="Breakpoints") setBreakpoints(b=>b.filter(i=>!ids.has(i.id)));
    else { const cc=customCollections.find(c=>c.name===tab); if(cc) setCustomCollections(ccs=>ccs.map(c=>c.id===cc.id?{...c,items:c.items.filter(i=>!ids.has(i.id))}:c)); }
    setSelected(new Set());
  };
  const bulkApply = (field: string, value: string) => {
    const ids = selected;
    if (tab==="Colors")      setColors(c=>c.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Text Styles") setTextStyles(ts=>ts.map(s=>ids.has(s.id)?{...s,[field]:value}:s));
    else if (tab==="Spacing")     setSpacing(s=>s.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Radius")      setRadius(r=>r.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Border")      setBorders(b=>b.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Z-Index")     setZIndex(z=>z.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else if (tab==="Breakpoints") setBreakpoints(b=>b.map(i=>ids.has(i.id)?{...i,[field]:value}:i));
    else { const cc=customCollections.find(c=>c.name===tab); if(cc) setCustomCollections(ccs=>ccs.map(c=>c.id===cc.id?{...c,items:c.items.map(i=>ids.has(i.id)?{...i,[field]:value}:i)}:c)); }
  };

  const [tabResetConfirm, setTabResetConfirm] = useState(false);
  const resetTab = () => {
    if (tab==="Primitives")  { setPrimGroups(buildDefaultPrimGroups()); setPrimitives(buildDefaultPrimitives()); }
    else if (tab==="Colors")      { setColors([...defaultColors]); setColorGroups([...DEFAULT_COLOR_GROUPS]); }
    else if (tab==="Spacing")     { setSpacing([...defaultSpacing]); }
    else if (tab==="Typography")  { setTypography({...defaultTypography}); }
    else if (tab==="Text Styles") { setTextStyles([...defaultTextStyles]); setTsGroups([...DEFAULT_TS_GROUPS]); }
    else if (tab==="Radius")      { setRadius([...defaultRadius]); }
    else if (tab==="Border")      { setBorders([...defaultBorders]); }
    else if (tab==="Shadows")     { setShadows([...defaultShadows]); }
    else if (tab==="Z-Index")     { setZIndex([...defaultZIndex]); }
    else if (tab==="Breakpoints") { setBreakpoints([...defaultBreakpoints]); }
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

  const tabActionBtns = <>{importError && <span className="error-msg">{importError}</span>}
    <button onClick={()=>fileRef.current?.click()} className="tab-btn">Import JSON</button>
    <button onClick={()=>setShowPreview(v=>!v)} className="tab-btn">{showPreview?"Hide Preview":"Preview JSON"}</button>
    <button onClick={copy} className="tab-btn">{copied?"Copied!":"Copy JSON"}</button>
    {tabResetConfirm ? <>
      <span className="error-msg">Reset {tab}?</span>
      <button onClick={resetTab} className="danger-confirm-btn">Yes</button>
      <button onClick={()=>setTabResetConfirm(false)} className="tab-btn">Cancel</button>
    </> : <button onClick={()=>setTabResetConfirm(true)} className="tab-reset-btn">Reset</button>}
  </>;
  const tabActions = (extra?: React.ReactNode) => <div className="tab-actions">{tabActionBtns}{extra}</div>;

  return (
    <div className="app">

      {/* Header */}
      <div className="app-header">
        <div>
          <div className="app-header__title">Figma Variables Generator</div>
          <div className="app-header__subtitle">Builds DTCG JSON for Figma native Variables + Text Styles import</div>
        </div>
        <div className="app-header__actions">
          <div className="app-header__icon-group">
            <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} className="icon-btn icon-btn--enabled">{theme === "dark" ? "\u2600" : "\u263E"}</button>
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className={`icon-btn ${canUndo?"icon-btn--enabled":"icon-btn--disabled"}`}>↩</button>
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className={`icon-btn ${canRedo?"icon-btn--enabled":"icon-btn--disabled"}`}>↪</button>
          </div>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={handleImport} />
          {showResetConfirm ? (
            <div className="reset-confirm">
              <span className="reset-confirm__text">Reset everything?</span>
              <button onClick={handleReset} className="reset-confirm__yes">Yes, reset</button>
              <button onClick={()=>setShowResetConfirm(false)} className="reset-confirm__cancel">Cancel</button>
            </div>
          ) : (
            <button onClick={()=>setShowResetConfirm(true)} className="global-reset-btn">Reset</button>
          )}
          <div className="dl-trigger">
            <button onClick={()=>setShowDl(v=>!v)} className="dl-trigger__btn">Download Files {showDl?"▴":"▾"}</button>
            {showDl && (
              <div className="dl-dropdown">
                <div onClick={()=>setShowDl(false)} className="dl-backdrop" />
                <DownloadPanel enabled={enabledTabs} primGroups={primGroups} primitives={primitives} colors={colors} spacing={spacing} typography={typography} textStyles={textStyles} radius={radius} borders={borders} shadows={shadows} zindex={zindex} breakpoints={breakpoints} customCollections={customCollections} />
              </div>
            )}
          </div>
        </div>
      </div>

      {saveError && <div className="save-error-banner">{saveError}</div>}

      <div className="app-body">

        {/* Sidebar */}
        <div className="sidebar">
          {allTabs.map(t => {
            const enabled=enabledTabs.has(t), active=tab===t;
            return (
              <div key={t} className="sidebar__tab-row">
                <button onClick={()=>{
                  const curr = customCollections.find(c => c.name === tab);
                  if (curr) {
                    if (!curr.locked) updateCustomCollection(curr.id, "locked", true);
                    const unlocked = curr.groups?.some(gr => gr.locked === false);
                    if (unlocked) setCustomCollections(ccs => ccs.map(c => c.id !== curr.id ? c : { ...c, groups: c.groups.map(gr => ({ ...gr, locked: true })) }));
                  }
                  setTab(t);setTabResetConfirm(false);setSelected(new Set());setSearch("");
                }} className={`sidebar__tab ${active?"sidebar__tab--active":enabled?"sidebar__tab--on":"sidebar__tab--off"}`}>{t}</button>
                <div onClick={()=>toggleTab(t)} title={enabled?"Exclude from export":"Include in export"} className="sidebar__toggle-wrap">
                  <div className={`sidebar__toggle ${enabled?"sidebar__toggle--on":"sidebar__toggle--off"}`}>
                    <div className={`sidebar__knob ${enabled?"sidebar__knob--on":"sidebar__knob--off"}`} />
                  </div>
                </div>
              </div>
            );
          })}
          <button onClick={addCustomCollection} className="sidebar__add-btn">+ Add Collection</button>
        </div>

        {/* Content */}
        <div className="content">

          {/* PRIMITIVES */}
          {tab==="Primitives" && (
            <div>
              <TabHeader title="Primitive Colors" description="Raw palette. Click a name to rename. Never apply directly to layers."
                actions={tabActions(<button onClick={addPrimGroup} className="tab-add-btn">+ Add Palette</button>)} search={search} onSearch={setSearch} />
              {primGroups.filter(g => matchesSearch(search, g.label, g.key, ...g.shades)).map(g => (
                <div key={g.id} {...primGroupDrag.makeDropZone(String(g.id))} className="mb-32">
                  <div className="hdr-style"><div draggable onDragStart={e=>primGroupDrag.onDragStart(e,String(g.id))} className="drag-handle">⌿</div><InlineLabel value={g.label} prefix="primitives / " onCommit={(nl: string)=>renamePrimGroup(g.key,nl)} /><div className="section-divider" /><button onClick={()=>deletePrimGroup(g.key)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete palette</button></div>
                  <div className="prim-shades">
                    {g.shades.map(shade => (
                      <div key={shade} className="prim-shade">
                        <div className="prim-swatch-wrap">
                          <div className="prim-swatch" style={{background:primitives[g.key]?.[shade]||"#808080"}} />
                          <input type="color" value={primitives[g.key]?.[shade]||"#808080"} onChange={e=>setPrimitives(p=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} className="prim-color-input" />
                        </div>
                        <InlineLabel value={shade} onCommit={(ns: string)=>renameShade(g.key,shade,ns)} style={{fontSize:11,color:"var(--text-secondary)",textAlign:"center"}} />
                        <input value={primitives[g.key]?.[shade]||""} onChange={e=>setPrimitives(p=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} className="prim-hex" />
                        <button onClick={()=>removeShade(g.key,shade)} className="del-btn" style={{fontSize:11,padding:0,lineHeight:1}}>x</button>
                      </div>
                    ))}
                    <div style={{display:"flex",alignItems:"center",height:56}}><button onClick={()=>addShade(g.key)} className="prim-add-shade">+</button></div>
                  </div>
                </div>
              ))}
              <div className="mb-28">
                <div className="hdr-style"><span>primitives / Base</span><div className="section-divider" /></div>
                <div style={{display:"flex",gap:12}}>
                  {["white","black"].map(k => (
                    <div key={k} className="prim-shade">
                      <div className="prim-swatch-wrap">
                        <div className="prim-swatch" style={{background:primitives.base?.[k]||"#000"}} />
                        <input type="color" value={primitives.base?.[k]||"#000000"} onChange={e=>setPrimitives(p=>({...p,base:{...p.base,[k]:e.target.value}}))} className="prim-color-input" />
                      </div>
                      <div className="text-xs text-secondary">{k}</div>
                      <input value={primitives.base?.[k]||""} onChange={e=>setPrimitives(p=>({...p,base:{...p.base,[k]:e.target.value}}))} className="prim-hex" />
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
                actions={tabActions(<button onClick={addColorGroup} className="tab-add-btn">+ Add Group</button>)} search={search} onSearch={setSearch} />
              {colorGroups.map(g => {
                const filtered = groupedColors[g].filter(c => matchesSearch(search, g, c.name, c.description, c.light, c.dark));
                if (search && filtered.length === 0) return null;
                return (
                <div key={g} {...colorGroupDrag.makeDropZone(g)} className="mb-28">
                  <div className="hdr-style"><div draggable onDragStart={e=>colorGroupDrag.onDragStart(e,g)} className="drag-handle">⌿</div><InlineLabel value={g} prefix="color / " onCommit={(n: string)=>renameColorGroup(g,n)} /><div className="section-divider" /><button onClick={()=>{const nn=g+" copy";setColorGroups(gs=>{const idx=gs.indexOf(g);const next=[...gs];next.splice(idx+1,0,nn);return next;});setColors(c=>[...c,...c.filter(i=>i.group===g).map(i=>({...i,id:uid(),group:nn}))]);}} className="dup-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={()=>deleteColorGroup(g)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button></div>
                  {filtered.length===0 && <div className="empty-msg">No tokens yet.</div>}
                  {filtered.length > 0 && (
                    <div>
                      <div className="col-hdr">
                        {selectAllChk(filtered.map(c=>c.id))}
                        <div className="drag-handle drag-handle--hidden">⌿</div>
                        <div className="flex-1 grid-row grid-colors">
                        {["Group","Name","Light","Dark",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                        </div>
                      </div>
                      {filtered.map(c => (
                        <DraggableRow key={c.id} id={c.id} dragHandlers={colorDrag} checked={selected.has(c.id)} onCheck={toggleSelect}>
                          <div className="grid-row grid-colors" style={{alignItems:"start"}}>
                            <select value={c.group} onChange={e=>updateColor(c.id,"group",e.target.value)} className="inp inp--full">{colorGroups.map(g2=><option key={g2}>{g2}</option>)}</select>
                            <div><input value={c.name} onChange={e=>updateColor(c.id,"name",e.target.value)} className={`inp inp--full${isDupe(c.name,dupeColors)?" inp--dupe":""}`} />{isDupe(c.name,dupeColors)&&<div className="dupe-warn">Duplicate name in group</div>}<input value={c.description} onChange={e=>updateColor(c.id,"description",e.target.value)} placeholder="Description" className="inp inp--full inp--desc" /></div>
                            <PrimSelector value={c.light} primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"light",v)} mode="Light" />
                            <PrimSelector value={c.dark}  primitives={primitives} primGroups={primGroups} onChange={(v: string)=>updateColor(c.id,"dark",v)}  mode="Dark" />
                            <div className="btn-group" style={{paddingTop:8}}><button onClick={()=>dupColor(c.id)} className="dup-btn">⧉</button><button onClick={()=>setColors(c2=>c2.filter(i=>i.id!==c.id))} className="del-btn" style={{fontSize:18}}>x</button></div>
                          </div>
                        </DraggableRow>
                      ))}
                    </div>
                  )}
                  <AddRowBtn onClick={()=>setColors(c=>[...c,{id:uid(),group:g,name:"new-color",light:"{primitives.blue.600}",dark:"{primitives.blue.400}",description:""}])} label={"+ Add token to "+g} />
                </div>
              );})}
            </div>
          )}

          {/* SPACING */}
          {tab==="Spacing" && (
            <div>
              <TabHeader title="Spacing Tokens" description="4px base scale. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="col-hdr">
                {selectAllChk(spacing.map(s=>s.id))}
                <div className="drag-handle drag-handle--hidden">⌿</div>
                <div className="flex-1 grid-row grid-spacing">
                {["Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                </div>
              </div>
              {spacing.filter(sp => matchesSearch(search, sp.name, sp.value)).map(sp => (
                <DraggableRow key={sp.id} id={sp.id} dragHandlers={spacingDrag} checked={selected.has(sp.id)} onCheck={toggleSelect}>
                  <div className="grid-row grid-spacing">
                    <span className="prefix">spacing /</span>
                    <div><input value={sp.name} onChange={e=>updateList(setSpacing,sp.id,"name",e.target.value)} className={`inp inp--full${isDupe(sp.name,dupeSpacing)?" inp--dupe":""}`} />{isDupe(sp.name,dupeSpacing)&&<div className="dupe-warn">Duplicate name</div>}</div>
                    <div className="flex-row"><input value={sp.value} onChange={e=>updateList(setSpacing,sp.id,"value",sanitizeNumberInput(e.target.value,sp.value))} className="inp inp--full inp--mono" /><span className="unit">px</span></div>
                    <div className="flex-row gap-8"><div className="spacing-bar" style={{width:Math.min(parseInt(sp.value)||0,220)+"px"}} /><span className="prefix">{sp.value}px</span></div>
                    <div className="btn-group"><button onClick={()=>dupInList(setSpacing,sp.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setSpacing,sp.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setSpacing(s=>[...s,{id:uid(),name:"new",value:"0"}])} label="+ Add spacing token" />
            </div>
          )}

          {/* TYPOGRAPHY */}
          {tab==="Typography" && (
            <div>
              <TabHeader title="Typography Tokens" description="Font families, sizes, weights and line heights. For composite text styles, use the Text Styles tab." actions={tabActions()} search={search} onSearch={setSearch} />
              {(["families","sizes","weights","lineHeights"] as const).map((key, ki) => { const labels=["font / family","font / size","font / weight","font / line-height"]; const units=["","px","",""]; const label=labels[ki]; const unit=units[ki]; return (
                <div key={key} className="mb-28">
                  <div style={{marginBottom:8}}><span className="col-hdr-label" style={{fontSize:12,letterSpacing:"0.07em"}}>{label} — drag to reorder</span></div>
                  <div className="col-hdr">
                    {selectAllChk(typography[key].map(i=>i.id))}
                    <div className="drag-handle drag-handle--hidden">⌿</div>
                    <div className="flex-1 grid-row grid-typo">
                    {["Name","Value",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                    </div>
                  </div>
                  {typography[key].filter(item => matchesSearch(search, item.name, item.value)).map(item => (
                    <DraggableRow key={item.id} id={item.id} dragHandlers={typoDragMap[key]} checked={selected.has(item.id)} onCheck={toggleSelect}>
                      <div className="grid-row grid-typo">
                        <input value={item.name} onChange={e=>setTypography(t=>({...t,[key]:t[key].map(i=>i.id===item.id?{...i,name:e.target.value}:i)}))} className="inp" />
                        <div className="flex-row">{key==="families" ? (
                          <select value={item.value} onChange={e=>setTypography(t=>({...t,[key]:t[key].map(i=>i.id===item.id?{...i,value:e.target.value}:i)}))} className="inp inp--full inp--sm" style={{fontFamily:item.value}}>
                            {FONT_FAMILIES.map(f=><option key={f.value} value={f.value} style={{fontFamily:f.value}}>{f.label}</option>)}
                            {!FONT_FAMILIES.some(f=>f.value===item.value) && <option value={item.value}>{item.value}</option>}
                          </select>
                        ) : (
                          <input value={item.value} onChange={e=>setTypography(t=>({...t,[key]:t[key].map(i=>i.id===item.id?{...i,value:e.target.value}:i)}))} className="inp inp--full inp--mono" />
                        )}{unit && <span className="unit">{unit}</span>}</div>
                        <div className="btn-group"><button onClick={()=>setTypography(t=>{const arr=[...t[key]];const idx=arr.findIndex(i=>i.id===item.id);if(idx<0)return t;arr.splice(idx+1,0,{...arr[idx],id:uid(),name:arr[idx].name+" copy"});return{...t,[key]:arr};})} className="dup-btn">⧉</button><button onClick={()=>setTypography(t=>({...t,[key]:t[key].filter(i=>i.id!==item.id)}))} className="del-btn" style={{fontSize:18}}>x</button></div>
                      </div>
                    </DraggableRow>
                  ))}
                  <AddRowBtn onClick={()=>setTypography(t=>({...t,[key]:[...t[key],{id:uid(),name:"new",value:""}]}))} label={"+ Add "+label.split(" / ").slice(1).join(" ")+" token"} />
                </div>
              );})}
            </div>
          )}

          {/* TEXT STYLES */}
          {tab==="Text Styles" && (
            <div>
              <TabHeader title="Text Styles"
                description="Composite typography styles — each defines a full font stack. Exports as text-styles.json for the plugin importer."
                actions={tabActions(<button onClick={addTsGroup} className="tab-add-btn">+ Add Group</button>)} search={search} onSearch={setSearch} />

              {tsGroups.map(g => {
                const filteredTs = (groupedTextStyles[g]||[]).filter(s => matchesSearch(search, g, s.name, s.fontFamily, s.fontSize, s.fontWeight));
                if (search && filteredTs.length === 0) return null;
                return (
                <div key={g} {...tsGroupDrag.makeDropZone(g)} className="mb-32">
                  <div className="hdr-style">
                    <div draggable onDragStart={e=>tsGroupDrag.onDragStart(e,g)} className="drag-handle">⌿</div>
                    <InlineLabel value={g} prefix="text / " onCommit={(n: string)=>renameTsGroup(g,n)} />
                    <div className="section-divider" />
                    <button onClick={()=>{const nn=g+" copy";setTsGroups(gs=>{const idx=gs.indexOf(g);const next=[...gs];next.splice(idx+1,0,nn);return next;});setTextStyles(ts=>[...ts,...ts.filter(s=>s.group===g).map(s=>({...s,id:uid(),group:nn,name:s.name+" copy"}))]);}} className="dup-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={()=>deleteTsGroup(g)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
                  </div>

                  <div className="col-hdr">
                    {selectAllChk(filteredTs.map(s=>s.id))}
                    <div className="drag-handle drag-handle--hidden">⌿</div>
                    <div className="flex-1 grid-row grid-ts">
                    {["Name","Font Family","Size (px)","Weight","Line Height (em)","Letter Spacing (%)","Paragraph Spacing (px)","Decoration","Preview",""].map((h,i)=><div key={i} className="col-hdr-label col-hdr-label--nowrap">{h}</div>)}
                    </div>
                  </div>

                  {filteredTs.map(s => (
                    <DraggableRow key={s.id} id={s.id} dragHandlers={textStylesDrag} checked={selected.has(s.id)} onCheck={toggleSelect}>
                      <div className="grid-row grid-ts">
                        <div><input value={s.name} onChange={e=>updateTextStyle(s.id,"name",e.target.value)} className={`inp inp--full${isDupe(s.name,dupeTextStyles)?" inp--dupe":""}`} />{isDupe(s.name,dupeTextStyles)&&<div className="dupe-warn">Duplicate name</div>}</div>
                        <select value={s.fontFamily} onChange={e=>updateTextStyle(s.id,"fontFamily",e.target.value)} className="inp inp--full inp--sm" style={{fontFamily:s.fontFamily}}>
                          {FONT_FAMILIES.map(f=><option key={f.value} value={f.value} style={{fontFamily:f.value}}>{f.label}</option>)}
                          {!FONT_FAMILIES.some(f=>f.value===s.fontFamily) && <option value={s.fontFamily}>{s.fontFamily}</option>}
                        </select>
                        <div className="flex-row"><input value={s.fontSize} onChange={e=>updateTextStyle(s.id,"fontSize",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                        <input value={s.fontWeight} onChange={e=>updateTextStyle(s.id,"fontWeight",e.target.value)} className="inp inp--full inp--mono inp--sm" />
                        <input value={s.lineHeight} onChange={e=>updateTextStyle(s.id,"lineHeight",e.target.value)} className="inp inp--full inp--mono inp--sm" />
                        <div className="flex-row"><input value={s.letterSpacing} onChange={e=>updateTextStyle(s.id,"letterSpacing",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                        <div className="flex-row"><input value={s.paragraphSpacing} onChange={e=>updateTextStyle(s.id,"paragraphSpacing",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                        <select value={s.textDecoration} onChange={e=>updateTextStyle(s.id,"textDecoration",e.target.value)} className="inp inp--full inp--sm">
                          {TS_DECORATION_OPTIONS.map(d=><option key={d} value={d}>{d.charAt(0)+d.slice(1).toLowerCase()}</option>)}
                        </select>
                        <TextPreview style={s} />
                        <div className="btn-group"><button onClick={()=>dupTextStyle(s.id)} className="dup-btn">⧉</button><button onClick={()=>deleteTextStyle(s.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                      </div>
                    </DraggableRow>
                  ))}

                  <AddRowBtn onClick={()=>addTextStyle(g)} label={"+ Add style to "+g} />
                </div>
                );
              })}

              {tsGroups.length === 0 && <div className="empty-msg empty-msg--centered">No groups yet. Click "+ Add Group" to start.</div>}
            </div>
          )}

          {/* RADIUS */}
          {tab==="Radius" && (
            <div>
              <TabHeader title="Border Radius Tokens" description="Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="radius-select-all">{selectAllChk(radius.map(r=>r.id))}<span className="radius-select-label">Select all</span></div>
              <div className="radius-cards">
                {radius.filter(r => matchesSearch(search, r.name, r.value)).map(r => (
                  <div key={r.id} draggable onDragStart={()=>radiusDrag.onDragStart(r.id)} onDragOver={e=>radiusDrag.onDragOver(e,r.id)} onDrop={()=>radiusDrag.onDrop()} onDragEnd={()=>radiusDrag.onDragEnd()} className={`radius-card ${selected.has(r.id)?"radius-card--selected":"radius-card--default"}`}>
                    <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleSelect(r.id)} className="chk radius-chk" />
                    <div className="radius-preview" style={{borderRadius:Math.min(parseInt(r.value)||0,30)+"px"}} />
                    <div><input value={r.name} onChange={e=>updateList(setRadius,r.id,"name",e.target.value)} className={`inp inp--full inp--center inp--compact${isDupe(r.name,dupeRadius)?" inp--dupe":""}`} />{isDupe(r.name,dupeRadius)&&<div className="dupe-warn">Duplicate</div>}</div>
                    <div className="flex-row w-full"><input value={r.value} onChange={e=>updateList(setRadius,r.id,"value",sanitizeNumberInput(e.target.value,r.value,0))} className="inp inp--center inp--mono inp--compact" style={{flex:1,width:0}} /><span className="unit">px</span></div>
                    <div className="btn-group"><button onClick={()=>dupInList(setRadius,r.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setRadius,r.id)} className="del-btn" style={{fontSize:12}}>Remove</button></div>
                  </div>
                ))}
              </div>
              <AddRowBtn onClick={()=>setRadius(r=>[...r,{id:uid(),name:"new",value:"0"}])} label="+ Add radius token" />
            </div>
          )}

          {/* BORDER */}
          {tab==="Border" && (
            <div>
              <TabHeader title="Border Width Tokens" description="Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="col-hdr">
                {selectAllChk(borders.map(b=>b.id))}
                <div className="drag-handle drag-handle--hidden">⌿</div>
                <div className="flex-1 grid-row grid-border">
                {["Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                </div>
              </div>
              {borders.filter(b => matchesSearch(search, b.name, b.value)).map(b => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={borderDrag} checked={selected.has(b.id)} onCheck={toggleSelect}>
                  <div className="grid-row grid-border">
                    <span className="prefix">border /</span>
                    <div><input value={b.name} onChange={e=>updateList(setBorders,b.id,"name",e.target.value)} className={`inp inp--full${isDupe(b.name,dupeBorders)?" inp--dupe":""}`} />{isDupe(b.name,dupeBorders)&&<div className="dupe-warn">Duplicate name</div>}</div>
                    <div className="flex-row"><input value={b.value} onChange={e=>updateList(setBorders,b.id,"value",sanitizeNumberInput(e.target.value,b.value,0))} className="inp inp--full inp--mono" /><span className="unit">px</span></div>
                    <div style={{display:"flex",alignItems:"center"}}><div className="border-bar" style={{height:Math.max(parseInt(b.value)||0,1),maxHeight:20}} /></div>
                    <div className="btn-group"><button onClick={()=>dupInList(setBorders,b.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setBorders,b.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setBorders(b=>[...b,{id:uid(),name:"new",value:"1"}])} label="+ Add border token" />
            </div>
          )}

          {/* SHADOWS */}
          {tab==="Shadows" && (
            <div>
              <TabHeader title="Shadow Tokens" description="Drag to reorder. Click the swatch to open the shadow picker." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="shadow-col-hdr">
                {selectAllChk(shadows.map(s=>s.id))}
                <div className="drag-handle drag-handle--hidden">⌿</div>
                <span className="col-hdr-label flex-shrink-0" style={{width:72}}>Prefix</span>
                <span className="col-hdr-label flex-shrink-0" style={{width:140}}>Name</span>
                <span className="col-hdr-label flex-1">Value</span>
                <span className="col-hdr-label flex-shrink-0" style={{width:80}}>Preview</span>
                <span className="flex-shrink-0" style={{width:32}}></span>
              </div>
              {shadows.filter(sh => matchesSearch(search, sh.name, sh.value)).map(sh => (
                <ShadowRow key={sh.id} sh={sh} dragHandlers={shadowDrag}
                  onChangeName={(v: string)=>updateList(setShadows,sh.id,"name",v)}
                  onChangeValue={(v: string)=>updateList(setShadows,sh.id,"value",v)}
                  onDelete={()=>deleteList(setShadows,sh.id)}
                  onDuplicate={()=>dupInList(setShadows,sh.id)}
                  checked={selected.has(sh.id)} onCheck={toggleSelect}
                  dupeWarning={isDupe(sh.name,dupeShadows)} />
              ))}
              <AddRowBtn onClick={()=>setShadows(s=>[...s,{id:uid(),name:"new",value:"0px 4px 12px 0px rgba(0,0,0,0.20)"}])} label="+ Add shadow token" />
            </div>
          )}

          {/* Z-INDEX */}
          {tab==="Z-Index" && (
            <div>
              <TabHeader title="Z-Index Tokens" description="Stacking order reference. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="col-hdr">
                {selectAllChk(zindex.map(z=>z.id))}
                <div className="drag-handle drag-handle--hidden">⌿</div>
                <div className="flex-1 grid-row grid-zindex">
                {["Prefix","Name","Value",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                </div>
              </div>
              {zindex.filter(z => matchesSearch(search, z.name, z.value)).map(z => (
                <DraggableRow key={z.id} id={z.id} dragHandlers={zDrag} checked={selected.has(z.id)} onCheck={toggleSelect}>
                  <div className="grid-row grid-zindex">
                    <span className="prefix">z-index /</span>
                    <div><input value={z.name} onChange={e=>updateList(setZIndex,z.id,"name",e.target.value)} className={`inp${isDupe(z.name,dupeZIndex)?" inp--dupe":""}`} />{isDupe(z.name,dupeZIndex)&&<div className="dupe-warn">Duplicate name</div>}</div>
                    <input value={z.value} onChange={e=>updateList(setZIndex,z.id,"value",sanitizeNumberInput(e.target.value,z.value))} className="inp inp--mono" />
                    <div className="btn-group"><button onClick={()=>dupInList(setZIndex,z.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setZIndex,z.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setZIndex(z=>[...z,{id:uid(),name:"new",value:"0"}])} label="+ Add z-index token" />
            </div>
          )}

          {/* BREAKPOINTS */}
          {tab==="Breakpoints" && (
            <div>
              <TabHeader title="Breakpoint Tokens" description="Min-width based. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
              <div className="col-hdr">
                {selectAllChk(breakpoints.map(b=>b.id))}
                <div className="drag-handle drag-handle--hidden">⌿</div>
                <div className="flex-1 grid-row grid-breakpoints">
                {["Prefix","Name","Min (px)","Max (px)","Range",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
                </div>
              </div>
              {breakpoints.filter(b => matchesSearch(search, b.name, b.value, b.max)).map(b => (
                <DraggableRow key={b.id} id={b.id} dragHandlers={breakpointDrag} checked={selected.has(b.id)} onCheck={toggleSelect}>
                  <div className="grid-row grid-breakpoints">
                    <span className="prefix">breakpoint /</span>
                    <div><input value={b.name} onChange={e=>updateList(setBreakpoints,b.id,"name",e.target.value)} className={`inp inp--full${isDupe(b.name,dupeBreakpoints)?" inp--dupe":""}`} />{isDupe(b.name,dupeBreakpoints)&&<div className="dupe-warn">Duplicate name</div>}</div>
                    <div className="flex-row"><input value={b.value} onChange={e=>{
                      const v = sanitizeNumberInput(e.target.value,b.value,0);
                      setBreakpoints(list => { const ri = list.findIndex(bp => bp.id === b.id); return list.map((bp, i) => {
                        if (i === ri) return { ...bp, value: v };
                        if (i === ri - 1) return { ...bp, max: v };
                        return bp;
                      }); });
                    }} className="inp inp--full inp--mono" /><span className="unit">px</span></div>
                    <div className="flex-row"><input value={b.max} onChange={e=>{
                      const v = sanitizeNumberInput(e.target.value,b.max,0);
                      setBreakpoints(list => { const ri = list.findIndex(bp => bp.id === b.id); return list.map((bp, i) => {
                        if (i === ri) return { ...bp, max: v };
                        if (i === ri + 1) return { ...bp, value: v };
                        return bp;
                      }); });
                    }} placeholder="none" className="inp inp--full inp--mono" /><span className="unit">px</span></div>
                    <div className="prefix mono">{bpRange(b)}</div>
                    <div className="btn-group"><button onClick={()=>dupInList(setBreakpoints,b.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setBreakpoints,b.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                  </div>
                </DraggableRow>
              ))}
              <AddRowBtn onClick={()=>setBreakpoints(b=>[...b,{id:uid(),name:"new",value:"",max:""}])} label="+ Add breakpoint token" />
            </div>
          )}

          {/* CUSTOM COLLECTIONS */}
          {customCollections.map(cc => tab === cc.name && (
            <div key={cc.id}>
              <TabHeader title={cc.name} description={`Custom collection — exports as ${cc.jsonKey}.json`}
                actions={tabActions(<button onClick={() => addCustomGroup(cc.id)} disabled={!cc.locked} className="tab-add-btn" style={{opacity: cc.locked ? 1 : 0.4, cursor: cc.locked ? "pointer" : "default"}}>+ Add Group</button>)} search={search} onSearch={setSearch} />

              <div className="cc-settings">
                <label className="cc-settings__label">
                  Tab Name
                  <input value={cc.name} disabled={cc.locked} onChange={e => {
                    const old = cc.name;
                    const nv = e.target.value;
                    setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, name: nv } : c));
                    setEnabledTabs(prev => { const next = new Set(prev); if (next.has(old)) { next.delete(old); next.add(nv); } return next; });
                    setTab(nv);
                  }} className={`inp${cc.locked?" inp--locked":""}`} style={{width:120}} />
                </label>
                <label className="cc-settings__label">
                  JSON Key
                  <input value={cc.jsonKey} disabled={cc.locked} onChange={e => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
                    updateCustomCollection(cc.id, "jsonKey", v);
                  }} className={`inp inp--mono${cc.locked?" inp--locked":""}${!cc.locked&&cc.jsonKey&&!isValidCSSIdentifier(cc.jsonKey)?" inp--invalid":""}`} style={{width:120}} />
                  {!cc.locked&&cc.jsonKey&&!isValidCSSIdentifier(cc.jsonKey)&&<div className="dupe-warn">Must start with a letter/underscore</div>}
                </label>
                <div className="cc-settings__actions">
                  {cc.locked ? (
                    cc.items.length === 0 && <button onClick={() => updateCustomCollection(cc.id, "locked", false)} className="tab-btn">Edit</button>
                  ) : (
                    <button onClick={() => updateCustomCollection(cc.id, "locked", true)} className="tab-add-btn">Save</button>
                  )}
                  <button onClick={() => deleteCustomCollection(cc.id)} className="cc-delete-btn">Delete Collection</button>
                </div>
              </div>

              {(cc.groups || []).map(g => {
                const allGroupItems = cc.items.filter(i => i.group === g.name);
                const groupItems = allGroupItems.filter(i => matchesSearch(search, g.name, i.name, i.value));
                if (search && groupItems.length === 0) return null;
                const singleGroup = cc.groups.length <= 1;
                const gLocked = g.locked !== false;
                const valueTypeSelect = <select value={g.type + (g.unit ? "|" + g.unit : "")} disabled={gLocked} onChange={e => {
                  const [type, unit = ""] = e.target.value.split("|");
                  updateCustomGroup(cc.id, g.name, "type", type);
                  updateCustomGroup(cc.id, g.name, "unit", unit);
                }} className={`inp inp--xs${gLocked?" inp--locked":""}`} style={{width:150}}>
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
                  groupItems.length === 0 && <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", false)} className="tab-btn" style={{fontSize:10,padding:"4px 8px"}}>Edit</button>
                ) : (
                  <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", true)} className="tab-add-btn" style={{fontSize:10,padding:"4px 8px"}}>Save</button>
                );
                return (
                  <div key={g.name} onDragOver={!singleGroup ? (e: React.DragEvent)=>{ if(e.dataTransfer.types.includes(GROUP_DRAG_TYPE)){e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).style.borderTop="2px solid var(--accent)";}} : undefined} onDragLeave={!singleGroup ? (e: React.DragEvent)=>{(e.currentTarget as HTMLElement).style.borderTop="";} : undefined} onDrop={!singleGroup ? (e: React.DragEvent)=>{(e.currentTarget as HTMLElement).style.borderTop="";const from=e.dataTransfer.getData(GROUP_DRAG_TYPE);if(!from||from===g.name)return;e.preventDefault();e.stopPropagation();setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const gs=[...c.groups];const fi=gs.findIndex(x=>x.name===from),ti=gs.findIndex(x=>x.name===g.name);if(fi<0||ti<0)return c;const[m]=gs.splice(fi,1);gs.splice(ti,0,m);return{...c,groups:gs};}));} : undefined} className="mb-28">
                    {singleGroup ? (
                      <div className="hdr-style" style={{justifyContent:"space-between"}}>
                        <span className="col-hdr-label" style={{letterSpacing:"0.07em"}}>Value Type</span>
                        {valueTypeSelect}
                        {groupSaveEdit}
                        <div className="flex-1" />
                      </div>
                    ) : (
                      <div className="hdr-style">
                        <div draggable onDragStart={(e: React.DragEvent)=>{e.dataTransfer.setData(GROUP_DRAG_TYPE,g.name);e.dataTransfer.effectAllowed="move";e.stopPropagation();}} className="drag-handle">⌿</div>
                        <InlineLabel value={g.name} prefix={cc.jsonKey + " / "} onCommit={(n: string) => renameCustomGroup(cc.id, g.name, n)} />
                        {valueTypeSelect}
                        {groupSaveEdit}
                        <div className="section-divider" />
                        <button onClick={() => { const nn=g.name+" copy"; setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const idx=c.groups.findIndex(gr=>gr.name===g.name);const newGroups=[...c.groups];newGroups.splice(idx+1,0,{...g,name:nn,locked:g.locked});const newItems=[...c.items,...c.items.filter(i=>i.group===g.name).map(i=>({...i,id:uid(),group:nn}))];return{...c,groups:newGroups,items:newItems};})); }} className="dup-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={() => deleteCustomGroup(cc.id, g.name)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
                      </div>
                    )}
                    {groupItems.length === 0 && <div className="empty-msg">No tokens yet.</div>}
                    {groupItems.length > 0 && (
                      <div>
                        <div className="col-hdr">
                          {selectAllChk(groupItems.map(i=>i.id))}
                          <div className="drag-handle drag-handle--hidden">⌿</div>
                          <div className="flex-1 grid-row grid-custom">
                          {["Name","Value",""].map((h,i) => <div key={i} className="col-hdr-label">{h}</div>)}
                          </div>
                        </div>
                        {groupItems.map(item => (
                          <DraggableRow key={item.id} id={item.id} checked={selected.has(item.id)} onCheck={toggleSelect} dragHandlers={{
                            onDragStart: (id: number) => { if (!ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; ccDragRef.current[cc.id].dragId = id; },
                            onDragOver: (e: React.DragEvent, id: number) => { e.preventDefault(); if (!ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; ccDragRef.current[cc.id].overId = id; },
                            onDrop: () => {
                              const d = ccDragRef.current[cc.id]; if (!d) return;
                              const from = d.dragId, to = d.overId;
                              if (from == null || to == null || from === to) return;
                              setCustomCollections(ccs => ccs.map(c => {
                                if (c.id !== cc.id) return c;
                                const items = [...c.items];
                                const fi = items.findIndex(i => i.id === from);
                                const ti = items.findIndex(i => i.id === to);
                                if (fi < 0 || ti < 0) return c;
                                const [moved] = items.splice(fi, 1);
                                items.splice(ti, 0, moved);
                                return { ...c, items };
                              }));
                            },
                            onDragEnd: () => { if (ccDragRef.current[cc.id]) ccDragRef.current[cc.id] = { dragId: null, overId: null }; },
                          }}>
                            <div className="grid-row grid-custom">
                              <input value={item.name} onChange={e => updateCustomItem(cc.id, item.id, "name", e.target.value)} className="inp inp--full" />
                              {g.type === "color" ? (
                                <PrimSelector value={item.value} primitives={primitives} primGroups={primGroups} onChange={(v: string) => updateCustomItem(cc.id, item.id, "value", v)} mode="Value" />
                              ) : g.type === "fontFamily" ? (
                                <select value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} className="inp inp--full inp--sm" style={{fontFamily:item.value}}>
                                  {FONT_FAMILIES.map(f => <option key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.label}</option>)}
                                  {!FONT_FAMILIES.some(f => f.value === item.value) && <option value={item.value}>{item.value}</option>}
                                </select>
                              ) : (
                                <div className="flex-row">
                                  <input value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} className="inp inp--full inp--mono" />
                                  {g.unit && <span className="unit">{g.unit}</span>}
                                </div>
                              )}
                              <div className="btn-group"><button onClick={() => dupCustomItem(cc.id, item.id)} className="dup-btn">⧉</button><button onClick={() => deleteCustomItem(cc.id, item.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
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
            <div className="bulk-bar">
              <span className="bulk-bar__count">{selected.size} selected</span>
              <div className="bulk-bar__divider" />
              {(tab==="Colors") && <>
                <label className="bulk-bar__label">Group <select onChange={e=>{if(e.target.value)bulkApply("group",e.target.value);e.target.value="";}} className="inp inp--xs" style={{width:100}}><option value="">—</option>{colorGroups.map(g=><option key={g} value={g}>{g}</option>)}</select></label>
              </>}
              {(tab==="Text Styles") && <>
                <label className="bulk-bar__label">Font <select onChange={e=>{if(e.target.value)bulkApply("fontFamily",e.target.value);e.target.value="";}} className="inp inp--xs" style={{width:130}}><option value="">—</option>{FONT_FAMILIES.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}</select></label>
                <label className="bulk-bar__label">Size <input type="number" min="1" placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as HTMLInputElement).value){bulkApply("fontSize",(e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value="";}}} className="inp inp--xs" style={{width:50}} /></label>
                <label className="bulk-bar__label">Weight <select onChange={e=>{if(e.target.value)bulkApply("fontWeight",e.target.value);e.target.value="";}} className="inp inp--xs" style={{width:70}}><option value="">—</option>{["100","200","300","400","500","600","700","800","900"].map(w=><option key={w} value={w}>{w}</option>)}</select></label>
                <label className="bulk-bar__label">L.Height <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as HTMLInputElement).value){bulkApply("lineHeight",(e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value="";}}} className="inp inp--xs" style={{width:50}} /></label>
                <label className="bulk-bar__label">L.Space <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as HTMLInputElement).value){bulkApply("letterSpacing",(e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value="";}}} className="inp inp--xs" style={{width:50}} /></label>
                <label className="bulk-bar__label">P.Space <input placeholder="—" onKeyDown={e=>{if(e.key==="Enter"&&(e.target as HTMLInputElement).value){bulkApply("paragraphSpacing",(e.target as HTMLInputElement).value);(e.target as HTMLInputElement).value="";}}} className="inp inp--xs" style={{width:50}} /></label>
                <label className="bulk-bar__label">Decoration <select onChange={e=>{if(e.target.value)bulkApply("textDecoration",e.target.value);e.target.value="";}} className="inp inp--xs" style={{width:100}}><option value="">—</option>{["NONE","UNDERLINE","STRIKETHROUGH"].map(d=><option key={d} value={d}>{d}</option>)}</select></label>
                <label className="bulk-bar__label">Group <select onChange={e=>{if(e.target.value)bulkApply("group",e.target.value);e.target.value="";}} className="inp inp--xs" style={{width:100}}><option value="">—</option>{tsGroups.map(g=><option key={g} value={g}>{g}</option>)}</select></label>
              </>}
              <div className="flex-1" />
              <button onClick={bulkDelete} className="bulk-bar__delete">Delete</button>
              <button onClick={()=>setSelected(new Set())} className="bulk-bar__clear">Clear (Esc)</button>
            </div>
          )}

        </div>

        {/* JSON Preview */}
        {showPreview && (
          <div className="preview-panel">
            <div className="preview-panel__header">
              <span className="preview-panel__title">{tab} — DTCG JSON</span>
              <span className="preview-panel__subtitle">Figma native format</span>
            </div>
            <pre className="preview-panel__code">{previewJSON}</pre>
          </div>
        )}

      </div>
    </div>
  );
}
