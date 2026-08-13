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
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../tokens/fuente.mjs';
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

const hayPublicacion = intenta('gh', ['release', 'view', etiqueta, '--repo', REPO, '--json', 'tagName']);
if (hayPublicacion) {
  pasos.push(['ZIP adjunto', 'gh', ['release', 'upload', etiqueta, `${zip}#Entrega ${etiqueta}`, '--clobber', '--repo', REPO]]);
} else {
  pasos.push(['publicación con ZIP', 'gh', ['release', 'create', etiqueta, `${zip}#Entrega ${etiqueta}`,
    '--repo', REPO, '--title', `${etiqueta}`, '--notes', `Instalación:\n\n    npm install "github:${REPO}#${etiqueta}"\n\nO el ZIP adjunto.`]]);
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
