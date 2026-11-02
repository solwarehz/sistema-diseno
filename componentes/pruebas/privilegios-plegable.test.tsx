/**
 * R168 · los títulos del menú: módulos plegables, título sin privilegios, resumen
 * limpio y encabezado con icono — reglas 34 a 38 del contrato.
 *
 * Lo pidió el equipo de Control de Asistencia: su pantalla de privilegios sigue
 * el menú, con títulos que todavía no tienen opciones debajo. Lo que fijan estas
 * pruebas es lo difícil de ver a ojo: que SIN las props nuevas nada cambia, que
 * lo plegado sale del árbol de accesibilidad y que un título vacío no dice nada
 * falso («sin permisos», «0 de 0»).
 */
import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PanelPrivilegios, type ColumnaPrivilegios, type ModuloPrivilegios,
  type ValorPrivilegios } from '../src/PanelPrivilegios';

const COLS: ColumnaPrivilegios[] = [
  { id: 'ver', titulo: 'Ver', icono: 'ojo' },
  { id: 'editar', titulo: 'Editar', icono: 'lapiz' },
  { id: 'alta', titulo: 'Dar alta' },
];
const COLS_SIN_ICONO: ColumnaPrivilegios[] = COLS.map(({ id, titulo }) => ({ id, titulo }));

const MODS: ModuloPrivilegios[] = [
  { id: 'dash', nombre: 'Dashboard', filas: [{ id: 'clas', nombre: 'Clasificación semanal' }],
    privilegios: [
      { id: 'd-ver', nombre: 'Ver', columna: 'ver', fila: 'clas' },
      { id: 'd-editar', nombre: 'Editar', columna: 'editar', fila: 'clas' },
    ] },
  { id: 'horarios', nombre: 'Horarios', privilegios: [] },
  { id: 'marc', nombre: 'Marcaciones', privilegios: [] },
];
const UNO = [MODS[0]];

type Extra = Partial<React.ComponentProps<typeof PanelPrivilegios>>;
function Panel({ inicial = {} as ValorPrivilegios, ...extra }: { inicial?: ValorPrivilegios } & Extra) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return (
    <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={MODS} base={null}
      valor={v} onCambio={(c) => setV(c)} {...extra} />
  );
}
const lista = (extra: Extra & { inicial?: ValorPrivilegios } = {}) =>
  ({ presentacion: 'lista' as const, columnas: undefined, ...extra });

const bandas = (c: HTMLElement, sel = '.pm-mod-cab') => Array.from(c.querySelectorAll<HTMLElement>(sel));
const filas = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('tr.pm-fila'));
const DASH_VER = { dash: { 'd-ver': true } };

describe('R168 · [34] la banda pliega y despliega, también en la matriz', () => {
  it('[34] con `plegable` la banda es un botón con aria-expanded y todo empieza cerrado', () => {
    const { container } = render(<Panel plegable />);
    const b = bandas(container);
    expect(b).toHaveLength(3);
    expect(b.every((x) => x.tagName === 'BUTTON' && x.getAttribute('aria-expanded') === 'false')).toBe(true);
    // Cerrado = FUERA del árbol de accesibilidad: `hidden`, no altura cero.
    expect(filas(container).every((r) => r.hidden)).toBe(true);
  });

  it('[34] pulsar la banda muestra sus filas, y volver a pulsar las oculta', () => {
    const { container } = render(<Panel plegable />);
    const dash = bandas(container)[0];
    fireEvent.click(dash);
    expect(dash.getAttribute('aria-expanded')).toBe('true');
    expect(filas(container).every((r) => !r.hidden)).toBe(true);
    fireEvent.click(dash);
    expect(dash.getAttribute('aria-expanded')).toBe('false');
    expect(filas(container).every((r) => r.hidden)).toBe(true);
  });

  it('[34] `aria-controls` nombra filas que existen', () => {
    const { container } = render(<Panel plegable />);
    const ids = (bandas(container)[0].getAttribute('aria-controls') ?? '').split(' ');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(container.querySelector(`[id="${id}"]`)).not.toBeNull();
  });

  it('[34] `abiertos` y `onAbiertos` mandan también en la matriz', () => {
    const onAbiertos = vi.fn();
    const { container } = render(<Panel plegable abiertos={['dash']} onAbiertos={onAbiertos} />);
    expect(bandas(container)[0].getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(bandas(container)[0]);
    expect(onAbiertos).toHaveBeenCalledWith([]);
  });

  it('[34] plegar no cambia el valor ni dispara `onCambio`', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" plegable columnas={COLS} modulos={MODS} base={null}
        valor={DASH_VER} onCambio={onCambio} />);
    fireEvent.click(bandas(container)[0]);
    fireEvent.click(bandas(container)[0]);
    expect(onCambio).not.toHaveBeenCalled();
  });

  it('[34] con `plegable` la banda sale aunque haya un solo módulo; sin él, no', () => {
    const con = render(<Panel plegable modulos={UNO} />);
    expect(bandas(con.container)).toHaveLength(1);
    con.unmount();
    const sin = render(<Panel modulos={UNO} />);
    expect(bandas(sin.container, '.pm-mod')).toHaveLength(0);
  });

  it('[34] el módulo no entra en `headers`: la banda lleva chips y contador, que no son su nombre', () => {
    const { container } = render(<Panel plegable abiertos={['dash']} onAbiertos={() => {}} />);
    const bandaId = container.querySelector('.pm-mod-nom')!.id;
    const celdas = Array.from(container.querySelectorAll('td[headers]'));
    expect(celdas.length).toBeGreaterThan(0);
    expect(celdas.some((td) => (td.getAttribute('headers') ?? '').split(' ').includes(bandaId))).toBe(false);
  });

  it('[34] la lista también pliega con `plegable` y su estado inicial no cambia', () => {
    const { container } = render(<Panel {...lista({ plegable: true })} />);
    const b = bandas(container, '.pp-mod-cab');
    expect(b.every((x) => x.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('[34] `abiertos` sin `onAbiertos` con `plegable` avisa, como en la lista', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Panel plegable abiertos={['dash']} />);
    expect(aviso.mock.calls.some((a) => /abiertos.*onAbiertos/.test(String(a[0])))).toBe(true);
    aviso.mockRestore();
  });

  it('[34] con `plegable`, `abiertos` ya no se avisa como «no hace nada» en la matriz', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Panel plegable abiertos={['dash']} onAbiertos={() => {}} />);
    expect(aviso.mock.calls.some((a) => /no hacen nada MIENTRAS SE PINTA LA MATRIZ/.test(String(a[0])))).toBe(false);
    aviso.mockRestore();
  });
});

describe('R168 · [35] un módulo sin privilegios es solo un título', () => {
  it('[35] en matriz: banda con chevron y nada más, sin fila repetida ni «Sin declarar»', () => {
    const { container } = render(<Panel plegable abiertos={['horarios']} onAbiertos={() => {}} />);
    const horarios = bandas(container)[1];
    expect(horarios.textContent).toContain('Horarios');
    expect(horarios.querySelector('.pm-chev')).not.toBeNull();
    expect(horarios.getAttribute('aria-controls')).toBeNull();
    // Solo la fila de Dashboard existe: ni implícita ni celdas vacías de los títulos vacíos.
    // Su única celda «Sin declarar» es la de «Dar alta», que de verdad no declara nada.
    expect(filas(container)).toHaveLength(1);
    expect(container.querySelectorAll('.pm-vacia')).toHaveLength(1);
  });

  it('[35] en lista: sin chip «sin permisos» ni «0 de 0» en el título vacío', () => {
    const { container } = render(<Panel {...lista({ plegable: true })} />);
    const horarios = bandas(container, '.pp-mod-cab')[1];
    expect(horarios.textContent).not.toMatch(/sin permisos/);
    expect(horarios.querySelector('.pp-conteo')).toBeNull();
    expect(horarios.textContent).not.toMatch(/0 de 0/);
  });

  it('[35] sin `plegable`, un módulo vacío sale como siempre (fila implícita y «sin permisos»)', () => {
    const m = render(<Panel />);
    expect(filas(m.container).length).toBeGreaterThan(1);
    m.unmount();
    const l = render(<Panel {...lista()} />);
    expect(bandas(l.container, '.pp-mod-cab')[1].textContent).toMatch(/sin permisos/);
  });

  it('[35] un `filas: []` JUNTO A privilegios NO es un título vacío: sigue dibujando su fila', () => {
    const roto: ModuloPrivilegios[] = [{ id: 'x', nombre: 'Roto', filas: [],
      privilegios: [{ id: 'x-ver', nombre: 'Ver', columna: 'ver' }] }];
    const { container } = render(<Panel plegable modulos={roto} abiertos={['x']} onAbiertos={() => {}} />);
    expect(filas(container).length).toBeGreaterThan(0);
  });
});

describe('R168 · [36] el resumen de la banda', () => {
  it('[36] `resumen="ninguno"`: ni chips ni cuenta en la banda, en matriz y en lista', () => {
    const m = render(<Panel plegable resumen="ninguno" inicial={DASH_VER} />);
    for (const b of bandas(m.container)) {
      expect(b.querySelector('.chip')).toBeNull();
      expect(b.textContent).not.toMatch(/\d+ de \d+|sin permisos/);
    }
    m.unmount();
    const l = render(<Panel {...lista({ resumen: 'ninguno', inicial: { dash: { 'd-ver': true, 'd-editar': true } } })} />);
    for (const b of bandas(l.container, '.pp-mod-cab')) {
      expect(b.querySelector('.chip')).toBeNull();
      expect(b.querySelector('.pp-conteo')).toBeNull();
    }
  });

  it('[36] por omisión («completo») la banda dice lo concedido y «n de n»', () => {
    const { container } = render(<Panel plegable inicial={DASH_VER} />);
    expect(bandas(container)[0].textContent).toMatch(/1 de 2/);
    expect(bandas(container)[0].querySelector('.chip')).not.toBeNull();
  });

  it('[36] en matriz sin `plegable`, la banda no lleva resumen aunque se pida', () => {
    const { container } = render(<Panel resumen="ninguno" inicial={DASH_VER} />);
    expect(container.querySelector('.pm-chev')).toBeNull();
    expect(container.querySelector('.pm-tags')).toBeNull();
  });
});

describe('R168 · [37] el encabezado de columnas con icono', () => {
  it('[37] una columna con `icono` lo pinta oculto al lector; su nombre sigue siendo el título', () => {
    const { container } = render(<Panel />);
    const ver = container.querySelector('th.pm-col')!;
    expect(ver.querySelector('svg')).not.toBeNull();
    expect(ver.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(ver.textContent?.trim()).toBe('Ver');
  });

  it('[37] con algún icono la tabla lo declara; sin ninguno sale como siempre', () => {
    const con = render(<Panel />);
    expect(con.container.querySelector('table.pm-con-iconos')).not.toBeNull();
    con.unmount();
    const sin = render(<Panel columnas={COLS_SIN_ICONO} />);
    expect(sin.container.querySelector('table.pm-con-iconos')).toBeNull();
    expect(sin.container.querySelector('.pm-col-ic')).toBeNull();
  });

  it('[37] una columna sin icono sigue usando el nodo de siempre', () => {
    const { container } = render(<Panel />);
    const alta = Array.from(container.querySelectorAll('th.pm-col'))[2];
    expect(alta.querySelector('.pm-col-ic')).toBeNull();
    expect(alta.querySelector('.pm-col-txt')?.textContent).toBe('Dar alta');
  });

  it('[37] el cursor sobre un interruptor ilumina su columna, y al salir se apaga', () => {
    const { container } = render(<Panel plegable abiertos={['dash']} onAbiertos={() => {}} />);
    const celdas = filas(container)[0].querySelectorAll('td');
    fireEvent.mouseOver(celdas[1]);
    const cols = Array.from(container.querySelectorAll('th.pm-col'));
    expect(cols.map((c) => c.classList.contains('pm-col-on'))).toEqual([false, true, false]);
    fireEvent.mouseLeave(container.querySelector('tbody')!);
    expect(container.querySelector('.pm-col-on')).toBeNull();
  });

  it('[37] el foco en un interruptor ilumina su columna y al perderlo se apaga', () => {
    const { container } = render(<Panel plegable abiertos={['dash']} onAbiertos={() => {}} />);
    const celdas = filas(container)[0].querySelectorAll('td');
    fireEvent.focus(celdas[0].querySelector('button')!);
    expect(container.querySelectorAll('th.pm-col')[0].classList.contains('pm-col-on')).toBe(true);
    fireEvent.blur(celdas[0].querySelector('button')!);
    expect(container.querySelector('.pm-col-on')).toBeNull();
  });

  it('[37] sin iconos no hay iluminación: el encabezado no cambia con el cursor', () => {
    const { container } = render(<Panel columnas={COLS_SIN_ICONO} />);
    fireEvent.mouseOver(filas(container)[0].querySelectorAll('td')[0]);
    expect(container.querySelector('.pm-col-on')).toBeNull();
  });
});

describe('R168 · [38] sin ninguna prop nueva, nada cambia', () => {
  const NUEVO = ['pm-mod-plegable', 'pm-mod-cab', 'pm-chev', 'pm-tags', 'pm-conteo', 'pm-con-iconos',
    'pm-col-ic', 'pm-col-on', 'pp-sin-conteo'];
  const sinNada = (extra: Extra = {}) => ({ columnas: COLS_SIN_ICONO, ...extra });

  it('[38] la matriz no emite ninguna clase, id ni atributo nuevos', () => {
    const { container } = render(<Panel {...sinNada()} />);
    const html = container.innerHTML;
    for (const c of NUEVO) expect(html).not.toContain(c);
    expect(container.querySelector('[hidden]')).toBeNull();
    expect(container.querySelector('[id$="-tr"]')).toBeNull();
    expect(container.querySelector('button.pm-mod-cab')).toBeNull();
  });

  it('[38] la lista no emite ninguna clase nueva y conserva «sin permisos» y «n de n»', () => {
    const { container } = render(<Panel {...lista({ columnas: undefined })} />);
    const html = container.innerHTML;
    for (const c of NUEVO) expect(html).not.toContain(c);
    expect(html).toMatch(/sin permisos/);
    expect(html).toMatch(/0 de 0/);
  });

  it('[38] con varios módulos y sin `plegable`, la banda sigue siendo un título que no es botón', () => {
    const { container } = render(<Panel {...sinNada()} />);
    const bandas = container.querySelectorAll('tr.pm-mod');
    expect(bandas).toHaveLength(3);
    expect(container.querySelector('tr.pm-mod button')).toBeNull();
  });

  it('[38] el módulo sí entra en `headers` cuando hay varios y no es plegable (regla 25 intacta)', () => {
    const { container } = render(<Panel {...sinNada()} />);
    const id = container.querySelector('.pm-mod-nom')!.id;
    const td = container.querySelector('td[headers]')!;
    expect((td.getAttribute('headers') ?? '').split(' ')).toContain(id);
  });

  it('[38] `abiertos` sin `plegable` en matriz sigue avisando que no hace nada', () => {
    const aviso = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Panel {...sinNada()} abiertos={['dash']} onAbiertos={() => {}} />);
    expect(aviso.mock.calls.some((a) => /no hacen nada MIENTRAS SE PINTA LA MATRIZ/.test(String(a[0])))).toBe(true);
    aviso.mockRestore();
  });
});
