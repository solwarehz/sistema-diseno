#!/usr/bin/env node
/**
 * ¿COMPILA LO QUE EL CATÁLOGO INVITA A COPIAR?
 *
 * QUÉ COMPRUEBA. Que cada bloque «Copia esto» del catálogo —los que llevan
 * botón de copiar— sea TypeScript válido **contra el paquete que se entrega**:
 * que el módulo del que importa exista, que los nombres que importa los exporte
 * el índice, y que las props que usa sean las del componente.
 *
 * POR QUÉ NACE. `CLAUDE.md` §7 regla 3 dice que lo único que se copia de un
 * componente compartido es «la importación y las props». Esa es, literalmente,
 * la superficie que este archivo vigila — y **no la vigilaba nadie**. Los
 * diecisiete candados comparan CSS resuelto, elementos, atributos, orden de
 * cascada e iconos: ninguno pasa un compilador por el código que el catálogo
 * enseña. Se declaró abierto en tres versiones seguidas —«ningún candado
 * compila los bloques de copia esto»— y en la tercera una auditoría midió el
 * daño acumulado:
 *
 *   · los DIECIOCHO bloques importaban de `@ae/sistema`, un paquete que **no
 *     existe** —el real es `sistema-diseno-ae`— y que no aparece documentado en
 *     ninguna parte;
 *   · cinco identificadores que el catálogo mandaba importar no los exporta
 *     nadie: `CampoTexto`, `GrupoOpcion`, `ProgresoPasos`, `avisar`,
 *     `useConfirmar`;
 *   · y once bloques pasaban props que el componente no tiene, algunas de un
 *     contrato entero distinto.
 *
 * De dieciséis bloques compilables, **dos salían verdes**. Una página que dice
 * «este bloque compila tal cual» y no compila es peor que no tener ejemplo: se
 * copia, no funciona, y quien lo copió busca el fallo en su código.
 *
 * QUÉ NO COMPRUEBA, y conviene decirlo. Que el ejemplo haga algo sensato: un
 * bloque puede compilar y enseñar una mala práctica. Esto mira el contrato, no
 * el criterio.
 *
 * CÓMO. Los bloques asumen un contexto que no declaran —`valor`, `setValor`,
 * `guardar`…—, que es lo normal en un fragmento. Esos nombres se declaran por
 * él; **todo lo demás tiene que resolver**. Y corre dentro del contenedor,
 * porque `node_modules` vive en un volumen con nombre y §3 prohíbe instalar en
 * la máquina.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HTML = join(RAIZ, 'cascaron', 'index.html');
const DIR = join(RAIZ, 'componentes', 'copia-tmp');

/* El nombre real del paquete, leído de su `package.json`: escribirlo aquí sería
   la misma cifra a mano que este repositorio persigue. */
const PAQUETE = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).name;

/* Lo que un fragmento puede dar por supuesto sin declararlo. Es una lista corta
   A PROPÓSITO: cada nombre que se añade aquí es un error que el candado deja de
   ver, así que sólo entran los que son contexto de la pantalla y nunca API del
   sistema. */
/* ─────────────────────────────────────────────────────────────────────────────
   DEUDA DECLARADA: los bloques que NO compilan hoy.
 *
 * Este candado nace sobre un destrozo que llevaba versiones acumulándose, y se
 * hace lo mismo que hicieron `verificar-elemento` y `verificar-promesa-muerta`
 * al nacer: **protege ya de lo nuevo y no finge que lo viejo no existe**.
 *
 * Cada línea es un bloque del catálogo cuyo ejemplo no compila contra lo que se
 * entrega. Arreglar uno es **quitar su línea**, y si se arregla y no se poda el
 * candado también falla: una lista de excepciones que nadie poda vuelve a ser el
 * inventario a mano de siempre.
 *
 * Lo que YA se arregló y por eso no está aquí: los dieciocho importaban de
 * `@ae/sistema`, un paquete que no existe. Ése era el defecto que hacía que
 * NINGÚN bloque resolviera, y se corrigió en la misma versión que este candado.
 * ───────────────────────────────────────────────────────────────────────────── */
/* LA DEUDA VA POR FIRMA, NO POR POSICION. Iba indexada por el numero de orden
   del bloque en el catalogo, y eso se rompio en cuanto se añadio un bloque en
   medio: los indices posteriores corrieron uno, siete deudas pasaron a señalar
   al bloque de al lado y un bloque con deuda declarada desde hace versiones
   salio como «NUEVO roto». Peor que el falso rojo es el silencio contrario —una
   deuda apuntando al bloque equivocado declara sana una rotura real—.
   La firma es la LINEA DE IMPORTACION del bloque, que es lo que lo identifica:
   si cambia, el bloque ya no es el mismo y que la deuda deje de casar es
   exactamente lo correcto. */
const DEUDA = new Map([
  ["import { Boton } from", 'Boton: usa `deshabilitado` (es el `disabled` de HTML) y un icono `<Ajustes/>` que no existe'],
  ["import { Enlace } from", 'Enlace: usa `enTexto`/`enMarco`; la prop es `contexto: "prosa" | "interfaz"`'],
  ["import { CampoTexto } from", 'importa `CampoTexto`, que no se exporta: el componente es `Campo`'],
  ["import { Selector } from", 'Selector: usa `buscar`/`sinResultados`, que son de `SelectorBusqueda`'],
  ["import { Interruptor } from", 'Interruptor: pasa `valor`; la prop es `activo`'],
  ["import { SeleccionMultiple, GrupoOpcion } from", 'importa `GrupoOpcion`, que no se exporta; y `SeleccionMultiple` no tiene `leyenda`'],
  ["import { Chip } from", 'Chip: usa `estado` y `punto`; la prop es `tono`'],
  ["import { Tarjeta } from", 'Tarjeta: usa `acciones` y `href`, que no existen'],
  ["import { TarjetaPersona } from", 'TarjetaPersona: pasa `estado` como texto; espera `{ tono, texto }`'],
  ["import { TablaDatos, Enlace } from", 'ejemplo con JSX y código alternados que el envoltorio no sabe separar'],
  ["import { Paginacion } from", 'Paginacion: casi ninguna prop coincide con `PaginacionProps`'],
  ["import { EstadoPantalla } from", 'EstadoPantalla: recibe otro contrato entero, y children que no acepta'],
  ["import { Progreso, ProgresoPasos } from", 'importa `ProgresoPasos`, que no existe; y `Progreso.valor` es 0-100, no un conteo'],
  ["import { avisar } from", 'importa `avisar`, que no existe: son `<Aviso tono>` y `<ZonaAvisos>`'],
  ["import { useConfirmar } from", 'importa `useConfirmar`, que no existe: es el componente `<Confirmacion>`'],
  ["import { RangoFecha, atajosDeDias } from", 'ejemplo con JSX y código alternados que el envoltorio no sabe separar'],
]);

/* La firma de un bloque: su primera linea de importacion, sin el modulo. Dos
   bloques que importan lo mismo comparten deuda, y eso es correcto: son el
   mismo ejemplo con otro texto alrededor. */
const firmaDe = (cuerpo) => {
  const m = /^\s*(import\s+\{[^}]*\}|import\s+[A-Za-z_$][\w$]*)\s+from/m.exec(cuerpo);
  return m ? m[1].replace(/\s+/g, ' ').trim() + ' from' : null;
};

/* Nombres que el ejemplo toma de la pantalla que lo rodea: el estado y los
   manejadores son del producto, no del sistema. Salen aqui para que `tsc` pueda
   mirar las PROPS, que es lo que el catalogo promete.
   `nivel` y `guardarYAplicar` entraron el 2026-09-22: estaban rompiendo el
   bloque del Segmentado y nadie lo veia porque la deuda iba por posicion y su
   entrada señalaba al bloque de al lado. */
const DEL_CONTEXTO = ['valor', 'setValor', 'guardar', 'datos', 'filas', 'onCambio',
  'pagina', 'setPagina', 'abierto', 'setAbierto', 'cargando', 'error', 'buscar',
  'seleccion', 'setSeleccion', 'enviar', 'archivo', 'setArchivo',
  'nivel', 'guardarYAplicar'];

const desescapar = (t) => t
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const doc = readFileSync(HTML, 'utf8');
const bloques = [...doc.matchAll(/<pre class="cod-pre"[^>]*>(?:<code>)?([\s\S]*?)(?:<\/code>)?<\/pre>/g)]
  .map((m) => desescapar(m[1]))
  // Sólo los que son TypeScript: los demás son HTML de ejemplo y no se compilan.
  .filter((t) => /^\s*import\s/m.test(t));

if (!bloques.length) {
  console.error('\n  No se encontró NI UN bloque de código en el catálogo.\n'
    + '  O el catálogo dejó de enseñarlos, o el patrón de este candado dejó de\n'
    + '  encontrarlos. Las dos cosas hay que mirarlas: un candado que no encuentra\n'
    + '  nada que comprobar sale en verde sin haber comprobado nada.\n');
  process.exit(1);
}

/* PRIMERO: ¿DE DÓNDE DICE EL CATÁLOGO QUE SE IMPORTA? Esta comprobación es la
   que habría cazado el defecto más caro: los dieciocho bloques importaban de
   `@ae/sistema`, un paquete que NO EXISTE, y que no aparecía documentado en
   ningún sitio. Se copiaba, no resolvía, y quien lo copió buscaba el fallo en
   su `package.json`. */
const malImportados = [];
bloques.forEach((b, i) => {
  for (const m of b.matchAll(/from\s+'([^']+)'/g)) {
    const mod = m[1];
    if (mod.startsWith('.') || mod === 'react' || mod.startsWith('react/')) continue;
    if (mod === PAQUETE || mod.startsWith(`${PAQUETE}/`)) continue;
    malImportados.push(`bloque ${i}: importa de «${mod}»`);
  }
});
if (malImportados.length) {
  console.error(`\n  ${malImportados.length} import(s) a un módulo que NO es el paquete:\n`);
  for (const x of malImportados) console.error(`    ${x}`);
  console.error(`\n  El paquete se llama «${PAQUETE}». Lo que el catálogo enseña a`);
  console.error('  importar tiene que ser instalable tal cual.\n');
  process.exit(1);
}

/* SE BORRA AL TERMINAR, y no solo al empezar. La cabecera de los archivos
   generados dice «Se borra solo» desde el dia que nacio y era falso: solo se
   borraban al ARRANCAR la siguiente corrida, asi que entre una y otra quedaban
   diecinueve .tsx sueltos en `componentes/`. Acabaron VERSIONADOS —18 archivos
   en el indice— y ensuciando el arbol en cada pasada, que es lo que hace que el
   publicador se niegue. §9: «no quedan artefactos temporales sueltos». */
const limpiar = () => rmSync(DIR, { recursive: true, force: true });
limpiar();
mkdirSync(DIR, { recursive: true });
const contexto = DEL_CONTEXTO.map((n) => `declare const ${n}: any;`).join('\n');
bloques.forEach((cuerpo, i) => {
  /* El JSX suelto de un ejemplo no es una sentencia válida: se envuelve en un
     componente. Se hace aquí y no se le pide al catálogo, porque el catálogo
     tiene que enseñar lo que se copia, no lo que hace falta para compilarlo. */
  const imports = (cuerpo.match(/^\s*import[\s\S]*?from\s+'[^']*';\s*$/gm) ?? []).join('\n');
  const sinImports = cuerpo.replace(/^\s*import[\s\S]*?from\s+'[^']*';\s*$/gm, '').trim();
  /* EL JSX SUELTO no es una sentencia válida, y el resto del bloque sí. Se
     envuelve CADA TRAMO de JSX de nivel superior, no «desde el primero hasta el
     final»: los ejemplos alternan JSX y código —una explicación, un `useState`
     debajo— y envolver hasta el final metía ese código DENTRO del fragmento.
     Eso no sólo rompía esos dos bloques: **tsc no emite ni un error de tipos si
     algún archivo no parsea**, así que dos bloques mal envueltos escondían los
     errores semánticos de los otros dieciséis. El candado salía casi verde
     tapando justo lo que venía a mirar. */
  const lineas = sinImports.split('\n');
  const partes = [];
  let i2 = 0;
  let nEj = 0;
  while (i2 < lineas.length) {
    if (!/^<[A-Z]/.test(lineas[i2])) { partes.push(lineas[i2]); i2 += 1; continue; }
    const desde = i2;
    // El tramo acaba en la línea que cierra el elemento en el margen.
    while (i2 < lineas.length) {
      const l = lineas[i2];
      i2 += 1;
      if (/\/>\s*$/.test(l) || /^<\/[A-Za-z]/.test(l) || /^\s*\/>/.test(l)) break;
    }
    partes.push(`export function Ejemplo${i}_${nEj}() {`, '  return (<>',
      ...lineas.slice(desde, i2), '  </>);', '}');
    nEj += 1;
  }
  const cuerpoFinal = partes.join('\n');

  /* EL IMPORT SE REMAPEA AL CÓDIGO QUE SE ENTREGA, y el NOMBRE se comprueba
     aparte. Apuntar al paquete por su nombre exigiría instalarlo en cada
     comprobación —y §3 prohíbe instalar en la máquina—, así que los tipos se
     miran contra `componentes/src`, que es exactamente lo que el paquete
     publica en esa subruta. Que el nombre del módulo sea el de verdad es la
     otra mitad, y va arriba: son dos preguntas distintas y una no tapa a la
     otra. */
  const importsLocales = imports.replace(
    new RegExp(`'${PAQUETE}(/componentes)?'`, 'g'), "'../src/index'");
  writeFileSync(join(DIR, `bloque-${i}.tsx`),
    `/* GENERADO por verificar-copia.mjs. Se borra solo. */\n`
    + `${importsLocales}\n${contexto}\n${cuerpoFinal}\n`);
});

/* UNO A UNO, Y ESA ES LA DIFERENCIA. `tsc` NO EMITE NI UN ERROR DE TIPOS si
   algún archivo de la invocación no parsea, así que compilarlos todos juntos
   hacía que un bloque mal escrito TAPARA los errores semánticos de los demás:
   con dos bloques rotos, los otros dieciséis salían «verdes» sin que nadie les
   hubiera mirado los tipos. Se descubrió aquí mismo, comparando con lo que una
   auditoría había encontrado a mano.
   Cuesta una invocación por bloque y a cambio el veredicto de cada uno es
   suyo. */
const fallos = [];
for (let i = 0; i < bloques.length; i += 1) {
  try {
    execFileSync('docker-compose',
      ['exec', '-T', 'ds', 'sh', '-c',
        'cd /trabajo/componentes && npx tsc --noEmit --jsx react-jsx --strict false '
        + '--skipLibCheck --moduleResolution bundler --module esnext --target es2020 '
        + `copia-tmp/bloque-${i}.tsx 2>&1`],
      { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    const texto = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '');
    const lineas = texto.split('\n').filter((l) => /error TS/.test(l));
    fallos.push({ i, lineas });
  }
}
console.log(`\n  ${bloques.length} bloques de «copia esto», compilados contra el paquete.`);
console.log(`  Importan de: ${PAQUETE}\n`);

const firmas = bloques.map(firmaDe);
const nuevos = fallos.filter((f) => !DEUDA.has(firmas[f.i]));
const arregladosSinPodar = [...DEUDA.keys()]
  .filter((f) => firmas.includes(f))
  .filter((f) => !fallos.some((x) => firmas[x.i] === f));

if (arregladosSinPodar.length) {
  console.error(`  ${arregladosSinPodar.length} bloque(s) ARREGLADOS y todavía en la deuda:\n`);
  for (const f of arregladosSinPodar) console.error(`    ${f}: ${DEUDA.get(f)}`);
  console.error('\n  Quita su línea de DEUDA en este archivo. Una lista de excepciones');
  console.error('  que nadie poda vuelve a ser el inventario a mano de siempre.\n');
  process.exit(1);
}

if (nuevos.length) {
  console.error(`  ${nuevos.length} bloque(s) NUEVOS que no compilan:\n`);
  for (const f of nuevos) {
    console.error(`    bloque ${f.i}:`);
    for (const l of f.lineas.slice(0, 4)) console.error(`      ${l.trim()}`);
    if (f.lineas.length > 4) console.error(`      … y ${f.lineas.length - 4} más`);
  }
  console.error('\n  Lo que se copia es la importación y las props (CLAUDE.md §7 regla 3).');
  console.error('  Un ejemplo que no compila se copia, no funciona, y quien lo copió');
  console.error('  busca el fallo en SU código.\n');
  limpiar();
  process.exit(1);
}

limpiar();
console.log(`  Ningún bloque NUEVO roto. Deuda declarada: ${DEUDA.size} de ${bloques.length},`);
console.log('  cada uno con su motivo. Arreglar uno es quitar su línea de este archivo.\n');
