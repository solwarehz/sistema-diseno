/**
 * R151 · la matriz — reglas 18 a 22 del contrato.
 *
 * Lo pidió Control Administrativos V2.0 al ir a adoptar el panel, y con una
 * honestidad que conviene dejar escrita: *«nunca os lo pedimos… habéis hecho
 * siete cosas sobre una premisa que no os aclaramos»*. La forma era decisión de
 * producto y no estaba en ninguna parte.
 *
 * Entra porque **no es de su proyecto**: filas = recursos, columnas = acciones
 * es el patrón estándar de una pantalla de permisos. Y lo que la lista no puede
 * hacer —leer hacia abajo— no es comodidad: es la revisión periódica que les
 * exige la norma.
 *
 * Lo que fijan estas pruebas es que **es la misma lógica**. Si la matriz
 * calculara por su cuenta, tendríamos dos verdades sobre quién puede qué.
 */
import { fireEvent, render, within } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { PanelPrivilegios, privilegiosEfectivos,
  type ColumnaPrivilegios, type ModuloPrivilegios, type ValorPrivilegios } from '../src/PanelPrivilegios';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

const COLS: ColumnaPrivilegios[] = [
  { id: 'ver', titulo: 'Ver' },
  { id: 'editar', titulo: 'Editar' },
  { id: 'crear', titulo: 'Crear' },
  { id: 'descargar', titulo: 'Descargar', aparte: true },
];

const MODS: ModuloPrivilegios[] = [
  { id: 'personal', nombre: 'Personal',
    filas: [{ id: 'trab', nombre: 'Trabajadores' }, { id: 'cont', nombre: 'Contratos' }],
    privilegios: [
      { id: 't-ver', nombre: 'Ver trabajadores', columna: 'ver', fila: 'trab' },
      { id: 't-editar', nombre: 'Editar trabajador', columna: 'editar', fila: 'trab' },
      { id: 't-crear', nombre: 'Crear trabajador', columna: 'crear', fila: 'trab', depende: 't-editar' },
      { id: 'c-ver', nombre: 'Ver contratos', columna: 'ver', fila: 'cont' },
      { id: 'c-crear', nombre: 'Crear contrato', columna: 'crear', fila: 'cont',
        cerrado: { tipo: 'noAplica', motivo: 'Un contrato no se crea aquí.' } },
      { id: 'c-desc', nombre: 'Descargar contratos', columna: 'descargar', fila: 'cont',
        deshabilitado: true },
    ] },
];

function Matriz({ inicial = {} as ValorPrivilegios, ...extra }) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return (
    <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={MODS} base={null}
      valor={v} onCambio={(c) => setV(c)} {...extra} />
  );
}

const celda = (c: HTMLElement, fila: string, col: number) => {
  const tr = [...c.querySelectorAll('tbody tr')]
    .find((r) => (r.querySelector('.pm-nom')?.textContent ?? '') === fila)!;
  return tr.children[col + 1] as HTMLElement;   // +1: la primera es el nombre
};

describe('[18] R151 · la matriz es una tabla de verdad', () => {
  it('[18] con `<th scope="col">` y `<th scope="row">`, no celdas sueltas', () => {
    /* Una rejilla de doscientos interruptores sin encabezados asociados es una
       pantalla que solo se puede usar mirándola. */
    const { container } = render(<Matriz />);
    const cols = [...container.querySelectorAll('thead th[scope="col"]')];
    expect(cols.map((t) => t.textContent)).toEqual(['Opción', 'Ver', 'Editar', 'Crear', 'Descargar']);
    const filas = [...container.querySelectorAll('tbody th[scope="row"]')];
    expect(filas.map((t) => t.textContent)).toEqual(['Trabajadores', 'Contratos']);
  });

  it('[18] sin `columnas` NO dibuja una matriz vacía: cae a la lista y avisa', () => {
    /* Una matriz sin columnas no es una matriz. Callar y pintar una tabla con
       una sola columna sería peor que decirlo. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" modulos={MODS} base={null} valor={{}}
        onCambio={() => {}} abiertos={['personal']} />
    );
    expect(container.querySelector('.pm')).toBeNull();
    expect(container.querySelector('.pp-lista')).not.toBeNull();
    expect(gritar).toHaveBeenCalled();
    gritar.mockRestore();
  });

  it('[19] cada interruptor se llama por su CRUCE, no por su columna', () => {
    /* Sin esto, un lector anuncia doscientas veces «Editar». La etiqueta existe
       y no se ve: `sr-solo` la lleva. */
    const { container } = render(<Matriz />);
    const sw = celda(container, 'Contratos', 0).querySelector('[role="switch"]')!;
    const et = container.querySelector(`#${CSS.escape(sw.getAttribute('aria-labelledby')!)}`)!;
    expect(et.textContent).toBe('Contratos · Ver');
    // Y no se ve: su contenedor lleva la clase que lo saca de la pantalla.
    expect(et.closest('.sr-solo'), 'la etiqueta se ve y llena la rejilla de texto').not.toBeNull();
  });
});

describe('[20] R151 · el hueco habla, y la celda sin declarar no', () => {
  it('[20] `noAplica` dice QUÉ pasa y POR QUÉ, en `title` y para el lector', () => {
    /* Omitir no es lo mismo que decir que no aplica: omitiendo, quien reparte
       nunca se entera de que esa acción existe. */
    const { container } = render(<Matriz />);
    const c = celda(container, 'Contratos', 2);
    expect(c.classList.contains('pm-no-noAplica')).toBe(true);
    expect(c.getAttribute('title')).toBe('Un contrato no se crea aquí.');
    expect(c.textContent).toContain('no aplica aquí');
    expect(c.textContent).toContain('Un contrato no se crea aquí.');
  });

  it('[20] y una celda SIN privilegio declarado no dice nada, y se distingue', () => {
    const { container } = render(<Matriz />);
    const c = celda(container, 'Contratos', 1);   // Contratos no declara «Editar»
    expect(c.classList.contains('pm-vacia')).toBe(true);
    expect(c.querySelector('[role="switch"]')).toBeNull();
    expect(c.classList.contains('pm-no'), 'se confunde con «no aplica»').toBe(false);
  });

  it('[20] `noAplica` NO cuenta como concedible: es lo mismo que los otros tres', () => {
    /* Contar una acción que no existe haría que un cargo pareciera incompleto
       por algo que no depende de nadie. */
    const efectivo = privilegiosEfectivos(MODS, { personal: { 'c-crear': true } }, null);
    expect(efectivo.personal['c-crear'], 'un permiso que no aplica viajó al backend').toBeUndefined();
  });
});

describe('[21] R151 · es la MISMA lógica, no otra', () => {
  it('[21] `depende` bloquea igual que en la lista, y con su motivo', () => {
    const { container } = render(<Matriz />);
    const c = celda(container, 'Trabajadores', 2);
    expect(c.classList.contains('pm-no-depende')).toBe(true);
    expect(c.textContent).toContain('Editar trabajador');
  });

  it('[21] y se desbloquea encendiendo el otro, sin recargar', () => {
    const { container } = render(<Matriz />);
    fireEvent.click(celda(container, 'Trabajadores', 1).querySelector('[role="switch"]')!);
    const c = celda(container, 'Trabajadores', 2);
    expect(c.classList.contains('pm-no-depende'), 'sigue bloqueado tras encender del que depende').toBe(false);
    expect(c.querySelector('[role="switch"]')).not.toBeNull();
  });

  it('[21] `deshabilitado` apaga la celda SIN esconder su estado', () => {
    const { container } = render(<Matriz inicial={{ personal: { 'c-desc': true } }} />);
    const sw = celda(container, 'Contratos', 3).querySelector('[role="switch"]')!;
    expect(sw.getAttribute('aria-checked'), 'el estado concedido no se ve').toBe('true');
    expect(sw.getAttribute('aria-disabled')).toBe('true');
    expect(sw.hasAttribute('disabled'), 'sale del recorrido del teclado').toBe(false);
  });

  it('[21] y `onCambio` entrega los dos valores, como en la lista', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" columnas={COLS} modulos={MODS} base={null}
        valor={{ personal: { 'c-crear': true } }} onCambio={onCambio} />
    );
    fireEvent.click(celda(container, 'Trabajadores', 0).querySelector('[role="switch"]')!);
    const [completo, efectivo] = onCambio.mock.calls[0];
    expect(completo.personal['t-ver']).toBe(true);
    expect(completo.personal['c-crear'], 'el mapa completo NO borra: es R98').toBe(true);
    expect(efectivo.personal['c-crear'], 'lo efectivo entrega lo que no aplica').toBeUndefined();
  });
});

describe('[22] R151 · la primera columna se ancla, que es el R142 otra vez', () => {
  it('[22] el nombre de fila y la esquina se quedan quietos', () => {
    const regla = (sel: string) => {
      const re = new RegExp('(?:^|[}\\n;])\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*\\}', 'g');
      return (css.match(re) ?? []).join('\n');
    };
    for (const sel of ['.pm-nom', '.pm-esquina']) {
      expect(regla(sel), `${sel} no se queda quieta`).toMatch(/position:\s*sticky/);
      expect(regla(sel)).toMatch(/left:\s*0/);
    }
    /* Y con fondo propio: una celda pegajosa transparente deja ver pasar el
       texto de las otras columnas. Es la lección cara del R142. */
    expect(regla('.pm-nom')).toMatch(/background:\s*var\(--fondo-tarjeta\)/);
    /* Y con suelo Y techo: en una tabla más ancha que su contenedor, `width` en
       una celda es una sugerencia — se midió en Chrome y costó una rendija. */
    expect(regla('.pm-nom')).toMatch(/min-width:\s*var\(--pm-nom\)/);
    expect(regla('.pm-nom')).toMatch(/max-width:\s*var\(--pm-nom\)/);
    expect(css).toMatch(/\.pm\s*\{[^}]*--pm-nom:/);
  });

  it('[22] el rayado y el hover llegan a la celda anclada, y el hover DESPUÉS', () => {
    const alt = css.indexOf('.pm tbody tr:nth-child(2n) .pm-nom');
    const hover = css.indexOf('.pm tbody tr:hover .pm-nom');
    expect(alt).toBeGreaterThan(-1);
    expect(hover, 'el hover va antes y pierde el empate').toBeGreaterThan(alt);
  });

  it('[22] y el deslizador existe: sin él, `sticky` no tiene contra qué pegarse', () => {
    expect(css).toMatch(/\.pm-envoltura\s*\{[^}]*overflow-x:\s*auto/);
  });
});
