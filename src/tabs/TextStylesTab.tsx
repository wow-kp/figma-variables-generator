import React from "react";
import type { TextStyle, DragHandlers, GroupDragHandlers } from "../types";
import { matchesSearch, TS_DECORATION_OPTIONS, FONT_FAMILIES } from "../defaults";
import { TabHeader, DraggableRow, AddRowBtn, InlineLabel, TextPreview } from "../components";

interface TextStylesTabProps {
  textStyles: TextStyle[];
  setTextStyles: React.Dispatch<React.SetStateAction<TextStyle[]>>;
  tsGroups: string[];
  setTsGroups: React.Dispatch<React.SetStateAction<string[]>>;
  groupedTextStyles: Record<string, TextStyle[]>;
  textStylesDrag: DragHandlers;
  tsGroupDrag: GroupDragHandlers;
  search: string;
  setSearch: (v: string) => void;
  tabActions: (extra?: React.ReactNode) => React.ReactNode;
  selectAllChk: (ids: number[]) => React.ReactNode;
  selected: Set<number>;
  toggleSelect: (id: number) => void;
  updateTextStyle: (id: number, field: string, val: string) => void;
  dupTextStyle: (id: number) => void;
  deleteTextStyle: (id: number) => void;
  addTextStyle: (group: string) => void;
  addTsGroup: () => void;
  renameTsGroup: (o: string, n: string) => void;
  deleteTsGroup: (g: string) => void;
  isDupe: (name: string, dupes: Set<string>) => boolean;
  dupeTextStyles: Set<string>;
  trimNameOnBlur: <T extends { id: number; name: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: number, current: string) => void;
  uid: () => number;
}

export function TextStylesTab({
  textStyles, setTextStyles, tsGroups, setTsGroups, groupedTextStyles,
  textStylesDrag, tsGroupDrag, search, setSearch, tabActions,
  selectAllChk, selected, toggleSelect,
  updateTextStyle, dupTextStyle, deleteTextStyle, addTextStyle,
  addTsGroup, renameTsGroup, deleteTsGroup,
  isDupe, dupeTextStyles, trimNameOnBlur, uid,
}: TextStylesTabProps) {
  return (
    <div>
      <TabHeader title="Text Styles"
        description="Composite typography styles — each defines a full font stack. Exports as text-styles.json for the plugin importer."
        actions={tabActions(<button onClick={addTsGroup} className="tab-add-btn">+ Add Group</button>)} search={search} onSearch={setSearch} />

      {tsGroups.map(g => {
        const filteredTs = (groupedTextStyles[g]||[]).filter(s => matchesSearch(search, g, s.name, s.fontFamily, s.fontSize, s.fontWeight));
        if (search && filteredTs.length === 0) return null;
        return (
        <div key={g} {...tsGroupDrag.makeDropZone(g)} className="mb-32">
          <div className="hdr-style">
            <div draggable onDragStart={e=>tsGroupDrag.onDragStart(e,g)} className="drag-handle">⌿</div>
            <InlineLabel value={g} prefix="text / " onCommit={(n: string)=>renameTsGroup(g,n)} />
            <div className="section-divider" />
            <button onClick={()=>{const nn=g+" copy";setTsGroups(gs=>{const idx=gs.indexOf(g);const next=[...gs];next.splice(idx+1,0,nn);return next;});setTextStyles(ts=>[...ts,...ts.filter(s=>s.group===g).map(s=>({...s,id:uid(),group:nn,name:s.name+" copy"}))]);}} className="dup-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>⧉ duplicate group</button><button onClick={()=>deleteTsGroup(g)} className="del-btn" style={{fontSize:12,padding:"0 4px",marginLeft:4}}>x delete group</button>
          </div>

          <div className="col-hdr">
            {selectAllChk(filteredTs.map(s=>s.id))}
            <div className="drag-handle drag-handle--hidden">⌿</div>
            <div className="flex-1 grid-row grid-ts">
            {["Name","Font Family","Size (px)","Weight","Line Height (em)","Letter Spacing (%)","Paragraph Spacing (px)","Decoration","Preview",""].map((h,i)=><div key={i} className="col-hdr-label col-hdr-label--nowrap">{h}</div>)}
            </div>
          </div>

          {filteredTs.map(s => (
            <DraggableRow key={s.id} id={s.id} dragHandlers={textStylesDrag} checked={selected.has(s.id)} onCheck={toggleSelect}>
              <div className="grid-row grid-ts">
                <div><input value={s.name} onChange={e=>updateTextStyle(s.id,"name",e.target.value)} onBlur={()=>trimNameOnBlur(setTextStyles,s.id,s.name)} className={`inp inp--full${isDupe(s.name,dupeTextStyles)?" inp--dupe":""}`} />{isDupe(s.name,dupeTextStyles)&&<div className="dupe-warn">Duplicate name</div>}</div>
                <select value={s.fontFamily} onChange={e=>updateTextStyle(s.id,"fontFamily",e.target.value)} className="inp inp--full inp--sm" style={{fontFamily:s.fontFamily}}>
                  {FONT_FAMILIES.map(f=><option key={f.value} value={f.value} style={{fontFamily:f.value}}>{f.label}</option>)}
                  {!FONT_FAMILIES.some(f=>f.value===s.fontFamily) && <option value={s.fontFamily}>{s.fontFamily}</option>}
                </select>
                <div className="flex-row"><input value={s.fontSize} onChange={e=>updateTextStyle(s.id,"fontSize",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                <input value={s.fontWeight} onChange={e=>updateTextStyle(s.id,"fontWeight",e.target.value)} className="inp inp--full inp--mono inp--sm" />
                <input value={s.lineHeight} onChange={e=>updateTextStyle(s.id,"lineHeight",e.target.value)} className="inp inp--full inp--mono inp--sm" />
                <div className="flex-row"><input value={s.letterSpacing} onChange={e=>updateTextStyle(s.id,"letterSpacing",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                <div className="flex-row"><input value={s.paragraphSpacing} onChange={e=>updateTextStyle(s.id,"paragraphSpacing",e.target.value)} className="inp inp--full inp--mono inp--sm" /></div>
                <select value={s.textDecoration} onChange={e=>updateTextStyle(s.id,"textDecoration",e.target.value)} className="inp inp--full inp--sm">
                  {TS_DECORATION_OPTIONS.map(d=><option key={d} value={d}>{d.charAt(0)+d.slice(1).toLowerCase()}</option>)}
                </select>
                <TextPreview style={s} />
                <div className="btn-group"><button onClick={()=>dupTextStyle(s.id)} className="dup-btn">⧉</button><button onClick={()=>deleteTextStyle(s.id)} className="del-btn" style={{fontSize:18}}>x</button></div>
              </div>
            </DraggableRow>
          ))}

          <AddRowBtn onClick={()=>addTextStyle(g)} label={"+ Add style to "+g} />
        </div>
        );
      })}

      {tsGroups.length === 0 && <div className="empty-msg empty-msg--centered">No groups yet. Click "+ Add Group" to start.</div>}
    </div>
  );
}
