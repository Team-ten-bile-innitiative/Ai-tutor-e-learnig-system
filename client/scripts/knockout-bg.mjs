import { PNG } from "pngjs";
import fs from "node:fs";

const input = process.argv[2];
const output = process.argv[3] || input;
const src = PNG.sync.read(fs.readFileSync(input));
const { width, height, data } = src;

function idx(x, y, w = width) {
  return (y * w + x) * 4;
}

function isLavenderBg(r, g, b, a) {
  if (a < 12) return true;
  const bright = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const nearPage = Math.abs(r - 243) + Math.abs(g - 238) + Math.abs(b - 255) <= 48;
  const lightPurple = bright >= 210 && b >= r - 4 && b >= g && sat <= 55;
  const nearWhite = bright >= 236 && sat <= 28;
  return nearPage || lightPurple || nearWhite;
}

const out = new PNG({ width, height });
data.copy(out.data);

const seen = new Uint8Array(width * height);
const q = [];
function push(x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const p = y * width + x;
  if (seen[p]) return;
  const i = idx(x, y);
  if (!isLavenderBg(out.data[i], out.data[i + 1], out.data[i + 2], out.data[i + 3])) return;
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

function opaqueCount(x) {
  let n = 0;
  for (let y = 0; y < height; y++) {
    if (out.data[idx(x, y) + 3] > 12) n += 1;
  }
  return n;
}

/** Remove isolated vertical hairlines (screenshot chrome) on the right. */
let x = width - 1;
while (x >= 0) {
  while (x >= 0 && opaqueCount(x) < 8) x -= 1;
  if (x < 0) break;
  const runEnd = x;
  while (x >= 0 && opaqueCount(x) >= 8) x -= 1;
  const runStart = x + 1;
  const runW = runEnd - runStart + 1;
  const tall = opaqueCount(runEnd) > height * 0.35 || opaqueCount(runStart) > height * 0.35;
  const isolated = runW <= 8 && tall;
  if (isolated) {
    for (let cx = runStart; cx <= runEnd; cx++) {
      for (let y = 0; y < height; y++) out.data[idx(cx, y) + 3] = 0;
    }
    continue;
  }
  break;
}

let cutRight = 0;
outer: for (let cx = width - 1; cx >= 0; cx--) {
  for (let y = 0; y < height; y++) {
    if (out.data[idx(cx, y) + 3] > 8) break outer;
  }
  cutRight += 1;
}

const newW = width - cutRight;
const cropped = new PNG({ width: newW, height });
for (let y = 0; y < height; y++) {
  for (let cx = 0; cx < newW; cx++) {
    const si = idx(cx, y);
    const di = (y * newW + cx) * 4;
    cropped.data[di] = out.data[si];
    cropped.data[di + 1] = out.data[si + 1];
    cropped.data[di + 2] = out.data[si + 2];
    cropped.data[di + 3] = out.data[si + 3];
  }
}

fs.writeFileSync(output, PNG.sync.write(cropped));
console.log("removed right hairline; cropped", cutRight, "px; size", newW, "x", height);
