import { readFile } from "node:fs/promises";
import { join } from "node:path";

const dir = (pkg: string) => join(process.cwd(), "node_modules", "@fontsource", pkg, "files");

/** Fonts for social preview images (Satori needs woff/ttf, not woff2). */
export async function ogFonts() {
  const [display, body, bodyDeva, deva] = await Promise.all([
    readFile(join(dir("cormorant-garamond"), "cormorant-garamond-latin-600-normal.woff")),
    readFile(join(dir("mukta"), "mukta-latin-600-normal.woff")),
    readFile(join(dir("mukta"), "mukta-devanagari-600-normal.woff")),
    readFile(join(dir("tiro-devanagari-hindi"), "tiro-devanagari-hindi-devanagari-400-normal.woff")),
  ]);
  return [
    { name: "Cormorant", data: display, weight: 600 as const, style: "normal" as const },
    { name: "Mukta", data: body, weight: 600 as const, style: "normal" as const },
    { name: "Mukta", data: bodyDeva, weight: 600 as const, style: "normal" as const },
    { name: "Tiro", data: deva, weight: 400 as const, style: "normal" as const },
  ];
}
