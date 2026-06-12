type CellValue = string | number | null | undefined;

function csvCell(value: CellValue): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function triggerDownload(filename: string, content: BlobPart, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(filename: string, headers: string[], rows: CellValue[][]) {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((r) => r.map(csvCell).join(",")),
  ];
  triggerDownload(`${filename}.csv`, lines.join("\r\n"), "text/csv;charset=utf-8;");
}

// ── Minimal XLSX (SpreadsheetML inside a hand-rolled ZIP) ─────────────────────

function escXml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colLetter(col: number): string {
  let s = "", c = col + 1;
  while (c > 0) { const r = (c - 1) % 26; s = String.fromCharCode(65 + r) + s; c = Math.floor((c - 1) / 26); }
  return s;
}

function xmlCell(ref: string, value: CellValue, bold = false): string {
  const v   = value == null ? "" : String(value);
  const num = !bold && v !== "" && !isNaN(Number(v));
  const s   = bold ? ' s="1"' : "";
  if (num) return `<c r="${ref}" t="n"${s}><v>${v}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${s}><is><t>${escXml(v)}</t></is></c>`;
}

function buildSheetXml(headers: string[], rows: CellValue[][]): string {
  const allRows: CellValue[][] = [headers, ...rows];
  const sheetRows = allRows
    .map((row, ri) =>
      `<row r="${ri + 1}">${row.map((cell, ci) =>
        xmlCell(`${colLetter(ci)}${ri + 1}`, cell, ri === 0)
      ).join("")}</row>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`;
}

// ── ZIP builder (stored, no compression) ─────────────────────────────────────

function u16(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff]); }
function u32(n: number) { return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]); }

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((s, a) => s + a.length, 0);
  const out   = new Uint8Array(total);
  let off = 0;
  for (const a of arrs) { out.set(a, off); off += a.length; }
  return out;
}

function crc32(data: Uint8Array): number {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c; }
  let crc = 0xffffffff;
  for (const b of data) crc = (crc >>> 8) ^ t[(crc ^ b) & 0xff]!;
  return (crc ^ 0xffffffff) >>> 0;
}

function zipFile(files: { name: string; data: string }[]): Uint8Array {
  const enc     = new TextEncoder();
  const entries: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let   offset  = 0;

  for (const f of files) {
    const nameB = enc.encode(f.name);
    const dataB = enc.encode(f.data);
    const crc   = crc32(dataB);

    const local = concat(
      new Uint8Array([0x50,0x4b,0x03,0x04]),
      u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(dataB.length), u32(dataB.length),
      u16(nameB.length), u16(0), nameB,
    );
    entries.push(concat(local, dataB));

    central.push(concat(
      new Uint8Array([0x50,0x4b,0x01,0x02]),
      u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(dataB.length), u32(dataB.length),
      u16(nameB.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameB,
    ));
    offset += local.length + dataB.length;
  }

  const cdSize = central.reduce((s, a) => s + a.length, 0);
  const eocd   = concat(
    new Uint8Array([0x50,0x4b,0x05,0x06]),
    u16(0), u16(0), u16(files.length), u16(files.length),
    u32(cdSize), u32(offset), u16(0),
  );

  return concat(...entries, ...central, eocd);
}

export function exportExcel(filename: string, sheetName: string, headers: string[], rows: CellValue[][]) {
  const files = [
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    { name: "xl/worksheets/sheet1.xml", data: buildSheetXml(headers, rows) },
  ];

  triggerDownload(
    `${filename}.xlsx`,
    zipFile(files),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
