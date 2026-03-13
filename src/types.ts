export interface PrimGroup {
  id: number;
  key: string;
  label: string;
  shades: string[];
}

export type Primitives = Record<string, Record<string, string>>;

export interface ColorToken {
  id: number;
  group: string;
  name: string;
  light: string;
  dark: string;
  description: string;
}

export interface SpacingToken {
  id: number;
  name: string;
  value: string;
}

export interface TypographyToken {
  id: number;
  name: string;
  value: string;
}

export interface Typography {
  families: TypographyToken[];
  sizes: TypographyToken[];
  weights: TypographyToken[];
  lineHeights: TypographyToken[];
}

export interface TextStyle {
  id: number;
  group: string;
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  paragraphSpacing: string;
  textDecoration: string;
}

export interface RadiusToken {
  id: number;
  name: string;
  value: string;
}

export interface BorderToken {
  id: number;
  name: string;
  value: string;
}

export interface ShadowToken {
  id: number;
  name: string;
  value: string;
}

export interface ZIndexToken {
  id: number;
  name: string;
  value: string;
}

export interface BreakpointToken {
  id: number;
  name: string;
  value: string;
  max: string;
}

export interface CustomGroup {
  name: string;
  type: string;
  unit: string;
  locked: boolean;
}

export interface CustomItem {
  id: number;
  name: string;
  group: string;
  value: string;
}

export interface CustomCollection {
  id: number;
  name: string;
  jsonKey: string;
  items: CustomItem[];
  groups: CustomGroup[];
  locked: boolean;
}

export interface FontFamily {
  label: string;
  value: string;
}

export interface PrimOption {
  ref: string;
  hex: string;
  label: string;
}

export interface DragHandlers {
  onDragStart: (id: number) => void;
  onDragOver: (e: React.DragEvent, id: number) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export interface GroupDragHandlers {
  onDragStart: (e: React.DragEvent, key: string) => void;
  makeDropZone: (targetKey: string) => {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}
