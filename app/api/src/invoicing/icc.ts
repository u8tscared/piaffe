/**
 * Profil ICC v2 sRGB minimal (matrice + courbes), construit en mémoire : environ 500 octets au lieu d'un fichier
 * de 3 à 60 Ko. Sert d'OutputIntent PDF/A (GTS_PDFA1). Primaires sRGB adaptées D50 (Bradford), gamma 2,2.
 */
function s15f16(x: number): number { return Math.round(x * 65536) >>> 0; }

let cached: Uint8Array | null = null;
export function srgbIcc(): Uint8Array {
  if (cached) return cached;
  const enc = (s: string) => [...s].map((c) => c.charCodeAt(0));
  const tags: { sig: string; data: number[] }[] = [];
  const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const xyz = (x: number, y: number, z: number) => [...enc("XYZ "), 0, 0, 0, 0, ...u32(s15f16(x)), ...u32(s15f16(y)), ...u32(s15f16(z))];
  const desc = (t: string) => {
    const a = [...enc("desc"), 0, 0, 0, 0, ...u32(t.length + 1), ...enc(t), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 67; i++) a.push(0);
    return a;
  };
  const text = (t: string) => [...enc("text"), 0, 0, 0, 0, ...enc(t), 0];
  const curv = [...enc("curv"), 0, 0, 0, 0, ...u32(1), 0x02, 0x33, 0, 0]; // gamma 2,2 (u8Fixed8 = 0x0233), complété à 4 octets
  tags.push({ sig: "desc", data: desc("sRGB IEC61966-2.1") });
  tags.push({ sig: "cprt", data: text("Public domain") });
  tags.push({ sig: "wtpt", data: xyz(0.9642, 1.0, 0.8249) });
  tags.push({ sig: "rXYZ", data: xyz(0.4361, 0.2225, 0.0139) });
  tags.push({ sig: "gXYZ", data: xyz(0.3851, 0.7169, 0.0971) });
  tags.push({ sig: "bXYZ", data: xyz(0.1431, 0.0606, 0.7141) });
  tags.push({ sig: "rTRC", data: curv });
  tags.push({ sig: "gTRC", data: curv });
  tags.push({ sig: "bTRC", data: curv });

  const tableSize = 4 + tags.length * 12;
  let offset = 128 + tableSize;
  const table: number[] = [...u32(tags.length)];
  const body: number[] = [];
  for (const t of tags) {
    while ((offset + body.length) % 4) body.push(0);
    const off = offset + body.length;
    table.push(...enc(t.sig), ...u32(off), ...u32(t.data.length));
    body.push(...t.data);
  }
  while ((offset + body.length) % 4) body.push(0);
  const size = offset + body.length;
  const h = new Array(128).fill(0);
  const put = (at: number, bytes: number[]) => bytes.forEach((b, i) => (h[at + i] = b));
  put(0, u32(size));
  put(8, [0x02, 0x10, 0, 0]);          // version 2.1
  put(12, enc("mntr")); put(16, enc("RGB ")); put(20, enc("XYZ "));
  put(24, [0x07, 0xd0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0]); // 2000-01-01
  put(36, enc("acsp"));
  put(68, [...u32(s15f16(0.9642)), ...u32(s15f16(1.0)), ...u32(s15f16(0.8249))]); // illuminant D50
  cached = new Uint8Array([...h, ...table, ...body]);
  return cached;
}
