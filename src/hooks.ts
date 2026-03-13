import { useRef, useCallback } from "react";

export const GROUP_DRAG_TYPE = "application/x-group-drag";

export function useDraggable(setList: (fn: (prev: any[]) => any[]) => void) {
  const dragId = useRef<number | null>(null), overId = useRef<number | null>(null);
  const onDragStart = useCallback((id: number) => { dragId.current = id; }, []);
  const onDragOver  = useCallback((e: React.DragEvent, id: number) => { e.preventDefault(); overId.current = id; }, []);
  const onDrop = useCallback(() => {
    if (dragId.current===null||overId.current===null||dragId.current===overId.current) return;
    setList((prev: any[]) => {
      const from=prev.findIndex(i=>i.id===dragId.current), to=prev.findIndex(i=>i.id===overId.current);
      if(from===-1||to===-1) return prev;
      const next=[...prev]; const [item]=next.splice(from,1); next.splice(to,0,item); return next;
    });
    dragId.current=null; overId.current=null;
  }, [setList]);
  const onDragEnd = useCallback(() => { dragId.current=null; overId.current=null; }, []);
  return { onDragStart, onDragOver, onDrop, onDragEnd };
}

export function useGroupDrag(setList: (fn: any) => void, mode: "string"|"id" = "string") {
  const onDragStart = useCallback((e: React.DragEvent, key: string) => {
    e.dataTransfer.setData(GROUP_DRAG_TYPE, key);
    e.dataTransfer.effectAllowed = "move";
    e.stopPropagation();
  }, []);
  const makeDropZone = useCallback((targetKey: string) => ({
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes(GROUP_DRAG_TYPE)) { e.preventDefault(); e.stopPropagation(); (e.currentTarget as HTMLElement).style.borderTop = "2px solid var(--accent)"; } },
    onDragLeave: (e: React.DragEvent) => { (e.currentTarget as HTMLElement).style.borderTop = ""; },
    onDrop: (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.borderTop = "";
      const fromKey = e.dataTransfer.getData(GROUP_DRAG_TYPE);
      if (!fromKey || fromKey === targetKey) return;
      e.preventDefault(); e.stopPropagation();
      if (mode === "string") {
        setList((prev: string[]) => { const f=prev.indexOf(fromKey), t=prev.indexOf(targetKey); if(f<0||t<0)return prev; const n=[...prev]; const[m]=n.splice(f,1); n.splice(t,0,m); return n; });
      } else {
        setList((prev: any[]) => { const f=prev.findIndex((i: any)=>String(i.id)===fromKey), t=prev.findIndex((i: any)=>String(i.id)===targetKey); if(f<0||t<0)return prev; const n=[...prev]; const[m]=n.splice(f,1); n.splice(t,0,m); return n; });
      }
    },
  }), [setList, mode]);
  return { onDragStart, makeDropZone };
}
