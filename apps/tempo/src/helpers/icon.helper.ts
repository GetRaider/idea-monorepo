import { deflateSync } from "node:zlib";

export function encodeTrayTemplatePng(size: number): Buffer {
  return encodeRingPng({
    size,
    background: null,
    ring: { red: 0, green: 0, blue: 0 },
  });
}

export function encodeAppIconPng(size: number): Buffer {
  return encodeRingPng({
    size,
    background: { red: 12, green: 8, blue: 20, alpha: 255 },
    ring: { red: 244, green: 238, blue: 254 },
  });
}

export function encodeRingPng(options: RingIconOptions): Buffer {
  const { size, background, ring } = options;
  const stride = size * 4 + 1;
  const rawPixels = Buffer.alloc(stride * size);
  const center = (size - 1) / 2;
  const outerRadius = size * RING_OUTER_RATIO;
  const innerRadius = size * RING_INNER_RATIO;
  const feather = Math.max(0.6, size * 0.004);

  for (let y = 0; y < size; y += 1) {
    rawPixels[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const deltaX = x - center;
      const deltaY = y - center;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const ringCoverage = coverage(
        distance,
        innerRadius,
        outerRadius,
        feather,
      );
      const pixelOffset = y * stride + 1 + x * 4;
      const baseRed = background?.red ?? 0;
      const baseGreen = background?.green ?? 0;
      const baseBlue = background?.blue ?? 0;
      const baseAlpha = background?.alpha ?? 0;

      rawPixels[pixelOffset] = mixChannel(baseRed, ring.red, ringCoverage);
      rawPixels[pixelOffset + 1] = mixChannel(
        baseGreen,
        ring.green,
        ringCoverage,
      );
      rawPixels[pixelOffset + 2] = mixChannel(
        baseBlue,
        ring.blue,
        ringCoverage,
      );
      rawPixels[pixelOffset + 3] = mixChannel(baseAlpha, 255, ringCoverage);
    }
  }

  return wrapPng(size, rawPixels);
}

function coverage(
  distance: number,
  innerRadius: number,
  outerRadius: number,
  feather: number,
): number {
  const outerCoverage =
    1 - smoothstep(outerRadius - feather, outerRadius + feather, distance);
  const innerCoverage = smoothstep(
    innerRadius - feather,
    innerRadius + feather,
    distance,
  );
  return outerCoverage * innerCoverage;
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  if (edgeEnd === edgeStart) {
    return value >= edgeEnd ? 1 : 0;
  }

  const clamped = Math.min(
    1,
    Math.max(0, (value - edgeStart) / (edgeEnd - edgeStart)),
  );
  return clamped * clamped * (3 - 2 * clamped);
}

function mixChannel(from: number, to: number, amount: number): number {
  return Math.round(from + (to - from) * amount);
}

function wrapPng(size: number, rawPixels: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rawPixels)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type);
  const payload = Buffer.concat([typeBuffer, data]);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);
  const checksumBuffer = Buffer.alloc(4);
  checksumBuffer.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([lengthBuffer, payload, checksumBuffer]);
}

function crc32(buffer: Buffer): number {
  let checksum = 0xffffffff;
  for (const byte of buffer) {
    checksum ^= byte;
    for (let bitIndex = 0; bitIndex < 8; bitIndex += 1) {
      const shouldMix = (checksum & 1) !== 0;
      checksum >>>= 1;
      if (shouldMix) {
        checksum ^= 0xedb88320;
      }
    }
  }

  return (checksum ^ 0xffffffff) >>> 0;
}

const RING_OUTER_RATIO = 0.36;
const RING_INNER_RATIO = 0.22;

interface RingColor {
  red: number;
  green: number;
  blue: number;
}

interface RingBackground extends RingColor {
  alpha: number;
}

interface RingIconOptions {
  size: number;
  background: RingBackground | null;
  ring: RingColor;
}
