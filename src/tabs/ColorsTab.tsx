import React from "react";
import type { ColorToken, PrimGroup, Primitives, DragHandlers, GroupDragHandlers } from "../types";
import { matchesSearch } from "../defaults";
import { TabHeader, AddRowBtn, DraggableRow, InlineLabel, PrimSelector } from "../components";

export interface ColorsTabProps {
  colors: ColorToken[];
  setColors: React.Dispatch<React.SetStateAction<ColorToken[]>>;
  colorGroups: string[];
  setColorGroups: React.Dispatch<React.SetStateAction<string[]>>;
  groupedColors: Record<string, ColorToken[]>;
  colorDrag: DragHandlers;
  colorGroupDrag: GroupDragHandlers;
  primitives: Primitives;
  primGroups: PrimGroup[];
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  selectAllChk: (ids: number[]) => React.ReactNode;
  search: string;
  setSearch: (s: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  updateColor: (id: number, f: string, v: string) => void;
  dupColor: (id: number) => void;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  dupeColors: Set<string>;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, current: string) => void;
  addColorGroup: () => void;
  renameColorGroup: (o: string, n: string) => void;
  deleteColorGroup: (n: string) => void;
  uid: () => number;
}

export function ColorsTab({
  colors, setColors, colorGroups, setColorGroups,
  groupedColors,
  colorDrag, colorGroupDrag,
  primitives, primGroups,
  selected, toggleSelect, selectAllChk,
  search, setSearch, tabActions,
  updateColor, dupColor,
  isDupe, dupeColors, trimNameOnBlur,
  addColorGroup, renameColorGroup, deleteColorGroup,
  uid,
}: ColorsTabProps) {
  return (
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
                    <div><input value={c.name} onChange={e=>updateColor(c.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setColors,c.id,c.name)} className={`inp inp--full${isDupe(c.name,dupeColors)?" inp--dupe":""}`} />{isDupe(c.name,dupeColors)&&<div className="dupe-warn">Duplicate name in group</div>}<input value={c.description} onChange={e=>updateColor(c.id,"description",e.target.value)} placeholder="Description" className="inp inp--full inp--desc" /></div>
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
  );
}
