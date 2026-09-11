#!/usr/bin/env node
/**
 * EXTRACTOR DE ESTILOS DE COMPONENTE
 *
 *   node sistema/componentes/extraer.mjs
 *
 * Escribe `sistema/componentes/componentes.css`: los estilos de los elementos
 * del sistema, listos para importar.
 *
 * POR QUÉ EXISTE. El área de sistemas reportó que replicar la tabla les costaba
 * mucho, y tenían razón: los estilos vivían SOLO dentro del catálogo —una página
 * de demostración de 881 KB— y la entrega no llevaba ni una regla. Cada proyecto
 * los reconstruía mirando.
 *
 * Y el coste no era lo peor. Un elemento reconstruido a ojo pierde justo lo que
 * no se ve: el anillo de foco, el filete que acompaña al color, la altura de
 * fila que es blanco táctil. **Un sistema cuyos elementos se rehacen mirando no
 * garantiza nada.**
 *
 * CÓMO EVITA DIVERGIR. No copia ni reescribe: EXTRAE del catálogo ya generado.
 * La hoja entregada y la que se ve en pantalla son literalmente las mismas
 * reglas, así que no pueden separarse. Si el catálogo cambia, la entrega cambia.
 *
 * QUÉ NO ES. No son componentes de React. Escribir React que no se puede
 * compilar en esta máquina sería entregar código nunca ejecutado, que es lo que
 * este sistema prohíbe. Esto elimina la reconstrucción del ESTILO; el
 * comportamiento sigue siendo del proyecto hasta que haya dónde compilarlo.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

// ── Qué sale y qué se queda ─────────────────────────────────────────────────
// Lista BLANCA a propósito: lo que no esté clasificado no viaja. Al revés
// —lista negra— cualquier clase nueva del catálogo acabaría en la entrega sin
// que nadie lo decidiera.

const ELEMENTOS = [
  { n: 'Botón',                 p: ['btn'] },
  { n: 'Enlace',                p: ['enl', 'enlace'] },
  { n: 'Campo de texto',        p: ['campo', 'cg', 'msj'] },
  // El campo que jamás se normaliza, con su conmutador ver/no ver (v1.37.0).
  { n: 'Campo de contraseña',   p: ['cp'] },
  // R102: la fila COMÚN de las tres cargas — imagen, PDF e ID. Va primero
  // porque es de la que dependen las otras tres: sin ella, cada una vuelve a
  // romper la rejilla del formulario a su manera.
  { n: 'Fila de carga',         p: ['cx'] },
  // R35: elegir, encuadrar (mover + acercar) y recortar en cuadrado.
  { n: 'Carga de imagen',       p: ['ci'] },
  // R43: soltar o elegir UN PDF, comprobarlo en los bytes y comprimirlo.
  { n: 'Carga de PDF',          p: ['cpdf'] },
  // R51: las dos caras del documento de identidad, con su proporción ID-1.
  { n: 'Carga de ID',           p: ['cid'] },
  // R44: el campo de varias líneas que crece con lo escrito.
  { n: 'Área de texto',         p: ['ta'] },
  { n: 'Selector',              p: ['sel'] },
  { n: 'Interruptor',           p: ['sw'] },
  { n: 'Selección múltiple',    p: ['ms'] },
  // R69 · Dos o tres opciones excluyentes en una línea. Elemento aparte y no
  // variante de `ms`: aquélla apila una fila por opción y ésta reparte el ancho,
  // que es lo que la hace repetible diez veces en una tabla a 390 px.
  { n: 'Segmentado',            p: ['sg'] },
  { n: 'Fecha y rango',         p: ['fc'] },
  { n: 'Horario',               p: ['hor'] },
  { n: 'Chip de estado',        p: ['chip'] },
  { n: 'Avatar',                p: ['avatar'] },
  { n: 'Tarjeta de persona',    p: ['tp'] },
  // R59 · Prefijo propio y no `tn-`: el corte de prefijos es en el guion, así
  // que `.tna` no cae dentro de `tn` por accidente. Y es un elemento aparte,
  // no una variante: tiene su propia página y su propio contrato.
  { n: 'Tarjeta de acción',     p: ['tna'] },
  { n: 'Tarjeta',               p: ['tn'] },
  // R28 (Control Administrativos, 2026-08-10): el marco que encierra barra +
  // tabla + pie. Estaba en SOLO_CATALOGO y cada consumidor copiaba sus cuatro
  // declaraciones a mano.
  { n: 'Bloque de contenido',   p: ['bloque'] },
  { n: 'Tabla de datos',        p: ['tb'] },
  { n: 'Tabla simple',          p: ['tabla'] },
  { n: 'Paginación',            p: ['pgn', 'pg-pos'] },
  { n: 'Barra de progreso',     p: ['pr'] },
  { n: 'Aviso temporal',        p: ['av'] },
  { n: 'Confirmación en línea', p: ['cf'] },
  { n: 'Estados de pantalla',   p: ['ep', 'esqueleto'] },
  { n: 'Marco de aplicación',   p: ['lat', 'nav', 'top', 'us', 'app', 'm', 'fg', 'velo', 'badge'] },
  // No es un elemento: es una utilidad transversal. Va en la lista porque lo
  // que no este aqui NO VIAJA, y sin ella los textos de solo-lector se ven.
  { n: 'Migas de pan',          p: ['migas'] },
  { n: 'Cabecera de pantalla',  p: ['pant'] },
  { n: 'Panel de la barra',     p: ['pb'] },
  // R97 · Reparte permisos por modulo. Se COMPONE de Interruptor, Chip y Boton;
  // lo unico suyo es el andamiaje de la lista.
  { n: 'Panel de privilegios',  p: ['pp'] },
  // R105 · Pasarela de pagos. VIAJA, y eso fue una correccion: nacio como
  // composicion «solo catalogo», y con eso la promesa NO se podia garantizar —
  // lo que no viaja, `verificar-promesa` no lo compara. Un producto montaba la
  // pantalla del cobro a ojo, que es el defecto que este sistema existe para
  // eliminar.
  //
  // Lo que NO viaja se llama `psl-demo-*` y lo corta `esParteAndamio`: el
  // navegador dibujado y —esto importa— el FORMULARIO FALSO de tarjeta. Ese
  // marcado imita el que pinta el SDK de Izipay, y entregarlo seria invitar a
  // un producto a maquetar campos de tarjeta propios. Los campos de tarjeta los
  // pinta Izipay o no los pinta nadie.
  { n: 'Pasarela de pagos',     p: ['psl'] },
  // R106 · Comprobante electronico: boleta, factura, notas de credito y debito,
  // y guia de remision. VIAJA por la misma razon que la pasarela — y con mas
  // motivo: un producto que emite DOCUMENTOS TRIBUTARIOS no puede rehacer a ojo
  // ni las lineas, ni el estado ante SUNAT, ni la representacion impresa, que
  // es la unica superficie del sistema cuyo contenido lo manda una norma.
  { n: 'Comprobante electronico', p: ['cpe'] },
  { n: 'Redes sociales', p: ['rs'] },
  { n: 'Diálogo',               p: ['dialogo'] },
  { n: 'Utilidades',            p: ['sr', 'mono'] },
];

// Clases que son SOLO del catálogo. Se listan una a una para poder distinguir
// «no clasificado todavía» de «decidido que no sale». Un elemento nuevo que
// caiga aquí por descuido se quedaría fuera de la entrega sin que se note, y
// por eso el extractor grita cuando aparece un prefijo que no está en ninguna
// de las dos listas.
// `sr-solo` NO va aqui: es una utilidad del SISTEMA y tiene que viajar.
const SOLO_CATALOGO = new Set([
  'w', 'pag', 'cat', 'caso', 'sub', 'mal', 'tira', 'cam',
  'atajo', 'cod', 'anatomia', 'anat', 'muestra', 'foco', 'op', 's', 'dialogos',
  'aviso', 'ic', 'ico', 'sin', 'filas', 'grupo', 'leyenda', 'pt', 'num',
  'motivo', 'conmutador', 'esc', 'esp', 'rejilla', 'rej', 'campos', 'estado',
  'estados', 'est', 'pendiente', 'tipo', 'iconos', 'dlg', 'man', 'mono', 'peso',
  'marca', 'ancho', 'cab', 'mf', 'activo', 'lienzo', 'copiar', 'seccion', 'demo',
  'pg-demo', 'pg-variantes', 'pg-var', 'envoltorio', 'movil', 'codigo', 'atajos',
  'manual', 'escala', 'maqueta', 'apagado', 'deuda', 'pesos', 'anchos', 'casos',
  'fila', 'mensajes', 'bien', 'emoji',
  // Las clases de escalon —`.color-azul_600`— NO se extraen, y no porque sean
  // del catalogo: es que ya viajan por `tokens.css`, que se entrega aparte.
  // Sacarlas tambien aqui daria DOS declaraciones del mismo color en dos
  // archivos, y el dia que una cambie sin la otra gana la que se importe
  // despues. Un color con dos fuentes es justo lo que este sistema no admite.
  // Igual las de token semantico: `.token-accion` viaja tambien por tokens.css.
  'color', 'token',
  // Chrome del propio catalogo, sin equivalente en un producto.
  'maquetas', 'escudo', 'opciones',
]);

// ── Troceado del CSS respetando las @media ──────────────────────────────────

/** Parte el CSS en bloques de primer nivel, contando llaves. Un `split('}')`
 *  parte las @media por la mitad y produce reglas inválidas. */
/**
 * Busca el siguiente carácter SALTANDO LOS COMENTARIOS.
 *
 * Sin esto, una llave dentro de un comentario abría un bloque falso: el
 * comentario `/* … `meses={1}` … *\/` hacía que el troceador empezara el bloque
 * en esa llave, el selector saliera inválido y **se descartara la regla
 * siguiente entera**. Pasó de verdad: la v1.103.0 se publicó con la regla de
 * `.fc-cal-cuerpo` fuera de la hoja entregada, y el arreglo que documentaba ese
 * mismo comentario no llegó a ningún producto. El texto que explicaba el
 * arreglo era lo que lo anulaba.
 *
 * Reescribir la prosa esquiva el síntoma; esto cierra el agujero.
 */
function fueraDeComentario(css, desde, ch) {
  let i = desde;
  while (i < css.length) {
    if (css[i] === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      if (fin < 0) return -1;
      i = fin + 2;
      continue;
    }
    if (css[i] === ch) return i;
    i++;
  }
  return -1;
}

function bloques(css) {
  const salida = [];
  let i = 0;
  while (i < css.length) {
    const abre = fueraDeComentario(css, i, '{');
    if (abre < 0) break;
    let prof = 1;
    let j = abre + 1;
    while (j < css.length && prof > 0) {
      if (css[j] === '/' && css[j + 1] === '*') {
        const fin = css.indexOf('*/', j + 2);
        j = fin < 0 ? css.length : fin + 2;
        continue;
      }
      if (css[j] === '{') prof++;
      else if (css[j] === '}') prof--;
      j++;
    }
    // Los comentarios se quitan DEL SELECTOR, no del bloque. Antes se descartaba
    // toda regla precedida de un comentario porque su selector «empezaba por
    // /*», y en un archivo tan comentado como este eso tiraba reglas en
    // silencio: la base de .btn y la cebra de la tabla se perdieron así, y solo
    // se vieron al montar la hoja sola y mirarla.
    const bruto = css.slice(i, abre);
    salida.push({
      sel: bruto.replace(/\/\*[\s\S]*?\*\//g, '').trim(),
      comentario: (bruto.match(/\/\*[\s\S]*?\*\//g) || []).join('\n'),
      cuerpo: css.slice(abre + 1, j - 1),
      entero: bruto.replace(/\/\*[\s\S]*?\*\//g, '').trim() + css.slice(abre, j),
    });
    i = j;
  }
  return salida;
}

/** La PRIMERA clase del selector, entera. Comparar solo el tramo de letras
 *  mezclaba `.pgn-btn` —que es el componente— con `.pg-demo`, que es la
 *  demostración del catálogo: los dos empiezan por «pg». */
const claseDe = (sel) => {
  const m = sel.match(/\.([a-z][a-z0-9-]*)/);
  return m ? m[1] : null;
};

/** Coincide la clase entera o un descendiente suyo: `tb` caza `.tb` y `.tb-sub`
 *  pero NO `.tbotro`. */
const cazaPatron = (clase, patron) => clase === patron || clase.startsWith(patron + '-');

/** ¿Este selector pertenece al elemento? Basta con que UNA de sus partes lo sea:
 *  `.tabla-simple, .tb-sub { … }` es de los dos, y sale en los dos. */
const esDe = (sel, patrones) =>
  sel.split(',').some((parte) => {
    const c = claseDe(parte);
    return c && patrones.some((p) => cazaPatron(c, p));
  });

// ── Andamiaje que comparte prefijo con clases reales ────────────────────────
// La lista de prefijos no puede cortarlo: `.sw-rejilla` empieza por `sw-`
// igual que `.sw-bolita`, pero una es la rejilla de muestras del catálogo y la
// otra es el interruptor de verdad. Así viajaban ~109 líneas de andamiaje —y
// la auditoría del 2026-08-10 encontró la ironía: la ÚNICA regla con `.bloque`
// que viajaba era `.cat-cuerpo, .pagina, .bloque, .app-main`, o sea, la del
// andamio. Se corta POR PARTE de selector: esa regla ahora viaja como
// `.bloque, .app-main { … }` en vez de arrastrar el andamio o perderse entera.
// Verificado antes de cortar: ningún TSX emite estas clases y ni el manual ni
// el contrato las documentan.
const ANDAMIO_NOMBRADO = new Set([
  'anatomia', 'tabla-manual', 'tabla-escala', 'tabla-escala-caja',
  'top-cascaron', 'cat-cuerpo', 'pagina',
]);
const esParteAndamio = (parte) => {
  // data-vista es el simulador de anchos del catálogo; data-app, su marco de
  // teléfono con cámara y gestos. Ningún producto los pone: el React no los
  // escribe y el manual no los enseña.
  if (/\[data-(vista|app)[\]='"]/.test(parte)) return true;
  return [...parte.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)]
    .some((m) => /(^|-)demo(-|$)/.test(m[1])
      || /(^|-)rejilla(-\d+)?$/.test(m[1])
      || ANDAMIO_NOMBRADO.has(m[1]));
};
/** La regla sin sus partes de andamio, o null si era todo andamio. */
const sinAndamio = (b) => {
  const partes = b.sel.split(',').map((p) => p.trim()).filter((p) => p && !esParteAndamio(p));
  if (partes.length === b.sel.split(',').length) return b; // no había andamio
  if (!partes.length) return null;
  return { ...b, sel: partes.join(', '), entero: `${partes.join(', ')} {${b.cuerpo}}` };
};

// ── Extracción ──────────────────────────────────────────────────────────────

const html = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const css = html.split('<style>')[1].split('</style>')[0];
const todos = bloques(css);

const porElemento = new Map(ELEMENTOS.map((e) => [e.n, []]));
const sinClasificar = new Map();
// Reglas que no son de ningun elemento pero SIN LAS CUALES el paquete no
// funciona: hoy, la declaracion de las sombras.
const dependenciasSueltas = [];
let dentroDeMedia = 0;

/* ── LAS ANIMACIONES QUE SE DECLARAN, DEFINIDAS ───────────────────────────────
 *
 * `animation: btn-girar …` sin `@keyframes btn-girar` NO ES UN AVISO: el
 * navegador la ignora en silencio. La hoja entregada declaraba DOS animaciones
 * —el giro del boton ocupado y el vaiven de la barra indeterminada— y no
 * llevaba ni un `@keyframes`: en el catalogo el giro giraba y en TODOS los
 * productos era un anillo quieto. Descubierto el 2026-09-11 por una auditoria;
 * llevaba asi desde que existe la hoja.
 *
 * Ningun candado podia verlo. `verificar-promesa` compara la cascada resuelta,
 * y `animation-name: btn-girar` computa IGUAL en las dos hojas: lo que falta no
 * es la declaracion, es la definicion. Es el mismo defecto del `box-sizing` que
 * no viajaba, con otra cara.
 *
 * Se viaja solo lo que alguien usa: se leen los nombres que las reglas ya
 * seleccionadas invocan, y se recogen SUS `@keyframes`. Si mañana alguien
 * declara una animacion que el catalogo no define, se dice y se para: una
 * animacion fantasma es una regla muerta que nadie ve morir.
 * ──────────────────────────────────────────────────────────────────────────── */
// nombre -> [bloques]. LISTA y no un solo bloque: indexar por el nombre pelado
// hacia que un `@-webkit-keyframes X` SUSTITUYERA al `@keyframes X` estandar, y
// el candado seguia verde porque el nombre existia. La entrega se quedaba con
// la variante prefijada y el giro volvia a estar quieto — el defecto original.
const keyframesDelCatalogo = new Map();
/* TAMBIEN LOS ANIDADOS. `bloques()` no entra en el cuerpo de un `@media` ni de
 * un `@supports`, asi que un `@keyframes` de dentro era invisible y el candado
 * habria PARADO LA ENTREGA diciendo que la animacion no existe. Se baja un
 * nivel, que es donde vive el CSS de verdad. */
const recogerKeyframes = (lista, prof = 0) => {
  for (const b of lista) {
    const k = b.sel.match(/^@(?:-webkit-|-moz-|-o-)?keyframes\s+([\w-]+)$/);
    if (k) {
      if (!keyframesDelCatalogo.has(k[1])) keyframesDelCatalogo.set(k[1], []);
      keyframesDelCatalogo.get(k[1]).push(b.entero);
    } else if (prof < 2 && /^@(media|supports|layer|container)\b/.test(b.sel)) {
      recogerKeyframes(bloques(b.cuerpo), prof + 1);
    }
  }
};
recogerKeyframes(todos);

for (const b of todos) {
  if (/^@(?:-webkit-|-moz-|-o-)?keyframes\b/.test(b.sel)) continue;
  if (b.sel.startsWith('@media')) {
    // R27: la politica de movimiento reducido es UNA regla resuelta una vez;
    // sin ella los tokens de duracion viajarian sin su apagado y cada producto
    // volveria a escribirlo. Va con las dependencias, no con un elemento.
    if (b.sel.includes('prefers-reduced-motion') && /--dur-/.test(b.cuerpo)) {
      dependenciasSueltas.push(b.entero);
      continue;
    }
    // Se conserva la envoltura: una regla de @media sin su @media no vale nada.
    for (const e of ELEMENTOS) {
      const dentro = bloques(b.cuerpo).map(sinAndamio).filter(Boolean)
        .filter((r) => r.sel && esDe(r.sel, e.p));
      if (dentro.length) {
        porElemento.get(e.n).push(`${b.sel} {\n${dentro.map((r) => '  ' + r.entero).join('\n')}\n}`);
        dentroDeMedia += dentro.length;
      }
    }
    continue;
  }
  // Los `:root` se saltan porque los tokens de color los entrega `tokens.css`.
  // PERO había uno que no es de color y no lo entrega nadie: el de las sombras.
  // Nueve reglas del paquete escriben `box-shadow: var(--sombra-capa)` y el
  // consumidor recibía la variable sin declarar —la capa flotante, el menú y
  // el aviso salían planos y nadie sabía por qué—. Se acompaña al paquete.
  // R27: los tokens de movimiento viajan por la misma via que las sombras.
  if (b.sel && b.sel.startsWith(':root') && /--sombra-|--dur-|--curva|--permanencia-/.test(b.entero)) {
    dependenciasSueltas.push(b.entero);
    continue;
  }
  // [data-tema se saltaba EN BLOQUE porque el tema viaja por tokens.css — y
  // el bloque se llevaba por delante dos cosas que los tokens no pueden dar:
  //   (a) las reglas ESTRUCTURALES cuyo color va incrustado en un SVG
  //       data-URI (la flecha del select, el icono del calendario): un
  //       data-URI no puede usar var(), así que el oscuro necesita SU regla;
  //   (b) la redefinición de las sombras del marco en oscuro, que es
  //       dependencia del paquete igual que su :root de al lado.
  // El resultado medido (2026-08-10, lo vio el equipo de desarrollo): en todo
  // producto en modo oscuro la flecha del select quedaba #6A6864 sobre fondo
  // oscuro — el select parecía sin estilo. Ahora se salta SOLO la
  // redefinición pura de tokens de color.
  if (b.sel && b.sel.startsWith('[data-tema')) {
    const puroTema = /^\[data-tema[^\]]*\](\s*,\s*:root[^{]*)?$/.test(b.sel);
    if (puroTema && /--sombra-|--canto-/.test(b.entero)) { dependenciasSueltas.push(b.entero); continue; }
    if (puroTema) continue; // tokens de color: esos sí viajan por tokens.css
    // estructural bajo tema: sigue y se clasifica como cualquier regla
  }
  // EL RESET UNIVERSAL. No es de ningún elemento, así que se caía por el mismo
  // agujero que las sombras: el extractor reparte por clase y esta regla no
  // tiene ninguna. Pero TODO el catálogo está maquetado con `border-box`, y sin
  // ella el producto recibe los componentes en `content-box` — el relleno y el
  // borde SUMAN al ancho declarado, y cada caja de tamaño fijo mide distinto de
  // lo que se enseñó.
  //
  // Lo encontró el candado de la promesa, y lo encontró en los DIECIOCHO casos
  // a la vez, que es lo que delata que no era un defecto de un componente sino
  // del cimiento. Lo reportó el responsable: «no veo el boton csv como lo veo
  // en el cascaron».
  if (b.sel && /^\*(\s*,\s*\*::[a-z-]+)*$/.test(b.sel.replace(/\s+/g, ' ').trim())
      && /box-sizing/.test(b.cuerpo)) {
    dependenciasSueltas.push(b.entero);
    continue;
  }
  if (!b.sel || b.sel.startsWith('@') || b.sel.startsWith(':root')) continue;

  const limpio = sinAndamio(b);
  if (!limpio) continue; // era todo andamio: decidido que no sale
  let colocado = false;
  for (const e of ELEMENTOS) {
    if (esDe(limpio.sel, e.p)) {
      porElemento.get(e.n).push(limpio.entero);
      colocado = true;
    }
  }
  if (!colocado) {
    const c = claseDe(b.sel);
    const conocida = c && [...SOLO_CATALOGO].some((p) => cazaPatron(c, p));
    if (c && !conocida) sinClasificar.set(c, (sinClasificar.get(c) || 0) + 1);
  }
}

// ── Escritura ───────────────────────────────────────────────────────────────

/* Los nombres que INVOCAN las reglas ya seleccionadas. `animation: none` no
 * invoca nada, y la envoltura de `prefers-reduced-motion` tampoco. */
const cssSeleccionado = [
  ...ELEMENTOS.flatMap((e) => porElemento.get(e.n)),
  ...dependenciasSueltas,
].join('\n');
/* CÓMO SE LEE UN VALOR DE `animation`, y las seis formas en que esto falló.
 *
 * El atajo de CSS no obliga a poner el nombre primero —`animation: 2s ease X
 * infinite` es tan válido como `animation: X 2s`— y admite varias animaciones
 * separadas por comas. La primera versión leía solo el PRIMER token; la
 * segunda tokenizaba pero seguía teniendo cinco agujeros que una auditoría
 * encontró el 2026-09-11, tres de ellos PARANDO LA ENTREGA en falso:
 *
 *   · un COMENTARIO de CSS que mencionara `animation:` convertía cada palabra
 *     de la prosa en una animación fantasma. En un catálogo tan comentado como
 *     éste, era cuestión de tiempo.
 *   · `animation: EASE 1s` — las palabras clave de CSS NO distinguen mayúsculas.
 *   · `steps(4 , jump-end )` con un espacio delante del paréntesis: el cierre
 *     dejaba de ir pegado al token y `jump-end` pasaba por nombre.
 *   · `ANIMATION-NAME:` en mayúsculas era invisible: los nombres de propiedad
 *     de CSS tampoco distinguen mayúsculas.
 *   · `animation: --mi-ident 1s` quedaba sin comprobar, porque se descartaba
 *     todo token que empezara por `-` para no confundirlo con `-1s`.
 *
 * Se resuelve limpiando primero —comentarios fuera, grupos entre paréntesis
 * fuera— y comparando las palabras clave en minúscula. Lo que no alcanza, y se
 * dice: un nombre con escapes (`aud4\.esc`) no se ve, ni el que vive dentro de
 * un `@media` anidado, porque el reparto lo descarta antes de llegar aquí. */
const PALABRAS_DE_ANIMACION = new Set([
  'none', 'normal', 'reverse', 'alternate', 'alternate-reverse',
  'forwards', 'backwards', 'both', 'running', 'paused', 'infinite',
  'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
  'step-start', 'step-end', 'start', 'end',
  'jump-start', 'jump-end', 'jump-none', 'jump-both',
  'initial', 'inherit', 'unset', 'revert', 'revert-layer',
]);
/** Los tokens del valor que solo pueden ser un NOMBRE de animación. */
/**
 * Los nombres de animación de un valor, LEÍDOS COMO LOS LEE EL NAVEGADOR.
 *
 * El atajo `animation` admite, por cada grupo separado por comas, **un solo**
 * `<keyframes-name>`, y los demás tokens se consumen como tiempo, curva,
 * repeticiones, dirección o estado. Así que en `animation: btn-girar 1s ease`
 * el nombre es `btn-girar` y `ease` es la CURVA — no un segundo nombre. Un
 * rescate por subcadena se traía un `@keyframes ease` que nadie invoca, y peor:
 * en `animation: linear 1s` el navegador lee `linear` como curva y la regla se
 * queda SIN NOMBRE, así que un `@keyframes linear` ahí es CSS muerto.
 *
 * En `animation-name`, en cambio, no hay ambigüedad: todo token es un nombre,
 * incluso uno que se llame como una palabra clave.
 */
const nombresDe = (valor, esAtajo) => valor
  // La llamada ENTERA, con su nombre: quitando solo el paréntesis quedaba
  // `var` suelto y el candado paraba la entrega diciendo que faltaba una
  // animación llamada así. Anidadas de un nivel, que es lo que hay en CSS.
  .replace(/[\w-]*\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ' ')
  .split(',')
  .flatMap((grupo) => {
    const tokens = grupo.trim().split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t
        && !/^[-+.]?\d/.test(t)             // 2s, .5s, -1s, 300ms
        && t !== '!important'
        && /^-{0,2}[A-Za-z_][\w-]*$/.test(t));
    if (!esAtajo) {
      // `animation-name`: todo es nombre menos los valores globales.
      return tokens.filter((t) => !['none', 'initial', 'inherit', 'unset', 'revert', 'revert-layer']
        .includes(t.toLowerCase()));
    }
    return tokens.filter((t) => !PALABRAS_DE_ANIMACION.has(t.toLowerCase()));
  });

/**
 * Sin comentarios NI cadenas, en una sola pasada y en el orden correcto.
 *
 * Hacerlo con dos reemplazos independientes fallaba en los dos sentidos, y las
 * dos las midio una auditoria el 2026-09-11:
 *   · `content: "animation: Foo Bar"` fabricaba fantasmas y PARABA LA ENTREGA.
 *   · una cadena que abriera un comentario se comia todo lo que hubiera en
 *     medio, asi que una animacion muerta declarada ahi viajaba EN SILENCIO.
 * Un comentario no puede empezar dentro de una cadena ni al reves, asi que la
 * unica forma honesta es recorrerlo una vez sabiendo en que se esta.
 */
const sinComentarios = (css) => {
  let fuera = '';
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const fin = css.indexOf('*/', i + 2);
      i = fin === -1 ? css.length : fin + 2;
      fuera += ' ';
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) { j += css[j] === '\\' ? 2 : 1; }
      i = j + 1;
      fuera += ' ';
      continue;
    }
    fuera += c;
    i += 1;
  }
  return fuera;
};

const limpio = sinComentarios(cssSeleccionado);
const invocadas = new Set();
/** Invocadas por un `animation` SIN prefijo: solo ésas exigen el estándar. */
const invocadasSinPrefijo = new Set();
const fantasmas = [];
for (const m of limpio.matchAll(/(-webkit-|-moz-|-o-)?animation(-name)?\s*:\s*([^;}]+)/gi)) {
  const prefijada = Boolean(m[1]);
  const esAtajo = !m[2];
  // Las mayúsculas se respetan: un `<custom-ident>` de CSS las distingue, así
  // que `@keyframes Ease` y `ease` NO son el mismo nombre.
  for (const token of nombresDe(m[3], esAtajo)) {
    if (keyframesDelCatalogo.has(token)) {
      invocadas.add(token);
      if (!prefijada) invocadasSinPrefijo.add(token);
    } else {
      fantasmas.push(token);
    }
  }
}
/* UNA VARIANTE PREFIJADA NO SUSTITUYE AL ESTÁNDAR. Si solo existe
 * `@-webkit-keyframes X`, en cualquier navegador moderno la animación NO
 * EXISTE: es el defecto original —el anillo quieto— con otra cara, y el mapa
 * por nombre lo daba por bueno. Solo se exige a las que invoca un `animation`
 * SIN prefijo: un par `-webkit-animation` + `@-webkit-keyframes` es coherente
 * consigo mismo, y pararlo sería un falso positivo. */
const soloPrefijadas = [...invocadasSinPrefijo].filter((n) => !keyframesDelCatalogo.get(n)
  .some((bloque) => /^@keyframes\b/.test(bloque.trimStart())));
if (soloPrefijadas.length) {
  console.error(`\n  Animaciones definidas SOLO con prefijo: ${soloPrefijadas.join(', ')}`);
  console.error('  Sin la variante sin prefijo, el navegador moderno la ignora.\n');
  process.exit(1);
}
if (fantasmas.length) {
  console.error(`\n  Animaciones DECLARADAS y no definidas: ${[...new Set(fantasmas)].join(', ')}`);
  console.error('  El navegador las ignora en silencio. Define su @keyframes en el');
  console.error('  catálogo o quita la declaración.\n');
  process.exit(1);
}
const bloqueAnimaciones = invocadas.size
  ? `/* ───────────────────────────────────────────────────────────────────────────
   ANIMACIONES — ${invocadas.size} · las que estas reglas invocan, con sus variantes
   Sin su @keyframes, \`animation:\` se ignora EN SILENCIO. Hasta la v1.107.0
   no viajaban: el giro del botón ocupado y la barra indeterminada estaban
   quietos en todos los productos.
   ─────────────────────────────────────────────────────────────────────────── */

${[...invocadas].sort().flatMap((n) => keyframesDelCatalogo.get(n)).join('\n')}
`
  : '';

const secciones = ELEMENTOS.filter((e) => porElemento.get(e.n).length).map((e) => {
  const reglas = porElemento.get(e.n);
  return `/* ───────────────────────────────────────────────────────────────────────────
   ${e.n.toUpperCase()} — ${reglas.length} reglas · clases .${e.p.join('-*, .')}-*
   ─────────────────────────────────────────────────────────────────────────── */

${reglas.join('\n')}
`;
});

const salida = `/* ───────────────────────────────────────────────────────────────────────────
   ESTILOS DE COMPONENTE — Colegio Albert Einstein · MMI-DS v${VERSION}

   ARCHIVO GENERADO. No editar a mano.
   Se EXTRAE del catálogo con \`node sistema/componentes/extraer.mjs\`, así que
   estas reglas son literalmente las mismas que se ven en pantalla. No pueden
   divergir del catálogo porque no son una copia: son las mismas.

   USO
     import 'sistema-diseno-ae/componentes.css';   // después de tokens.css

   Depende de las variables de \`tokens.css\`: impórtalo DESPUÉS o no habrá
   ningún color definido.

   QUÉ TE DA Y QUÉ NO
     Sí  · el estilo exacto: anillo de foco, filetes, alturas de fila, estados
   VERIFICADO. 21 ejemplares reales del catálogo se montaron con SOLO estas dos
   hojas y se compararon propiedad a propiedad contra el catálogo: 20 idénticos.
   El que difiere es .hor-b, que hereda su tamaño de .hor: fuera de la tabla del
   horario sale a 15px en vez de 13. No es una regla que falte, es una
   DEPENDENCIA DE CONTEXTO, y por eso el contrato de marcado importa tanto como
   la hoja.

     No  · el comportamiento. Ordenar, filtrar, plegar y el teclado siguen
           siendo del proyecto. El marcado que espera cada elemento está en
           \`componentes.md\`, junto a esta hoja.
   ─────────────────────────────────────────────────────────────────────────── */

${dependenciasSueltas.length ? '/* Dependencias del paquete que no pertenecen a ningun elemento */\n' + dependenciasSueltas.join('\n') + '\n\n' : ''}${secciones.join('\n')}${bloqueAnimaciones ? '\n' + bloqueAnimaciones : ''}`;

mkdirSync(AQUI, { recursive: true });
writeFileSync(join(AQUI, 'componentes.css'), salida);

/**
 * Y SE INYECTA EN EL CATÁLOGO, para que su página «La entrega real» pueda
 * pintar los componentes con la hoja QUE SE ENTREGA y nada más.
 *
 * Va aquí y no en el generador por un problema de orden: `componentes.css` se
 * EXTRAE del catálogo, así que cuando el catálogo se genera todavía no existe
 * —o existe la de la versión anterior, que es peor—. Inyectarla en una segunda
 * pasada garantiza que la página muestra el archivo real y no una copia que
 * puede quedarse vieja, que es de lo que va todo este repositorio.
 */
const MARCA_INI = '<script type="text/plain" id="hoja-entregada">';
const MARCA_FIN = '</' + 'script>';
const catalogo = readFileSync(join(RAIZ, 'cascaron', 'index.html'), 'utf8');
const desde = catalogo.indexOf(MARCA_INI);
if (desde >= 0) {
  const hasta = catalogo.indexOf(MARCA_FIN, desde);
  // El `<` de un selector como `.fc-dias > [role]` no rompe nada dentro de un
  // `text/plain`, pero un `</script` sí cerraría el bloque. No los hay en CSS.
  const nuevo = catalogo.slice(0, desde + MARCA_INI.length) + '\n' + salida + '\n'
    + catalogo.slice(hasta);
  writeFileSync(join(RAIZ, 'cascaron', 'index.html'), nuevo);
  console.log(`  ✓ hoja entregada inyectada en el catálogo (${(salida.length / 1024) | 0} KB)`);
} else {
  console.error('\n  El catálogo no tiene el hueco `hoja-entregada`: la página');
  console.error('  «La entrega real» pintaría con la hoja del CATÁLOGO, que es');
  console.error('  justo lo que esa página existe para no hacer.\n');
  process.exit(1);
}

// ── Reporte ─────────────────────────────────────────────────────────────────

const totalReglas = ELEMENTOS.reduce((n, e) => n + porElemento.get(e.n).length, 0);
console.log(`\n  componentes.css  ${(salida.length / 1024).toFixed(0)} KB · ${totalReglas} reglas de ${todos.length}\n`);
for (const e of ELEMENTOS) {
  const n = porElemento.get(e.n).length;
  console.log(`    ${n ? '✓' : '·'} ${e.n.padEnd(24)} ${String(n).padStart(3)} reglas`);
}
if (dentroDeMedia) console.log(`\n    ${dentroDeMedia} reglas dentro de @media, con su envoltura`);

if (sinClasificar.size) {
  console.log('\n  Prefijos sin clasificar — ni de elemento ni declarados del catálogo:\n');
  [...sinClasificar.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([p, n]) => console.log(`    .${p.padEnd(14)} ${String(n).padStart(3)} reglas`));
  console.log('\n  Decide para cada uno: o es de un elemento y entra en ELEMENTOS,');
  console.log('  o es del catálogo y entra en SOLO_CATALOGO. Callarlos hace que');
  console.log('  un elemento nuevo se quede fuera de la entrega sin que se note.\n');
}
// ─────────────────────────────────────────────────────────────────────────────
// CANDADO DE LA CLASE HUÉRFANA
//
// Un componente puede invocar una clase que no existe en ninguna hoja, y no se
// nota: React la escribe en el atributo, el navegador no protesta y el elemento
// sale sin estilo. Solo se descubre mirándolo, y solo si sabes cómo debería
// verse.
//
// Había DIECIOCHO. Las peores no eran de estilo:
//   · `.sr-solo` no existía, y tres componentes la usaban para OCULTAR texto a
//     la vista. Los «Cargando» y los «(se abre en una pestaña nueva)» se veían.
//   · `.tb-th-btn` dejaba el disparador de orden con el aspecto de botón del
//     navegador dentro del encabezado de la tabla.
//
// Casi todas existían con OTRO nombre —`.tb-caja` por `.tb-envoltura`, `.ms`
// por `.ms-grupo`, `.fc-titulo` por `.fc-mes-tit`—, que es lo que pasa cuando
// el marcado se escribe mirando en vez de copiando.
// ─────────────────────────────────────────────────────────────────────────────

const dirComponentes = join(RAIZ, 'componentes', 'src');
if (existsSync(dirComponentes)) {
  const declaradas = new Set();
  for (const m of salida.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) declaradas.add(m[1]);

  // El LÍMITE CONOCIDO de la versión anterior —no veía clases dentro de un
  // array, `className={['fc-dia', ...].join(' ')}`— dejó de ser teórico el
  // 2026-08-10: RangoFecha emitía tres clases sin regla por esa vía exacta y
  // el candado decía verde (auditorias/2026-08-10-auditoria-composicion.md).
  // Ahora se recorre el contenido COMPLETO de cada className={...} contando
  // llaves, y se toma todo literal de cadena que parezca clase. El límite que
  // queda, también declarado: un literal de COMPARACIÓN dentro de la zona
  // (`className={x === 'grande' ? 'a' : 'b'}`) se tomaría por clase y daría
  // un falso rojo — ruidoso y visible, que es el lado bueno del error.
  function zonasClassName(fuente) {
    const zonas = [];
    const re = /className=/g;
    let m;
    while ((m = re.exec(fuente))) {
      const i = m.index + m[0].length;
      if (fuente[i] === '"') {
        zonas.push({ texto: fuente.slice(i + 1, fuente.indexOf('"', i + 1)), esCadena: true });
      } else if (fuente[i] === '{') {
        let nivel = 1, j = i + 1;
        while (j < fuente.length && nivel > 0) {
          if (fuente[j] === '{') nivel++;
          else if (fuente[j] === '}') nivel--;
          j++;
        }
        zonas.push({ texto: fuente.slice(i + 1, j - 1), esCadena: false });
      }
    }
    return zonas;
  }

  /**
   * TAMBIÉN `interno/`, y esto era un agujero.
   *
   * El barrido leía solo los .tsx sueltos de `componentes/src`, así que todo
   * lo que se extrae a una pieza interna salía del alcance del candado justo
   * al extraerse — que es cuando más falta hace, porque una pieza interna la
   * comparten varios componentes y su clase huérfana rompe en todos.
   * Se vio al escribir `interno/FilaCarga.tsx` (R102): sus catorce clases
   * `cx-*` no las miraba nadie. `EditorEncuadre` llevaba ahí desde la v1.45.0.
   */
  const tsx = [
    ...readdirSync(dirComponentes).filter((f) => /\.tsx$/.test(f)),
    ...(existsSync(join(dirComponentes, 'interno'))
      ? readdirSync(join(dirComponentes, 'interno'))
        .filter((f) => /\.tsx$/.test(f))
        .map((f) => join('interno', f))
      : []),
  ];

  const huerfanas = [];
  for (const f of tsx) {
    const fuente = readFileSync(join(dirComponentes, f), 'utf8');
    for (const zona of zonasClassName(fuente)) {
      // En una zona de cadena, la zona ES el literal. En una de expresión,
      // los literales son lo entrecomillado. `className={variable}` no trae
      // ninguno, y ese es el límite que QUEDA: las clases con que se arma la
      // variable en otra línea no se ven desde aquí (pasa en Migas). Declarado
      // a propósito — un candado que dice qué no ve vale más que uno que calla.
      const literales = zona.esCadena
        ? [zona.texto]
        : [...zona.texto.matchAll(/["'`]([^"'`]*)["'`]/g)].map((l) => l[1]);
      for (const lit of literales) {
        for (const c of lit.split(/\s+/)) {
          if (c.includes('${')) continue; // trozo de plantilla, queda cortado
          if (!/^[a-z][a-z0-9-]*$/.test(c)) continue;
          if (!declaradas.has(c)) huerfanas.push([f.replace('.tsx', ''), c]);
        }
      }
    }
  }

  if (huerfanas.length) {
    console.error(`  ${huerfanas.length} clase(s) que un componente invoca y NADIE define:\n`);
    for (const [comp, c] of huerfanas) console.error(`    ${comp.padEnd(16)} .${c}`);
    console.error('\n  El elemento sale SIN ESTILO en cualquier proyecto que importe');
    console.error('  esta hoja, y no da ningún error. Antes de crear la regla, busca:');
    console.error('  casi siempre existe con otro nombre y lo que falla es el marcado.\n');
    process.exit(1);
  }
  console.log(`  ✓ ${declaradas.size} clases declaradas · 0 huérfanas en los componentes\n`);
}

export { ELEMENTOS };
