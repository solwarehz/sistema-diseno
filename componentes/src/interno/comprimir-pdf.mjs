/**
 * COMPRESOR DE PDF — sin una sola dependencia
 *
 * POR QUÉ ESTÁ ESCRITO A MANO. El paquete no tiene dependencias de ejecución:
 * viaja como fuente y lo único que pide es React. Meter `pdf-lib` obligaría a
 * cada producto que instala el sistema a cargar con ella, y §9 ya decidió que
 * las librerías entran solo cuando escribir a mano produce fallos
 * sistemáticos. Aquí no los produce: el formato está publicado y lo que hace
 * falta —inflar, desinflar, recorrer y volver a escribir— cabe en un archivo.
 *
 * QUÉ HACE, en el orden en que gana peso:
 *
 *   1 · RECOMPRIME LAS IMÁGENES. Es el único cambio que mueve la aguja en un
 *       escaneo, que es el PDF que de verdad pesa en un colegio. Solo toca
 *       imágenes JPEG (`/DCTDecode`): las decodifica, las reduce al ancho
 *       máximo y las vuelve a codificar. Necesita `canvas`, así que ESTO SOLO
 *       OCURRE EN EL NAVEGADOR — en Node se salta, y se dice.
 *   2 · TIRA LO INALCANZABLE. Un PDF firmado o editado varias veces arrastra
 *       todas sus revisiones anteriores. Se recorre desde el catálogo y lo que
 *       no se alcanza no se copia.
 *   3 · TIRA XMP Y `/PieceInfo`. Metadatos duplicados y datos privados de la
 *       aplicación que lo generó. Word deja ahí kilobytes que nadie lee.
 *   4 · DESINFLA LO QUE VIAJABA EN CRUDO.
 *   5 · REEMPAQUETA. Los objetos que no son flujo van a un `/ObjStm` y la
 *       tabla de referencias sale como flujo. Sin esto, un PDF moderno SALDRÍA
 *       MÁS GRANDE del que entró: sus objetos pequeños ya venían empaquetados.
 *
 * LAS TRES PROMESAS. Son el contrato, y el resto del archivo existe para
 * sostenerlas:
 *
 *   · NUNCA DEVUELVE ALGO MÁS GRANDE. Se compara al final y, si no se ganó
 *     peso, vuelve el original intacto.
 *   · NUNCA DEVUELVE ALGO QUE NO SEPA VOLVER A LEER. Lo que sale se vuelve a
 *     analizar con este mismo lector y se comprueba que el catálogo resuelve y
 *     que el número de páginas es el mismo. Si algo no cuadra, vuelve el
 *     original.
 *   · NUNCA TOCA UN PDF CIFRADO. Se devuelve intacto con su motivo.
 *
 * LO QUE NO HACE, y hay que decirlo: no reduce imágenes que no sean JPEG, no
 * toca las fuentes incrustadas y no vuelve a comprimir un flujo que ya venía
 * desinflado. Un PDF que ya pasó por un optimizador saldrá igual —y devuelto
 * tal cual, que es lo correcto.
 */

// ── Piezas del formato ──────────────────────────────────────────────────────
// Un PDF es una lista de objetos numerados. Cada valor es de uno de estos
// tipos, y se modelan con clases para poder distinguir un nombre (`/Tipo`) de
// una cadena («Tipo») al volver a escribir: en JavaScript los dos serían un
// string y saldrían iguales, que es exactamente el error que corrompe archivos.

export class Nombre {
  constructor(v) { this.v = v; }
}
export class Ref {
  constructor(num, gen) { this.num = num; this.gen = gen; }
}
export class Cadena {
  constructor(bytes, hex) { this.bytes = bytes; this.hex = !!hex; }
}
export class Flujo {
  constructor(dic, datos) { this.dic = dic; this.datos = datos; }
}

const BLANCOS = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMS = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);
const esBlanco = (c) => BLANCOS.has(c);
const esDelim = (c) => DELIMS.has(c);
const esRegular = (c) => c !== undefined && !esBlanco(c) && !esDelim(c);
const esDigito = (c) => c >= 0x30 && c <= 0x39;

/** `dic.get('Type')` sin tener que comprobar que existe ni que es un nombre. */
function nombreDe(dic, clave) {
  const v = dic instanceof Map ? dic.get(clave) : undefined;
  return v instanceof Nombre ? v.v : null;
}

// ── Lector ──────────────────────────────────────────────────────────────────

class Lector {
  constructor(bytes) {
    this.b = bytes;
    this.i = 0;
  }

  /** Salta blancos Y comentarios: un `%` fuera de una cadena llega a fin de línea. */
  saltar() {
    for (;;) {
      while (this.i < this.b.length && esBlanco(this.b[this.i])) this.i++;
      if (this.b[this.i] !== 0x25) return;
      while (this.i < this.b.length && this.b[this.i] !== 0x0a && this.b[this.i] !== 0x0d) this.i++;
    }
  }

  /** Mira si en la posición actual está esta palabra, sin consumirla. */
  esPalabra(txt) {
    for (let k = 0; k < txt.length; k++) {
      if (this.b[this.i + k] !== txt.charCodeAt(k)) return false;
    }
    return true;
  }

  leerSimbolo() {
    const ini = this.i;
    while (esRegular(this.b[this.i])) this.i++;
    return String.fromCharCode(...this.b.subarray(ini, this.i));
  }

  leerNombre() {
    this.i++; // la barra
    let s = '';
    while (esRegular(this.b[this.i])) {
      let c = this.b[this.i++];
      // `#41` es una `A`. Sin deshacerlo, un nombre con espacio o con `#` se
      // reescribiría distinto del que se leyó.
      if (c === 0x23 && esHex(this.b[this.i]) && esHex(this.b[this.i + 1])) {
        c = parseInt(String.fromCharCode(this.b[this.i], this.b[this.i + 1]), 16);
        this.i += 2;
      }
      s += String.fromCharCode(c);
    }
    return new Nombre(s);
  }

  leerCadenaLiteral() {
    this.i++; // (
    const out = [];
    let nivel = 1;
    while (this.i < this.b.length) {
      const c = this.b[this.i++];
      if (c === 0x5c) { // barra invertida
        const e = this.b[this.i++];
        const simples = { 0x6e: 10, 0x72: 13, 0x74: 9, 0x62: 8, 0x66: 12 };
        if (e in simples) out.push(simples[e]);
        else if (e >= 0x30 && e <= 0x37) { // octal, hasta tres cifras
          let n = e - 0x30;
          for (let k = 0; k < 2 && this.b[this.i] >= 0x30 && this.b[this.i] <= 0x37; k++) {
            n = n * 8 + (this.b[this.i++] - 0x30);
          }
          out.push(n & 0xff);
        } else if (e === 0x0a) { /* continuación de línea: no produce byte */ }
        else if (e === 0x0d) { if (this.b[this.i] === 0x0a) this.i++; }
        else out.push(e);
      } else if (c === 0x28) { nivel++; out.push(c); }
      else if (c === 0x29) { if (--nivel === 0) break; out.push(c); }
      else out.push(c);
    }
    return new Cadena(Uint8Array.from(out), false);
  }

  leerCadenaHex() {
    this.i++; // <
    let s = '';
    while (this.i < this.b.length && this.b[this.i] !== 0x3e) {
      const c = this.b[this.i++];
      if (esHex(c)) s += String.fromCharCode(c);
    }
    this.i++; // >
    if (s.length % 2) s += '0';
    const out = new Uint8Array(s.length / 2);
    for (let k = 0; k < out.length; k++) out[k] = parseInt(s.substr(k * 2, 2), 16);
    return new Cadena(out, true);
  }

  leerDiccionario() {
    this.i += 2; // <<
    const dic = new Map();
    for (;;) {
      this.saltar();
      if (this.i >= this.b.length) break;
      if (this.esPalabra('>>')) { this.i += 2; break; }
      if (this.b[this.i] !== 0x2f) { // clave que no es nombre: archivo roto
        const antes = this.i;
        this.leerValor();
        if (this.i === antes) { this.i++; }
        continue;
      }
      const clave = this.leerNombre().v;
      const valor = this.leerValor();
      dic.set(clave, valor);
    }
    return dic;
  }

  leerArreglo() {
    this.i++; // [
    const arr = [];
    for (;;) {
      this.saltar();
      if (this.i >= this.b.length) break;
      if (this.b[this.i] === 0x5d) { this.i++; break; }
      const antes = this.i;
      arr.push(this.leerValor());
      if (this.i === antes) { this.i++; } // nunca girar en vacío
    }
    return arr;
  }

  leerValor() {
    this.saltar();
    const c = this.b[this.i];
    if (c === undefined) return null;
    if (c === 0x2f) return this.leerNombre();
    if (c === 0x28) return this.leerCadenaLiteral();
    if (c === 0x5b) return this.leerArreglo();
    if (c === 0x3c) return this.b[this.i + 1] === 0x3c ? this.leerDiccionario() : this.leerCadenaHex();
    if (c === 0x3e || c === 0x5d) return null; // cierre suelto: lo come quien llamó

    if (esDigito(c) || c === 0x2b || c === 0x2d || c === 0x2e) {
      const guardado = this.i;
      const num = parseFloat(this.leerSimbolo());
      // ¿Es `12 0 R`? Hay que mirar dos símbolos por delante y volver si no.
      const trasNumero = this.i;
      this.saltar();
      if (esDigito(this.b[this.i])) {
        const g = this.i;
        const gen = parseInt(this.leerSimbolo(), 10);
        this.saltar();
        if (this.b[this.i] === 0x52 && !esRegular(this.b[this.i + 1])) { // R
          this.i++;
          return new Ref(num, gen);
        }
        this.i = g;
      }
      this.i = trasNumero;
      return Number.isNaN(num) ? (this.i = guardado + 1, null) : num;
    }

    const sim = this.leerSimbolo();
    if (sim === 'true') return true;
    if (sim === 'false') return false;
    if (sim === 'null') return null;
    if (sim === '') { this.i++; return null; }
    return new Nombre(sim); // símbolo desconocido: se conserva como está
  }
}

const esHex = (c) => c !== undefined &&
  ((c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66));

// ── Inflar y desinflar ──────────────────────────────────────────────────────
// `CompressionStream('deflate')` produce zlib (RFC 1950), que es justo lo que
// `/FlateDecode` espera. No hace falta nada más.

async function porTubo(bytes, stream) {
  const w = stream.writable.getWriter();
  w.write(bytes);
  w.close();
  const partes = [];
  const r = stream.readable.getReader();
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    partes.push(value);
  }
  let n = 0;
  for (const p of partes) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of partes) { out.set(p, o); o += p.length; }
  return out;
}

export async function desinflar(bytes) {
  return porTubo(bytes, new CompressionStream('deflate'));
}

/** Devuelve `null` si no se puede inflar: quien llama decide, nadie revienta. */
export async function inflar(bytes) {
  for (const modo of ['deflate', 'deflate-raw']) {
    try {
      return await porTubo(bytes, new DecompressionStream(modo));
    } catch { /* se prueba el siguiente */ }
  }
  return null;
}

/**
 * Deshace el predictor PNG. Los flujos de referencias cruzadas casi siempre
 * lo llevan, y sin esto un PDF moderno se leería como ruido.
 */
function deshacerPredictor(datos, parms) {
  if (!(parms instanceof Map)) return datos;
  const pred = parms.get('Predictor') ?? 1;
  if (typeof pred !== 'number' || pred < 2) return datos;
  const colores = parms.get('Colors') ?? 1;
  const bpc = parms.get('BitsPerComponent') ?? 8;
  const columnas = parms.get('Columns') ?? 1;
  const muestra = Math.ceil((colores * bpc) / 8);
  const fila = Math.ceil((colores * bpc * columnas) / 8);
  if (pred === 2) return datos; // TIFF: solo se usa con imágenes, que no tocamos aquí
  const filas = Math.floor(datos.length / (fila + 1));
  const out = new Uint8Array(filas * fila);
  let previa = new Uint8Array(fila);
  for (let f = 0; f < filas; f++) {
    const tipo = datos[f * (fila + 1)];
    const cruda = datos.subarray(f * (fila + 1) + 1, f * (fila + 1) + 1 + fila);
    const actual = new Uint8Array(fila);
    for (let k = 0; k < fila; k++) {
      const izq = k >= muestra ? actual[k - muestra] : 0;
      const arr = previa[k];
      const diag = k >= muestra ? previa[k - muestra] : 0;
      let v = cruda[k];
      if (tipo === 1) v += izq;
      else if (tipo === 2) v += arr;
      else if (tipo === 3) v += (izq + arr) >> 1;
      else if (tipo === 4) {
        const p = izq + arr - diag;
        const pa = Math.abs(p - izq), pb = Math.abs(p - arr), pc = Math.abs(p - diag);
        v += pa <= pb && pa <= pc ? izq : pb <= pc ? arr : diag;
      }
      actual[k] = v & 0xff;
    }
    out.set(actual, f * fila);
    previa = actual;
  }
  return out;
}

/** El contenido real de un flujo, o `null` si lleva un filtro que no sabemos deshacer. */
async function contenido(flujo) {
  const filtros = comoArreglo(flujo.dic.get('Filter'));
  if (!filtros.length) return flujo.datos;
  if (filtros.length !== 1 || nombreDe2(filtros[0]) !== 'FlateDecode') return null;
  const crudo = await inflar(flujo.datos);
  if (!crudo) return null;
  const parms = comoArreglo(flujo.dic.get('DecodeParms'))[0] ?? flujo.dic.get('DecodeParms');
  return deshacerPredictor(crudo, parms instanceof Map ? parms : null);
}

const nombreDe2 = (v) => (v instanceof Nombre ? v.v : null);
const comoArreglo = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

// ── Lectura del documento ───────────────────────────────────────────────────

/**
 * Los objetos se buscan RECORRIENDO EL ARCHIVO, no siguiendo la tabla de
 * referencias. Es a propósito: la tabla es lo primero que se rompe en un PDF
 * que pasó por varias manos, y un compresor que solo funciona con archivos
 * sanos no sirve para el archivo que llega de fuera. Al recorrer en orden y
 * saltar por encima de cada objeto ya leído, un `obj` que aparezca dentro de
 * los bytes de una imagen no confunde a nadie.
 */
function localizarObjetos(bytes) {
  const objetos = new Map(); // num -> { dic|valor, flujo, fin }
  let i = 0;
  while (i < bytes.length - 3) {
    if (bytes[i] !== 0x6f || bytes[i + 1] !== 0x62 || bytes[i + 2] !== 0x6a || esRegular(bytes[i + 3])) {
      i++;
      continue;
    }
    // Hacia atrás: blancos, generación, blancos, número.
    let j = i - 1;
    while (j >= 0 && esBlanco(bytes[j])) j--;
    const finGen = j;
    while (j >= 0 && esDigito(bytes[j])) j--;
    if (j === finGen) { i++; continue; }
    const gen = parseInt(txt(bytes, j + 1, finGen + 1), 10);
    while (j >= 0 && esBlanco(bytes[j])) j--;
    const finNum = j;
    while (j >= 0 && esDigito(bytes[j])) j--;
    if (j === finNum) { i++; continue; }
    if (j >= 0 && esRegular(bytes[j])) { i++; continue; }
    const num = parseInt(txt(bytes, j + 1, finNum + 1), 10);

    const lec = new Lector(bytes);
    lec.i = i + 3;
    let valor;
    try { valor = lec.leerValor(); } catch { i++; continue; }
    lec.saltar();

    let flujo = null;
    if (valor instanceof Map && lec.esPalabra('stream')) {
      lec.i += 6;
      if (bytes[lec.i] === 0x0d) lec.i++;
      if (bytes[lec.i] === 0x0a) lec.i++;
      const ini = lec.i;
      const largo = valor.get('Length');
      let fin = -1;
      // Se cree a `/Length` solo si lo que hay detrás es de verdad `endstream`.
      if (typeof largo === 'number' && largo >= 0 && ini + largo <= bytes.length) {
        const tras = saltarBlancos(bytes, ini + largo);
        if (coincide(bytes, tras, 'endstream')) fin = ini + largo;
      }
      if (fin < 0) fin = buscar(bytes, 'endstream', ini);
      if (fin < 0) { i = ini; continue; }
      // El fin de línea antes de `endstream` no es del flujo.
      let real = fin;
      if (bytes[real - 1] === 0x0a) real--;
      if (bytes[real - 1] === 0x0d) real--;
      flujo = new Flujo(valor, bytes.subarray(ini, real));
      lec.i = fin + 9;
    }

    objetos.set(num, { gen, valor: flujo ?? valor });
    i = Math.max(lec.i, i + 3);
  }
  return objetos;
}

const txt = (b, a, z) => String.fromCharCode(...b.subarray(a, z));
const coincide = (b, i, s) => {
  for (let k = 0; k < s.length; k++) if (b[i + k] !== s.charCodeAt(k)) return false;
  return true;
};
const saltarBlancos = (b, i) => { while (i < b.length && esBlanco(b[i])) i++; return i; };
function buscar(b, s, desde) {
  const c0 = s.charCodeAt(0);
  for (let i = desde; i <= b.length - s.length; i++) {
    if (b[i] === c0 && coincide(b, i, s)) return i;
  }
  return -1;
}

/** Los objetos que viajan dentro de un `/ObjStm`. Sin esto, un PDF 1.5 se lee vacío. */
async function expandirObjStm(objetos) {
  for (const [, entrada] of [...objetos]) {
    const o = entrada.valor;
    if (!(o instanceof Flujo) || nombreDe(o.dic, 'Type') !== 'ObjStm') continue;
    const datos = await contenido(o);
    if (!datos) continue;
    const n = o.dic.get('N');
    const primero = o.dic.get('First');
    if (typeof n !== 'number' || typeof primero !== 'number') continue;
    const cab = new Lector(datos);
    const pares = [];
    for (let k = 0; k < n; k++) {
      cab.saltar();
      const num = parseInt(cab.leerSimbolo(), 10);
      cab.saltar();
      const off = parseInt(cab.leerSimbolo(), 10);
      if (Number.isNaN(num) || Number.isNaN(off)) break;
      pares.push([num, off]);
    }
    for (const [num, off] of pares) {
      // Un objeto suelto en el archivo gana al empaquetado: si el PDF trae una
      // revisión posterior, está fuera del `/ObjStm`.
      if (objetos.has(num)) continue;
      const lec = new Lector(datos);
      lec.i = primero + off;
      try { objetos.set(num, { gen: 0, valor: lec.leerValor(), enObjStm: true }); } catch { /* se ignora */ }
    }
  }
}

/** El catálogo: por el tráiler, por el flujo de referencias, o buscándolo. */
function hallarRaiz(bytes, objetos) {
  let cifrado = false;
  let raiz = null;
  let info = null;
  // El último tráiler del archivo es el vigente.
  let p = -1;
  for (;;) {
    const s = buscar(bytes, 'trailer', p + 1);
    if (s < 0) break;
    p = s;
    const lec = new Lector(bytes);
    lec.i = s + 7;
    const dic = lec.leerValor();
    if (dic instanceof Map) {
      if (dic.has('Encrypt')) cifrado = true;
      if (dic.get('Root') instanceof Ref) raiz = dic.get('Root');
      if (dic.get('Info') instanceof Ref) info = dic.get('Info');
    }
  }
  for (const [, e] of objetos) {
    const v = e.valor;
    const dic = v instanceof Flujo ? v.dic : v;
    if (!(dic instanceof Map)) continue;
    if (nombreDe(dic, 'Type') === 'XRef') {
      if (dic.has('Encrypt')) cifrado = true;
      if (!raiz && dic.get('Root') instanceof Ref) raiz = dic.get('Root');
      if (!info && dic.get('Info') instanceof Ref) info = dic.get('Info');
    }
  }
  if (!raiz) {
    for (const [num, e] of objetos) {
      if (e.valor instanceof Map && nombreDe(e.valor, 'Type') === 'Catalog') {
        raiz = new Ref(num, 0);
        break;
      }
    }
  }
  return { raiz, info, cifrado };
}

/** Recorrido desde el catálogo: lo que no se alcanza, no se copia. */
function alcanzables(objetos, semillas) {
  const vistos = new Set();
  const cola = [...semillas];
  while (cola.length) {
    const ref = cola.pop();
    if (!(ref instanceof Ref) || vistos.has(ref.num)) continue;
    vistos.add(ref.num);
    const e = objetos.get(ref.num);
    if (!e) continue;
    recorrer(e.valor, (r) => { if (!vistos.has(r.num)) cola.push(r); });
  }
  return vistos;
}

function recorrer(valor, alVerRef) {
  const pila = [valor];
  while (pila.length) {
    const v = pila.pop();
    if (v instanceof Ref) alVerRef(v);
    else if (v instanceof Flujo) pila.push(v.dic);
    else if (v instanceof Map) for (const x of v.values()) pila.push(x);
    else if (Array.isArray(v)) for (const x of v) pila.push(x);
  }
}

/** Cuántas páginas tiene. Es la cifra con la que se comprueba que no se perdió nada. */
function contarPaginas(objetos, raiz) {
  const cat = raiz && objetos.get(raiz.num);
  if (!cat || !(cat.valor instanceof Map)) return -1;
  const paginas = cat.valor.get('Pages');
  if (!(paginas instanceof Ref)) return -1;
  let n = 0;
  const vistos = new Set();
  const cola = [paginas];
  while (cola.length) {
    const ref = cola.pop();
    if (vistos.has(ref.num)) continue;
    vistos.add(ref.num);
    const e = objetos.get(ref.num);
    if (!e || !(e.valor instanceof Map)) continue;
    const tipo = nombreDe(e.valor, 'Type');
    if (tipo === 'Page') { n++; continue; }
    for (const h of comoArreglo(e.valor.get('Kids'))) if (h instanceof Ref) cola.push(h);
  }
  return n;
}

// ── Escritura ───────────────────────────────────────────────────────────────

const CODIF = new TextEncoder();

class Pluma {
  constructor() { this.trozos = []; this.largo = 0; }
  bytes(u8) { this.trozos.push(u8); this.largo += u8.length; }
  texto(s) { this.bytes(CODIF.encode(s)); }
  juntar() {
    const out = new Uint8Array(this.largo);
    let o = 0;
    for (const t of this.trozos) { out.set(t, o); o += t.length; }
    return out;
  }
}

/** Un nombre se vuelve a escribir escapando lo que no es regular. */
function escribirNombre(v) {
  let s = '/';
  for (const ch of v) {
    const c = ch.charCodeAt(0);
    s += esRegular(c) && c > 0x20 && c < 0x7f && c !== 0x23 ? ch
      : '#' + c.toString(16).padStart(2, '0');
  }
  return s;
}

function escribirValor(valor, pluma) {
  if (valor === null || valor === undefined) { pluma.texto('null'); return; }
  if (typeof valor === 'boolean') { pluma.texto(valor ? 'true' : 'false'); return; }
  if (typeof valor === 'number') {
    pluma.texto(Number.isInteger(valor) ? String(valor) : String(parseFloat(valor.toFixed(6))));
    return;
  }
  if (valor instanceof Nombre) { pluma.texto(escribirNombre(valor.v)); return; }
  if (valor instanceof Ref) { pluma.texto(`${valor.num} ${valor.gen} R`); return; }
  if (valor instanceof Cadena) {
    // Siempre en hexadecimal: no hay que escapar nada y no se puede corromper
    // una cadena binaria por un paréntesis suelto.
    let s = '<';
    for (const b of valor.bytes) s += b.toString(16).padStart(2, '0');
    pluma.texto(s + '>');
    return;
  }
  if (Array.isArray(valor)) {
    pluma.texto('[');
    valor.forEach((v, k) => { if (k) pluma.texto(' '); escribirValor(v, pluma); });
    pluma.texto(']');
    return;
  }
  if (valor instanceof Map) {
    pluma.texto('<<');
    for (const [k, v] of valor) {
      pluma.texto(escribirNombre(k));
      pluma.texto(' ');
      escribirValor(v, pluma);
    }
    pluma.texto('>>');
    return;
  }
  pluma.texto('null');
}

function aTexto(valor) {
  const p = new Pluma();
  escribirValor(valor, p);
  return p.juntar();
}

// ── El compresor ────────────────────────────────────────────────────────────

const POR_DEFECTO = {
  /** Ancho máximo de una imagen incrustada. Un escaneo a 300 ppp de un A4 son
   *  2480 px: por encima de 1600 no se gana legibilidad en pantalla. */
  anchoMaximoImagen: 1600,
  calidadImagen: 0.72,
  recomprimirImagenes: true,
};

/**
 * Lo que se midió por el camino. Se devuelve entero porque una cifra de ahorro
 * sin decir de dónde salió no se puede comprobar: `imagenesOmitidas` es la que
 * avisa de que se comprimió SIN tocar las imágenes —en Node siempre— y de que
 * por eso un escaneo apenas se movió.
 *
 * @typedef {object} DetalleCompresion
 * @property {number} paginas
 * @property {number} imagenes            Cuántas se volvieron a codificar
 * @property {number} [bytesImagen]       Cuánto se ganó solo con ellas
 * @property {number} desinflados         Flujos que viajaban en crudo
 * @property {number} tirados             Objetos que ya no alcanzaba nadie
 * @property {number} metadatosFuera      XMP y /PieceInfo retirados
 * @property {boolean} [imagenesOmitidas] `true` si no había `canvas`
 *
 * @typedef {object} ResultadoCompresion
 * @property {Blob} archivo
 * @property {number} pesoInicial
 * @property {number} pesoFinal
 * @property {boolean} comprimido
 * @property {string|null} motivo  `cifrado` · `no-es-pdf` · `ilegible` ·
 *   `no-verificado` · `sin-ganancia`
 * @property {Partial<DetalleCompresion>} detalle
 *
 * @param {Blob|ArrayBuffer|Uint8Array} entrada
 * @param {{anchoMaximoImagen?: number, calidadImagen?: number,
 *   recomprimirImagenes?: boolean}} [opciones]
 * @returns {Promise<ResultadoCompresion>}
 */
export async function comprimirPdf(entrada, opciones = {}) {
  const cfg = { ...POR_DEFECTO, ...opciones };
  const bytes = await aBytes(entrada);
  const original = () => (entrada instanceof Blob ? entrada : new Blob([bytes], { type: 'application/pdf' }));
  const pesoInicial = bytes.length;
  const salir = (motivo, detalle = {}) => ({
    archivo: original(), pesoInicial, pesoFinal: pesoInicial,
    comprimido: false, motivo, detalle,
  });

  if (!coincide(bytes, 0, '%PDF-')) {
    // Algunos archivos traen basura delante. Se admite si la cabecera aparece pronto.
    if (buscar(bytes.subarray(0, 1024), '%PDF-', 0) < 0) return salir('no-es-pdf');
  }

  let objetos;
  try {
    objetos = localizarObjetos(bytes);
    await expandirObjStm(objetos);
  } catch {
    return salir('ilegible');
  }
  if (!objetos.size) return salir('ilegible');

  const { raiz, info, cifrado } = hallarRaiz(bytes, objetos);
  // Un PDF cifrado tiene sus cadenas y sus flujos codificados con una clave.
  // Reescribirlo sin descifrar produce un archivo que abre y no se lee.
  if (cifrado) return salir('cifrado');
  if (!raiz || !objetos.has(raiz.num)) return salir('ilegible');

  const paginasAntes = contarPaginas(objetos, raiz);
  if (paginasAntes <= 0) return salir('ilegible');

  // 1 · Metadatos que sobran. XMP repite lo que ya está en `/Info`; `/PieceInfo`
  //     son datos privados de Word que ningún lector usa.
  const catalogo = objetos.get(raiz.num).valor;
  let metadatosFuera = 0;
  if (catalogo instanceof Map) {
    for (const clave of ['Metadata', 'PieceInfo']) {
      if (catalogo.has(clave)) { catalogo.delete(clave); metadatosFuera++; }
    }
  }

  // 2 · Lo alcanzable desde el catálogo. Todo lo demás son revisiones viejas.
  const semillas = [raiz];
  if (info && objetos.has(info.num)) semillas.push(info);
  const vivos = alcanzables(objetos, semillas);
  const tirados = objetos.size - vivos.size;

  // 3 · Imágenes. Es lo único que mueve la aguja en un escaneo.
  let imagenes = 0;
  let bytesImagen = 0;
  if (cfg.recomprimirImagenes && hayLienzo()) {
    for (const num of vivos) {
      const e = objetos.get(num);
      if (!(e?.valor instanceof Flujo)) continue;
      const antes = e.valor.datos.length;
      const nuevo = await recomprimirImagen(e.valor, cfg);
      if (nuevo) { e.valor = nuevo; imagenes++; bytesImagen += antes - nuevo.datos.length; }
    }
  }

  // 4 · Lo que viajaba en crudo, desinflado.
  let desinflados = 0;
  for (const num of vivos) {
    const e = objetos.get(num);
    if (!(e?.valor instanceof Flujo)) continue;
    const f = e.valor;
    if (f.dic.has('Filter') || !f.datos.length) continue;
    // `/XRef` no se copia: la tabla se escribe de cero más abajo.
    if (nombreDe(f.dic, 'Type') === 'XRef') continue;
    const comprimido = await desinflar(f.datos);
    if (comprimido.length >= f.datos.length) continue;
    f.dic.set('Filter', new Nombre('FlateDecode'));
    f.dic.set('Length', comprimido.length);
    e.valor = new Flujo(f.dic, comprimido);
    desinflados++;
  }

  // 5 · Escribir de nuevo, renumerando.
  let salida;
  try {
    salida = await escribirDocumento(objetos, vivos, raiz, info);
  } catch {
    return salir('ilegible');
  }

  // La promesa que sostiene todo: lo que sale se vuelve a leer.
  const comprobado = await volverALeer(salida, paginasAntes);
  if (!comprobado) return salir('no-verificado', { paginas: paginasAntes });

  if (salida.length >= pesoInicial) {
    return salir('sin-ganancia', {
      paginas: paginasAntes, imagenes, desinflados, tirados, metadatosFuera,
    });
  }

  return {
    archivo: new Blob([salida], { type: 'application/pdf' }),
    pesoInicial,
    pesoFinal: salida.length,
    comprimido: true,
    motivo: null,
    detalle: {
      paginas: paginasAntes, imagenes, bytesImagen, desinflados, tirados,
      metadatosFuera, imagenesOmitidas: !hayLienzo(),
    },
  };
}

async function escribirDocumento(objetos, vivos, raiz, info) {
  // Renumeración 1..N. Los huecos de la numeración original se van con las
  // revisiones viejas, y la tabla de referencias no paga por ellos.
  const orden = [...vivos].filter((n) => objetos.has(n)).sort((a, b) => a - b);
  const mapa = new Map(orden.map((n, k) => [n, k + 1]));
  const renum = (v) => transformar(v, (r) => (mapa.has(r.num) ? new Ref(mapa.get(r.num), 0) : null));

  const sueltos = []; // flujos: van tal cual
  const empacables = []; // el resto: van dentro de un /ObjStm
  for (const viejo of orden) {
    const nuevo = mapa.get(viejo);
    const valor = renum(objetos.get(viejo).valor);
    (valor instanceof Flujo ? sueltos : empacables).push([nuevo, valor]);
  }

  const numObjStm = orden.length + 1;
  const numXRef = orden.length + 2;
  const total = orden.length + 3; // +1 porque el objeto 0 existe y está libre

  // El `/ObjStm`: cabecera de pares «número desplazamiento» y detrás los
  // objetos pegados. Es lo que evita que el archivo salga MÁS GRANDE: sin
  // esto, cada diccionario pequeño pagaría su `N 0 obj … endobj` y su entrada
  // de 20 bytes en la tabla.
  const cabecera = [];
  const cuerpo = new Pluma();
  for (const [num, valor] of empacables) {
    cabecera.push(`${num} ${cuerpo.largo}`);
    cuerpo.bytes(aTexto(valor));
    cuerpo.texto(' ');
  }
  const cabBytes = CODIF.encode(cabecera.join(' ') + (cabecera.length ? ' ' : ''));
  const planoObjStm = new Uint8Array(cabBytes.length + cuerpo.largo);
  planoObjStm.set(cabBytes, 0);
  planoObjStm.set(cuerpo.juntar(), cabBytes.length);
  const objStmDatos = await desinflar(planoObjStm);

  const doc = new Pluma();
  doc.texto('%PDF-1.5\n%\xe2\xe3\xcf\xd3\n');
  const posiciones = new Map();

  const escribirFlujo = (num, dic, datos) => {
    posiciones.set(num, doc.largo);
    dic.set('Length', datos.length);
    doc.texto(`${num} 0 obj\n`);
    doc.bytes(aTexto(dic));
    doc.texto('\nstream\n');
    doc.bytes(datos);
    doc.texto('\nendstream\nendobj\n');
  };

  for (const [num, flujo] of sueltos) escribirFlujo(num, flujo.dic, flujo.datos);

  if (empacables.length) {
    const dic = new Map([
      ['Type', new Nombre('ObjStm')],
      ['N', empacables.length],
      ['First', cabBytes.length],
      ['Filter', new Nombre('FlateDecode')],
    ]);
    escribirFlujo(numObjStm, dic, objStmDatos);
  }

  // Tabla de referencias como flujo. Tres campos: tipo, desplazamiento y
  // generación —o número de `/ObjStm` e índice dentro de él para el tipo 2.
  const ANCHOS = [1, 4, 2];
  const filas = new Uint8Array(total * 7);
  const poner = (idx, t, a, b) => {
    const o = idx * 7;
    filas[o] = t;
    filas[o + 1] = (a >>> 24) & 0xff; filas[o + 2] = (a >>> 16) & 0xff;
    filas[o + 3] = (a >>> 8) & 0xff; filas[o + 4] = a & 0xff;
    filas[o + 5] = (b >>> 8) & 0xff; filas[o + 6] = b & 0xff;
  };
  poner(0, 0, 0, 0xffff); // el objeto 0 siempre está libre
  const indiceEnObjStm = new Map(empacables.map(([num], k) => [num, k]));
  for (const [num] of [...sueltos, ...empacables].sort((a, b) => a[0] - b[0])) {
    if (posiciones.has(num)) poner(num, 1, posiciones.get(num), 0);
    else poner(num, 2, numObjStm, indiceEnObjStm.get(num));
  }
  if (empacables.length) poner(numObjStm, 1, posiciones.get(numObjStm), 0);

  const posXRef = doc.largo;
  poner(numXRef, 1, posXRef, 0);
  const xrefDatos = await desinflar(filas);
  const dicXRef = new Map([
    ['Type', new Nombre('XRef')],
    ['Size', total],
    ['W', ANCHOS],
    ['Root', new Ref(mapa.get(raiz.num), 0)],
    ['Filter', new Nombre('FlateDecode')],
  ]);
  if (info && mapa.has(info.num)) dicXRef.set('Info', new Ref(mapa.get(info.num), 0));
  escribirFlujo(numXRef, dicXRef, xrefDatos);
  doc.texto(`startxref\n${posXRef}\n%%EOF\n`);
  return doc.juntar();
}

/** Copia cambiando las referencias. Una referencia a algo tirado se vuelve `null`. */
function transformar(valor, fn) {
  if (valor instanceof Ref) return fn(valor);
  if (valor instanceof Flujo) return new Flujo(transformar(valor.dic, fn), valor.datos);
  if (valor instanceof Map) {
    const m = new Map();
    for (const [k, v] of valor) m.set(k, transformar(v, fn));
    return m;
  }
  if (Array.isArray(valor)) return valor.map((v) => transformar(v, fn));
  return valor;
}

/**
 * Analiza un PDF y devuelve lo que hay dentro. Es lo que usa la segunda
 * promesa para releer su propia salida, y se exporta porque una prueba que
 * quiera comprobar que un valor sobrevivió a la reescritura NO PUEDE MIRAR LOS
 * BYTES: van dentro de un `/ObjStm` desinflado. Hay que volver a leerlos.
 */
export async function analizarPdf(bytes) {
  const objetos = localizarObjetos(bytes);
  await expandirObjStm(objetos);
  const { raiz, info, cifrado } = hallarRaiz(bytes, objetos);
  return { objetos, raiz, info, cifrado, paginas: raiz ? contarPaginas(objetos, raiz) : -1 };
}

/**
 * La segunda promesa. Se vuelve a analizar lo escrito con el mismo lector y se
 * exige que el catálogo resuelva y que las páginas sean las mismas. No prueba
 * que un lector de PDF esté contento, y por eso el candado no dice que sí a
 * ciegas: dice que si esto falla, no se entrega.
 */
async function volverALeer(salida, paginasAntes) {
  try {
    const { raiz, cifrado, paginas } = await analizarPdf(salida);
    if (cifrado || !raiz) return false;
    return paginas === paginasAntes;
  } catch {
    return false;
  }
}

// ── Imágenes ────────────────────────────────────────────────────────────────

const hayLienzo = () =>
  typeof createImageBitmap === 'function' && typeof document !== 'undefined' &&
  typeof document.createElement === 'function';

/**
 * Solo JPEG (`/DCTDecode`), y sin excusas: los bytes de ese flujo SON un JPEG,
 * así que se decodifican, se reducen y se vuelven a codificar. Al salir siempre
 * en RGB de 8 bits se reescribe también `/ColorSpace`, y así un original en
 * CMYK no acaba con los colores invertidos —que es como se rompe esto cuando
 * se hace a medias.
 *
 * Se deja quieta si es máscara, si lleva más de un filtro o si no se gana peso.
 */
async function recomprimirImagen(flujo, cfg) {
  const dic = flujo.dic;
  if (nombreDe(dic, 'Subtype') !== 'Image') return null;
  if (dic.get('ImageMask') === true) return null;
  const filtros = comoArreglo(dic.get('Filter'));
  if (filtros.length !== 1 || nombreDe2(filtros[0]) !== 'DCTDecode') return null;
  const ancho = dic.get('Width');
  const alto = dic.get('Height');
  if (typeof ancho !== 'number' || typeof alto !== 'number' || !ancho || !alto) return null;

  const escala = Math.min(1, cfg.anchoMaximoImagen / Math.max(ancho, alto));
  const nAncho = Math.max(1, Math.round(ancho * escala));
  const nAlto = Math.max(1, Math.round(alto * escala));

  let mapa;
  try {
    mapa = await createImageBitmap(new Blob([flujo.datos], { type: 'image/jpeg' }));
  } catch {
    return null; // JPEG que el navegador no decodifica: se deja como estaba
  }
  const lienzo = document.createElement('canvas');
  lienzo.width = nAncho;
  lienzo.height = nAlto;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(mapa, 0, 0, nAncho, nAlto);
  mapa.close?.();

  const blob = await new Promise((res) => lienzo.toBlob(res, 'image/jpeg', cfg.calidadImagen));
  if (!blob) return null;
  const nuevos = new Uint8Array(await blob.arrayBuffer());
  if (nuevos.length >= flujo.datos.length) return null;

  const nuevo = new Map(dic);
  nuevo.set('Width', nAncho);
  nuevo.set('Height', nAlto);
  nuevo.set('ColorSpace', new Nombre('DeviceRGB'));
  nuevo.set('BitsPerComponent', 8);
  nuevo.set('Length', nuevos.length);
  nuevo.delete('Decode');
  nuevo.delete('DecodeParms');
  return new Flujo(nuevo, nuevos);
}

// ── Utilidades públicas ─────────────────────────────────────────────────────

async function aBytes(entrada) {
  if (entrada instanceof Uint8Array) return entrada;
  if (entrada instanceof ArrayBuffer) return new Uint8Array(entrada);
  return new Uint8Array(await entrada.arrayBuffer());
}

/**
 * El peso como se dice en voz alta. Un decimal a partir de MB, ninguno en KB:
 * «1,4 MB» se retiene y «1.428 KB» no.
 */
export function formatearPeso(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** El ahorro en porcentaje entero. Nunca negativo: si no se ganó, es 0. */
export function ahorro(pesoInicial, pesoFinal) {
  if (!pesoInicial || pesoFinal >= pesoInicial) return 0;
  return Math.round(((pesoInicial - pesoFinal) / pesoInicial) * 100);
}

/** Que sea PDF de verdad: la extensión miente y el `type` del navegador también. */
export async function esPdf(archivo) {
  try {
    const cabeza = new Uint8Array(await archivo.slice(0, 1024).arrayBuffer());
    return buscar(cabeza, '%PDF-', 0) >= 0;
  } catch {
    return false;
  }
}
