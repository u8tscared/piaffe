/**
 * Encodeur ZIP minimal (méthode « stored », sans compression) : les PDF sont déjà compressés, la méthode deflate
 * ne ferait gagner que quelques pour cent pour beaucoup de temps de calcul. Noms de fichiers en UTF-8 (bit 11).
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
export function crc32(d: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < d.length; i++) c = CRC_TABLE[(c ^ d[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry { name: string; data: Uint8Array; date?: Date }

export function zip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = []; const central: Uint8Array[] = [];
  let offset = 0;
  const seen = new Set<string>();
  for (const e of entries) {
    let name = e.name.replace(/[\\:*?"<>|]/g, "_");
    while (seen.has(name)) name = name.replace(/(\.[^.]*)?$/, (m) => "-2" + m);
    seen.add(name);
    const nb = enc.encode(name);
    const crc = crc32(e.data);
    const d = e.date || new Date();
    const dosTime = (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | (d.getUTCSeconds() >> 1);
    const dosDate = ((d.getUTCFullYear() - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate();
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, e.data.length, true); lh.setUint32(22, e.data.length, true); lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), nb, e.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, e.data.length, true); ch.setUint32(24, e.data.length, true); ch.setUint16(28, nb.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nb);
    offset += 30 + nb.length + e.data.length;
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0));
  let p = 0; for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

/** Lecture des noms et contenus d'un ZIP « stored » (tests). */
export function unzipStored(z: Uint8Array): { name: string; data: Uint8Array }[] {
  const dv = new DataView(z.buffer, z.byteOffset, z.byteLength);
  const out: { name: string; data: Uint8Array }[] = []; let p = 0;
  while (p + 4 <= z.length && dv.getUint32(p, true) === 0x04034b50) {
    const size = dv.getUint32(p + 18, true); const nl = dv.getUint16(p + 26, true); const xl = dv.getUint16(p + 28, true);
    const name = new TextDecoder().decode(z.subarray(p + 30, p + 30 + nl));
    const start = p + 30 + nl + xl;
    out.push({ name, data: z.subarray(start, start + size) });
    p = start + size;
  }
  return out;
}
