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
import { PanelPrivilegios, privilegiosEfectivos, type ColumnaPrivilegios,
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

describe('R153 · lo que encontró la auditoría sobre la caída a lista', () => {
  const CONFILAS: ModuloPrivilegios[] = [{ id: 'personal', nombre: 'Personal',
    filas: [{ id: 'trab', nombre: 'Trabajadores' }, { id: 'cont', nombre: 'Contratos' }],
    privilegios: [
      { id: 't-ver', nombre: 'Ver trabajadores', columna: 'ver', fila: 'trab' },
      { id: 't-ed', nombre: 'Editar trabajador', columna: 'editar', fila: 'trab' },
      { id: 'c-ver', nombre: 'Ver contratos', columna: 'ver', fila: 'cont' },
      { id: 'c-ed', nombre: 'Editar contrato', columna: 'editar', fila: 'cont' },
    ] }];
  /* A «Contratos» le falta su «ver», a «Trabajadores» no. */
  const MEDIAS = { personal: { 't-ver': true, 'c-ed': true } };

  it('[23] en la LISTA, el carril marca la fila que le falta — y el aviso va bajo SU base', () => {
    /* Se calculaba del PRIMER privilegio del módulo, así que con `filas` el
       carril salía o no según cuál estuviera declarada primero. Medido: la
       lista no marcaba NADA y enseñaba «Editar contrato» encendido con ese
       permiso FUERA de lo efectivo — el borrado silencioso del R150, reabierto
       por la caída a lista. */
    conAncho(360);
    const { container } = render(<PanelPrivilegios modulos={CONFILAS} base="ver"
      valor={MEDIAS} onCambio={() => {}} abiertos={['personal']} />);
    expect(container.querySelector('.pp-sin-base'), 'no se marca nada').not.toBeNull();
    const avisos = container.querySelectorAll('.pp-aviso');
    expect(avisos, 'el aviso falta, o sale repetido').toHaveLength(1);
    /* Y va DEBAJO del base que falta, no al final: regla 12. */
    const hijos = [...container.querySelectorAll('.pp-mod-cuerpo > *')];
    const iAviso = hijos.findIndex((x) => x.classList.contains('pp-aviso'));
    expect(hijos[iAviso - 1].textContent, 'el aviso no cuelga del base que falta')
      .toContain('Ver contratos');
  });

  it('[4] y el conteo NO contradice a lo efectivo', () => {
    /* Decía «2 de 4» con un solo privilegio efectivo. Lo que se ve sin abrir
       —que es lo que la regla 4 promete— era falso. */
    conAncho(360);
    const { container } = render(<PanelPrivilegios modulos={CONFILAS} base="ver"
      valor={MEDIAS} onCambio={() => {}} abiertos={['personal']} />);
    const efectivos = Object.values(privilegiosEfectivos(CONFILAS, MEDIAS, 'ver').personal)
      .filter((v) => v === true).length;
    expect(container.querySelector('.pp-conteo')!.textContent)
      .toBe(`${efectivos} de 4`);
  });

  it('[12] el base de cada fila se marca como base, no sólo el del módulo', () => {
    conAncho(360);
    const { container } = render(<PanelPrivilegios modulos={CONFILAS} base="ver"
      valor={MEDIAS} onCambio={() => {}} abiertos={['personal']} />);
    expect(container.querySelectorAll('.pp-priv-base'),
      'con dos filas hay dos bases, uno por recurso').toHaveLength(2);
  });

  it('[28] con varios módulos, el interruptor se LLAMA distinto', () => {
    /* `headers` asocia la celda para recorrer la tabla, pero no entra en el
       nombre accesible del botón: dos sedes con una fila «Contratos» daban dos
       interruptores llamados exactamente igual. La regla 28 daba esto por
       cerrado y sólo lo había arreglado en `headers`. */
    conAncho(1200);
    const dos: ModuloPrivilegios[] = [
      { id: 'n', nombre: 'Sede Norte', filas: [{ id: 'c', nombre: 'Contratos' }],
        privilegios: [{ id: 'n-e', nombre: 'Editar', columna: 'editar', fila: 'c' }] },
      { id: 's', nombre: 'Sede Sur', filas: [{ id: 'c', nombre: 'Contratos' }],
        privilegios: [{ id: 's-e', nombre: 'Editar', columna: 'editar', fila: 'c' }] },
    ];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={COLS}
      modulos={dos} base={null} valor={{}} onCambio={() => {}} />);
    const nombres = [...container.querySelectorAll('[role="switch"]')].map((sw) => {
      const id = sw.getAttribute('aria-labelledby')!;
      return id.split(' ').map((x) => container.querySelector(`#${CSS.escape(x)}`)?.textContent
        ?? '').join(' ');
    });
    expect(new Set(nombres).size, 'dos interruptores de módulos distintos se llaman igual')
      .toBe(nombres.length);
    expect(nombres[0]).toContain('Sede Norte');
  });

  it('[33] el `title` del nombre de fila vale también con nombre con formato', () => {
    /* `typeof n === "string"` dejaba fuera el caso más normal: el nombre con
       formato. Volvía a salir `null` y el nombre recortado dejaba de poder
       leerse — el defecto del R153 por la puerta de al lado. */
    conAncho(1200);
    const conFormato: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f', nombre: <b>Fijar sobre qué sedes alcanza un cargo</b> }],
      privilegios: [{ id: 'p', nombre: 'Ver', columna: 'ver', fila: 'f' }] }];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={COLS}
      modulos={conFormato} base={null} valor={{}} onCambio={() => {}} />);
    expect(container.querySelector('.pm-nom-txt')!.getAttribute('title'))
      .toBe('Fijar sobre qué sedes alcanza un cargo');
  });

  it('[24] el aviso de `abiertos` NO sale cuando se pinta la lista', () => {
    /* Salía también bajo 640 px, donde `abiertos` SÍ manda: el diagnóstico
       mentía justo en el ancho en el que importa, e invitaba a quitar una prop
       que allí hace falta. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    conAncho(360);
    render(<PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={CONFILAS}
      base={null} valor={{}} onCambio={() => {}} abiertos={['personal']}
      onAbiertos={() => {}} />);
    expect(gritar.mock.calls.flat().join(' ')).not.toContain('no hacen nada');
    gritar.mockRestore();
  });

  it('[24] y `abiertos` sin `onAbiertos` se dice: deja el panel sin poder abrirse', () => {
    /* Manda lo de fuera y el mando de dentro escribe donde ya nadie lee. En la
       lista de un teléfono, eso son los permisos inalcanzables. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    conAncho(360);
    render(<PanelPrivilegios modulos={CONFILAS} base={null} valor={{}}
      onCambio={() => {}} abiertos={[]} />);
    expect(gritar.mock.calls.flat().join(' ')).toContain('no se puede abrir ni cerrar');
    gritar.mockRestore();
  });
});
