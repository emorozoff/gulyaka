import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const svg = readFileSync(path.join(root, "public/icon.svg"));

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

await Promise.all(
  sizes.map(async ({ name, size }) => {
    const buffer = await sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toBuffer();
    await writeFile(path.join(root, "public", name), buffer);
    console.log(`✓ ${name} (${size}x${size})`);
  }),
);
