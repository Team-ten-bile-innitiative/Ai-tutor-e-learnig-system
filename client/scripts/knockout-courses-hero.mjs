import { PNG } from "pngjs";
import fs from "node:fs";

const input = process.argv[2];
const output = process.argv[3] || input;
const src = PNG.sync.read(fs.readFileSync(input));
const { width, height, data } = src;
const out = new PNG({ width, height });
data.copy(out.data);

function idx(x, y) {
  return (y * width + x) * 4;
}

function isPinkBg(r, g, b, a) {
  if (a < 12) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const bright = (r + g + b) / 3;
  const pinkLavender = r >= 210 && g >= 185 && b >= 210 && sat <= 70 && bright >= 205;
  const paleHalo = r >= 220 && g >= 200 && b >= 220 && bright >= 215 && sat <= 45;
  const nearWhite = bright >= 232 && sat <= 30;
  return pinkLavender || paleHalo || nearWhite;
}

const seen = new Uint8Array(width * height);
const q = [];
function push(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (seen[p]) return;
  const i = idx(x, y);
  if (!isPinkBg(out.data[i], out.data[i + 1], out.data[i + 2], out.data[i + 3])) return;
  seen[p] = 1;
  q.push(p);
}
for (let x = 0; x < width; x++) {
  push(x, 0);
  push(x, height - 1);
}
for (let y = 0; y < height; y++) {
  push(0, y);
  push(width - 1, y);
}
while (q.length) {
  const p = q.pop();
  const x = p % width;
  const y = (p / width) | 0;
  out.data[idx(x, y) + 3] = 0;
  push(x + 1, y);
  push(x - 1, y);
  push(x, y + 1);
  push(x, y - 1);
}

const visited = new Uint8Array(width * height);
const minKeep = Math.floor(width * height * 0.004);
for (let start = 0; start < width * height; start++) {
  if (visited[start]) continue;
  const i0 = start * 4;
  if (out.data[i0 + 3] < 16) {
    visited[start] = 1;
    continue;
  }
  const stack = [start];
  visited[start] = 1;
  const cells = [];
  while (stack.length) {
    const p = stack.pop();
    cells.push(p);
    const x = p % width;
    const y = (p / width) | 0;
    const nbs = [p - 1, p + 1, p - width, p + width];
    for (const n of nbs) {
      if (n < 0 || n >= width * height || visited[n]) continue;
      const nx = n % width;
      const ny = (n / width) | 0;
      if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
      if (out.data[n * 4 + 3] < 16) {
        visited[n] = 1;
        continue;
      }
      visited[n] = 1;
      stack.push(n);
    }
  }
  if (cells.length < minKeep) {
    for (const p of cells) out.data[p * 4 + 3] = 0;
  }
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = idx(x, y);
    if (out.data[i + 3] === 0) continue;
    if (!isPinkBg(out.data[i], out.data[i + 1], out.data[i + 2], 255)) continue;
    let nearClear = false;
    for (let dy = -1; dy <= 1 && !nearClear; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        if (out.data[idx(xx, yy) + 3] < 8) nearClear = true;
      }
    }
    if (nearClear) out.data[i + 3] = 0;
  }
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (out.data[idx(x, y) + 3] > 12) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}
const pad = 12;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);
const newW = maxX - minX + 1;
const newH = maxY - minY + 1;
const cropped = new PNG({ width: newW, height: newH });
for (let y = 0; y < newH; y++) {
  for (let x = 0; x < newW; x++) {
    const si = idx(x + minX, y + minY);
    const di = (y * newW + x) * 4;
    cropped.data[di] = out.data[si];
    cropped.data[di + 1] = out.data[si + 1];
    cropped.data[di + 2] = out.data[si + 2];
    cropped.data[di + 3] = out.data[si + 3];
  }
}

fs.writeFileSync(output, PNG.sync.write(cropped));
console.log("knocked out pink bg; cropped to", newW, "x", newH);
