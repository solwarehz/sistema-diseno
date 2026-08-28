#!/usr/bin/env node
/**
 * VERIFICADOR DE CONTRASTE — el candado mecánico (§7)
 *
 *   node sistema/candado/verificar-contraste.mjs
 *
 * Lee `paleta.lock.json` y RECALCULA cada par desde cero. No confía en el
 * número guardado: lo comprueba. Si alguien cambia un valor sin regenerar el
 * contrato, o si el contrato miente, esto falla y el pipeline se detiene.
 *
 * Sale con código 1 si hay cualquier discrepancia. Pensado para CI.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const LOCK = join(AQUI, '..', 'tokens', 'paleta.lock.json');

// ── WCAG 2.2 ────────────────────────────────────────────────────────────────

const canal = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminancia = (hex) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

const medir = (a, b) => {
  const [la, lb] = [luminancia(a), luminancia(b)];
  const [alto, bajo] = la > lb ? [la, lb] : [lb, la];
  return Math.floor(((alto + 0.05) / (bajo + 0.05)) * 100) / 100;
};

// ── Verificación ────────────────────────────────────────────────────────────

let lock;
try {
  lock = JSON.parse(readFileSync(LOCK, 'utf8'));
} catch (e) {
  console.error(`\n  No se pudo leer el contrato: ${LOCK}`);
  console.error(`  ${e.message}\n`);
  process.exit(1);
}

const problemas = [];

for (const par of lock.contrastes) {
  const { modo, frente, fondo, hexFrente, hexFondo, ratio, minimo, motivo } = par;
  const etiqueta = `[${modo}] ${frente} sobre ${fondo}`;

  // 1 · El hex guardado debe coincidir con el semántico declarado, en ESE modo.
  //     Detecta que alguien editó un token y no regeneró.
  // R113 · Un par puede nombrar un token de MARCA desde que el rojo del escudo
  // se autorizó para los iconos de redes. Antes esto solo miraba `semanticos` y
  // devolvía `undefined`, o sea que el candado se rompía justo cuando por fin
  // tenía algo de marca que vigilar. `semanticos` va primero: un nombre
  // repetido no puede quedar secuestrado por la marca.
  const donde = (n) => lock.semanticos[n] ?? lock.marca?.[n];
  const realFrente = donde(frente)?.[modo];
  const realFondo = donde(fondo)?.[modo];
  if (realFrente !== hexFrente) {
    problemas.push(`  ${etiqueta}: el par dice ${hexFrente} pero ${frente} vale ${realFrente}`);
    continue;
  }
  if (realFondo !== hexFondo) {
    problemas.push(`  ${etiqueta}: el par dice ${hexFondo} pero ${fondo} vale ${realFondo}`);
    continue;
  }

  // 2 · El contraste guardado debe coincidir con el recalculado.
  const recalculado = medir(hexFrente, hexFondo);
  if (recalculado !== ratio) {
    problemas.push(`  ${etiqueta}: el contrato dice ${ratio}:1, el cálculo da ${recalculado}:1`);
    continue;
  }

  // 3 · El contraste debe alcanzar su mínimo.
  if (minimo !== 'informativo' && recalculado < minimo) {
    problemas.push(`  ${etiqueta}: ${recalculado}:1 < ${minimo}:1 — ${motivo}`);
  }
}

// ── Reporte ─────────────────────────────────────────────────────────────────

const { paresTotales, paresBloqueantes, paresInformativos } = lock.resumen;

console.log(`\n  Candado de color — ${lock.documento} v${lock.version} · ${lock.norma}\n`);
console.log(`  Modos:        ${lock.modos.join(' · ')}`);
console.log(`  Pares:        ${paresTotales} (${paresBloqueantes} bloqueantes · ${paresInformativos} informativos)`);
for (const m of lock.modos) {
  const r = lock.resumen.porModo[m];
  console.log(`    ${m.padEnd(7)} ${String(r.bloqueantes).padStart(2)} bloqueantes · ${r.fallos} fallos`);
}

if (problemas.length) {
  console.error(`\n  ${problemas.length} problema(s):\n`);
  problemas.forEach((p) => console.error(p));
  console.error(
    `\n  El contrato y los valores no coinciden.\n` +
      `  Corrige sistema/tokens/fuente.mjs y ejecuta:\n` +
      `      node sistema/tokens/generar.mjs\n`
  );
  process.exit(1);
}

console.log(`  Recalculados: ${paresTotales} de ${paresTotales}`);
console.log(`  Fallos:       0\n`);
console.log(`  El contrato es fiel a los valores.\n`);
