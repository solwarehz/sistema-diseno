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
function bloques(css) {
  const salida = [];
  let i = 0;
  while (i < css.length) {
    const abre = css.indexOf('{', i);
    if (abre < 0) break;
    let prof = 1;
    let j = abre + 1;
    while (j < css.length && prof > 0) {
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

for (const b of todos) {
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

${dependenciasSueltas.length ? '/* Dependencias del paquete que no pertenecen a ningun elemento */\n' + dependenciasSueltas.join('\n') + '\n\n' : ''}${secciones.join('\n')}`;

mkdirSync(AQUI, { recursive: true });
writeFileSync(join(AQUI, 'componentes.css'), salida);

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

  const huerfanas = [];
  for (const f of readdirSync(dirComponentes).filter((f) => /\.tsx$/.test(f))) {
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
