import React from "react";
import type { BreakpointToken, DragHandlers } from "../types";
import { matchesSearch, sanitizeNumberInput } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn } from "../components";

interface BreakpointsTabProps {
  breakpoints: BreakpointToken[];
  setBreakpoints: React.Dispatch<React.SetStateAction<BreakpointToken[]>>;
  breakpointDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeBreakpoints: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, name: string) => void;
  uid: () => number;
}

export function BreakpointsTab({
  breakpoints, setBreakpoints, breakpointDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeBreakpoints, isDupe, trimNameOnBlur, uid,
}: BreakpointsTabProps) {
  return (
    <div>
      <TabHeader title="Breakpoint Tokens" description="Min-width based. Drag to reorder." actions={tabActions()} search={search} onSearch={setSearch} />
      <div className="col-hdr">
        {selectAllChk(breakpoints.map(b=>b.id))}
        <div className="drag-handle drag-handle--hidden">⌿</div>
        <div className="flex-1 grid-row grid-breakpoints">
        {["Prefix","Name","Min (px)","Max (px)","Range",""].map((h,i)=><div key={i} className="col-hdr-label">{h}</div>)}
        </div>
      </div>
      {breakpoints.filter(b => matchesSearch(search, b.name, b.value, b.max)).length === 0 && <div className="empty-state">{search ? "No breakpoint tokens match your filter." : "No breakpoint tokens yet. Click \"+ Add breakpoint token\" below to create one."}</div>}
      {breakpoints.filter(b => matchesSearch(search, b.name, b.value, b.max)).map(b => (
        <DraggableRow key={b.id} id={b.id} dragHandlers={breakpointDrag} checked={selected.has(b.id)} onCheck={toggleSelect}>
          <div className="grid-row grid-breakpoints">
            <span className="prefix">breakpoint /</span>
            <div><input value={b.name} onChange={e=>updateList(setBreakpoints,b.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setBreakpoints,b.id,b.name)} className={`inp inp--full${isDupe(b.name,dupeBreakpoints)?" inp--dupe":""}`} />{isDupe(b.name,dupeBreakpoints)&&<div className="dupe-warn">Duplicate name</div>}</div>
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
            <div className="prefix mono">{(b.value?">= "+b.value+"px":"0")+(b.max?" and < "+b.max+"px":"")}</div>
            <div className="btn-group"><button onClick={()=>dupInList(setBreakpoints,b.id)} className="dup-btn">⧉</button><button onClick={()=>deleteList(setBreakpoints,b.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
          </div>
        </DraggableRow>
      ))}
      <AddRowBtn onClick={()=>setBreakpoints(b=>[...b,{id:uid(),name:"new",value:"",max:""}])} label="+ Add breakpoint token" />
    </div>
  );
}
