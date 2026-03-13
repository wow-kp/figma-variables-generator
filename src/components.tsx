import { useState, memo } from "react";
import type { Primitives, PrimGroup, DragHandlers, ShadowToken } from "./types";
import { getPrimOptions, resolveColor } from "./generators";
import { normalizeHex } from "./defaults";

export function AddRowBtn({ onClick, label, disabled }: { onClick: () => void; label: string; disabled?: boolean }) {
  return <button onClick={disabled ? undefined : onClick} disabled={disabled} className="add-row-btn">{label}</button>;
}

export function TabHeader({ title, description, actions, search, onSearch }: { title: string; description?: string; actions?: React.ReactNode; search?: string; onSearch?: (v: string) => void }) {
  return (
    <div className="tab-header">
      <div className="tab-header__top">
        <span className="tab-header__title">{title}</span>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {description && <div className="tab-header__desc">{description}</div>}
      {onSearch && <div className="tab-header__search">
        <input value={search||""} onChange={e=>onSearch(e.target.value)} placeholder="Filter tokens…" aria-label="Filter tokens" className="tab-header__search-input" />
        {search && <button onClick={()=>onSearch("")} aria-label="Clear search" className="tab-header__search-clear">×</button>}
      </div>}
    </div>
  );
}

export function DragHandle({ onMouseEnter, onMouseLeave }: { onMouseEnter: () => void; onMouseLeave: () => void }) {
  return <div role="button" aria-label="Drag to reorder" tabIndex={0} title="Drag to reorder" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="drag-handle">&#8959;</div>;
}

const PREVIEW_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const _measureCanvas = document.createElement("canvas");
function measureTextWidth(text: string, font: string) {
  const ctx = _measureCanvas.getContext("2d")!;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export const TextPreview = memo(function TextPreview({ style }: { style: { fontSize: string; fontFamily: string; fontWeight: string; lineHeight: string; letterSpacing: string; textDecoration: string } }) {
  const fontSize = (parseFloat(style.fontSize) || 16) + "px";
  const font = `${style.fontWeight} ${fontSize} ${style.fontFamily}`;
  const fullWidth = measureTextWidth(PREVIEW_TEXT, font);
  const w = Math.ceil(fullWidth / 2) + 8;
  return (
    <div className="text-preview" onMouseDown={e=>e.stopPropagation()} onDragStart={e=>e.stopPropagation()}>
      <span className="text-preview__text" style={{fontFamily:style.fontFamily,fontSize,fontWeight:style.fontWeight,lineHeight:style.lineHeight,letterSpacing:(parseFloat(style.letterSpacing)||0)+"px",textDecoration:style.textDecoration==="UNDERLINE"?"underline":style.textDecoration==="STRIKETHROUGH"?"line-through":"none",maxWidth:w}}>{PREVIEW_TEXT}</span>
    </div>
  );
});

export const DraggableRow = memo(function DraggableRow({ id, dragHandlers, children, checked, onCheck }: { id: number; dragHandlers: DragHandlers; children: React.ReactNode; checked?: boolean; onCheck?: (id: number) => void }) {
  const [over, setOver] = useState(false), [hov, setHov] = useState(false);
  return (
    <div draggable={hov}
      onDragStart={() => dragHandlers.onDragStart(id)}
      onDragOver={(e) => { dragHandlers.onDragOver(e,id); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { dragHandlers.onDrop(); setOver(false); }}
      onDragEnd={() => { dragHandlers.onDragEnd(); setOver(false); }}
      className={`draggable-row${over?" draggable-row--over":""}${checked?" draggable-row--checked":""}${hov?" draggable-row--grab":""}`}>
      {onCheck !== undefined && <input type="checkbox" checked={!!checked} onChange={()=>onCheck(id)} aria-label="Select row" className="chk" />}
      <DragHandle onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} />
      <div className="draggable-row__content">{children}</div>
    </div>
  );
});

export function InlineLabel({ value, onCommit, prefix="", style={} }: { value: string; onCommit: (v: string) => void; prefix?: string; style?: React.CSSProperties }) {
  const [editing, setEditing] = useState(false), [val, setVal] = useState(value);
  const commit = () => { const t = val.trim(); if (t && t !== value) onCommit(t); setEditing(false); };
  if (editing) return <input autoFocus value={val} onChange={e=>setVal(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape")setEditing(false);}} aria-label="Rename" className="inline-label-input" style={style} />;
  return <span onDoubleClick={() => { setVal(value); setEditing(true); }} title="Double-click to rename" className="inline-label" style={style}>{prefix}{value}</span>;
}

export const PrimSelector = memo(function PrimSelector({ value, primitives, primGroups, onChange, mode }: { value: string; primitives: Primitives; primGroups: PrimGroup[]; onChange: (v: string) => void; mode: string }) {
  const opts = getPrimOptions(primitives, primGroups);
  const isCustom = !value.startsWith("{primitives.");
  const resolved = resolveColor(value, primitives);
  return (
    <div className="prim-selector">
      <div className="prim-selector__preview">
        <div className="prim-selector__swatch" style={{background:resolved}} />
        <span className="prim-selector__ref">{isCustom ? resolved : value.replace("{primitives.","").replace("}","")}</span>
      </div>
      <select value={isCustom?"custom":value} onChange={e=>{const v=e.target.value;if(v==="custom"){onChange(resolved);}else{onChange(v);}}} aria-label={mode+" color reference"} className="prim-selector__select">
        <optgroup label={"-- "+mode+" mode --"}>{opts.map(o=><option key={o.ref} value={o.ref} style={{background:"var(--bg-input)"}}>{o.label}</option>)}</optgroup>
      </select>
      {isCustom && <div className="prim-selector__custom"><input type="color" value={resolved} onChange={e=>onChange(e.target.value)} aria-label={mode+" color picker"} className="prim-selector__picker" /><input value={value} onChange={e=>onChange(e.target.value)} onBlur={e=>{const n=normalizeHex(e.target.value);if(n!==value)onChange(n);}} placeholder="#000000 or rgba(...)" aria-label={mode+" color hex value"} className="prim-selector__hex" /></div>}
    </div>
  );
});

// ── Shadow components ─────────────────────────────────────────────────────────

export function parseShadow(str: string) {
  if (!str) return { x:0,y:4,blur:8,spread:0,color:"rgba(0,0,0,0.20)",inset:false };
  const inset=/\binset\b/.test(str), clean=str.replace(/\binset\b/,"").trim();
  const rgba=clean.match(/rgba?\([^)]+\)/), hex=clean.match(/#[0-9a-fA-F]{3,8}/);
  const color=rgba?rgba[0]:hex?hex[0]:"rgba(0,0,0,0.20)";
  const nums=clean.replace(color,"").trim().split(/\s+/).map(v=>parseFloat(v)||0);
  return { x:nums[0]||0,y:nums[1]||4,blur:nums[2]||8,spread:nums[3]||0,color,inset };
}

function buildShadow({ x,y,blur,spread,color,inset }: { x:number;y:number;blur:number;spread:number;color:string;inset:boolean }) { return (inset?"inset ":"")+x+"px "+y+"px "+blur+"px "+spread+"px "+color; }

function ShadowSwatch({ value, active, onClick }: { value: string; active: boolean; onClick: () => void }) {
  return <div role="button" aria-label="Toggle shadow picker" aria-expanded={active} tabIndex={0} onClick={onClick} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onClick();}}} className={`shadow-swatch${active?" shadow-swatch--active":""}`}><div className="shadow-swatch__inner" style={{boxShadow:value}} /></div>;
}

function ShadowSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return <div className="shadow-slider"><span className="shadow-slider__label" id={"shadow-"+label.replace(/\s+/g,"-").toLowerCase()}>{label}</span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} aria-label={label} className="shadow-slider__range" /><input type="number" value={value} onChange={e=>onChange(Number(e.target.value)||0)} aria-label={label+" value"} className="inp inp--xs inp--center inp--mono" style={{width:52}} /><span className="shadow-slider__unit">px</span></div>;
}

function ShadowPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const p=parseShadow(value), set=(field: string,val: number|string|boolean)=>onChange(buildShadow({...p,[field]:val}));
  return <div className="shadow-picker"><div className="shadow-picker__preview"><div className="shadow-picker__inner" style={{boxShadow:value}} /></div><div className="shadow-picker__controls"><ShadowSlider label="X offset" value={p.x} min={-80} max={80} onChange={v=>set("x",v)} /><ShadowSlider label="Y offset" value={p.y} min={-80} max={80} onChange={v=>set("y",v)} /><ShadowSlider label="Blur" value={p.blur} min={0} max={120} onChange={v=>set("blur",v)} /><ShadowSlider label="Spread" value={p.spread} min={-40} max={60} onChange={v=>set("spread",v)} /><div className="shadow-picker__color-row"><span className="shadow-slider__label">Color</span><input value={p.color} onChange={e=>set("color",e.target.value)} aria-label="Shadow color" className="inp inp--mono inp--sm" style={{flex:1}} /><label className="shadow-picker__inset"><input type="checkbox" checked={p.inset} onChange={e=>set("inset",e.target.checked)} aria-label="Inset shadow" style={{accentColor:"#4f46e5"}} />inset</label></div></div></div>;
}

export function ShadowRow({ sh, dragHandlers, onChangeName, onChangeValue, onDelete, onDuplicate, checked, onCheck, dupeWarning }: { sh: ShadowToken; dragHandlers: DragHandlers; onChangeName: (v: string) => void; onChangeValue: (v: string) => void; onDelete: () => void; onDuplicate: () => void; checked?: boolean; onCheck?: (id: number) => void; dupeWarning?: boolean }) {
  const [open,setOpen]=useState(false), [hov,setHov]=useState(false);
  return <div className="shadow-row"><div draggable onDragStart={()=>dragHandlers.onDragStart(sh.id)} onDragOver={(e)=>dragHandlers.onDragOver(e,sh.id)} onDrop={()=>dragHandlers.onDrop()} onDragEnd={()=>dragHandlers.onDragEnd()} className={`shadow-row__header${checked?" shadow-row--checked":""}${hov?" shadow-row--grab":""}`}>{onCheck !== undefined && <input type="checkbox" checked={!!checked} onChange={()=>onCheck(sh.id)} aria-label={"Select "+sh.name} className="chk" />}<DragHandle onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} /><span className="prefix flex-shrink-0" style={{width:72}}>shadow /</span><div style={{width:140,flexShrink:0}}><input value={sh.name} onChange={e=>onChangeName(e.target.value)} aria-label="Shadow name" className={`inp${dupeWarning?" inp--dupe":""}`} style={{width:"100%"}} />{dupeWarning&&<div className="dupe-warn">Duplicate name</div>}</div><input value={sh.value} onChange={e=>onChangeValue(e.target.value)} aria-label="Shadow CSS value" className="inp inp--mono" style={{flex:1,fontSize:12,minWidth:0}} /><ShadowSwatch value={sh.value} active={open} onClick={()=>setOpen(o=>!o)} /><button onClick={onDuplicate} aria-label={"Duplicate "+sh.name} className="dup-btn">⧉</button><button onClick={onDelete} aria-label={"Delete "+sh.name} className="del-btn" style={{fontSize:18,flexShrink:0}}>x</button></div>{open && <ShadowPicker value={sh.value} onChange={onChangeValue} />}</div>;
}
