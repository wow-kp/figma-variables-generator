import React from "react";
import type { SpacingToken, DragHandlers } from "../types";
import { matchesSearch, sanitizeNumberInput } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn } from "../components";

interface SpacingTabProps {
  spacing: SpacingToken[];
  setSpacing: React.Dispatch<React.SetStateAction<SpacingToken[]>>;
  spacingDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeSpacing: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, name: string) => void;
  uid: () => number;
}

export function SpacingTab({
  spacing, setSpacing, spacingDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeSpacing, isDupe, trimNameOnBlur, uid,
}: SpacingTabProps) {
  return (
    <div>
      <TabHeader title="Spacing Tokens" description="4px base scale. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
      <div className="col-hdr">
        {selectAllChk(spacing.map(s=>s.id))}
        <div className="drag-handle drag-handle--hidden">⌿</div>
        <div className="flex-1 grid-row grid-spacing">
        {["Prefix","Name","Value","Visual",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
        </div>
      </div>
      {spacing.filter(sp => matchesSearch(search, sp.name, sp.value)).length === 0 && <div className="empty-state">{search ? "No spacing tokens match your filter." : "No spacing tokens yet. Click \"+ Add spacing token\" below to create one."}</div>}
      {spacing.filter(sp => matchesSearch(search, sp.name, sp.value)).map(sp => (
        <DraggableRow key={sp.id} id={sp.id} dragHandlers={spacingDrag} checked={selected.has(sp.id)} onCheck={toggleSelect}>
          <div className="grid-row grid-spacing">
            <span className="prefix">spacing /</span>
            <div><input value={sp.name} onChange={e=>updateList(setSpacing,sp.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setSpacing,sp.id,sp.name)} className={`inp inp--full${isDupe(sp.name,dupeSpacing)?" inp--dupe":""}`} />{isDupe(sp.name,dupeSpacing)&&<div className="dupe-warn">Duplicate name</div>}</div>
            <div className="flex-row"><input value={sp.value} onChange={e=>updateList(setSpacing,sp.id,"value",sanitizeNumberInput(e.target.value,sp.value))} className="inp inp--full inp--mono" /><span className="unit">px</span></div>
            <div className="flex-row gap-8"><div className="spacing-bar" style={{width:Math.min(parseInt(sp.value)||0,220)+"px"}} /><span className="prefix">{sp.value}px</span></div>
            <div className="btn-group"><button onClick={()=>dupInList(setSpacing,sp.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setSpacing,sp.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
          </div>
        </DraggableRow>
      ))}
      <AddRowBtn onClick={()=>setSpacing(s=>[...s,{id:uid(),name:"new",value:"0"}])} label="+ Add spacing token" />
    </div>
  );
}
