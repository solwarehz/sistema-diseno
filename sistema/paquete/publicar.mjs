#!/usr/bin/env node
/**
 * PUBLICAR UNA VERSIÓN — las dos vías, siempre, y sin ZIP viejos
 *
 *   node sistema/paquete/publicar.mjs            # comprueba y dice qué haría
 *   node sistema/paquete/publicar.mjs --publicar # lo hace
 *
 * POR QUÉ EXISTE. Subir a `main` NO es publicar. El área de sistemas instala de
 * dos formas y las dos tienen que funcionar **siempre**:
 *
 *   · `npm install "github:solwarehz/sistema-diseno#vX.Y.Z"` — necesita ETIQUETA
 *   · descarga directa del ZIP — necesita PUBLICACIÓN CON ADJUNTO
 *
 * Eran tres pasos a mano, y por eso fallaron: el 2026-08-13 se descubrió que las
 * etiquetas se cortaban en v1.38.0 con el sistema en v1.48.0 —doce versiones sin
 * etiquetar— y que `ACTUALIZAR.md` mandaba instalar `#v1.48.0`, que no existía.
 * Nadie podía actualizar, y nadie se había enterado porque nada lo comprobaba.
 *
 * Es el mismo defecto que la lista de componentes del empaquetador (R60) y la
 * lista de candados del CLAUDE.md: **un paso que depende de acordarse**. Aquí
 * deja de depender.
 *
 * TAMBIÉN PODA. Solo la última entrega conserva su ZIP: al publicar, se borran
 * los adjuntos de las publicaciones anteriores. Las etiquetas y las
 * publicaciones NO se tocan — si se borraran, `npm install #vieja` dejaría de
 * funcionar, que es justo lo contrario de lo que se quiere garantizar. Y el ZIP
 * borrado no se pierde: se reconstruye desde su etiqueta.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, CAMBIOS } from '../tokens/fuente.mjs';
import { NOMBRE_ZIP } from './empaquetar.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const REPO = 'solwarehz/sistema-diseno';
const HACERLO = process.argv.includes('--publicar');

const sh = (cmd, args) => execFileSync(cmd, args, { cwd: RAIZ, encoding: 'utf8' }).trim();
/** Preguntar por algo que puede no existir —una etiqueta, una publicación— es
 *  normal aquí, no un fallo. Sin silenciar su salida de error, el ensayo en
 *  seco escupe «unknown revision» y «release not found» y parece roto cuando
 *  está funcionando: quien lo lea la primera vez desconfía del resto. */
const intenta = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
};

const etiqueta = `v${VERSION}`;
const zip = join(RAIZ, 'cascaron', NOMBRE_ZIP);
const problemas = [];

console.log(`\n  Publicar ${etiqueta}\n`);

/* ── 1 · Que haya algo que publicar, y que sea lo que se cree ─────────────── */

if (!existsSync(zip)) {
  problemas.push(`no existe ${NOMBRE_ZIP} — corre antes: node sistema/cascaron/generar-cascaron.mjs`);
}

/* El documento al que se remite al área de sistemas tiene que hablar de ESTA
 * versión. Si no, manda a una descarga que la poda acaba de borrar: pasó al
 * publicar la v1.53.0 con ACTUALIZAR.md todavía en la v1.51.1, y esa era
 * exactamente la clase de fallo que este comando existe para impedir. */
const actualizar = join(RAIZ, 'manual', 'ACTUALIZAR.md');
if (existsSync(actualizar)) {
  const texto = readFileSync(actualizar, 'utf8');
  if (!texto.includes(etiqueta)) {
    const cita = texto.match(/#v(\d+\.\d+\.\d+)/)?.[1] ?? '(ninguna)';
    problemas.push(`manual/ACTUALIZAR.md manda instalar v${cita} y estamos publicando ${etiqueta}: ponlo al día o el documento manda a un ZIP que la poda borra`);
  }
}

const sucio = sh('git', ['status', '--porcelain']);
if (sucio) problemas.push('el árbol tiene cambios sin commitear: se publicaría una versión que no es la del repositorio');

const cabeza = sh('git', ['rev-parse', 'HEAD']);
const enRemoto = intenta('git', ['rev-parse', 'origin/main']);
if (enRemoto && enRemoto !== cabeza) {
  problemas.push('HEAD y origin/main no coinciden: sube primero el código, o la etiqueta apuntaría a otra cosa');
}

// La etiqueta se pone DESPUÉS del último commit. Si ya existe apuntando a otro
// sitio, NO se mueve: una etiqueta movida entrega cosas distintas según cuándo
// se baje. Se avanza de versión.
const yaEtiquetada = intenta('git', ['rev-parse', `${etiqueta}^{}`]);
if (yaEtiquetada && yaEtiquetada !== cabeza) {
  problemas.push(`${etiqueta} ya existe y apunta a ${yaEtiquetada.slice(0, 7)}, no a ${cabeza.slice(0, 7)}. NO se mueve: sube de versión`);
}

/**
 * LOS CANDADOS SE CORREN AQUÍ, y no se confía en que alguien los haya corrido.
 *
 * La v1.103.0 se publicó con la regla de `.fc-cal-cuerpo` FUERA de la hoja
 * entregada. Los candados la habrían cazado —`verificar-promesa` la vio en
 * cuanto se corrió después—, pero la publicación se hizo apoyada en una pasada
 * anterior a la última edición. El fallo no fue del candado: fue que correrlo
 * dependía de acordarse.
 *
 * Es exactamente lo que la cabecera de este archivo dice que ya pasó con las
 * etiquetas, y el motivo por el que este guion existe. Faltaba aplicárselo a sí
 * mismo.
 */
const CANDADOS = [
  'sistema/tokens/generar.mjs',
  'sistema/cascaron/generar-cascaron.mjs',
  'sistema/componentes/extraer.mjs',
  'sistema/candado/verificar-contraste.mjs',
  'sistema/candado/verificar-tono.mjs',
  'sistema/candado/verificar-color.mjs',
  'sistema/candado/auditar-cascaron.mjs',
  'sistema/candado/probar-candado.mjs',
  'sistema/candado/verificar-cascada.mjs',
  'sistema/candado/verificar-altura.mjs',
  'sistema/candado/verificar-contrato.mjs',
  'sistema/candado/verificar-entrega.mjs',
  'sistema/candado/verificar-promesa.mjs',
  'sistema/candado/verificar-elemento.mjs',
  'sistema/candado/verificar-atributo.mjs',
  'sistema/candado/verificar-empate.mjs',
  'sistema/candado/verificar-forma.mjs',
  'sistema/candado/verificar-omision.mjs',
  'sistema/candado/verificar-iconos.mjs',
  'sistema/candado/verificar-promesa-muerta.mjs',
  /* R153+ · Lo que el catalogo INVITA A COPIAR, compilado contra lo que se
     entrega. `CLAUDE.md` §7 regla 3 dice que lo unico que se copia de un
     componente compartido es «la importacion y las props», y esa superficie no
     la miraba NADIE: los diecisiete comparan CSS, elementos, atributos, orden
     de cascada e iconos, y ninguno pasa un compilador. Se declaro abierto tres
     versiones seguidas; al escribirlo, DIECISIETE de dieciocho bloques no
     compilaban — y los dieciocho importaban de un paquete que no existe. */
  'sistema/candado/verificar-copia.mjs',
  'sistema/candado/verificar-muerta.mjs',
  'sistema/candado/verificar-ciegas.mjs',
  'sistema/candado/verificar-citas.mjs',
];

/** Por CÓDIGO DE SALIDA, no por si imprimió algo: `intenta` devuelve '' cuando
 *  el guion calla, y '' es falso — un candado mudo habría contado como rojo. */
const verde = (cmd, args) => {
  try { execFileSync(cmd, args, { cwd: RAIZ, stdio: 'ignore' }); return true; }
  catch { return false; }
};

process.stdout.write('  candados… ');
const enRojo = [];
for (const c of CANDADOS) {
  if (!verde('node', [c])) enRojo.push(c.split('/').pop().replace('.mjs', ''));
}
console.log(enRojo.length ? `${enRojo.length} EN ROJO` : `${CANDADOS.length} en verde`);
if (enRojo.length) {
  problemas.push(`en rojo: ${enRojo.join(', ')} — córrelos y mira qué dicen antes de publicar`);
}

/* Y ESLINT, QUE LLEVABA CINCO VERSIONES EN ROJO SIN QUE NADIE MIRARA.
 *
 * `CLAUDE.md` §6 dice que el candado de ESLint prohíbe ocho cosas «con fallo de
 * build». No había tal fallo: ESLint no era ninguno de los veinte pasos, así
 * que la regla estaba escrita y nadie la ejecutaba. Al correrlo salieron 18
 * infracciones, 16 de ellas desde la v1.123.0 — cinco versiones publicadas. Lo
 * cazó una auditoría adversaria.
 *
 * Va DENTRO del contenedor por lo mismo que las pruebas: `node_modules` vive en
 * un volumen con nombre y §3 prohíbe instalar en la máquina. Y el guion que se
 * llama aquí comprueba primero que ESLint se haya EJECUTADO de verdad: contaba
 * cero cuando no podía correr, y salía en verde sin mirar un archivo. */
process.stdout.write('  eslint… ');
let lintOk = false;
try {
  execFileSync('docker-compose',
    ['exec', '-T', 'ds', 'sh', '-c', 'cd /trabajo && sh sistema/candado/probar-con-eslint.sh'],
    { cwd: RAIZ, stdio: 'ignore' });
  lintOk = true;
} catch { lintOk = false; }
console.log(lintOk ? 'limpio' : 'EN ROJO');
if (!lintOk) {
  problemas.push('eslint en rojo — córrelo y mira qué dice: '
    + "docker-compose exec -T ds sh -c 'cd /trabajo && sh sistema/candado/probar-con-eslint.sh'");
}

/* LAS PRUEBAS TAMBIÉN, y no «acordándose». `CLAUDE.md` §8 exige los diecisiete
 * pasos en verde **y las pruebas pasando**, y lo segundo era el único requisito
 * de esta lista que dependía de que alguien se acordara — que es exactamente lo
 * que este guion existe para eliminar, y lo que esa misma sección declara
 * fatal. Lo encontró una auditoría el 2026-09-11.
 *
 * Corren en Docker porque `node_modules` vive en un volumen con nombre y NO en
 * la máquina: §3 prohíbe instalar nada aquí. Si el contenedor no está en pie,
 * NO se da por bueno — se para y se dice, que es lo contrario de saltárselo. */
process.stdout.write('  pruebas… ');
/* POR CÓDIGO DE SALIDA, igual que `verde()` treinta líneas más arriba, que lo
 * dice con todas las letras. La primera versión de este paso juzgaba por TEXTO
 * y se equivocaba en las dos direcciones; las dos las midió una auditoría el
 * 2026-09-11:
 *
 *  · VERDE en falso. vitest sale con 1 por un rechazo sin manejar y su resumen
 *    sigue diciendo «Tests N passed», sin la palabra «failed» en ninguna parte.
 *    El publicador daba el visto bueno — justo delante de la clase de defecto
 *    que el `.catch` de `Boton` acababa de nacer para impedir.
 *  · ROJO en falso. Buscar «failed» en TODA la salida caza el nombre de una
 *    prueba, una ruta, o —literalmente— el `console.error` que el propio
 *    `Boton` imprime al fallar una acción: `TypeError: fetch failed`. Los dos
 *    cambios del mismo día eran hostiles entre sí.
 *
 * Se mira el código de salida, y el resumen solo para poder decir cuántas.
 * Corre en Docker porque `node_modules` vive en un volumen y §3 prohíbe
 * instalar nada en la máquina; si el contenedor no está en pie NO se da por
 * bueno, se para y se dice.
 *
 * `ulimit -c 0` porque un worker de vitest que revienta por falta de memoria
 * deja un VOLCADO de 2,1 GB dentro de `componentes/`. Pasó dos veces el mismo
 * día —4,2 GB— y la segunda ya estaba en `.gitignore`, así que ni siquiera
 * ensuciaba el árbol para que alguien lo notara. El volcado no sirve de nada
 * aquí: lo que hace falta saber lo dice vitest antes de morir. */
const correrPruebas = () => {
  try {
    const salida = execFileSync('docker-compose',
            /* `--no-file-parallelism` NO es una preferencia de velocidad: es lo que
         hace este paso DETERMINISTA. Corriendo en paralelo, esta maquina se
         queda sin memoria y mata workers — paso tres veces el 2026-09-19, una
         de ellas AQUI: el publicador reporto «las pruebas no pasan» y al
         correrlas a continuacion salieron 1173 en verde con codigo 0. Un
         publicador que rechaza una entrega buena de forma intermitente es peor
         que uno lento: enseña a reintentar hasta que salga, y eso es lo
         contrario de una comprobacion.
         Y NO SE ARREGLA CON `--pool=forks --singleFork`. Se probo el
         2026-09-22 contra un worker que seguia muriendo: con un solo proceso
         los archivos comparten el `document` de jsdom y se contaminan entre
         ellos — 20 pruebas en rojo que en el pool normal estan en verde,
         RangoFecha y EditorTexto las primeras. El aislamiento por archivo no
         es un lujo del corredor: es lo que hace que una prueba signifique
         algo. */
      ['exec', '-T', 'ds', 'sh', '-c',
        'ulimit -c 0; cd componentes && npx vitest run --no-file-parallelism 2>&1'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, salida };
  } catch (e) {
    return { ok: false, salida: (e.stdout ?? '') + (e.stderr ?? '') };
  }
};
const pruebas = correrPruebas();
// Sin los códigos de color: vitest los emite aunque no haya terminal.
const resumen = pruebas.salida.replace(/\x1b\[[0-9;]*m/g, '');
const cuantas = (resumen.match(/Tests\s+(\d+) passed/) ?? [])[1];
/* Y EL CÓDIGO DE SALIDA TAMPOCO BASTA. El 2026-09-22 un worker murió por
 * memoria a mitad del barrido: vitest imprimió «Test Files 58 passed (59)»,
 * «Tests 1198 passed (1213)» y «Unhandled Error: Worker exited unexpectedly»,
 * y salió con CÓDIGO 0. El publicador habría dicho «1198 en verde» con un
 * archivo entero —quince pruebas— SIN CORRER. Es el mismo defecto que este
 * repositorio ya conoce con otro disfraz: una comprobación que mide lo que
 * pasó y no lo que FALTABA por pasar.
 *
 * Los paréntesis son el total que vitest se propuso correr. Si el número de
 * archivos en verde no es ese total, no hay entrega: da igual que ninguno haya
 * fallado — lo que no corrió no protege nada. */
const archivos = resumen.match(/Test Files\s+(\d+) passed(?:\s+\((\d+)\))?/);
const corrieron = archivos ? Number(archivos[1]) : 0;
const previstos = archivos?.[2] ? Number(archivos[2]) : corrieron;
const faltan = previstos - corrieron;
if (pruebas.ok && cuantas && faltan === 0) {
  console.log(`${cuantas} en verde`);
} else {
  console.log('NO');
  problemas.push(!pruebas.salida
    ? 'no pude correr las pruebas: ¿está levantado el contenedor? `docker-compose up -d`'
    : faltan > 0
      ? `${faltan} de ${previstos} archivos de prueba NO llegaron a correr (un worker murió; salida en verde de los que sí). Vuelve a correrlas: docker-compose exec -T ds sh -c "ulimit -c 0; cd componentes && npx vitest run --no-file-parallelism"`
      : `las pruebas no pasan (vitest salió con error). Corre: docker-compose exec -T ds sh -c "cd componentes && npx vitest run"`);
}

// Regenerar puede haber tocado archivos. Si el árbol quedó sucio DESPUÉS de
// esto, lo publicado no sería lo commiteado.
const sucioTras = intenta('git', ['status', '--porcelain']);
if (sucioTras) {
  /* Y SE DICE QUÉ ES CADA COSA, porque el diagnóstico mandaba a buscar donde no
     era: decía «los candados regeneraron algo» ante un archivo NUEVO sin
     rastrear —un informe recién escrito—, y quien lo lea se pone a mirar
     generadores que no han tocado nada. Un aviso que se equivoca de causa
     cuesta más que no tenerlo. */
  const lineas = sucioTras.split('\n').filter(Boolean);
  /* Se quita el ESTADO, no tres caracteres. `intenta()` recorta la salida, asi
     que la PRIMERA linea llega sin su espacio inicial y un corte fijo se comia
     una letra: decia «ascaron/index.html». Un diagnostico que escribe mal el
     nombre del archivo manda a buscar un archivo que no existe. */
  const soloRuta = (l) => l.replace(/^\s*\S{1,2}\s+/, '');
  const nuevos = lineas.filter((l) => l.trimStart().startsWith('??')).map(soloRuta);
  const tocados = lineas.filter((l) => !l.trimStart().startsWith('??')).map(soloRuta);
  if (tocados.length) {
    problemas.push('los candados regeneraron algo: '
      + `${tocados.join(', ')}. Commitea y vuelve a intentarlo`);
  }
  if (nuevos.length) {
    problemas.push(`hay archivo(s) sin rastrear: ${nuevos.join(', ')}. `
      + 'No los tocaron los candados — añádelos o ignóralos, pero el árbol tiene '
      + 'que estar limpio para que lo publicado sea exactamente lo commiteado');
  }
}

if (problemas.length) {
  console.error('  No se puede publicar:\n');
  for (const p of problemas) console.error(`    · ${p}`);
  console.error('');
  process.exit(1);
}

/* ── 2 · Las dos vías ─────────────────────────────────────────────────────── */

const pasos = [];
if (!yaEtiquetada) pasos.push(['etiqueta local', 'git', ['tag', '-a', etiqueta, '-m', `${etiqueta} — entrega del sistema de diseño`]]);
pasos.push(['etiqueta al remoto', 'git', ['push', 'origin', etiqueta]]);

/**
 * LAS NOTAS SALEN DE `CAMBIOS`, Y SOBRE TODO DE `rompe`.
 *
 * Eran una plantilla fija —«Instalación: … O el ZIP adjunto»— idéntica en las
 * ciento diecisiete versiones. `fuente.mjs` lleva por cada versión qué cambió,
 * por qué, y una lista `rompe` con lo que puede romperle a quien actualice; el
 * catálogo la pinta en su tabla «Puede romperte» y **la publicación de GitHub
 * no decía una palabra**. Quien entra por la publicación —que es la puerta que
 * abre `npm install`— recibía el aviso de cambio de comportamiento **sólo si
 * además se le ocurría abrir el catálogo**. Lo cazó una auditoría el 2026-09-15.
 */
function notasDeLaVersion() {
  const c = CAMBIOS.find((x) => x.v === VERSION);
  const instalar = `**Instalación**\n\n    npm install "github:${REPO}#${etiqueta}"\n\nO el ZIP adjunto.`;
  if (!c) return instalar;   // versión sin entrada: se instala igual, y se nota
  const partes = [`## ${c.que}`, '', c.porque, ''];
  /* `rompe` es una lista de textos, y a veces `false`. Medido sobre las 143
     entradas de `CAMBIOS`: 121 arrays y 22 `false`. El guard mira la FORMA
     porque `false.length` —igual que `true.length`— es `undefined`, y con eso
     la tabla «Puede romperte» desaparecería sin un solo error. Esto llegó a
     pasar escribiendo `rompe: true` en una versión de esta misma semana; la
     entrada se corrigió antes de publicarse, así que hoy no queda ninguna. */
  if (Array.isArray(c.rompe) && c.rompe.length) {
    partes.push('## ⚠️ Puede romperte', '');
    for (const r of c.rompe) partes.push(`- ${r}`);
    partes.push('');
  }
  partes.push('---', '', instalar);
  return partes.join('\n');
}
const NOTAS = notasDeLaVersion();

const hayPublicacion = intenta('gh', ['release', 'view', etiqueta, '--repo', REPO, '--json', 'tagName']);
if (hayPublicacion) {
  /* LAS NOTAS PRIMERO, y el ZIP después. Los dos pasos son idempotentes y
     reintentar arregla cualquier corte, pero el orden decide CÓMO se ve el
     estado intermedio si algo falla entre medias: con las notas antes, un corte
     deja la publicación describiendo la versión nueva con el ZIP de la
     anterior —visible y coherente de leer—; al revés dejaba el ZIP nuevo bajo
     las notas viejas, que es la combinación que engaña. Lo señaló una
     auditoría el 2026-09-15. */
  pasos.push(['notas al día', 'gh', ['release', 'edit', etiqueta, '--repo', REPO, '--notes', NOTAS]]);
  pasos.push(['ZIP adjunto', 'gh', ['release', 'upload', etiqueta, `${zip}#Entrega ${etiqueta}`, '--clobber', '--repo', REPO]]);
} else {
  pasos.push(['publicación con ZIP', 'gh', ['release', 'create', etiqueta, `${zip}#Entrega ${etiqueta}`,
    '--repo', REPO, '--title', `${etiqueta}`, '--notes', NOTAS]]);
}

/* ── 3 · La poda ──────────────────────────────────────────────────────────── */

const otras = JSON.parse(intenta('gh', ['release', 'list', '--repo', REPO, '--limit', '100', '--json', 'tagName']) || '[]')
  .map((r) => r.tagName)
  .filter((t) => t !== etiqueta);

const aPodar = [];
for (const t of otras) {
  const adj = JSON.parse(intenta('gh', ['release', 'view', t, '--repo', REPO, '--json', 'assets']) || '{"assets":[]}').assets;
  for (const a of adj) if (a.name.endsWith('.zip')) aPodar.push([t, a.name]);
}

/* ── Informe y ejecución ──────────────────────────────────────────────────── */

for (const [que] of pasos) console.log(`    ${HACERLO ? '·' : '→'} ${que}`);

/* EL ENSAYO EN SECO ENSEÑA LAS NOTAS. La función de este comando es «decir qué
   haría», y desde que las notas salen de `CAMBIOS` son lo único variable y
   editorial que se publica: el texto que lee quien instala. Era justo lo único
   que no se podía revisar antes — se publicaba y se leía después, que es el
   patrón que este repositorio declara fatal. Lo cazó una auditoría. */
if (!HACERLO) {
  console.log('\n  ── Notas de la publicación ' + '─'.repeat(46));
  for (const linea of NOTAS.split('\n')) console.log(`  │ ${linea}`);
  console.log('  ' + '─'.repeat(74));
}
if (aPodar.length) {
  console.log(`\n  ZIP de versiones anteriores a borrar (${aPodar.length}):`);
  for (const [t, n] of aPodar) console.log(`    ${HACERLO ? '·' : '→'} ${t}  ${n}`);
  console.log('\n  Las etiquetas y las publicaciones NO se tocan: npm install de una');
  console.log('  versión vieja tiene que seguir funcionando.');
}

if (!HACERLO) {
  console.log('\n  Nada hecho. Repite con --publicar.\n');
  process.exit(0);
}

for (const [que, cmd, args] of pasos) {
  process.stdout.write(`  ${que}… `);
  try { sh(cmd, args); console.log('hecho'); }
  catch (e) { console.error(`FALLÓ\n${e.stderr || e.message}`); process.exit(1); }
}
for (const [t, n] of aPodar) {
  process.stdout.write(`  borrando ${t}/${n}… `);
  try { sh('gh', ['release', 'delete-asset', t, n, '--yes', '--repo', REPO]); console.log('hecho'); }
  catch (e) { console.error(`FALLÓ\n${e.stderr || e.message}`); process.exit(1); }
}

console.log(`\n  ${etiqueta} publicada por las dos vías:`);
console.log(`    npm install "github:${REPO}#${etiqueta}"`);
console.log(`    https://github.com/${REPO}/releases/tag/${etiqueta}\n`);
