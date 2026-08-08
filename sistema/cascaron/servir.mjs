#!/usr/bin/env node
/**
 * SERVIDOR DEL CASCARÓN
 *
 *   node sistema/cascaron/servir.mjs [puerto]
 *
 * Sirve `cascaron/` en 127.0.0.1 y nada más. No instala nada: usa el `http` que
 * trae Node. Existe porque `file://` bloquea parte de la verificación
 * automática del catálogo, no porque abrirlo a mano no funcione.
 *
 * Solo escucha en loopback. No expone nada a la red.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'cascaron');
const PUERTO = Number(process.argv[2]) || 8137;

const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

createServer(async (pet, res) => {
  const ruta = decodeURIComponent(new URL(pet.url, 'http://x').pathname);
  // Sin salir de `cascaron/`: se normaliza y se comprueba el prefijo.
  const destino = normalize(join(RAIZ, ruta === '/' ? 'index.html' : ruta));
  if (!destino.startsWith(RAIZ)) { res.writeHead(403).end('403'); return; }
  try {
    const cuerpo = await readFile(destino);
    const ext = destino.slice(destino.lastIndexOf('.'));
    res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream' }).end(cuerpo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404');
  }
}).listen(PUERTO, '127.0.0.1', () => {
  console.log(`\n  Cascarón en http://127.0.0.1:${PUERTO}\n`);
});
