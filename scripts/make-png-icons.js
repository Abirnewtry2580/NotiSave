import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG generator
function createPNG(width, height, drawFn) {
  // RGBA buffer with scanlines (1 filter byte per line)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG header: 89 50 4E 47 0D 0A 1A 0A
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(typeAndData);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// Drawing Notisave Icon: Rounded squircle, bell shape
function drawNotisave(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background
  if (isMaskable) {
    // Solid background for maskable
    // Subtle gradient from #3b82f6 to #4f46e5
    const t = (x + y) / (w + h);
    const rVal = Math.round(59 + (79 - 59) * t);
    const gVal = Math.round(130 + (70 - 130) * t);
    const bVal = Math.round(246 + (229 - 246) * t);
    
    // Draw bell in white
    const ny = (y - cy) / (r * 0.75);
    const nx = (x - cx) / (r * 0.75);
    const bellDist = Math.sqrt(nx * nx + (ny + 0.1) * (ny + 0.1));
    
    // Dome
    if (ny >= -0.6 && ny <= 0.4 && Math.abs(nx) <= (0.2 + (ny + 0.6) * 0.5)) {
      return [255, 255, 255, 255];
    }
    // Bottom flare
    if (ny > 0.35 && ny <= 0.55 && Math.abs(nx) <= 0.75) {
      return [255, 255, 255, 255];
    }
    // Clapper
    const clapperDist = Math.sqrt(nx * nx + (ny - 0.75) * (ny - 0.75));
    if (clapperDist <= 0.18) {
      return [255, 255, 255, 255];
    }
    
    return [rVal, gVal, bVal, 255];
  } else {
    // Squircle shape
    const cornerR = r * 0.35;
    const halfW = r * 0.88;
    const inBox = Math.abs(dx) <= halfW && Math.abs(dy) <= halfW;
    const ax = Math.abs(dx) - (halfW - cornerR);
    const ay = Math.abs(dy) - (halfW - cornerR);
    
    let inside = false;
    if (ax <= 0 || ay <= 0) {
      inside = inBox;
    } else {
      inside = (ax * ax + ay * ay) <= cornerR * cornerR;
    }

    if (!inside) {
      return [0, 0, 0, 0]; // Transparent outside squircle
    }

    // Outer ring ringGrad
    const ringDist = dist;
    if (ringDist >= r * 0.72 && ringDist <= r * 0.82) {
      return [236, 72, 153, 240]; // Pink/purple ring
    }

    // Bell shape in blue
    const ny = (y - cy) / (r * 0.7);
    const nx = (x - cx) / (r * 0.7);
    // Dome
    if (ny >= -0.55 && ny <= 0.35 && Math.abs(nx) <= (0.18 + (ny + 0.55) * 0.45)) {
      return [59, 130, 246, 255];
    }
    // Bottom lip
    if (ny > 0.35 && ny <= 0.5 && Math.abs(nx) <= 0.65) {
      return [37, 99, 235, 255];
    }
    // Clapper
    const clapperDist = Math.sqrt(nx * nx + (ny - 0.68) * (ny - 0.68));
    if (clapperDist <= 0.16) {
      return [37, 99, 235, 255];
    }

    // White base inside squircle
    return [255, 255, 255, 255];
  }
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating 192x192 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawNotisave(x, y, w, h, false)));

console.log('Generating 512x512 PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawNotisave(x, y, w, h, false)));

console.log('Generating 512x512 Maskable PNG...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawNotisave(x, y, w, h, true)));

console.log('Generating Apple Touch Icon PNG...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawNotisave(x, y, w, h, false)));

console.log('Generating favicon.ico...');
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, (x, y, w, h) => drawNotisave(x, y, w, h, false)));

console.log('All icons generated successfully!');
