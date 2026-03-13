import { useState, memo } from "react";
import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken, CustomCollection } from "./types";
import {
  genPrimitivesJSON, genColorsJSON, genSpacingJSON, genTypographyJSON, genTextStylesJSON, genRadiusJSON, genBorderJSON, genShadowsJSON, genZIndexJSON, genBreakpointsJSON, genCustomJSON,
  genPrimitivesCSS, genColorsCSS, genSpacingCSS, genTypographyCSS, genTextStylesCSS, genRadiusCSS, genBorderCSS, genShadowsCSS, genZIndexCSS, genBreakpointsCSS, genCustomCSS,
  genPrimitivesTW, genColorsTW, genSpacingTW, genTypographyTW, genRadiusTW, genBorderTW, genShadowsTW, genZIndexTW, genBreakpointsTW,
  dlJSON, dlText,
} from "./generators";

interface DownloadPanelProps {
  enabled: Set<string>;
  primGroups: PrimGroup[];
  primitives: Primitives;
  colors: ColorToken[];
  spacing: SpacingToken[];
  typography: Typography;
  textStyles: TextStyle[];
  radius: RadiusToken[];
  borders: BorderToken[];
  shadows: ShadowToken[];
  zindex: ZIndexToken[];
  breakpoints: BreakpointToken[];
  customCollections: CustomCollection[];
}

export const DownloadPanel = memo(function DownloadPanel({ enabled, primGroups, primitives, colors, spacing, typography, textStyles, radius, borders, shadows, zindex, breakpoints, customCollections }: DownloadPanelProps) {
  const [fmt, setFmt] = useState<"dtcg"|"css"|"tailwind">("dtcg");

  const dtcgFiles = [
    { tab:"Primitives",   label:"primitives.json",     name:"primitives.json",     gen:() => genPrimitivesJSON(primGroups,primitives)     },
    { tab:"Colors",       label:"colors-light.json",   name:"colors-light.json",   gen:() => genColorsJSON(colors,primitives,"light")     },
    { tab:"Colors",       label:"colors-dark.json",    name:"colors-dark.json",    gen:() => genColorsJSON(colors,primitives,"dark")      },
    { tab:"Spacing",      label:"spacing.json",        name:"spacing.json",        gen:() => genSpacingJSON(spacing)                      },
    { tab:"Typography",   label:"typography.json",     name:"typography.json",     gen:() => genTypographyJSON(typography)                },
    { tab:"Text Styles",  label:"text-styles.json",    name:"text-styles.json",    gen:() => genTextStylesJSON(textStyles)                },
    { tab:"Radius",       label:"radius.json",         name:"radius.json",         gen:() => genRadiusJSON(radius)                        },
    { tab:"Border",       label:"border-width.json",   name:"border-width.json",   gen:() => genBorderJSON(borders)                       },
    { tab:"Shadows",      label:"shadows.json",        name:"shadows.json",        gen:() => genShadowsJSON(shadows)                      },
    { tab:"Z-Index",      label:"z-index.json",        name:"z-index.json",        gen:() => genZIndexJSON(zindex)                        },
    { tab:"Breakpoints",  label:"breakpoints.json",    name:"breakpoints.json",    gen:() => genBreakpointsJSON(breakpoints)              },
    ...customCollections.map(c => ({ tab:c.name, label:c.jsonKey+".json", name:c.jsonKey+".json", gen:()=>genCustomJSON(c.items,c.groups) })),
  ];
  const cssFiles = [
    { tab:"Primitives",   label:"primitives.css",      name:"primitives.css",      gen:() => genPrimitivesCSS(primGroups,primitives)      },
    { tab:"Colors",       label:"colors-light.css",    name:"colors-light.css",    gen:() => genColorsCSS(colors,primitives,"light")      },
    { tab:"Colors",       label:"colors-dark.css",     name:"colors-dark.css",     gen:() => genColorsCSS(colors,primitives,"dark")       },
    { tab:"Spacing",      label:"spacing.css",         name:"spacing.css",         gen:() => genSpacingCSS(spacing)                       },
    { tab:"Typography",   label:"typography.css",      name:"typography.css",      gen:() => genTypographyCSS(typography)                 },
    { tab:"Text Styles",  label:"text-styles.css",     name:"text-styles.css",     gen:() => genTextStylesCSS(textStyles)                 },
    { tab:"Radius",       label:"radius.css",          name:"radius.css",          gen:() => genRadiusCSS(radius)                         },
    { tab:"Border",       label:"border-width.css",    name:"border-width.css",    gen:() => genBorderCSS(borders)                        },
    { tab:"Shadows",      label:"shadows.css",         name:"shadows.css",         gen:() => genShadowsCSS(shadows)                       },
    { tab:"Z-Index",      label:"z-index.css",         name:"z-index.css",         gen:() => genZIndexCSS(zindex)                         },
    { tab:"Breakpoints",  label:"breakpoints.css",     name:"breakpoints.css",     gen:() => genBreakpointsCSS(breakpoints)               },
    ...customCollections.map(c => ({ tab:c.name, label:c.jsonKey+".css", name:c.jsonKey+".css", gen:()=>genCustomCSS(c.items,c.groups,c.jsonKey) })),
  ];
  const twFiles = [
    { tab:"Primitives",   label:"primitives.tw.json",  name:"primitives.tw.json",  gen:() => genPrimitivesTW(primGroups,primitives)       },
    { tab:"Colors",       label:"colors-light.tw.json",name:"colors-light.tw.json",gen:() => genColorsTW(colors,primitives,"light")       },
    { tab:"Colors",       label:"colors-dark.tw.json", name:"colors-dark.tw.json", gen:() => genColorsTW(colors,primitives,"dark")        },
    { tab:"Spacing",      label:"spacing.tw.json",     name:"spacing.tw.json",     gen:() => genSpacingTW(spacing)                        },
    { tab:"Typography",   label:"typography.tw.json",  name:"typography.tw.json",  gen:() => genTypographyTW(typography)                  },
    { tab:"Radius",       label:"radius.tw.json",      name:"radius.tw.json",      gen:() => genRadiusTW(radius)                          },
    { tab:"Border",       label:"border.tw.json",      name:"border.tw.json",      gen:() => genBorderTW(borders)                         },
    { tab:"Shadows",      label:"shadows.tw.json",     name:"shadows.tw.json",     gen:() => genShadowsTW(shadows)                        },
    { tab:"Z-Index",      label:"z-index.tw.json",     name:"z-index.tw.json",     gen:() => genZIndexTW(zindex)                          },
    { tab:"Breakpoints",  label:"screens.tw.json",     name:"screens.tw.json",     gen:() => genBreakpointsTW(breakpoints)                },
  ];

  const allFiles = (fmt === "dtcg" ? dtcgFiles : fmt === "css" ? cssFiles : twFiles).filter(f => enabled.has(f.tab));
  const [checked, setChecked] = useState(() => new Set(allFiles.map(f => f.name)));
  const allChecked = allFiles.length > 0 && checked.size === allFiles.length;
  const toggle = (name: string) => setChecked(prev => { const next=new Set(prev); next.has(name)?next.delete(name):next.add(name); return next; });
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(allFiles.map(f => f.name)));
  const downloadSelected = () => allFiles.filter(f => checked.has(f.name)).forEach(f => {
    const content = f.gen();
    f.name.endsWith(".css") ? dlText(content, f.name) : dlJSON(content, f.name);
  });

  return (
    <div className="dl-panel">
      {fmt === "dtcg" && <div className="dl-panel__info">
        <b style={{color:"var(--text-tertiary)"}}>How to import into Figma:</b><br />
        1. Open the Local Variables panel<br />
        2. Use the plugin's <b style={{color:"var(--accent-highlight)"}}>Import Variables</b> tab<br />
        3. For <b style={{color:"var(--accent-highlight)"}}>Text Styles</b>: ensure fonts are installed locally
      </div>}
      <div className="dl-panel__fmt-row">
        <button onClick={()=>{setFmt("dtcg");setChecked(new Set());}} className={`dl-panel__fmt-btn ${fmt==="dtcg"?"dl-panel__fmt-btn--on":"dl-panel__fmt-btn--off"}`}>DTCG JSON</button>
        <button onClick={()=>{setFmt("css");setChecked(new Set());}} className={`dl-panel__fmt-btn ${fmt==="css"?"dl-panel__fmt-btn--on":"dl-panel__fmt-btn--off"}`}>CSS Variables</button>
        <button onClick={()=>{setFmt("tailwind");setChecked(new Set());}} className={`dl-panel__fmt-btn ${fmt==="tailwind"?"dl-panel__fmt-btn--on":"dl-panel__fmt-btn--off"}`}>Tailwind</button>
      </div>
      <div className="dl-panel__select-all">
        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="chk" />
        <span style={{fontSize:12,color:"var(--text-tertiary)",flex:1}}>{allChecked ? "Deselect all" : "Select all"}</span>
        <span className="text-xs text-secondary">{checked.size} / {allFiles.length} selected</span>
      </div>
      <div className="dl-panel__list">
        {allFiles.map(f => (
          <label key={f.name} className={`dl-panel__file${checked.has(f.name)?" dl-panel__file--checked":""}`}>
            <input type="checkbox" checked={checked.has(f.name)} onChange={() => toggle(f.name)} className="chk" />
            <span className={`dl-panel__file-name ${checked.has(f.name)?"dl-panel__file-name--on":"dl-panel__file-name--off"}`}>{f.label}</span>
            <span className="dl-panel__file-tab">{f.tab}</span>
          </label>
        ))}
      </div>
      <button onClick={downloadSelected} disabled={checked.size===0} className={`dl-panel__dl-btn ${checked.size===0?"dl-panel__dl-btn--off":"dl-panel__dl-btn--on"}`}>
        ↓ Download {checked.size} file{checked.size!==1?"s":""}
      </button>
    </div>
  );
});
