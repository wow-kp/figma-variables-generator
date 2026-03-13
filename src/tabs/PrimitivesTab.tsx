import React from "react";
import type { PrimGroup, Primitives, GroupDragHandlers } from "../types";
import { matchesSearch, normalizeHex } from "../defaults";
import { TabHeader, InlineLabel } from "../components";

export interface PrimitivesTabProps {
  primGroups: PrimGroup[];
  setPrimitives: React.Dispatch<React.SetStateAction<Primitives>>;
  primitives: Primitives;
  primGroupDrag: GroupDragHandlers;
  renamePrimGroup: (oldKey: string, newLabel: string) => void;
  deletePrimGroup: (key: string) => void;
  addPrimGroup: () => void;
  addShade: (gk: string) => void;
  removeShade: (gk: string, s: string) => void;
  renameShade: (gk: string, os: string, ns: string) => void;
  search: string;
  setSearch: (s: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
}

export function PrimitivesTab({
  primGroups, setPrimitives, primitives,
  primGroupDrag,
  renamePrimGroup, deletePrimGroup, addPrimGroup, addShade, removeShade, renameShade,
  search, setSearch, tabActions,
}: PrimitivesTabProps) {
  return (
    <div>
      <TabHeader title="Primitive Colors" description="Raw palette. Click a name to rename. Never apply directly to layers."
        actions={tabActions(<button onClick={addPrimGroup} className="tab-add-btn">+ Add Palette</button>)} search={search} onSearch={setSearch} />
      {primGroups.filter(g => matchesSearch(search, g.label, g.key, ...g.shades)).map(g => (
        <div key={g.id} {...primGroupDrag.makeDropZone(String(g.id))} className="mb-32">
          <div className="hdr-style"><div draggable onDragStart={e=>primGroupDrag.onDragStart(e,String(g.id))} className="drag-handle">⌿</div><InlineLabel value={g.label} prefix="primitives / " onCommit={(nl: string)=>renamePrimGroup(g.key,nl)} /><div className="section-divider" /><button onClick={()=>deletePrimGroup(g.key)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete palette</button></div>
          <div className="prim-shades">
            {g.shades.map(shade => (
              <div key={shade} className="prim-shade">
                <div className="prim-swatch-wrap">
                  <div className="prim-swatch" style={{background:primitives[g.key]?.[shade]||"#808080"}} />
                  <input type="color" value={primitives[g.key]?.[shade]||"#808080"} onChange={e=>setPrimitives(p=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} className="prim-color-input" />
                </div>
                <InlineLabel value={shade} onCommit={(ns: string)=>renameShade(g.key,shade,ns)} style={{fontSize:11,color:"var(--text-secondary)",textAlign:"center"}} />
                <input value={primitives[g.key]?.[shade]||""} onChange={e=>setPrimitives(p=>({...p,[g.key]:{...p[g.key],[shade]:e.target.value}}))} onBlur={e=>{const n=normalizeHex(e.target.value);if(n!==e.target.value)setPrimitives(p=>({...p,[g.key]:{...p[g.key],[shade]:n}}));}} className="prim-hex" />
                <button onClick={()=>removeShade(g.key,shade)} className="del-btn" style={{fontSize:11,padding:0,lineHeight:1}}>x</button>
              </div>
            ))}
            <div style={{display:"flex",alignItems:"center",height:56}}><button onClick={()=>addShade(g.key)} className="prim-add-shade">+</button></div>
          </div>
        </div>
      ))}
      <div className="mb-28">
        <div className="hdr-style"><span>primitives / Base</span><div className="section-divider" /></div>
        <div style={{display:"flex",gap:12}}>
          {["white","black"].map(k => (
            <div key={k} className="prim-shade">
              <div className="prim-swatch-wrap">
                <div className="prim-swatch" style={{background:primitives.base?.[k]||"#000"}} />
                <input type="color" value={primitives.base?.[k]||"#000000"} onChange={e=>setPrimitives(p=>({...p,base:{...p.base,[k]:e.target.value}}))} className="prim-color-input" />
              </div>
              <div className="text-xs text-secondary">{k}</div>
              <input value={primitives.base?.[k]||""} onChange={e=>setPrimitives(p=>({...p,base:{...p.base,[k]:e.target.value}}))} onBlur={e=>{const n=normalizeHex(e.target.value);if(n!==e.target.value)setPrimitives(p=>({...p,base:{...p.base,[k]:n}}));}} className="prim-hex" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
