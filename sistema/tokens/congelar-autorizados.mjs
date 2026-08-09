#!/usr/bin/env node
/**
 * CONGELAR LA LISTA DE COLORES AUTORIZADOS
 *
 *   node sistema/tokens/congelar-autorizados.mjs
 *
 * Reescribe `autorizados.lock.json` con la lista actual.
 *
 * EJECUTA ESTO SOLO CON AUTORIZACIÓN EXPRESA DEL USUARIO. Autorizar un color es
 * decisión suya: los «colores autorizados» son los únicos que pueden vivir en el
 * sistema, y ampliarlos por iniciativa propia vacía la palabra.
 *
 * Si el color hace falta pero NO se usa —un valor de un PNG, un tono que solo se
 * cita—, no viene aquí: va a `categoricas.marca`, que es CONOCIDA y NO
 * autorizada. Eso lo mete bajo el candado sin darle permiso de uso, y no
 * necesita autorización porque no autoriza nada.
 *
 * Está aparte del generador a propósito. Si el propio `generar.mjs` reescribiera
 * el congelado, el candado se resolvería solo cada vez que alguien ejecutara la
 * generación y no habría avisado nunca de nada.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, autorizados } from './fuente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

writeFileSync(
  join(AQUI, 'autorizados.lock.json'),
  JSON.stringify(
    {
      aviso:
        'Archivo generado. La lista de colores AUTORIZADOS del sistema, congelada. ' +
        'Ampliarla es decisión del usuario, no del agente: regenerar esto sin su ' +
        'permiso expreso salta la regla. Un color que hace falta pero no se usa va ' +
        'a `categoricas.marca` —conocida y no autorizada—, que sí puede crecer sola.',
      version: VERSION,
      total: autorizados.length,
      escalones: Object.fromEntries(autorizados),
    },
    null,
    2
  ) + '\n'
);

console.log(`\n  Congelados ${autorizados.length} escalones autorizados · v${VERSION}\n`);
