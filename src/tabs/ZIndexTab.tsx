import React from "react";
import type { ZIndexToken, DragHandlers } from "../types";
import { matchesSearch, sanitizeNumberInput } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn } from "../components";

interface ZIndexTabProps {
  zindex: ZIndexToken[];
  setZIndex: React.Dispatch<React.SetStateAction<ZIndexToken[]>>;
  zDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeZIndex: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, name: string) => void;
  uid: () => number;
}

export function ZIndexTab({
  zindex, setZIndex, zDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeZIndex, isDupe, trimNameOnBlur, uid,
}: ZIndexTabProps) {
  return (
    <div>
      <TabHeader title="Z-Index Tokens" description="Stacking order reference. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
      <div className="col-hdr">
        {selectAllChk(zindex.map(z=>z.id))}
        <div className="drag-handle drag-handle--hidden">⌿</div>
        <div className="flex-1 grid-row grid-zindex">
        {["Prefix","Name","Value",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
        </div>
      </div>
      {zindex.filter(z => matchesSearch(search, z.name, z.value)).length === 0 && <div className="empty-state">{search ? "No z-index tokens match your filter." : "No z-index tokens yet. Click \"+ Add z-index token\" below to create one."}</div>}
      {zindex.filter(z => matchesSearch(search, z.name, z.value)).map(z => (
        <DraggableRow key={z.id} id={z.id} dragHandlers={zDrag} checked={selected.has(z.id)} onCheck={toggleSelect}>
          <div className="grid-row grid-zindex">
            <span className="prefix">z-index /</span>
            <div><input value={z.name} onChange={e=>updateList(setZIndex,z.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setZIndex,z.id,z.name)} className={`inp${isDupe(z.name,dupeZIndex)?" inp--dupe":""}`} />{isDupe(z.name,dupeZIndex)&&<div className="dupe-warn">Duplicate name</div>}</div>
            <input value={z.value} onChange={e=>updateList(setZIndex,z.id,"value",sanitizeNumberInput(e.target.value,z.value))} className="inp inp--mono" />
            <div className="btn-group"><button onClick={()=>dupInList(setZIndex,z.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setZIndex,z.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
          </div>
        </DraggableRow>
      ))}
      <AddRowBtn onClick={()=>setZIndex(z=>[...z,{id:uid(),name:"new",value:"0"}])} label="+ Add z-index token" />
    </div>
  );
}
