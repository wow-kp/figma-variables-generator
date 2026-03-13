import { describe, it, expect } from "vitest";
import {
  resolveColor, getPrimOptions,
  genPrimitivesJSON, genColorsJSON, genSpacingJSON, genTypographyJSON,
  genTextStylesJSON, genRadiusJSON, genBorderJSON, genShadowsJSON,
  genZIndexJSON, genBreakpointsJSON, genCustomJSON,
  genSpacingCSS, genRadiusCSS, genBorderCSS, genShadowsCSS, genZIndexCSS,
  genSpacingTW, genRadiusTW, genBorderTW, genShadowsTW, genZIndexTW, genBreakpointsTW,
} from "./generators";
import {
  normalizeHex, isValidCSSIdentifier, sanitizeNumberInput,
  findDuplicateNames, findDuplicateNamesInGroups,
} from "./defaults";
import type { PrimGroup, Primitives, ColorToken, SpacingToken, Typography, TextStyle, RadiusToken, BorderToken, ShadowToken, ZIndexToken, BreakpointToken } from "./types";

// ── Test data ────────────────────────────────────────────────────────────────

const primGroups: PrimGroup[] = [
  { id: 1, key: "blue", label: "Blue", shades: ["500", "600"] },
];
const primitives: Primitives = {
  blue: { "500": "#3B82F6", "600": "#2563EB" },
  base: { white: "#FFFFFF", black: "#000000" },
};
const colors: ColorToken[] = [
  { id: 1, group: "brand", name: "primary", light: "{primitives.blue.600}", dark: "{primitives.blue.500}", description: "Primary" },
];
const spacing: SpacingToken[] = [
  { id: 1, name: "1", value: "4" },
  { id: 2, name: "2", value: "8" },
];
const typography: Typography = {
  families: [{ id: 1, name: "sans", value: "Inter, sans-serif" }],
  sizes: [{ id: 2, name: "base", value: "16" }],
  weights: [{ id: 3, name: "bold", value: "700" }],
  lineHeights: [{ id: 4, name: "normal", value: "1.5" }],
};
const textStyles: TextStyle[] = [
  { id: 1, group: "body", name: "default", fontFamily: "Inter, sans-serif", fontSize: "16", fontWeight: "400", lineHeight: "1.5", letterSpacing: "0", paragraphSpacing: "0", textDecoration: "NONE" },
];
const radius: RadiusToken[] = [{ id: 1, name: "md", value: "6" }];
const borders: BorderToken[] = [{ id: 1, name: "thin", value: "1" }];
const shadows: ShadowToken[] = [{ id: 1, name: "sm", value: "0px 2px 6px 0px rgba(0,0,0,0.20)" }];
const zindex: ZIndexToken[] = [{ id: 1, name: "modal", value: "400" }];
const breakpoints: BreakpointToken[] = [{ id: 1, name: "sm", value: "567", max: "767" }];

// ── Color helpers ────────────────────────────────────────────────────────────

describe("resolveColor", () => {
  it("resolves primitive references", () => {
    expect(resolveColor("{primitives.blue.600}", primitives)).toBe("#2563EB");
    expect(resolveColor("{primitives.base.white}", primitives)).toBe("#FFFFFF");
  });
  it("returns raw value for non-references", () => {
    expect(resolveColor("#ff0000", primitives)).toBe("#ff0000");
    expect(resolveColor("rgba(0,0,0,0.5)", primitives)).toBe("rgba(0,0,0,0.5)");
  });
  it("returns fallback for missing refs", () => {
    expect(resolveColor("{primitives.nope.999}", primitives)).toBe("#000000");
    expect(resolveColor("", primitives)).toBe("#000000");
  });
});

describe("getPrimOptions", () => {
  it("returns options for all shades + base + custom", () => {
    const opts = getPrimOptions(primitives, primGroups);
    expect(opts.length).toBe(5); // 2 shades + white + black + custom
    expect(opts[0].ref).toBe("{primitives.blue.500}");
    expect(opts[0].hex).toBe("#3B82F6");
    expect(opts.find(o => o.ref === "custom")).toBeTruthy();
  });
});

// ── DTCG JSON generators ─────────────────────────────────────────────────────

describe("genPrimitivesJSON", () => {
  it("produces valid DTCG JSON with $type and $value", () => {
    const json = JSON.parse(genPrimitivesJSON(primGroups, primitives));
    expect(json.blue["500"].$type).toBe("color");
    expect(json.blue["500"].$value).toHaveProperty("colorSpace", "srgb");
    expect(json.blue["500"].$value.components).toHaveLength(3);
    expect(json.base.white.$type).toBe("color");
  });
});

describe("genColorsJSON", () => {
  it("resolves light mode colors", () => {
    const json = JSON.parse(genColorsJSON(colors, primitives, "light"));
    expect(json.brand.primary.$type).toBe("color");
    expect(json.brand.primary.$value.hex).toBe("#2563eb");
  });
  it("resolves dark mode colors", () => {
    const json = JSON.parse(genColorsJSON(colors, primitives, "dark"));
    expect(json.brand.primary.$value.hex).toBe("#3b82f6");
  });
});

describe("genSpacingJSON", () => {
  it("produces dimension tokens with px unit", () => {
    const json = JSON.parse(genSpacingJSON(spacing));
    expect(json["1"].$type).toBe("dimension");
    expect(json["1"].$value).toEqual({ value: 4, unit: "px" });
    expect(json["2"].$value.value).toBe(8);
  });
});

describe("genTypographyJSON", () => {
  it("produces all four categories", () => {
    const json = JSON.parse(genTypographyJSON(typography));
    expect(json.family.sans.$type).toBe("fontFamily");
    expect(json.family.sans.$value).toBe("Inter, sans-serif");
    expect(json.size.base.$value).toEqual({ value: 16, unit: "px" });
    expect(json.weight.bold.$value).toBe(700);
    expect(json["line-height"].normal.$value).toBe(1.5);
  });
});

describe("genTextStylesJSON", () => {
  it("produces grouped textStyle tokens", () => {
    const json = JSON.parse(genTextStylesJSON(textStyles));
    expect(json.body.default.$type).toBe("textStyle");
    expect(json.body.default.$value.fontFamily).toBe("Inter, sans-serif");
    expect(json.body.default.$value.fontSize).toEqual({ value: 16, unit: "px" });
    expect(json.body.default.$value.fontWeight).toBe(400);
    expect(json.body.default.$value.textDecoration).toBe("NONE");
  });
});

describe("genRadiusJSON", () => {
  it("produces dimension tokens", () => {
    const json = JSON.parse(genRadiusJSON(radius));
    expect(json.md.$value).toEqual({ value: 6, unit: "px" });
  });
});

describe("genBorderJSON", () => {
  it("produces dimension tokens", () => {
    const json = JSON.parse(genBorderJSON(borders));
    expect(json.thin.$value).toEqual({ value: 1, unit: "px" });
  });
});

describe("genShadowsJSON", () => {
  it("preserves shadow string value", () => {
    const json = JSON.parse(genShadowsJSON(shadows));
    expect(json.sm.$type).toBe("string");
    expect(json.sm.$value).toBe("0px 2px 6px 0px rgba(0,0,0,0.20)");
  });
});

describe("genZIndexJSON", () => {
  it("produces number tokens", () => {
    const json = JSON.parse(genZIndexJSON(zindex));
    expect(json.modal.$type).toBe("number");
    expect(json.modal.$value).toBe(400);
  });
});

describe("genBreakpointsJSON", () => {
  it("produces number tokens from min value", () => {
    const json = JSON.parse(genBreakpointsJSON(breakpoints));
    expect(json.sm.$value).toBe(567);
  });
});

describe("genCustomJSON", () => {
  it("flat output for single group", () => {
    const items = [{ id: 1, name: "gap", group: "default", value: "16" }];
    const groups = [{ name: "default", type: "dimension", unit: "px", locked: true }];
    const json = JSON.parse(genCustomJSON(items, groups));
    expect(json.gap.$type).toBe("dimension");
    expect(json.gap.$value).toEqual({ value: 16, unit: "px" });
  });
  it("nested output for multiple groups", () => {
    const items = [{ id: 1, name: "gap", group: "layout", value: "16" }];
    const groups = [
      { name: "layout", type: "dimension", unit: "px", locked: true },
      { name: "other", type: "string", unit: "", locked: true },
    ];
    const json = JSON.parse(genCustomJSON(items, groups));
    expect(json.layout.gap.$value).toEqual({ value: 16, unit: "px" });
  });
});

// ── CSS generators (spot checks) ─────────────────────────────────────────────

describe("CSS generators", () => {
  it("genSpacingCSS contains custom properties and utility classes", () => {
    const css = genSpacingCSS(spacing);
    expect(css).toContain("--spacing-1: 4px");
    expect(css).toContain(".p-1 { padding: var(--spacing-1)");
    expect(css).toContain(".gap-2 { gap: var(--spacing-2)");
  });
  it("genRadiusCSS produces correct output", () => {
    const css = genRadiusCSS(radius);
    expect(css).toContain("--radius-md: 6px");
    expect(css).toContain(".rounded-md");
  });
  it("genBorderCSS produces correct output", () => {
    const css = genBorderCSS(borders);
    expect(css).toContain("--border-width-thin: 1px");
  });
  it("genShadowsCSS preserves shadow values", () => {
    const css = genShadowsCSS(shadows);
    expect(css).toContain("--shadow-sm: 0px 2px 6px");
  });
  it("genZIndexCSS produces correct output", () => {
    const css = genZIndexCSS(zindex);
    expect(css).toContain("--z-index-modal: 400");
    expect(css).toContain(".z-modal");
  });
});

// ── Tailwind generators (spot checks) ────────────────────────────────────────

describe("Tailwind generators", () => {
  it("genSpacingTW wraps in theme.extend.spacing", () => {
    const json = JSON.parse(genSpacingTW(spacing));
    expect(json.theme.extend.spacing["1"]).toBe("4px");
  });
  it("genRadiusTW wraps in borderRadius", () => {
    const json = JSON.parse(genRadiusTW(radius));
    expect(json.theme.extend.borderRadius.md).toBe("6px");
  });
  it("genBorderTW wraps in borderWidth", () => {
    const json = JSON.parse(genBorderTW(borders));
    expect(json.theme.extend.borderWidth.thin).toBe("1px");
  });
  it("genShadowsTW wraps in boxShadow", () => {
    const json = JSON.parse(genShadowsTW(shadows));
    expect(json.theme.extend.boxShadow.sm).toBe("0px 2px 6px 0px rgba(0,0,0,0.20)");
  });
  it("genZIndexTW wraps in zIndex", () => {
    const json = JSON.parse(genZIndexTW(zindex));
    expect(json.theme.extend.zIndex.modal).toBe("400");
  });
  it("genBreakpointsTW wraps in screens", () => {
    const json = JSON.parse(genBreakpointsTW(breakpoints));
    expect(json.theme.extend.screens.sm).toBe("567px");
  });
});

// ── Round-trip: JSON export → re-parse → re-export produces same output ──────

describe("round-trip consistency", () => {
  it("spacing round-trips", () => {
    const json1 = genSpacingJSON(spacing);
    const parsed = JSON.parse(json1);
    const reconstructed: SpacingToken[] = Object.entries(parsed).map(([name, t]: [string, any], i) => ({
      id: i, name, value: String(t.$value.value),
    }));
    expect(genSpacingJSON(reconstructed)).toBe(json1);
  });
  it("radius round-trips", () => {
    const json1 = genRadiusJSON(radius);
    const parsed = JSON.parse(json1);
    const reconstructed: RadiusToken[] = Object.entries(parsed).map(([name, t]: [string, any], i) => ({
      id: i, name, value: String(t.$value.value),
    }));
    expect(genRadiusJSON(reconstructed)).toBe(json1);
  });
  it("borders round-trips", () => {
    const json1 = genBorderJSON(borders);
    const parsed = JSON.parse(json1);
    const reconstructed: BorderToken[] = Object.entries(parsed).map(([name, t]: [string, any], i) => ({
      id: i, name, value: String(t.$value.value),
    }));
    expect(genBorderJSON(reconstructed)).toBe(json1);
  });
  it("shadows round-trips", () => {
    const json1 = genShadowsJSON(shadows);
    const parsed = JSON.parse(json1);
    const reconstructed: ShadowToken[] = Object.entries(parsed).map(([name, t]: [string, any], i) => ({
      id: i, name, value: t.$value,
    }));
    expect(genShadowsJSON(reconstructed)).toBe(json1);
  });
  it("zindex round-trips", () => {
    const json1 = genZIndexJSON(zindex);
    const parsed = JSON.parse(json1);
    const reconstructed: ZIndexToken[] = Object.entries(parsed).map(([name, t]: [string, any], i) => ({
      id: i, name, value: String(t.$value),
    }));
    expect(genZIndexJSON(reconstructed)).toBe(json1);
  });
});

// ── Validation helpers ───────────────────────────────────────────────────────

describe("normalizeHex", () => {
  it("expands 3-char shorthand", () => {
    expect(normalizeHex("fff")).toBe("#ffffff");
    expect(normalizeHex("F0A")).toBe("#FF00AA");
  });
  it("expands 4-char shorthand with alpha", () => {
    expect(normalizeHex("f0af")).toBe("#ff00aaff");
  });
  it("adds # to 6-char hex", () => {
    expect(normalizeHex("3B82F6")).toBe("#3B82F6");
  });
  it("preserves already-valid hex", () => {
    expect(normalizeHex("#3B82F6")).toBe("#3B82F6");
  });
  it("passes through rgb/hsl/reference values", () => {
    expect(normalizeHex("rgb(255,0,0)")).toBe("rgb(255,0,0)");
    expect(normalizeHex("hsl(0,100%,50%)")).toBe("hsl(0,100%,50%)");
    expect(normalizeHex("{primitives.blue.500}")).toBe("{primitives.blue.500}");
  });
  it("handles empty string", () => {
    expect(normalizeHex("")).toBe("");
    expect(normalizeHex("  ")).toBe("");
  });
});

describe("isValidCSSIdentifier", () => {
  it("accepts valid identifiers", () => {
    expect(isValidCSSIdentifier("colors")).toBe(true);
    expect(isValidCSSIdentifier("_private")).toBe(true);
    expect(isValidCSSIdentifier("my-var")).toBe(true);
    expect(isValidCSSIdentifier("a1")).toBe(true);
  });
  it("rejects invalid identifiers", () => {
    expect(isValidCSSIdentifier("123")).toBe(false);
    expect(isValidCSSIdentifier("my var")).toBe(false);
    expect(isValidCSSIdentifier("-start")).toBe(false);
    expect(isValidCSSIdentifier("")).toBe(false);
  });
});

describe("sanitizeNumberInput", () => {
  it("passes through valid numbers", () => {
    expect(sanitizeNumberInput("42", "0")).toBe("42");
    expect(sanitizeNumberInput("-5", "0")).toBe("-5");
    expect(sanitizeNumberInput("3.14", "0")).toBe("3.14");
  });
  it("allows empty and minus sign", () => {
    expect(sanitizeNumberInput("", "10")).toBe("");
    expect(sanitizeNumberInput("-", "10")).toBe("-");
  });
  it("rejects NaN, returns prev", () => {
    expect(sanitizeNumberInput("abc", "10")).toBe("10");
    expect(sanitizeNumberInput("12px", "10")).toBe("10");
  });
  it("clamps to min/max", () => {
    expect(sanitizeNumberInput("-5", "0", 0)).toBe("0");
    expect(sanitizeNumberInput("999", "0", 0, 100)).toBe("100");
  });
});

describe("findDuplicateNames", () => {
  it("finds duplicates (case-insensitive)", () => {
    const items = [{ name: "foo" }, { name: "bar" }, { name: "Foo" }];
    expect(findDuplicateNames(items).has("foo")).toBe(true);
    expect(findDuplicateNames(items).has("bar")).toBe(false);
  });
  it("returns empty set for no duplicates", () => {
    expect(findDuplicateNames([{ name: "a" }, { name: "b" }]).size).toBe(0);
  });
});

describe("findDuplicateNamesInGroups", () => {
  it("finds duplicates within same group only", () => {
    const items = [
      { name: "primary", group: "a" },
      { name: "primary", group: "a" },
      { name: "primary", group: "b" },
    ];
    const dupes = findDuplicateNamesInGroups(items);
    expect(dupes.has("primary")).toBe(true);
  });
  it("no duplicates across different groups", () => {
    const items = [
      { name: "primary", group: "a" },
      { name: "primary", group: "b" },
    ];
    expect(findDuplicateNamesInGroups(items).size).toBe(0);
  });
});
