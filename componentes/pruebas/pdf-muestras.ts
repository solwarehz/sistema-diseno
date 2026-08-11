/**
 * MUESTRAS DE PDF para las pruebas del compresor.
 *
 * Se fabrican aquí, byte a byte, en vez de guardar archivos de ejemplo: un PDF
 * de muestra binario en el repositorio no se puede leer en un diff, nadie sabe
 * qué contiene, y el día que una prueba falle no hay forma de saber si el fallo
 * es del compresor o de la muestra. Escritas así, cada familia dice en su
 * nombre qué defecto representa.
 *
 * Las cuatro familias que llegan de verdad:
 *   crudo         · generadores que no comprimen nada
 *   conRevisiones · editado o firmado varias veces: arrastra lo viejo
 *   conMetadatos  · procesador de textos: XMP y datos privados
 *   moderno       · PDF 1.5 con /ObjStm y tabla en flujo (la mayoría de hoy)
 */

const E = new TextEncoder();

function juntar(trozos: Array<string | Uint8Array>): Uint8Array<ArrayBuffer> {
  const bs = trozos.map((t) => (typeof t === 'string' ? E.encode(t) : t));
  const n = bs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const b of bs) { out.set(b, o); o += b.length; }
  return out;
}

/** Texto repetitivo, que es lo que hay dentro de un PDF de texto. */
function contenidoPagina(i: number): string {
  let s = 'BT /F1 12 Tf 72 720 Td\n';
  for (let k = 0; k < 40; k++) {
    s += `(Constancia de estudios ${i} linea ${k} - Colegio Albert Einstein Huaraz) Tj 0 -14 Td\n`;
  }
  return s + 'ET\n';
}

type Obj = string | { dic: string; datos: string };

function ensamblarClasico(objs: Obj[], extraTrailer = ''): Uint8Array<ArrayBuffer> {
  const trozos: Array<string | Uint8Array> = ['%PDF-1.4\n'];
  let off = 9;
  const pos: number[] = [];
  for (let n = 1; n < objs.length; n++) {
    if (!objs[n]) continue;
    pos[n] = off;
    const o = objs[n];
    const t = typeof o === 'string'
      ? `${n} 0 obj\n${o}\nendobj\n`
      : `${n} 0 obj\n${o.dic}\nstream\n${o.datos}\nendstream\nendobj\n`;
    trozos.push(t);
    off += t.length;
  }
  const size = objs.length;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let n = 1; n < size; n++) {
    xref += pos[n] === undefined
      ? '0000000000 65535 f \n'
      : `${String(pos[n]).padStart(10, '0')} 00000 n \n`;
  }
  trozos.push(xref);
  trozos.push(`trailer\n<< /Size ${size} /Root 1 0 R ${extraTrailer}>>\nstartxref\n${off}\n%%EOF\n`);
  return juntar(trozos);
}

/** Clásico y sin un solo filtro. */
export function pdfCrudo(paginas = 3): Uint8Array<ArrayBuffer> {
  const objs: Obj[] = [];
  const kids: string[] = [];
  for (let i = 0; i < paginas; i++) kids.push(`${4 + i * 2} 0 R`);
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${paginas} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  for (let i = 0; i < paginas; i++) {
    const c = contenidoPagina(i);
    objs[4 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + i * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`;
    objs[5 + i * 2] = { dic: `<< /Length ${c.length} >>`, datos: c };
  }
  return ensamblarClasico(objs);
}

/**
 * Cada revisión deja la anterior dentro del archivo. Se dejan las dos formas en
 * que eso ocurre de verdad, porque se limpian por vías distintas:
 *   · el objeto 5 se REESCRIBE  → gana la última definición al recorrer
 *   · cada revisión añade un objeto que ya nadie referencia → lo tira el
 *     recorrido desde el catálogo
 */
export function pdfConRevisiones(revisiones = 3): Uint8Array<ArrayBuffer> {
  let base = pdfCrudo(2);
  for (let r = 0; r < revisiones; r++) {
    const nuevo = contenidoPagina(100 + r);
    const suelto = contenidoPagina(200 + r);
    const trozo = `5 0 obj\n<< /Length ${nuevo.length} >>\nstream\n${nuevo}\nendstream\nendobj\n`
      + `${50 + r} 0 obj\n<< /Length ${suelto.length} >>\nstream\n${suelto}\nendstream\nendobj\n`
      + `trailer\n<< /Size ${60 + r} /Root 1 0 R >>\nstartxref\n0\n%%EOF\n`;
    base = juntar([base, trozo]);
  }
  return base;
}

/** XMP y `/PieceInfo`: lo que deja un procesador de textos. */
export function pdfConMetadatos(): Uint8Array<ArrayBuffer> {
  const xmp = '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/">\n'
    + '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"></rdf:RDF>\n'.repeat(60)
    + '</x:xmpmeta>\n<?xpacket end="w"?>';
  const priv = 'x'.repeat(4000);
  const c = contenidoPagina(0);
  const objs: Obj[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R /Metadata 6 0 R /PieceInfo 7 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [4 0 R] /Count 1 >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objs[4] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 3 0 R >> >> >>';
  objs[5] = { dic: `<< /Length ${c.length} >>`, datos: c };
  objs[6] = { dic: `<< /Type /Metadata /Subtype /XML /Length ${xmp.length} >>`, datos: xmp };
  objs[7] = { dic: `<< /Length ${priv.length} >>`, datos: priv };
  return ensamblarClasico(objs);
}

/** Con `/Encrypt` en el tráiler: no se toca. */
export function pdfCifrado(): Uint8Array<ArrayBuffer> {
  const c = contenidoPagina(0);
  const objs: Obj[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [4 0 R] /Count 1 >>';
  objs[3] = '<< /Filter /Standard /V 2 /R 3 /Length 128 >>';
  objs[4] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>';
  objs[5] = { dic: `<< /Length ${c.length} >>`, datos: c };
  return ensamblarClasico(objs, '/Encrypt 3 0 R ');
}

/** Un PDF con cadenas y nombres que se rompen si se reescriben a la ligera. */
export function pdfConRarezas(): Uint8Array<ArrayBuffer> {
  const c = contenidoPagina(0);
  const objs: Obj[] = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R /Names 6 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [4 0 R] /Count 1 >>';
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objs[4] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 3 0 R >> >> >>';
  objs[5] = { dic: `<< /Length ${c.length} >>`, datos: c };
  // Cadena con paréntesis anidados y escapes, nombre con almohadilla, y un
  // objeto huérfano que el recorrido tiene que tirar.
  objs[6] = '<< /Titulo (Acta \\(final\\) del a\\361o \\\\ 2026) /Nombre#20Raro true /Octal (\\101\\102) >>';
  objs[7] = '<< /Type /Basura /Nadie 1 >>';
  return ensamblarClasico(objs);
}
