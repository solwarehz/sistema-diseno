import fs from 'node:fs';
const p = 'sistema/cascaron/generar-cascaron.mjs';
let s = fs.readFileSync(p, 'utf8');
const antes = s;
// El componente ya no emite la clase `rs` de raiz: ninguna regla la definia.
// El catalogo tiene que emitir EXACTAMENTE lo mismo.
s = s.split('class="rs rs-').join('class="rs-');
if (s === antes) throw new Error('no habia nada que igualar');
fs.writeFileSync(p, s);
console.log('catalogo igualado de verdad');
