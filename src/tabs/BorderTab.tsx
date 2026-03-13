import React from "react";
import type { BorderToken, DragHandlers } from "../types";
import { matchesSearch, sanitizeNumberInput } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn } from "../components";

interface BorderTabProps {
  borders: BorderToken[];
  setBorders: React.Dispatch<React.SetStateAction<BorderToken[]>>;
  borderDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeBorders: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, name: string) => void;
  uid: () => number;
}

export function BorderTab({
  borders, setBorders, borderDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeBorders, isDupe, trimNameOnBlur, uid,
}: BorderTabProps) {
  return (
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
            <div><input value={b.name} onChange={e=>updateList(setBorders,b.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setBorders,b.id,b.name)} className={`inp inp--full${isDupe(b.name,dupeBorders)?" inp--dupe":""}`} />{isDupe(b.name,dupeBorders)&&<div className="dupe-warn">Duplicate name</div>}</div>
            <div className="flex-row"><input value={b.value} onChange={e=>updateList(setBorders,b.id,"value",sanitizeNumberInput(e.target.value,b.value,0))} className="inp inp--full inp--mono" /><span className="unit">px</span></div>
            <div style={{display:"flex",alignItems:"center"}}><div className="border-bar" style={{height:Math.max(parseInt(b.value)||0,1),maxHeight:20}} /></div>
            <div className="btn-group"><button onClick={()=>dupInList(setBorders,b.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setBorders,b.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
          </div>
        </DraggableRow>
      ))}
      <AddRowBtn onClick={()=>setBorders(b=>[...b,{id:uid(),name:"new",value:"1"}])} label="+ Add border token" />
    </div>
  );
}
