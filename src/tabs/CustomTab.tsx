import React, { useRef } from "react";
import type { CustomCollection, Primitives, PrimGroup, DragHandlers } from "../types";
import { matchesSearch, isValidCSSIdentifier, FONT_FAMILIES } from "../defaults";
import { GROUP_DRAG_TYPE } from "../hooks";
import { TabHeader, DraggableRow, AddRowBtn, InlineLabel, PrimSelector } from "../components";

interface CustomTabProps {
  cc: CustomCollection;
  primitives: Primitives;
  primGroups: PrimGroup[];
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateCustomCollection: (id: number, field: string, val: unknown) => void;
  deleteCustomCollection: (id: number) => void;
  updateCustomItem: (collId: number, itemId: number, field: string, val: string) => void;
  deleteCustomItem: (collId: number, itemId: number) => void;
  dupCustomItem: (collId: number, itemId: number) => void;
  addCustomItem: (collId: number, group: string) => void;
  addCustomGroup: (collId: number) => void;
  renameCustomGroup: (collId: number, oldName: string, newName: string) => void;
  updateCustomGroup: (collId: number, groupName: string, field: string, val: unknown) => void;
  deleteCustomGroup: (collId: number, groupName: string) => void;
  setCustomCollections: React.Dispatch<React.SetStateAction<CustomCollection[]>>;
  setEnabledTabs: React.Dispatch<React.SetStateAction<Set<string>>>;
  setTab: (t: string) => void;
  uid: () => number;
}

export function CustomTab({
  cc, primitives, primGroups, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect,
  updateCustomCollection, deleteCustomCollection,
  updateCustomItem, deleteCustomItem, dupCustomItem, addCustomItem,
  addCustomGroup, renameCustomGroup, updateCustomGroup, deleteCustomGroup,
  setCustomCollections, setEnabledTabs, setTab, uid,
}: CustomTabProps) {
  const ccDragRef = useRef<{ dragId: number|null; overId: number|null }>({ dragId: null, overId: null });

  return (
    <div>
      <TabHeader title={cc.name} description={`Custom collection — exports as ${cc.jsonKey}.json`}
        actions={tabActions(<button onClick={() => addCustomGroup(cc.id)} disabled={!cc.locked} className="tab-add-btn" style={{opacity: cc.locked ? 1 : 0.4, cursor: cc.locked ? "pointer" : "default"}}>+ Add Group</button>)} search={search} onSearch={setSearch} />

      <div className="cc-settings">
        <label className="cc-settings__label">
          Tab Name
          <input value={cc.name} disabled={cc.locked} onChange={e => {
            const old = cc.name;
            const nv = e.target.value;
            setCustomCollections(ccs => ccs.map(c => c.id === cc.id ? { ...c, name: nv } : c));
            setEnabledTabs(prev => { const next = new Set(prev); if (next.has(old)) { next.delete(old); next.add(nv); } return next; });
            setTab(nv);
          }} className={`inp${cc.locked?" inp--locked":""}`} style={{width:120}} />
        </label>
        <label className="cc-settings__label">
          JSON Key
          <input value={cc.jsonKey} disabled={cc.locked} onChange={e => {
            const v = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "");
            updateCustomCollection(cc.id, "jsonKey", v);
          }} className={`inp inp--mono${cc.locked?" inp--locked":""}${!cc.locked&&cc.jsonKey&&!isValidCSSIdentifier(cc.jsonKey)?" inp--invalid":""}`} style={{width:120}} />
          {!cc.locked&&cc.jsonKey&&!isValidCSSIdentifier(cc.jsonKey)&&<div className="dupe-warn">Must start with a letter/underscore</div>}
        </label>
        <div className="cc-settings__actions">
          {cc.locked ? (
            cc.items.length === 0 && <button onClick={() => updateCustomCollection(cc.id, "locked", false)} className="tab-btn">Edit</button>
          ) : (
            <button onClick={() => updateCustomCollection(cc.id, "locked", true)} className="tab-add-btn">Save</button>
          )}
          <button onClick={() => deleteCustomCollection(cc.id)} className="cc-delete-btn">Delete Collection</button>
        </div>
      </div>

      {(cc.groups || []).map(g => {
        const allGroupItems = cc.items.filter(i => i.group === g.name);
        const groupItems = allGroupItems.filter(i => matchesSearch(search, g.name, i.name, i.value));
        if (search && groupItems.length === 0) return null;
        const singleGroup = cc.groups.length <= 1;
        const gLocked = g.locked !== false;
        const valueTypeSelect = <select value={g.type + (g.unit ? "|" + g.unit : "")} disabled={gLocked} onChange={e => {
          const [type, unit = ""] = e.target.value.split("|");
          updateCustomGroup(cc.id, g.name, "type", type);
          updateCustomGroup(cc.id, g.name, "unit", unit);
        }} className={`inp inp--xs${gLocked?" inp--locked":""}`} style={{width:150}}>
          <optgroup label="Unitless">
            <option value="number">Number</option>
            <option value="string">String</option>
            <option value="color">Color</option>
            <option value="fontFamily">Font Family</option>
            <option value="fontWeight">Font Weight</option>
          </optgroup>
          <optgroup label="Dimension (length)">
            <option value="dimension|px">Dimension — px</option>
            <option value="dimension|rem">Dimension — rem</option>
            <option value="dimension|em">Dimension — em</option>
            <option value="dimension|%">Dimension — %</option>
            <option value="dimension|vw">Dimension — vw</option>
            <option value="dimension|vh">Dimension — vh</option>
          </optgroup>
          <optgroup label="Duration">
            <option value="duration|ms">Duration — ms</option>
            <option value="duration|s">Duration — s</option>
          </optgroup>
          <optgroup label="Other">
            <option value="number|deg">Number — deg</option>
            <option value="cubicBezier">Cubic Bezier</option>
          </optgroup>
        </select>;
        const groupSaveEdit = gLocked ? (
          groupItems.length === 0 && <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", false)} className="tab-btn" style={{fontSize:10,padding:"4px 8px"}}>Edit</button>
        ) : (
          <button onClick={() => updateCustomGroup(cc.id, g.name, "locked", true)} className="tab-add-btn" style={{fontSize:10,padding:"4px 8px"}}>Save</button>
        );
        const dragHandlers: DragHandlers = {
          onDragStart: (id: number) => { ccDragRef.current = { dragId: id, overId: null }; },
          onDragOver: (e: React.DragEvent, id: number) => { e.preventDefault(); ccDragRef.current.overId = id; },
          onDrop: () => {
            const d = ccDragRef.current;
            const from = d.dragId, to = d.overId;
            if (from == null || to == null || from === to) return;
            setCustomCollections(ccs => ccs.map(c => {
              if (c.id !== cc.id) return c;
              const items = [...c.items];
              const fi = items.findIndex(i => i.id === from);
              const ti = items.findIndex(i => i.id === to);
              if (fi < 0 || ti < 0) return c;
              const [moved] = items.splice(fi, 1);
              items.splice(ti, 0, moved);
              return { ...c, items };
            }));
          },
          onDragEnd: () => { ccDragRef.current = { dragId: null, overId: null }; },
        };
        return (
          <div key={g.name} onDragOver={!singleGroup ? (e: React.DragEvent)=>{ if(e.dataTransfer.types.includes(GROUP_DRAG_TYPE)){e.preventDefault();e.stopPropagation();(e.currentTarget as HTMLElement).style.borderTop="2px solid var(--accent)";}} : undefined} onDragLeave={!singleGroup ? (e: React.DragEvent)=>{(e.currentTarget as HTMLElement).style.borderTop="";} : undefined} onDrop={!singleGroup ? (e: React.DragEvent)=>{(e.currentTarget as HTMLElement).style.borderTop="";const from=e.dataTransfer.getData(GROUP_DRAG_TYPE);if(!from||from===g.name)return;e.preventDefault();e.stopPropagation();setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const gs=[...c.groups];const fi=gs.findIndex(x=>x.name===from),ti=gs.findIndex(x=>x.name===g.name);if(fi<0||ti<0)return c;const[m]=gs.splice(fi,1);gs.splice(ti,0,m);return{...c,groups:gs};}));} : undefined} className="mb-28">
            {singleGroup ? (
              <div className="hdr-style" style={{justifyContent:"space-between"}}>
                <span className="col-hdr-label" style={{letterSpacing:"0.07em"}}>Value Type</span>
                {valueTypeSelect}
                {groupSaveEdit}
                <div className="flex-1" />
              </div>
            ) : (
              <div className="hdr-style">
                <div draggable onDragStart={(e: React.DragEvent)=>{e.dataTransfer.setData(GROUP_DRAG_TYPE,g.name);e.dataTransfer.effectAllowed="move";e.stopPropagation();}} className="drag-handle">⌿</div>
                <InlineLabel value={g.name} prefix={cc.jsonKey + " / "} onCommit={(n: string) => renameCustomGroup(cc.id, g.name, n)} />
                {valueTypeSelect}
                {groupSaveEdit}
                <div className="section-divider" />
                <button onClick={() => { const nn=g.name+" copy"; setCustomCollections(ccs=>ccs.map(c=>{if(c.id!==cc.id)return c;const idx=c.groups.findIndex(gr=>gr.name===g.name);const newGroups=[...c.groups];newGroups.splice(idx+1,0,{...g,name:nn,locked:g.locked});const newItems=[...c.items,...c.items.filter(i=>i.group===g.name).map(i=>({...i,id:uid(),group:nn}))];return{...c,groups:newGroups,items:newItems};})); }} className="dup-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={() => deleteCustomGroup(cc.id, g.name)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
              </div>
            )}
            {groupItems.length === 0 && <div className="empty-msg">No tokens yet.</div>}
            {groupItems.length > 0 && (
              <div>
                <div className="col-hdr">
                  {selectAllChk(groupItems.map(i=>i.id))}
                  <div className="drag-handle drag-handle--hidden">⌿</div>
                  <div className="flex-1 grid-row grid-custom">
                  {["Name","Value",""].map((h,i) => <div key={i} className="col-hdr-label">{h}</div>)}
                  </div>
                </div>
                {groupItems.map(item => (
                  <DraggableRow key={item.id} id={item.id} checked={selected.has(item.id)} onCheck={toggleSelect} dragHandlers={dragHandlers}>
                    <div className="grid-row grid-custom">
                      <input value={item.name} onChange={e => updateCustomItem(cc.id, item.id, "name", e.target.value)} onBlur={e=>{const t=e.target.value.trim();if(t!==item.name)updateCustomItem(cc.id,item.id,"name",t||"unnamed");}} className="inp inp--full" />
                      {g.type === "color" ? (
                        <PrimSelector value={item.value} primitives={primitives} primGroups={primGroups} onChange={(v: string) => updateCustomItem(cc.id, item.id, "value", v)} mode="Value" />
                      ) : g.type === "fontFamily" ? (
                        <select value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} className="inp inp--full inp--sm" style={{fontFamily:item.value}}>
                          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value} style={{fontFamily: f.value}}>{f.label}</option>)}
                          {!FONT_FAMILIES.some(f => f.value === item.value) && <option value={item.value}>{item.value}</option>}
                        </select>
                      ) : (
                        <div className="flex-row">
                          <input value={item.value} onChange={e => updateCustomItem(cc.id, item.id, "value", e.target.value)} className="inp inp--full inp--mono" />
                          {g.unit && <span className="unit">{g.unit}</span>}
                        </div>
                      )}
                      <div className="btn-group"><button onClick={() => dupCustomItem(cc.id, item.id)} className="dup-btn">⧉</button><button onClick={() => deleteCustomItem(cc.id, item.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
                    </div>
                  </DraggableRow>
                ))}
              </div>
            )}
            <AddRowBtn onClick={() => addCustomItem(cc.id, g.name)} label={`+ Add ${cc.jsonKey} token`} disabled={!cc.locked || !gLocked} />
          </div>
        );
      })}
    </div>
  );
}
