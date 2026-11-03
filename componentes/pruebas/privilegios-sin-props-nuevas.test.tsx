/**
 * R168 · [38] sin ninguna prop nueva, el HTML es EL DE v1.150.0 — literal.
 *
 * La prueba hermana de `privilegios-plegable` solo mira que no aparezcan clases,
 * ids ni atributos nuevos; eso no ve un atributo CAMBIADO, una clase quitada ni un
 * orden distinto. Aquí se compara el marcado entero contra lo que emitió la
 * versión 1.150.0 (la última antes de R168), capturado ejecutando ESE componente
 * (`git show v1.150.0:componentes/src/PanelPrivilegios.tsx`) en cinco
 * configuraciones. Los `useId` se normalizan a `ID1`, `ID2`… por orden de aparición.
 *
 * Si un cambio legítimo altera el HTML por omisión, no se edita el literal a la
 * ligera: es una ruptura para quien ya usa el panel y pide versión mayor o prop.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PanelPrivilegios, type ColumnaPrivilegios, type ModuloPrivilegios,
  type ValorPrivilegios } from '../src/PanelPrivilegios';

const COLS: ColumnaPrivilegios[] = [
  { id: 'ver', titulo: 'Ver' },
  { id: 'editar', titulo: 'Editar' },
  { id: 'alta', titulo: 'Dar alta', aparte: true },
];

const MODS: ModuloPrivilegios[] = [
  { id: 'dash', nombre: 'Dashboard',
    filas: [{ id: 'clas', nombre: 'Clasificación semanal' }, { id: 'res', nombre: 'Resumen' }],
    privilegios: [
      { id: 'd-ver', nombre: 'Ver', columna: 'ver', fila: 'clas' },
      { id: 'd-editar', nombre: 'Editar', columna: 'editar', fila: 'clas', depende: 'd-ver' },
      { id: 'd-ver2', nombre: 'Ver', columna: 'ver', fila: 'res' },
      { id: 'd-alta', nombre: 'Dar alta', columna: 'alta', fila: 'res',
        cerrado: 'Lo cierra el área de sistemas' },
    ] },
  { id: 'horarios', nombre: 'Horarios', privilegios: [] },
  { id: 'marc', nombre: 'Marcaciones',
    privilegios: [
      { id: 'm-ver', nombre: 'Ver', columna: 'ver' },
      { id: 'm-editar', nombre: 'Editar', columna: 'editar' },
    ] },
];

const VALOR: ValorPrivilegios = {
  dash: { 'd-ver': true, 'd-editar': true, 'd-ver2': true },
  marc: { 'm-ver': true },
};

const noop = () => {};

/** Cada configuración usa SOLO props que ya existían en v1.150.0. */
const CONFIGS: Record<string, React.ReactElement> = {
  'matriz con tres módulos (uno vacío, un cerrado, un depende)':
    <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={MODS} base={null}
      valor={VALOR} onCambio={noop} />,
  'matriz con un solo módulo':
    <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={[MODS[2]]} base={null}
      valor={VALOR} onCambio={noop} />,
  'matriz con un módulo sin nada concedido':
    <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={[MODS[2]]} base={null}
      valor={{}} onCambio={noop} />,
  'lista con tres módulos (uno vacío)':
    <PanelPrivilegios presentacion="lista" modulos={MODS} base={null}
      valor={VALOR} onCambio={noop} />,
  'lista con un solo módulo con grupos, niveles y base':
    <PanelPrivilegios presentacion="lista" base="ver" valor={{ g: { ver: true, edit: true, niv: true } }}
      onCambio={noop}
      modulos={[{ id: 'g', nombre: 'Gestión',
        privilegios: [
          { id: 'ver', nombre: 'Ver' },
          { id: 'edit', nombre: 'Editar', depende: 'ver' },
          { id: 'niv', nombre: 'Alcance', depende: 'ver',
            niveles: [{ id: 'alc', nombre: 'Alcance',
              opciones: [{ valor: 'propio', texto: 'Propio' }, { valor: 'todo', texto: 'Todo' }] }] },
        ] }]} />,
};

/** `useId` → `ID1`, `ID2`… por orden de primera aparición. */
function normalizar(html: string): string {
  const vistos = new Map<string, string>();
  return html.replace(/[:«][rR]?[0-9a-z]+[:»]/g, (m) => {
    if (!vistos.has(m)) vistos.set(m, `ID${vistos.size + 1}`);
    return vistos.get(m)!;
  });
}

const LITERALES: Record<string, string> = {
  // matriz con tres módulos (uno vacío, un cerrado, un depende)
  "matriz con tres módulos (uno vacío, un cerrado, un depende)":
    "<div class=\"pp\"><div class=\"pm-envoltura\"><table class=\"pm\"><thead><tr><th class=\"pm-esquina\" scope=\"col\"><span class=\"sr-solo\">Opción</span></th><th scope=\"col\" id=\"ID1-col-ver\" class=\"pm-col\"><span class=\"pm-col-txt\">Ver</span></th><th scope=\"col\" id=\"ID1-col-editar\" class=\"pm-col\"><span class=\"pm-col-txt\">Editar</span></th><th scope=\"col\" id=\"ID1-col-alta\" class=\"pm-col pm-col-aparte\"><span class=\"pm-col-txt\">Dar alta</span></th></tr></thead><tbody><tr class=\"pm-mod\"><th scope=\"colgroup\" colspan=\"4\" class=\"pm-mod-nom\" id=\"ID1-mod-0\">Dashboard</th></tr><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-0-0\"><span class=\"pm-nom-txt\" title=\"Clasificación semanal\">Clasificación semanal</span></th><td headers=\"ID1-mod-0 ID1-fila-0-0 ID1-col-ver\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID2-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID2-et\"><span class=\"sr-solo\">Dashboard · </span><span class=\"sr-solo\">Clasificación semanal · </span>Ver</span></span></label></td><td headers=\"ID1-mod-0 ID1-fila-0-0 ID1-col-editar\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID3-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID3-et\"><span class=\"sr-solo\">Dashboard · </span><span class=\"sr-solo\">Clasificación semanal · </span>Editar</span></span></label></td><td headers=\"ID1-mod-0 ID1-fila-0-0 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td></tr><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-0-1\"><span class=\"pm-nom-txt\" title=\"Resumen\">Resumen</span></th><td headers=\"ID1-mod-0 ID1-fila-0-1 ID1-col-ver\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID4-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID4-et\"><span class=\"sr-solo\">Dashboard · </span><span class=\"sr-solo\">Resumen · </span>Ver</span></span></label></td><td headers=\"ID1-mod-0 ID1-fila-0-1 ID1-col-editar\" class=\"pm-celda pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td><td headers=\"ID1-mod-0 ID1-fila-0-1 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-no pm-no-cerrado\" title=\"Lo cierra el área de sistemas\"><span class=\"pm-no-ic\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"2\"></rect><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"></path></svg></span><span class=\"sr-solo\">Dashboard · Resumen · Dar alta: no se puede conceder. Lo cierra el área de sistemas</span></td></tr><tr class=\"pm-mod\"><th scope=\"colgroup\" colspan=\"4\" class=\"pm-mod-nom\" id=\"ID1-mod-1\">Horarios</th></tr><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-1-0\"><span class=\"pm-nom-txt\" title=\"Horarios\">Horarios</span></th><td headers=\"ID1-mod-1 ID1-fila-1-0 ID1-col-ver\" class=\"pm-celda pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td><td headers=\"ID1-mod-1 ID1-fila-1-0 ID1-col-editar\" class=\"pm-celda pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td><td headers=\"ID1-mod-1 ID1-fila-1-0 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td></tr><tr class=\"pm-mod\"><th scope=\"colgroup\" colspan=\"4\" class=\"pm-mod-nom\" id=\"ID1-mod-2\">Marcaciones</th></tr><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-2-0\"><span class=\"pm-nom-txt\" title=\"Marcaciones\">Marcaciones</span></th><td headers=\"ID1-mod-2 ID1-fila-2-0 ID1-col-ver\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID5-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID5-et\"><span class=\"sr-solo\">Marcaciones · </span><span class=\"sr-solo\">Marcaciones · </span>Ver</span></span></label></td><td headers=\"ID1-mod-2 ID1-fila-2-0 ID1-col-editar\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"false\" aria-labelledby=\"ID6-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID6-et\"><span class=\"sr-solo\">Marcaciones · </span><span class=\"sr-solo\">Marcaciones · </span>Editar</span></span></label></td><td headers=\"ID1-mod-2 ID1-fila-2-0 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td></tr></tbody></table></div></div>",
  // matriz con un solo módulo
  "matriz con un solo módulo":
    "<div class=\"pp\"><div class=\"pm-envoltura\"><table class=\"pm\"><thead><tr><th class=\"pm-esquina\" scope=\"col\"><span class=\"sr-solo\">Opción</span></th><th scope=\"col\" id=\"ID1-col-ver\" class=\"pm-col\"><span class=\"pm-col-txt\">Ver</span></th><th scope=\"col\" id=\"ID1-col-editar\" class=\"pm-col\"><span class=\"pm-col-txt\">Editar</span></th><th scope=\"col\" id=\"ID1-col-alta\" class=\"pm-col pm-col-aparte\"><span class=\"pm-col-txt\">Dar alta</span></th></tr></thead><tbody><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-0-0\"><span class=\"pm-nom-txt\" title=\"Marcaciones\">Marcaciones</span></th><td headers=\"ID1-fila-0-0 ID1-col-ver\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID2-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID2-et\"><span class=\"sr-solo\">Marcaciones · </span>Ver</span></span></label></td><td headers=\"ID1-fila-0-0 ID1-col-editar\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"false\" aria-labelledby=\"ID3-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID3-et\"><span class=\"sr-solo\">Marcaciones · </span>Editar</span></span></label></td><td headers=\"ID1-fila-0-0 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td></tr></tbody></table></div></div>",
  // matriz con un módulo sin nada concedido
  "matriz con un módulo sin nada concedido":
    "<div class=\"pp\"><div class=\"pm-envoltura\"><table class=\"pm\"><thead><tr><th class=\"pm-esquina\" scope=\"col\"><span class=\"sr-solo\">Opción</span></th><th scope=\"col\" id=\"ID1-col-ver\" class=\"pm-col\"><span class=\"pm-col-txt\">Ver</span></th><th scope=\"col\" id=\"ID1-col-editar\" class=\"pm-col\"><span class=\"pm-col-txt\">Editar</span></th><th scope=\"col\" id=\"ID1-col-alta\" class=\"pm-col pm-col-aparte\"><span class=\"pm-col-txt\">Dar alta</span></th></tr></thead><tbody><tr class=\"pm-fila\"><th scope=\"row\" class=\"pm-nom\" id=\"ID1-fila-0-0\"><span class=\"pm-nom-txt\" title=\"Marcaciones\">Marcaciones</span></th><td headers=\"ID1-fila-0-0 ID1-col-ver\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"false\" aria-labelledby=\"ID2-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID2-et\"><span class=\"sr-solo\">Marcaciones · </span>Ver</span></span></label></td><td headers=\"ID1-fila-0-0 ID1-col-editar\" class=\"pm-celda\"><label class=\"sw-fila sw-solo\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"false\" aria-labelledby=\"ID3-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt sr-solo\"><span class=\"sw-et\" id=\"ID3-et\"><span class=\"sr-solo\">Marcaciones · </span>Editar</span></span></label></td><td headers=\"ID1-fila-0-0 ID1-col-alta\" class=\"pm-celda pm-celda-aparte pm-vacia\"><span class=\"sr-solo\">Sin declarar</span></td></tr></tbody></table></div></div>",
  // lista con tres módulos (uno vacío)
  "lista con tres módulos (uno vacío)":
    "<div class=\"pp\"><div class=\"pp-lista\"><section class=\"pp-mod\"><button type=\"button\" class=\"pp-mod-cab\" aria-expanded=\"false\" aria-controls=\"pp-dash\"><span class=\"pp-chev\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m6 9 6 6 6-6\"></path></svg></span><span class=\"pp-mod-nom\">Dashboard</span><span class=\"pp-tags\"><span class=\"chip chip-info\">Ver</span><span class=\"chip chip-info\">Editar</span><span class=\"chip chip-info\">Ver</span><span class=\"chip chip-info pp-tags-mas\">+1</span></span><span class=\"pp-conteo\">3 de 3</span></button><div class=\"pp-mod-cuerpo\" id=\"pp-dash\" hidden=\"\"><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID1-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID1-et\">Ver</span></span></label></div><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID2-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID2-et\">Editar</span></span></label></div><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID3-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID3-et\">Ver</span></span></label></div><div class=\"pp-priv pp-no-cerrado\"><div class=\"pp-cerrado\"><span class=\"pp-cerrado-ic\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"4\" y=\"10\" width=\"16\" height=\"10\" rx=\"2\"></rect><path d=\"M8 10V7a4 4 0 0 1 8 0v3\"></path></svg></span><span class=\"pp-cerrado-txt\"><span class=\"pp-cerrado-nom\">Dar alta</span><span class=\"pp-cerrado-eti\"><span class=\"chip chip-inact\">no se puede conceder</span></span><span class=\"pp-cerrado-motivo\">Lo cierra el área de sistemas</span></span></div></div></div></section><section class=\"pp-mod\"><button type=\"button\" class=\"pp-mod-cab\" aria-expanded=\"false\" aria-controls=\"pp-horarios\"><span class=\"pp-chev\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m6 9 6 6 6-6\"></path></svg></span><span class=\"pp-mod-nom\">Horarios</span><span class=\"pp-tags\"><span class=\"chip chip-pend\">sin permisos</span></span><span class=\"pp-conteo\">0 de 0</span></button><div class=\"pp-mod-cuerpo\" id=\"pp-horarios\" hidden=\"\"></div></section><section class=\"pp-mod\"><button type=\"button\" class=\"pp-mod-cab\" aria-expanded=\"false\" aria-controls=\"pp-marc\"><span class=\"pp-chev\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m6 9 6 6 6-6\"></path></svg></span><span class=\"pp-mod-nom\">Marcaciones</span><span class=\"pp-tags\"><span class=\"chip chip-info\">Ver</span></span><span class=\"pp-conteo\">1 de 2</span></button><div class=\"pp-mod-cuerpo\" id=\"pp-marc\" hidden=\"\"><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID4-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID4-et\">Ver</span></span></label></div><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"false\" aria-labelledby=\"ID5-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID5-et\">Editar</span></span></label></div></div></section></div></div>",
  // lista con un solo módulo con grupos, niveles y base
  "lista con un solo módulo con grupos, niveles y base":
    "<div class=\"pp\"><div class=\"pp-lista\"><section class=\"pp-mod\"><button type=\"button\" class=\"pp-mod-cab\" aria-expanded=\"false\" aria-controls=\"pp-g\"><span class=\"pp-chev\"><svg class=\"ic\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m6 9 6 6 6-6\"></path></svg></span><span class=\"pp-mod-nom\">Gestión</span><span class=\"pp-tags\"><span class=\"chip chip-info\">Ver</span><span class=\"chip chip-info\">Editar</span><span class=\"chip chip-info\">Alcance</span><span class=\"chip chip-info pp-tags-mas\">+1</span></span><span class=\"pp-conteo\">3 de 3</span></button><div class=\"pp-mod-cuerpo\" id=\"pp-g\" hidden=\"\"><div class=\"pp-priv pp-priv-base\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID1-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID1-et\">Ver</span></span></label></div><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID2-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID2-et\">Editar</span></span></label></div><div class=\"pp-priv\"><label class=\"sw-fila\"><button type=\"button\" role=\"switch\" class=\"sw\" aria-checked=\"true\" aria-labelledby=\"ID3-et\"><span class=\"sw-bolita\"></span></button><span class=\"sw-txt\"><span class=\"sw-et\" id=\"ID3-et\">Alcance</span></span></label><div class=\"pp-niveles\"><fieldset class=\"sg\"><legend class=\"sg-et\"><span class=\"sr-solo\">Gestión · </span>Alcance</legend><div class=\"sg-barra\"><label class=\"sg-op\" for=\"ID4-propio\"><input id=\"ID4-propio\" class=\"sg-in\" type=\"radio\" name=\"ID4\" aria-labelledby=\"ID4-propio-txt\" value=\"propio\" checked=\"\"><span class=\"sg-txt\" id=\"ID4-propio-txt\">Propio</span></label><label class=\"sg-op\" for=\"ID4-todo\"><input id=\"ID4-todo\" class=\"sg-in\" type=\"radio\" name=\"ID4\" aria-labelledby=\"ID4-todo-txt\" value=\"todo\"><span class=\"sg-txt\" id=\"ID4-todo-txt\">Todo</span></label></div></fieldset></div></div></div></section></div></div>",
};

describe('R168 · [38] sin props nuevas el HTML es idéntico al de v1.150.0', () => {
  for (const nombre of Object.keys(CONFIGS)) {
    it(`[38] ${nombre}`, () => {
      const { container } = render(CONFIGS[nombre]);
      const html = normalizar(container.innerHTML);
      if (process.env.VOLCAR_PANEL) {
        process.stdout.write(`\n@@${JSON.stringify([nombre, html])}@@\n`);
        return;
      }
      expect(LITERALES[nombre], 'falta el literal capturado de v1.150.0').toBeDefined();
      expect(html).toBe(LITERALES[nombre]);
    });
  }
});
