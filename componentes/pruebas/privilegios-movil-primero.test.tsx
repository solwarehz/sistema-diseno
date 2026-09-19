/**
 * MÓVIL PRIMERO · la matriz cae a lista cuando no cabe.
 *
 * Política del responsable (CLAUDE.md §4bis, 2026-09-19), vinculante. No vino
 * con el R151 porque el equipo dejó el responsive como deseable y no como
 * requisito — y eso no lo saca de la política: un requisito de producto puede
 * faltar, una política del sistema no.
 *
 * Lo que se midió antes de escribir esto, en Chrome sobre el catálogo: a 360 px
 * la tabla ocupaba **687 px** y seguía siendo tabla, con el nombre de fila
 * recortado y **sin `title`** — el nombre completo no estaba en ninguna parte.
 */
import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PanelPrivilegios, type ColumnaPrivilegios,
  type ModuloPrivilegios } from '../src/PanelPrivilegios';

const COLS: ColumnaPrivilegios[] = [
  { id: 'ver', titulo: 'Ver' }, { id: 'editar', titulo: 'Editar' },
  { id: 'crear', titulo: 'Crear' }, { id: 'descargar', titulo: 'Descargar' },
];
const MODS: ModuloPrivilegios[] = [{ id: 'personal', nombre: 'Personal',
  filas: [
    { id: 'trab', nombre: 'Trabajadores' },
    { id: 'sedes', nombre: 'Fijar sobre qué sedes alcanza un cargo del área' },
  ],
  privilegios: [
    { id: 't-ver', nombre: 'Ver', columna: 'ver', fila: 'trab' },
    { id: 't-ed', nombre: 'Editar', columna: 'editar', fila: 'trab' },
    { id: 's-ver', nombre: 'Ver sedes', columna: 'ver', fila: 'sedes' },
  ] }];

/* Un `ResizeObserver` que se puede accionar a mano: jsdom no lo trae, y el
   componente sólo decide cuando PUEDE medir — sin forma de medir respeta lo que
   se le pidió, porque ahí no hay un ancho que consultar. */
let disparar: ((ancho: number) => void) | null = null;
let anchoFingido = 0;
const rectOriginal = HTMLElement.prototype.getBoundingClientRect;
const conAncho = (w: number) => { anchoFingido = w; };
beforeEach(() => {
  anchoFingido = 0;
  HTMLElement.prototype.getBoundingClientRect = function () {
    return { ...rectOriginal.call(this), width: anchoFingido } as DOMRect;
  };
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    cb: (e: { contentRect: { width: number } }[]) => void;
    constructor(cb: (e: { contentRect: { width: number } }[]) => void) { this.cb = cb; }
    /* El disparador se entrega en `observe`, no en el constructor: creándolo
       antes, quitar el `observe()` del componente pasaba desapercibido — la
       prueba seguía pudiendo empujar anchos a un observador que no observaba
       nada. Una sonda que funciona sin estar conectada no prueba la conexión. */
    observe() {
      disparar = (ancho: number) => act(() => { this.cb([{ contentRect: { width: ancho } }]); });
    }
    disconnect() { disparar = null; }
  };
});
afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = rectOriginal;
  delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  disparar = null;
});

const pinta = (extra = {}) => render(
  <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={MODS} base={null}
    valor={{}} onCambio={() => {}} abiertos={['personal']} {...extra} />
);

describe('[33] Móvil primero · la matriz cae a lista cuando no cabe', () => {
  it('[33] sin sitio, LISTA — aunque el producto pidiera matriz', () => {
    /* Lo importante de móvil primero no es el orden de los pintados: es que a
       ancho de teléfono se vea la forma que cabe. El estado del que parte el
       componente es el estrecho —`useState(null)`, que resuelve a «no cabe»— y
       la medida se aplica en un efecto de DISEÑO, antes de que el navegador
       pinte, para no enseñar el paso intermedio. Por eso el valor inicial no se
       puede observar desde fuera, y lo que se mide aquí es el resultado. */
    conAncho(360);
    const { container } = pinta();
    expect(container.querySelector('table.pm'), 'a 360 px sigue siendo matriz').toBeNull();
    expect(container.querySelector('.pp-lista')).not.toBeNull();
  });

  it('[33] con sitio de sobra, gana la matriz', () => {
    conAncho(1200);
    const { container } = pinta();
    expect(container.querySelector('table.pm'), 'con 1200 px no se pinta la matriz')
      .not.toBeNull();
  });

  it('[33] a ancho de teléfono, la lista — y NADA que deslizar en horizontal', () => {
    /* A 360 px la tabla medía 687 px: había que arrastrar para leer lo que la
       pantalla tiene que decir, que es lo que la política prohíbe. */
    conAncho(1200);
    const { container } = pinta();
    expect(container.querySelector('table.pm')).not.toBeNull();
    disparar!(360);
    expect(container.querySelector('table.pm'), 'a 360 px sigue siendo una tabla')
      .toBeNull();
    expect(container.querySelector('.pm-envoltura'),
      'queda el deslizador horizontal, que es lo que se venía a quitar').toBeNull();
    expect(container.querySelector('.pp-lista')).not.toBeNull();
  });

  it('[33] el corte son 640 px, y se comprueba en los dos lados', () => {
    conAncho(640);
    const { container } = pinta();
    expect(container.querySelector('table.pm'), 'justo en 640 debe caber').not.toBeNull();
    disparar!(639);
    expect(container.querySelector('table.pm'), 'por debajo de 640 no cae a lista').toBeNull();
  });

  it('[33] y en la lista se conserva lo que la lista sabe hacer: agrupar y plegar', () => {
    /* No es una matriz recortada: es la presentación en lista, con sus módulos
       en acordeón. Es lo que hace que quepa en una columna. */
    conAncho(360);
    const { container } = pinta();
    expect(container.querySelectorAll('.pp-mod-cab').length,
      'no hay cabecera de módulo que plegar').toBeGreaterThan(0);
    expect(container.querySelectorAll('.pp-mod-cuerpo').length).toBeGreaterThan(0);
  });

  it('[33] un ancho de CERO no es un ancho estrecho: es «aquí no hay maquetado»', () => {
    /* Con observador disponible pero sin layout —jsdom, o un render que aún no
       ha maquetado— `getBoundingClientRect()` da 0. Tratarlo como «no cabe»
       convertiría en lista toda pantalla que se monte antes de maquetar, y es
       inventar una medida para cambiarle la forma al producto. */
    conAncho(0);
    const { container } = pinta();
    expect(container.querySelector('table.pm'),
      'un ancho de 0 se leyó como pantalla estrecha').not.toBeNull();
  });

  it('[33] sin forma de medir se respeta lo pedido, en vez de inventar un ancho', () => {
    /* Render en servidor, o un entorno sin `ResizeObserver`: ahí no hay ancho
       que consultar, y fingir uno sería inventarlo. */
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    const { container } = pinta();
    expect(container.querySelector('table.pm'),
      'sin poder medir, se dejó de pintar lo que el producto pidió').not.toBeNull();
  });

  it('[33] el nombre de fila recortado SE PUEDE LEER ENTERO', () => {
    /* Lo midió el equipo en su pantalla: «Fijar sobre qué sedes alcanza u…» sin
       forma de leerlo entero — ni a la vista, ni en globito, ni para un lector.
       El recorte es presentación; la información no se recorta. */
    conAncho(1200);
    const { container } = pinta();
    const largo = [...container.querySelectorAll('.pm-nom-txt')]
      .find((x) => x.textContent?.startsWith('Fijar sobre'))!;
    expect(largo.getAttribute('title'),
      'el nombre cortado no se puede leer entero de ninguna forma')
      .toBe('Fijar sobre qué sedes alcanza un cargo del área');
  });
});
