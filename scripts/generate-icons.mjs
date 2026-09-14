/**
 * Rasterize brand SVG into the PNG / ICO files Google, iOS and social crawlers
 * actually fetch. SVG-only icons are why Search Console is not detecting a logo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const mark = fs.readFileSync(path.join(pub, 'favicon.svg'));
const appleSvg = fs.readFileSync(path.join(pub, 'apple-touch-icon.svg'));
const ogSvg = fs.readFileSync(path.join(pub, 'og-default.svg'));

function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(0, 0);
  entry.writeUInt8(0, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

const png48 = await sharp(mark).resize(48, 48).png().toBuffer();
await sharp(png48).toFile(path.join(pub, 'favicon-48x48.png'));
await sharp(mark).resize(32, 32).png().toFile(path.join(pub, 'favicon-32x32.png'));
await sharp(mark).resize(96, 96).png().toFile(path.join(pub, 'favicon-96x96.png'));
fs.writeFileSync(path.join(pub, 'favicon.ico'), pngToIco(png48));

await sharp(appleSvg).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'));
await sharp(mark).resize(192, 192).png().toFile(path.join(pub, 'android-chrome-192x192.png'));
await sharp(mark).resize(512, 512).png().toFile(path.join(pub, 'android-chrome-512x512.png'));
await sharp(mark).resize(512, 512).png().toFile(path.join(pub, 'logo-512.png'));
await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(pub, 'og-default.png'));

console.log('Wrote favicon, apple touch, chrome, logo and OG PNG files to public/');
