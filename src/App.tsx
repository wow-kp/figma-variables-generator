import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken, CustomCollection } from "./types";
import { ALL_TABS, DEFAULT_ENABLED, DEFAULT_COLOR_GROUPS, DEFAULT_TS_GROUPS, STORAGE_KEY, buildDefaultPrimitives, buildDefaultPrimGroups, defaultTextStyles, defaultColors, defaultSpacing, defaultTypography, defaultRadius, defaultBorders, defaultShadows, defaultZIndex, defaultBreakpoints, FONT_FAMILIES, initIdCounter, uid, loadSaved, findDuplicateNames, findDuplicateNamesInGroups } from "./defaults";
import { genPrimitivesJSON, genColorsJSON, genSpacingJSON, genTypographyJSON, genTextStylesJSON, genRadiusJSON, genBorderJSON, genShadowsJSON, genZIndexJSON, genBreakpointsJSON, genCustomJSON, dlJSON } from "./generators";
import { useDraggable, useGroupDrag } from "./hooks";
import { DownloadPanel } from "./DownloadPanel";
import { PrimitivesTab, ColorsTab, SpacingTab, TypographyTab, TextStylesTab, RadiusTab, BorderTab, ShadowsTab, ZIndexTab, BreakpointsTab, CustomTab } from "./tabs";

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
  const exportBackup = () => {
    const backup = JSON.stringify({ tab, enabledTabs: [...enabledTabs], primGroups, primitives, colorGroups, colors, spacing, typography, textStyles, tsGroups, radius, borders, shadows, zindex, breakpoints, customCollections, theme }, null, 2);
    dlJSON(backup, "figma-variables-backup-" + new Date().toISOString().slice(0,10) + ".json");
  };
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
  const trimNameOnBlur = <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, current: string) => {
    const trimmed = current.trim();
    if (trimmed !== current) setter(prev => prev.map(i => i.id === id ? { ...i, name: trimmed || "unnamed" } : i));
    else if (!trimmed) setter(prev => prev.map(i => i.id === id ? { ...i, name: "unnamed" } : i));
  };
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
              <button onClick={exportBackup} className="reset-confirm__cancel">Export backup first</button>
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

          {tab==="Primitives" && (
            <PrimitivesTab primGroups={primGroups} setPrimitives={setPrimitives} primitives={primitives}
              primGroupDrag={primGroupDrag} renamePrimGroup={renamePrimGroup} deletePrimGroup={deletePrimGroup}
              addPrimGroup={addPrimGroup} addShade={addShade} removeShade={removeShade} renameShade={renameShade}
              search={search} setSearch={setSearch} tabActions={tabActions} />
          )}

          {tab==="Colors" && (
            <ColorsTab colors={colors} setColors={setColors} colorGroups={colorGroups} setColorGroups={setColorGroups}
              groupedColors={groupedColors} colorDrag={colorDrag} colorGroupDrag={colorGroupDrag}
              primitives={primitives} primGroups={primGroups} selected={selected} toggleSelect={toggleSelect}
              selectAllChk={selectAllChk} search={search} setSearch={setSearch} tabActions={tabActions}
              updateColor={updateColor} dupColor={dupColor} isDupe={isDupe} dupeColors={dupeColors}
              trimNameOnBlur={trimNameOnBlur} addColorGroup={addColorGroup} renameColorGroup={renameColorGroup}
              deleteColorGroup={deleteColorGroup} uid={uid} />
          )}

          {tab==="Spacing" && (
            <SpacingTab spacing={spacing} setSpacing={setSpacing} spacingDrag={spacingDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeSpacing={dupeSpacing} isDupe={isDupe} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {tab==="Typography" && (
            <TypographyTab typography={typography} setTypography={setTypography} typoDragMap={typoDragMap}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} uid={uid} />
          )}

          {tab==="Text Styles" && (
            <TextStylesTab textStyles={textStyles} setTextStyles={setTextStyles} tsGroups={tsGroups} setTsGroups={setTsGroups}
              groupedTextStyles={groupedTextStyles} textStylesDrag={textStylesDrag} tsGroupDrag={tsGroupDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateTextStyle={updateTextStyle}
              dupTextStyle={dupTextStyle} deleteTextStyle={deleteTextStyle} addTextStyle={addTextStyle}
              addTsGroup={addTsGroup} renameTsGroup={renameTsGroup} deleteTsGroup={deleteTsGroup}
              isDupe={isDupe} dupeTextStyles={dupeTextStyles} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {tab==="Radius" && (
            <RadiusTab radius={radius} setRadius={setRadius} radiusDrag={radiusDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeRadius={dupeRadius} isDupe={isDupe} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {tab==="Border" && (
            <BorderTab borders={borders} setBorders={setBorders} borderDrag={borderDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeBorders={dupeBorders} isDupe={isDupe} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {tab==="Shadows" && (
            <ShadowsTab shadows={shadows} setShadows={setShadows} shadowDrag={shadowDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeShadows={dupeShadows} isDupe={isDupe} uid={uid} />
          )}

          {tab==="Z-Index" && (
            <ZIndexTab zindex={zindex} setZIndex={setZIndex} zDrag={zDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeZIndex={dupeZIndex} isDupe={isDupe} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {tab==="Breakpoints" && (
            <BreakpointsTab breakpoints={breakpoints} setBreakpoints={setBreakpoints} breakpointDrag={breakpointDrag}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect} updateList={updateList} deleteList={deleteList}
              dupInList={dupInList} dupeBreakpoints={dupeBreakpoints} isDupe={isDupe} trimNameOnBlur={trimNameOnBlur} uid={uid} />
          )}

          {customCollections.map(cc => tab === cc.name && (
            <CustomTab key={cc.id} cc={cc} primitives={primitives} primGroups={primGroups}
              search={search} setSearch={setSearch} tabActions={tabActions} selectAllChk={selectAllChk}
              selected={selected} toggleSelect={toggleSelect}
              updateCustomCollection={updateCustomCollection} deleteCustomCollection={deleteCustomCollection}
              updateCustomItem={updateCustomItem} deleteCustomItem={deleteCustomItem} dupCustomItem={dupCustomItem}
              addCustomItem={addCustomItem} addCustomGroup={addCustomGroup} renameCustomGroup={renameCustomGroup}
              updateCustomGroup={updateCustomGroup} deleteCustomGroup={deleteCustomGroup}
              setCustomCollections={setCustomCollections} setEnabledTabs={setEnabledTabs} setTab={setTab} uid={uid} />
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
