/**
 * CANDADO DE LA ENTREGA — lo que el catálogo enseña y no viaja
 *
 *   node sistema/candado/verificar-entrega.mjs
 *
 * Tres veces ha pasado lo mismo, y las tres las reportó Control Administrativos
 * V2.0 desde un producto real:
 *
 *   · la TABLA vivía solo como ejemplo dentro del catálogo → se publicó TablaDatos
 *   · los ICONOS viajaban como cadenas, sin componente     → se publicó Icono
 *   · la CABECERA DE PANTALLA se ve en las 39 páginas      → no viajaba
 *
 * El efecto es siempre el mismo: un proyecto ve la pieza, la da por disponible,
 * y acaba reconstruyéndola. Reconstruida diverge, que es lo que el sistema
 * existe para impedir.
 *
 * CÓMO LO DETECTA. La frecuencia bruta no sirve: `.num` aparece 515 veces y es
 * una celda de tabla comparativa, puro catálogo. Lo que distingue un patrón
 * ESTRUCTURAL es aparecer en CASI TODAS LAS PÁGINAS: si el catálogo lo repite
 * en cada una, es que forma parte de cómo se arma una pantalla, no de cómo se
 * demuestra un elemento.
 *
 * Con ese criterio, `.pag-cab` —40 usos en 39 páginas— salta. `.num` no.
 *
 * QUÉ NO HACE. Decidir. Lo que salta se mira y se decide: o se publica como
 * componente, o se declara ESTRUCTURA_CATALOGO con su motivo. Lo que no se
 * puede es dejarlo en silencio, que es lo que pasó tres veces.
 *
 * Cálculo puro. No toca red. No escribe nada.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';
import { ELEMENTOS } from '../componentes/extraer.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');

/**
 * Clases que aparecen en casi todas las páginas y NO son un patrón de producto:
 * son la estructura del propio catálogo. Se listan una a una, con su motivo,
 * para que la exención sea una decisión y no un descuido.
 */
const ESTRUCTURA_CATALOGO = new Map([
  ['pagina', 'El contenedor de cada página del catálogo. No existe en un producto.'],
  ['pag-intro', 'La entradilla que explica el ELEMENTO. Es documentación, no interfaz.'],
  ['sub-seccion', 'Los apartados de la documentación de cada elemento.'],
  ['seccion-sub', 'El subtítulo de un apartado de documentación.'],
  ['bloque', 'La caja donde el catálogo monta sus demostraciones.'],
  ['w', 'El armazón del propio catálogo.'],
  ['ic', 'Envoltorio del SVG en plantilla. En React lo pone `Icono`.'],
]);

const catalogo = join(RAIZ, 'cascaron/index.html');
if (!existsSync(catalogo)) {
  console.error('\n  No existe cascaron/index.html. Genera el catálogo primero.\n');
  process.exit(1);
}

const html = readFileSync(catalogo, 'utf8').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

// Se trocea por páginas. Cada `<section class="pagina">` es una pantalla del
// catálogo, y lo que aparece en casi todas es estructura, no demostración.
const paginas = html.split(/<section class="pagina"/).slice(1);
if (paginas.length < 5) {
  console.error('\n  No se reconocen las páginas del catálogo; el candado no puede medir.\n');
  process.exit(1);
}

const enPaginas = new Map(); // clase → nº de páginas donde aparece
for (const pag of paginas) {
  const vistas = new Set();
  for (const m of pag.matchAll(/class="([^"]+)"/g)) {
    for (const c of m[1].split(/\s+/)) if (/^[a-z][a-z0-9-]*$/.test(c)) vistas.add(c);
  }
  for (const c of vistas) enPaginas.set(c, (enPaginas.get(c) ?? 0) + 1);
}

const prefijos = ELEMENTOS.flatMap((e) => e.p);
const viaja = (c) => prefijos.some((p) => c === p || c.startsWith(p + '-'));

// 80 %: por debajo empiezan a colarse patrones que solo usan las páginas de un
// tipo de elemento, y eso es demostración, no estructura.
const UMBRAL = Math.ceil(paginas.length * 0.8);

const sospechosas = [...enPaginas]
  .filter(([c, n]) => n >= UMBRAL && !viaja(c) && !ESTRUCTURA_CATALOGO.has(c))
  .sort((a, b) => b[1] - a[1]);

console.log(`\n  Candado de la entrega — MMI-DS v${VERSION}\n`);
console.log(`  Páginas del catálogo:  ${paginas.length}`);
console.log(`  Umbral de estructura:  ${UMBRAL} páginas (80 %)`);
console.log(`  Exentas declaradas:    ${ESTRUCTURA_CATALOGO.size}`);
console.log(`  Sin decidir:           ${sospechosas.length}\n`);

if (sospechosas.length) {
  console.error('  El catálogo repite esto en casi todas sus páginas y NO viaja:\n');
  for (const [c, n] of sospechosas) {
    console.error(`    .${c.padEnd(18)} ${n} de ${paginas.length} páginas`);
  }
  console.error('\n  Un proyecto que lo vea lo dará por disponible y acabará');
  console.error('  reconstruyéndolo. Ha pasado tres veces: la tabla, los iconos y');
  console.error('  la cabecera de pantalla.\n');
  console.error('  Dos salidas, y las dos son decisiones:');
  console.error('    · publicarlo como componente y añadir su prefijo a ELEMENTOS;');
  console.error('    · o declararlo en ESTRUCTURA_CATALOGO, con el motivo escrito.\n');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Y LA COMPROBACIÓN INVERSA: componentes publicados que el catálogo no enseña.
//
// Es el mismo fallo del revés, y hace el mismo daño. El área de sistemas se
// guía del catálogo: lo que no aparece ahí, no existe para ellos, y acaban
// reconstruyéndolo aunque esté publicado. Pasó con `Nota`, `Migas`, `Dialogo`
// y `CabeceraPantalla`, que se escribieron y no se enseñaron.
//
// El nombre de la página se declara aquí junto al del componente, porque no se
// deriva: `SeleccionMultiple` vive en la página «Selección múltiple» y
// `MenuUsuario` no tiene página propia —vive dentro del marco—.
// ─────────────────────────────────────────────────────────────────────────────

const PAGINA_DE = new Map([
  ['PanelPrivilegios', 'Panel de privilegios'],
  ['Boton', 'Botón'], ['Enlace', 'Enlace'], ['Campo', 'Campo de texto'],
  ['Selector', 'Selector'], ['SelectorBusqueda', 'Selector'],
  ['Interruptor', 'Interruptor'], ['SeleccionMultiple', 'Selección múltiple'],
  // R69 · Página propia y no compartida con el interruptor: lo que hay que
  // enseñar es justamente cuándo NO sirve el interruptor, y eso se pierde si se
  // cuenta como una variante suya.
  ['Segmentado', 'Segmentado'],
  ['RangoFecha', 'Fecha y rango'], ['Horario', 'Horario'], ['Chip', 'Chip de estado'],
  ['Avatar', 'Avatar'], ['Tarjeta', 'Tarjeta'], ['TarjetaPersona', 'Tarjeta'],
  ['TablaDatos', 'Tabla de datos'], ['Paginacion', 'Paginación'],
  ['Progreso', 'Barra de progreso'], ['Aviso', 'Aviso temporal'],
  // La zona se demuestra CON los avisos: es donde viven, y por separado no se
  // entiende (R29, v1.23.0).
  ['ZonaAvisos', 'Aviso temporal'],
  ['CargaImagen', 'Carga de imagen'],
  ['CargaPdf', 'Carga de PDF'],
  ['CargaId', 'Carga de ID'],
  ['AreaTexto', 'Área de texto'],
  // El compresor se exporta suelto para el producto que sube PDF sin usar el
  // componente, y se demuestra en la misma página: separado no se entiende —lo
  // que hay que ver es la cifra de antes y después (R43, v1.39.0).
  ['comprimirPdf', 'Carga de PDF'],
  // El campo de contraseña se demuestra con los campos (v1.37.0).
  ['CampoContrasena', 'Campo de texto'],
  ['EstadoPantalla', 'Estados de pantalla'], ['Confirmacion', 'Confirmación'],
  ['Nota', 'Nota permanente'],
  // R83 · Comparte página con la nota: las dos son mensajes EN FLUJO y lo que
  // hay que enseñar es cuándo va cada una. Separarlas en dos páginas es
  // justamente lo que hace que se elija la equivocada.
  ['Mensaje', 'Nota permanente'],
  ['Dialogo', 'Diálogo'], ['Migas', 'Migas de pan'],
  ['CabeceraPantalla', 'Cabecera de pantalla'], ['Icono', 'Iconos'],
  ['PanelBarra', 'Panel de la barra'],
  // Los tres del marco comparten pagina: se demuestran juntos o no se entienden.
  ['MarcoApp', 'Maquetas'], ['MenuUsuario', 'Maquetas'], ['MarcaMenu', 'Maquetas'],
]);

const indice = join(RAIZ, 'componentes/src/index.ts');
if (existsSync(indice)) {
  const exportados = [...new Set(
    [...readFileSync(indice, 'utf8').matchAll(/export \{\s*([A-Za-z]+)/g)].map((m) => m[1])
  )];
  const titulos = [...html.matchAll(/class="nav-txt">([^<]+)</g)].map((m) => m[1].trim());

  const sinPagina = exportados.filter((c) => {
    const pag = PAGINA_DE.get(c);
    return !pag || !titulos.includes(pag);
  });

  if (sinPagina.length) {
    console.error(`  ${sinPagina.length} componente(s) publicado(s) que el catálogo NO enseña:\n`);
    for (const c of sinPagina) {
      console.error(`    ${c.padEnd(20)} ${PAGINA_DE.has(c) ? 'la página «' + PAGINA_DE.get(c) + '» no existe' : 'sin página declarada'}`);
    }
    console.error('\n  El área de sistemas se guía del catálogo: lo que no está ahí no');
    console.error('  existe para ellos, y lo reconstruyen aunque esté publicado.\n');
    console.error('  Escribe su página, o declara con qué otra la comparte.\n');
    process.exit(1);
  }
  console.log(`  ${exportados.length} componentes publicados, todos con página en el catálogo.`);

  /* R60 · Y QUE ADEMÁS VIAJEN.
   *
   * Tener página no es estar entregado. Durante seis componentes seguidos
   * —AreaTexto, CampoContrasena, CargaId, CargaImagen, CargaPdf, ZonaAvisos—
   * este candado decía «todos con página en el catálogo» mientras ninguno de
   * los seis estaba dentro del ZIP: la lista de `empaquetar.mjs` se escribía a
   * mano y nadie se acordó. El candado miraba el escaparate y no la caja.
   *
   * Se comprueba contra el CONTENIDO real del empaquetador, no contra el ZIP
   * construido: así falla ANTES de empaquetar y no después. */
  /* Este candado VIAJA en la entrega, y el empaquetador no: allí no hay nada
   * que empaquetar. Sin esta guarda, correrlo en el proyecto de destino —que es
   * justo para lo que se entrega— reventaba con ERR_MODULE_NOT_FOUND. Lo
   * introduje en R60 al añadir esta segunda mitad; se caza aquí. */
  const rutaEmpaquetador = new URL('../paquete/empaquetar.mjs', import.meta.url);
  if (!existsSync(rutaEmpaquetador)) {
    console.log('  (el empaquetador no está: esta mitad solo corre en el repositorio)');
    console.log('\n  Nada estructural se queda sin decidir.\n');
    process.exit(0);
  }
  const { CONTENIDO_ENTREGA } = await import('../paquete/empaquetar.mjs');
  // Los MÓDULOS que viajan, normalizados sin extensión: la clave es de dónde
  // sale cada export, no cómo se llama. `EstadoPantalla` vive en `Estados.tsx`
  // y `comprimirPdf` en `interno/comprimir-pdf.mjs`; comparar por nombre de
  // archivo daba falsos positivos en los dos.
  const viajan = new Set(
    CONTENIDO_ENTREGA
      .map(([origen]) => origen.match(/^componentes\/src\/(.+?)(?:\.tsx|\.ts|\.mjs|\.mts)$/)?.[1])
      .filter(Boolean)
  );
  // De `export { A, B } from './X'` se saca el módulo, y de ahí se comprueba.
  const sinViajar = [];
  for (const m of readFileSync(indice, 'utf8')
    .matchAll(/export \{([^}]+)\} from '\.\/([^']+)'/g)) {
    const modulo = m[2].replace(/\.(tsx|ts|mjs|mts)$/, '');
    if (viajan.has(modulo)) continue;
    for (const n of m[1].split(',')) {
      const nombre = n.replace(/^\s*type\s+/, '').trim();
      if (nombre && /^[A-Za-z]/.test(nombre)) sinViajar.push(`${nombre}  (${modulo})`);
    }
  }
  if (sinViajar.length) {
    console.error(`\n  ${sinViajar.length} componente(s) que el catálogo enseña y el PAQUETE no lleva:\n`);
    for (const c of sinViajar) console.error(`    ${c}`);
    console.error('\n  Se publica, se documenta y se prueba — y al instalar no está.');
    console.error('  Un escaparate con la caja vacía es peor que no publicarlo.\n');
    process.exit(1);
  }
  console.log(`  ${viajan.size} módulos de componente viajan en el paquete.`);

  // ───────────────────────────────────────────────────────────────────────────
  // R91 · TODO LO QUE UN COMPONENTE EXPORTA TIENE QUE LLEGAR AL ÍNDICE
  //
  // La comprobación de arriba mira que el MÓDULO viaje. No miraba que sus
  // exportaciones salgan, y son dos cosas distintas: `Horario.tsx` viajaba
  // entero y `AjusteHorario` no se podía importar.
  //
  // Lo reportó Control Administrativos el 2026-08-21, y con la frase que lo
  // resume: «lo deduzco del propio componente en vez de meter mano en el
  // paquete». Al mirarlo aparecieron 42 de 105 exportaciones sin salida, entre
  // ellas los `Props` de TODOS los componentes. Un paquete que obliga a deducir
  // el tipo de una prop no ha publicado esa prop.
  //
  // Es la tercera lista escrita a mano que se queda corta el mismo día —el
  // filtro que no estaba en los casos de la promesa (R87), el horario que
  // tampoco estaba (R90), y este índice— y por eso deja de depender de que
  // alguien se acuerde.
  //
  // Lo que NO quiera publicarse, que no se exporte del módulo: ahí la decisión
  // se ve y se revisa. Un `export` que no llega al índice no es una decisión,
  // es un olvido.
  // ───────────────────────────────────────────────────────────────────────────
  // Se leen los nombres de las CLÁUSULAS export, no el texto del archivo. La
  // primera versión buscaba el nombre en todo el índice y se daba por
  // satisfecha con encontrarlo en un COMENTARIO — el de aquí arriba, que cita
  // `AjusteHorario` al contar por qué existe este candado. Se rompió a
  // propósito quitando esa exportación y el candado siguió en verde.
  const sacaElIndice = new Set();
  for (const m of readFileSync(indice, 'utf8').matchAll(/export \{([^}]+)\}/g)) {
    for (const n of m[1].split(',')) {
      const nombre = n.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0].trim();
      if (nombre) sacaElIndice.add(nombre);
    }
  }
  const dirFuente = join(RAIZ, 'componentes', 'src');
  const sinSalida = [];
  let exportadas = 0;
  for (const f of readdirSync(dirFuente).filter((f) => /\.tsx$/.test(f)).sort()) {
    const fuente = readFileSync(join(dirFuente, f), 'utf8');
    const nombres = [
      ...[...fuente.matchAll(/^export (?:type|interface) ([A-Za-z0-9_]+)/gm)],
      ...[...fuente.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)],
    ].map((m) => m[1]);
    exportadas += nombres.length;
    for (const n of nombres) {
      if (!sacaElIndice.has(n)) sinSalida.push(`${n}  (${f})`);
    }
  }
  if (sinSalida.length) {
    console.error(`\n  ${sinSalida.length} exportación(es) que un componente declara y el ÍNDICE no saca:\n`);
    for (const c of sinSalida) console.error(`    ${c}`);
    console.error('\n  Quien instale el paquete no las puede importar: tiene que deducirlas');
    console.error('  del componente, que es justo lo que un paquete evita.');
    console.error('\n  Dos salidas, y las dos honestas: sácala por `componentes/src/index.ts`,');
    console.error('  o quítale el `export` al módulo si no es pública. Lo que no vale es');
    console.error('  exportarla a medias.\n');
    process.exit(1);
  }
  console.log(`  ${exportadas} exportaciones de componente · todas salen por el índice.`);
}

console.log('\n  Nada estructural se queda sin decidir.\n');
