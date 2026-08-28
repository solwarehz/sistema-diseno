import { readFileSync } from 'node:fs';
const css = readFileSync('sistema/tokens/tokens.css', 'utf8');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h) => { const [r, g, b] = hex(h).map((c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const f = (n) => n.toFixed(2).replace('.', ',');

// El bloque claro es todo lo anterior al primer bloque de oscuro.
const corte = css.indexOf('Marca en oscuro');
const inicioOscuro = css.lastIndexOf('{', corte);
const claro = css.slice(0, inicioOscuro);
const oscuro = css.slice(inicioOscuro);
const val = (bloque, n) => (bloque.match(new RegExp('--' + n + ':\s*(#[0-9A-Fa-f]{6})')) || [])[1];

const fondos = {
  'tarjeta claro': val(claro, 'fondo-tarjeta'), 'tarjeta oscuro': val(oscuro, 'fondo-tarjeta') || val(claro, 'fondo-tarjeta'),
  'pagina claro': val(claro, 'fondo-pagina'), 'pagina oscuro': val(oscuro, 'fondo-pagina') || val(claro, 'fondo-pagina'),
};
console.log('\n  fondos:', JSON.stringify(fondos), '\n');
for (const n of ['marca-rojo', 'marca-rojo-panel', 'marca-oro', 'marca-amarillo', 'marca-celeste']) {
  const c = val(claro, n), o = val(oscuro, n) || c;
  const rc = ratio(c, fondos['tarjeta claro']), ro = ratio(o, fondos['tarjeta oscuro']);
  console.log(`  ${n.padEnd(18)} claro ${c} ${f(rc).padStart(6)}:1   oscuro ${o} ${f(ro).padStart(6)}:1   ${rc >= 3 && ro >= 3 ? 'pasa 3:1' : 'NO llega a 3:1'}`);
}
