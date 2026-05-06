import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

const INK = '#1c1917';
const PAPER = '#fafaf9';

const tightLogoSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${INK}"/>
  <g fill="${PAPER}">
    ${gShape(size, 0.16)}
  </g>
</svg>
`;

const maskableSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <g fill="${PAPER}">
    ${gShape(size, 0.27)}
  </g>
</svg>
`;

const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${INK}"/>
  <g fill="${PAPER}">
    ${gShape(512, 0.16)}
  </g>
</svg>
`;

function gShape(size, padRatio) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const stem = Math.round(inner * 0.22);
  const x0 = pad;
  const y0 = pad;
  const x1 = pad + inner;
  const y1 = pad + inner;
  return `<path d="
    M ${x0} ${y0}
    L ${x1} ${y0}
    L ${x1} ${y0 + stem}
    L ${x0 + stem} ${y0 + stem}
    L ${x0 + stem} ${y1}
    L ${x0} ${y1}
    Z" />`;
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  await writeFile(join(publicDir, 'favicon.svg'), faviconSvg.trim());

  await sharp(Buffer.from(tightLogoSvg(192)))
    .png()
    .toFile(join(iconsDir, 'icon-192.png'));

  await sharp(Buffer.from(tightLogoSvg(512)))
    .png()
    .toFile(join(iconsDir, 'icon-512.png'));

  await sharp(Buffer.from(maskableSvg(512)))
    .png()
    .toFile(join(iconsDir, 'icon-maskable-512.png'));

  console.log('Icons generated in', iconsDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
