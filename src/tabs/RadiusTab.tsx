import React from "react";
import type { RadiusToken, DragHandlers } from "../types";
import { matchesSearch, sanitizeNumberInput } from "../defaults";
import { TabHeader, AddRowBtn } from "../components";

interface RadiusTabProps {
  radius: RadiusToken[];
  setRadius: React.Dispatch<React.SetStateAction<RadiusToken[]>>;
  radiusDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeRadius: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, name: string) => void;
  uid: () => number;
}

export function RadiusTab({
  radius, setRadius, radiusDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeRadius, isDupe, trimNameOnBlur, uid,
}: RadiusTabProps) {
  return (
    <div>
      <TabHeader title="Border Radius Tokens" description="Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
      <div className="radius-select-all">{selectAllChk(radius.map(r=>r.id))}<span className="radius-select-label">Select all</span></div>
      <div className="radius-cards">
        {radius.filter(r => matchesSearch(search, r.name, r.value)).map(r => (
          <div key={r.id} draggable onDragStart={()=>radiusDrag.onDragStart(r.id)} onDragOver={e=>radiusDrag.onDragOver(e,r.id)} onDrop={()=>radiusDrag.onDrop()} onDragEnd={()=>radiusDrag.onDragEnd()} className={`radius-card ${selected.has(r.id)?"radius-card--selected":"radius-card--default"}`}>
            <input type="checkbox" checked={selected.has(r.id)} onChange={()=>toggleSelect(r.id)} className="chk radius-chk" />
            <div className="radius-preview" style={{borderRadius:Math.min(parseInt(r.value)||0,30)+"px"}} />
            <div><input value={r.name} onChange={e=>updateList(setRadius,r.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setRadius,r.id,r.name)} className={`inp inp--full inp--center inp--compact${isDupe(r.name,dupeRadius)?" inp--dupe":""}`} />{isDupe(r.name,dupeRadius)&&<div className="dupe-warn">Duplicate</div>}</div>
            <div className="flex-row w-full"><input value={r.value} onChange={e=>updateList(setRadius,r.id,"value",sanitizeNumberInput(e.target.value,r.value,0))} className="inp inp--center inp--mono inp--compact" style={{flex:1,width:0}} /><span className="unit">px</span></div>
            <div className="btn-group"><button onClick={()=>dupInList(setRadius,r.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setRadius,r.id)} className="del-btn" style={{fontSize:12}}>Remove</button></div>
          </div>
        ))}
      </div>
      <AddRowBtn onClick={()=>setRadius(r=>[...r,{id:uid(),name:"new",value:"0"}])} label="+ Add radius token" />
    </div>
  );
}
