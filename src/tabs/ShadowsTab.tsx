import React from "react";
import type { ShadowToken, DragHandlers } from "../types";
import { matchesSearch } from "../defaults";
import { TabHeader, ShadowRow, AddRowBtn } from "../components";

interface ShadowsTabProps {
  shadows: ShadowToken[];
  setShadows: React.Dispatch<React.SetStateAction<ShadowToken[]>>;
  shadowDrag: DragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateList: <T extends { id: number }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, key: string, value: string) => void;
  deleteList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupInList: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number) => void;
  dupeShadows: Set<string>;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  uid: () => number;
}

export function ShadowsTab({
  shadows, setShadows, shadowDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect, updateList, deleteList, dupInList,
  dupeShadows, isDupe, uid,
}: ShadowsTabProps) {
  return (
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
  );
}
