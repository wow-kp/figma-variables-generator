import React from "react";
import type { Typography, DragHandlers } from "../types";
import { matchesSearch, FONT_FAMILIES } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn } from "../components";

interface TypographyTabProps {
  typography: Typography;
  setTypography: React.Dispatch<React.SetStateAction<Typography>>;
  typoDragMap: Record<string, DragHandlers>;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  uid: () => number;
}

export function TypographyTab({
  typography, setTypography, typoDragMap, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, uid,
}: TypographyTabProps) {
  return (
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
                <input value={item.name} onChange={e=>setTypography(t=>({...t,[key]:t[key].map(i=>i.id===item.id?{...i,name:e.target.value}:i)}))} onBlur={e=>{const v=e.target.value.trim();if(v!==item.name)setTypography(t=>({...t,[key]:t[key].map(i=>i.id===item.id?{...i,name:v||"unnamed"}:i)}));}} className="inp" />
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
  );
}
