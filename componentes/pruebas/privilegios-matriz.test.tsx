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
import { PanelPrivilegios, privilegiosEfectivos, baseDe, baseSinResolver,
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
  /* Por `.pm-nom-txt` y no por `.pm-nom`: el encabezado de fila lleva tambien
     el aviso de «sin base» para el lector, asi que su `textContent` ya no es
     solo el nombre. */
  const tr = [...c.querySelectorAll('tbody tr')]
    .find((r) => (r.querySelector('.pm-nom-txt')?.textContent ?? '') === fila)!;
  return tr.children[col + 1] as HTMLElement;   // +1: la primera es la del nombre
};

describe('R151 · la matriz es una tabla de verdad', () => {
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

describe('R151 · el hueco habla, y la celda sin declarar no', () => {
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

describe('R151 · es la MISMA lógica, no otra', () => {
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

describe('R151 · la primera columna se ancla, que es el R142 otra vez', () => {
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

describe('R151 · lo que las trece primeras dejaban pasar', () => {
  /* Las encontró una auditoría adversaria: veintitrés mutaciones sobrevivían a
     las trece pruebas de arriba. Quince rojas no son cobertura, y la peor de
     las supervivientes lo dice todo. */

  it('[21] LA MATRIZ TIENE QUE PODER APAGAR, y ninguna prueba lo pedía', () => {
    /* `onCambio={() => cambiar(m, p.id, true)}` —un panel que concede y no
       retira jamás— pasaba el contrato entero: ninguna de las trece pulsaba un
       interruptor ENCENDIDO. Para una pantalla de permisos, no poder retirar es
       peor que no poder conceder. */
    const { container } = render(<Matriz inicial={{ personal: { 't-ver': true } }} />);
    const sw = celda(container, 'Trabajadores', 0).querySelector('[role="switch"]')!;
    expect(sw.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(sw);
    expect(celda(container, 'Trabajadores', 0).querySelector('[role="switch"]')!
      .getAttribute('aria-checked'), 'la matriz no puede retirar un permiso').toBe('false');
  });

  it('[18] las celdas de datos son `td`, no `th`', () => {
    /* Un `<th>` sin `scope` no aparece en `tbody th[scope=row]`, así que la
       prueba de la regla 18 no lo notaba: la tabla dejaba de tener encabezados
       distinguibles de los datos y seguía verde. */
    const { container } = render(<Matriz />);
    const primera = container.querySelectorAll('tbody tr')[0].children;
    expect(primera[0].tagName).toBe('TH');
    expect([...primera].slice(1).map((c) => c.tagName)).toEqual(['TD', 'TD', 'TD', 'TD']);
  });

  it('[18] los `id` de los encabezados los USA alguien: `headers` en cada celda', () => {
    /* Estaban puestos y no los referenciaba nadie — atributos muertos. En una
       rejilla de doscientas celdas, `headers` es lo que le dice al lector en
       qué cruce está. */
    const { container } = render(<Matriz />);
    const c = celda(container, 'Contratos', 0);
    const ids = c.getAttribute('headers')!.split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      const th = container.querySelector(`#${CSS.escape(id)}`);
      expect(th, `headers apunta a «${id}», que no existe`).not.toBeNull();
      expect(th!.tagName).toBe('TH');
    }
  });

  it('[18] la esquina no se ve, y no basta con que diga lo mismo', () => {
    const { container } = render(<Matriz />);
    const esq = container.querySelector('.pm-esquina')!;
    expect(esq.querySelector('.sr-solo'), 'la esquina pinta «Opción» a la vista').not.toBeNull();
  });

  it('[20] los CUATRO motivos dibujan CUATRO iconos distintos', () => {
    /* Comparar «no aplica» con «depende» no servía: se parecen poco de por sí,
       así que `noAplica`→candado —el icono de `cerrado`— sobrevivía. La regla 2
       promete icono PROPIO por motivo, así que se comparan los cuatro. */
    const tipos = ['cerrado', 'ajeno', 'pendiente', 'noAplica'] as const;
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" base={null} valor={{}} onCambio={() => {}}
        columnas={tipos.map((t) => ({ id: t, titulo: t }))}
        modulos={[{ id: 'm', nombre: 'M', filas: [{ id: 'f', nombre: 'F' }],
          privilegios: tipos.map((t) => ({ id: t, nombre: t, columna: t, fila: 'f',
            cerrado: { tipo: t, motivo: 'porque sí' } })) }] as any} />
    );
    const dibujos = tipos.map((_, i) =>
      celda(container, 'F', i).querySelector('.pm-no-ic')!.innerHTML);
    expect(dibujos.every((d) => d.length > 0), 'algún motivo se quedó sin icono').toBe(true);
    expect(new Set(dibujos).size, 'dos motivos dibujan el mismo icono').toBe(4);
  });

  it('[20] y la celda bloqueada dice el CRUCE al lector, no solo el motivo', () => {
    const { container } = render(<Matriz />);
    expect(celda(container, 'Contratos', 2).querySelector('.sr-solo')!.textContent)
      .toContain('Contratos · Crear');
  });

  it('[20] la celda sin declarar se distingue TAMBIÉN para quien no ve la hoja', () => {
    const { container } = render(<Matriz />);
    expect(celda(container, 'Contratos', 1).querySelector('.sr-solo')!.textContent)
      .toBe('Sin declarar');
  });

  it('[21] `depende` también dice su motivo en el globito', () => {
    /* La regla 2 dice «cada uno lleva icono, etiqueta y motivo propios». Las
       trece comprobaban el `title` de uno de los cuatro. */
    const { container } = render(<Matriz />);
    expect(celda(container, 'Trabajadores', 2).getAttribute('title'))
      .toContain('Editar trabajador');
  });

  it('[22] `aparte` separa de verdad, en la columna y en sus celdas', () => {
    /* La prop existía en el tipo y NINGUNA prueba la miraba. */
    const { container } = render(<Matriz />);
    const col = [...container.querySelectorAll('thead th')].find(
      (t) => t.textContent === 'Descargar')!;
    expect(col.classList.contains('pm-col-aparte')).toBe(true);
    expect(celda(container, 'Contratos', 3).classList.contains('pm-celda-aparte')).toBe(true);
  });
});

describe('R151 · el base gobierna SU recurso, no el módulo', () => {
  /* EL DEFECTO MÁS CARO DE ESTA VERSIÓN, y lo encontró una auditoría antes de
     publicar. `base` se buscaba por id literal; con `filas` los ids son únicos
     por módulo, así que NUNCA existía uno llamado `ver` —el valor por omisión—
     y `privilegiosEfectivos` devolvía `{}` para el módulo entero, pasara lo que
     pasara con los interruptores. Con un backend de juego completo, eso BORRA
     permisos que nadie retiró: el daño exacto que R150 cerró, reabierto por la
     puerta de al lado. Nadie lo veía porque las cuatro invocaciones de matriz
     que existían pasaban `base={null}`. */

  const COLS2: ColumnaPrivilegios[] = [
    { id: 'ver', titulo: 'Ver' }, { id: 'editar', titulo: 'Editar' },
  ];
  const MODS2: ModuloPrivilegios[] = [{
    id: 'personal', nombre: 'Personal',
    filas: [{ id: 'trab', nombre: 'Trabajadores' }, { id: 'cont', nombre: 'Contratos' }],
    privilegios: [
      { id: 't-ver', nombre: 'Ver trabajadores', columna: 'ver', fila: 'trab' },
      { id: 't-ed', nombre: 'Editar trabajador', columna: 'editar', fila: 'trab' },
      { id: 'c-ver', nombre: 'Ver contratos', columna: 'ver', fila: 'cont' },
      { id: 'c-ed', nombre: 'Editar contrato', columna: 'editar', fila: 'cont' },
    ],
  }];

  it('[23] con `filas` y el `base` por omisión, lo efectivo NO se vacía', () => {
    const ef = privilegiosEfectivos(MODS2, { personal: { 't-ver': true, 't-ed': true } }, 'ver');
    expect(ef.personal, 'el módulo entero viajó vacío: eso BORRA en el backend')
      .toEqual({ 't-ver': true, 't-ed': true });
  });

  it('[23] y un recurso sin su «ver» no se lleva por delante a los otros', () => {
    /* Contratos pierde lo suyo; Trabajadores no tiene nada que ver con eso. */
    const ef = privilegiosEfectivos(
      MODS2, { personal: { 't-ver': true, 't-ed': true, 'c-ed': true } }, 'ver');
    expect(ef.personal['c-ed'], 'editar un contrato sin poder verlo viajó al backend')
      .toBeUndefined();
    expect(ef.personal['t-ed'], 'un recurso ajeno perdió sus permisos').toBe(true);
  });

  it('[23] `baseDe` responde por fila, y sin `filas` responde lo de siempre', () => {
    expect(baseDe(MODS2[0], MODS2[0].privilegios[1], 'ver')).toBe('t-ver');
    expect(baseDe(MODS2[0], MODS2[0].privilegios[3], 'ver')).toBe('c-ver');
    const plano: ModuloPrivilegios = { id: 'x', nombre: 'X', privilegios: [
      { id: 'ver', nombre: 'Ver' }, { id: 'ed', nombre: 'Editar' }] };
    expect(baseDe(plano, plano.privilegios[1], 'ver')).toBe('ver');
    expect(baseDe(plano, plano.privilegios[1], null)).toBeNull();
  });

  it('[23] encender arrastra el «ver» DE SU FILA, no el de la de al lado', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" columnas={COLS2} modulos={MODS2} base="ver"
        valor={{}} onCambio={onCambio} />
    );
    fireEvent.click(celda(container, 'Contratos', 1).querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.personal['c-ver'], 'no encendió el «ver» de su propio recurso').toBe(true);
    expect(completo.personal['t-ver'], 'encendió el «ver» del recurso de al lado').toBeUndefined();
  });

  it('[23] y el carril de «sin base» marca la fila que le falta, no todas', () => {
    const { container } = render(
      <PanelPrivilegios presentacion="matriz" columnas={COLS2} modulos={MODS2} base="ver"
        valor={{ personal: { 't-ver': true } }} onCambio={() => {}} />
    );
    const marcadas = [...container.querySelectorAll('tbody tr.pm-sin-base')]
      .map((t) => t.querySelector('.pm-nom-txt')!.textContent);
    expect(marcadas).toEqual(['Contratos']);
  });

  it('[23] un base que no encarna nadie SE DICE, en vez de vaciar en silencio', () => {
    /* «leer» no es ni un id ni una columna del modulo, asi que el que no lo
       tiene es EL MODULO, no cada fila: decirlo por fila mandaba a mirar filas
       cuando el problema esta arriba. */
    expect(baseSinResolver(MODS2[0], 'leer')).toEqual(['personal']);
    expect(baseSinResolver(MODS2[0], 'ver')).toEqual([]);
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios presentacion="matriz" columnas={COLS2} modulos={MODS2}
      base="leer" valor={{}} onCambio={() => {}} />);
    expect(gritar.mock.calls.flat().join(' ')).toContain('encarne el base');
    gritar.mockRestore();
  });
});

describe('R151 · nada desaparece sin decirlo', () => {
  const C: ColumnaPrivilegios[] = [{ id: 'ver', titulo: 'Ver' }];
  const con = (privilegios: any[], filas?: any[]) => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C}
      modulos={[{ id: 'm', nombre: 'M', ...(filas ? { filas } : {}), privilegios }] as any}
      base={null} valor={{}} onCambio={() => {}} />);
    const dicho = gritar.mock.calls.flat().join(' ');
    gritar.mockRestore();
    return { container, dicho };
  };

  it('[24] un privilegio sin `columna` no se dibuja — y se dice cuál', () => {
    const { container, dicho } = con([{ id: 'exportar', nombre: 'Exportar' }]);
    expect(container.querySelectorAll('[role="switch"]')).toHaveLength(0);
    expect(dicho).toContain('exportar');
    expect(dicho).toContain('columna');
  });

  it('[24] una `columna` que no existe tampoco', () => {
    const { dicho } = con([{ id: 'p', nombre: 'P', columna: 'fantasma' }]);
    expect(dicho).toContain('fantasma');
  });

  it('[24] una `fila` que no existe tampoco', () => {
    const { dicho } = con([{ id: 'p', nombre: 'P', columna: 'ver', fila: 'fantasma' }],
      [{ id: 'a', nombre: 'A' }]);
    expect(dicho).toContain('fantasma');
  });

  it('[24] dos en la misma celda: se dibuja uno y el otro SIGUE concediéndose', () => {
    const { container, dicho } = con([
      { id: 'a', nombre: 'A', columna: 'ver' }, { id: 'b', nombre: 'B', columna: 'ver' }]);
    expect(container.querySelectorAll('[role="switch"]')).toHaveLength(1);
    expect(dicho).toContain('MISMA celda');
  });

  it('[24] `niveles` no caben en un cruce, y callarlo pierde configuración', () => {
    const { dicho } = con([{ id: 'p', nombre: 'P', columna: 'ver',
      niveles: [{ id: 'alcance', nombre: 'Alcance', opciones: [
        { valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] }] }]);
    expect(dicho).toContain('niveles');
  });

  it('[24] y `abiertos` no hace nada aquí: se dice en vez de aceptarlo callando', () => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios presentacion="matriz" columnas={C} abiertos={['m']}
      modulos={[{ id: 'm', nombre: 'M', privilegios: [{ id: 'p', nombre: 'P', columna: 'ver' }] }]}
      base={null} valor={{}} onCambio={() => {}} />);
    expect(gritar.mock.calls.flat().join(' ')).toContain('abiertos');
    gritar.mockRestore();
  });
});

describe('R151 · lo que `estado()` calcula, la matriz lo pinta', () => {
  /* R99, R148 y R149 estaban escritas, la lista las cumplía y la matriz no:
     `conQuien` y `arrastraElBase` se calculaban y se tiraban, y `ayuda` no
     llegaba a la celda. No eran dos lógicas: era una lógica y dos pantallas
     diciendo cosas distintas sobre quién puede qué. */
  const C: ColumnaPrivilegios[] = [
    { id: 'ver', titulo: 'Ver' }, { id: 'editar', titulo: 'Editar' }];
  const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
    filas: [{ id: 'f', nombre: 'F' }],
    privilegios: [
      { id: 'f-ver', nombre: 'Ver', columna: 'ver', fila: 'f' },
      { id: 'f-ed', nombre: 'Editar', columna: 'editar', fila: 'f',
        ayuda: 'Solo su sede.', deshabilitado: true },
    ] }];

  /* EL GLOBITO NO BASTA. `title` no lo anuncia un lector de pantalla al enfocar
     un control, y con el ratón tampoco lo ve quien navega con teclado. Así que
     se exige las DOS cosas: el globito para quien pasa el ratón, y el texto
     atado al interruptor con `aria-describedby` para quien no lo ve. Comprobar
     solo `title` dejaba pasar que el aviso no llegara al control. */
  const globito = (c: HTMLElement) => c.getAttribute('title') ?? '';
  const loQueSeAnuncia = (c: HTMLElement) => {
    const sw = c.querySelector('[role="switch"]');
    const id = sw?.getAttribute('aria-describedby');
    if (!id) return '';
    return c.querySelector(`#${CSS.escape(id)}`)?.textContent ?? '';
  };
  const texto = (c: HTMLElement) => {
    const g = globito(c), a = loQueSeAnuncia(c);
    expect(a, 'el aviso no está atado al interruptor: un lector no lo dice').not.toBe('');
    expect(g, 'el aviso no sale en el globito').not.toBe('');
    return `${g} ${a}`;
  };

  it('[25] R148 · `deshabilitado` dice POR QUÉ, y no solo que no se puede', () => {
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C}
      modulos={M} base={null} valor={{}} onCambio={() => {}} />);
    expect(texto(celda(container, 'F', 1)), 'el porqué no llega a la celda')
      .toContain('Solo su sede.');
  });

  it('[25] R149 · el arrastre del base se anuncia ANTES de pulsar', () => {
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C}
      modulos={[{ ...M[0], privilegios: M[0].privilegios.map(
        (p) => p.id === 'f-ed' ? { ...p, deshabilitado: false, ayuda: undefined } : p) }]}
      base="ver" valor={{}} onCambio={() => {}} />);
    expect(texto(celda(container, 'F', 1)), 'enciende el base de rebote y no lo dice')
      .toContain('Enciende también');
  });

  it('[25] R99 · los que comparten `clave` se mueven juntos, y se dice', () => {
    const conClave: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f', nombre: 'F' }],
      privilegios: [
        { id: 'a', nombre: 'A', columna: 'ver', fila: 'f', clave: 'k' },
        { id: 'b', nombre: 'B', columna: 'editar', fila: 'f', clave: 'k' },
      ] }];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C}
      modulos={conClave} base={null} valor={{}} onCambio={() => {}} />);
    expect(texto(celda(container, 'F', 0)), 'arrastra al compañero sin avisar')
      .toContain('Va con');
  });

  it('[25] R146 · la celda bloqueada por `depende` SÍ se alcanza con teclado', () => {
    /* Es la única transitoria: se desbloquea sin recargar, y quien reparte con
       teclado vería aparecer un control que un segundo antes no alcanzaba. En
       la lista está desde R146; en la matriz era un `<td>` pelado. */
    const { container } = render(<Matriz />);
    const c = celda(container, 'Trabajadores', 2);
    const ctrl = c.querySelector('[role="switch"]')!;
    expect(ctrl, 'no hay control que alcanzar').not.toBeNull();
    expect(ctrl.getAttribute('aria-disabled')).toBe('true');
    expect(ctrl.getAttribute('tabindex')).toBe('0');
    const desc = container.querySelector(`#${CSS.escape(ctrl.getAttribute('aria-describedby')!)}`);
    expect(desc!.textContent).toContain('Editar trabajador');
  });

  it('[25] y con varios módulos se dice de qué módulo es cada fila', () => {
    const dos: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'Personal', filas: [{ id: 'f', nombre: 'Trabajadores' }],
        privilegios: [{ id: 'a-v', nombre: 'Ver', columna: 'ver', fila: 'f' }] },
      { id: 'b', nombre: 'Reportes', filas: [{ id: 'f', nombre: 'Asistencia' }],
        privilegios: [{ id: 'b-v', nombre: 'Ver', columna: 'ver', fila: 'f' }] },
    ];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C}
      modulos={dos} base={null} valor={{}} onCambio={() => {}} />);
    const cabs = [...container.querySelectorAll('.pm-mod-nom')].map((t) => t.textContent);
    expect(cabs, 'dos módulos y sus filas salen mezcladas sin decir de cuál son')
      .toEqual(['Personal', 'Reportes']);
    expect(container.querySelector('.pm-mod-nom')!.getAttribute('colspan')).toBe('3');
    expect(container.querySelector('.pm-mod-nom')!.getAttribute('scope'),
      'la cabecera de módulo no dice a qué manda').toBe('colgroup');
  });
});

describe('R151 · la hoja de la matriz, medida entera', () => {
  /* La regla 22 se comprobaba a fondo en `.pm-nom` y a medias en `.pm-esquina`:
     una auditoría quitó el fondo de la esquina, su suelo y su techo, y las
     pruebas siguieron verdes. La esquina está igual de pegada que el nombre —es
     la MISMA columna— y la lección cara del R142 vale para las dos celdas. */
  const regla = (sel: string) => {
    const re = new RegExp('(?:^|[}\n;])\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      + '\\s*\\{[^}]*\\}', 'g');
    return (css.match(re) ?? []).join('\n');
  };

  it('[22] la esquina se ancla como el nombre: fondo propio, suelo y techo', () => {
    const r = regla('.pm-esquina');
    expect(r, 'la esquina no se queda quieta').toMatch(/position:\s*sticky/);
    expect(r, 'esquina pegajosa TRANSPARENTE: deja ver pasar el texto de debajo')
      .toMatch(/background:\s*var\(--/);
    expect(r, 'la esquina y el cuerpo de la columna dejan de medir igual')
      .toMatch(/min-width:\s*var\(--pm-nom\)/);
    expect(r).toMatch(/max-width:\s*var\(--pm-nom\)/);
  });

  it('[22] y las dos van por encima de lo que pasa por debajo', () => {
    /* Sin `z-index`, `position: sticky` no basta: la celda se queda quieta y el
       contenido de las otras columnas le pasa POR ENCIMA. */
    for (const sel of ['.pm-nom', '.pm-esquina']) {
      const z = /z-index:\s*(\d+)/.exec(regla(sel));
      expect(z, `${sel} no declara z-index`).not.toBeNull();
      expect(Number(z![1]), `${sel} no se pone por encima`).toBeGreaterThan(0);
    }
  });

  it('[22] el techo de ancho RECORTA de verdad', () => {
    /* `max-width` sin `overflow` no recorta nada: el texto se sale de la celda
       y se mete en la columna de al lado. */
    expect(regla('.pm-nom'), 'el techo no recorta').toMatch(/overflow:\s*hidden/);
    expect(regla('.pm-nom-txt'), 'un nombre largo no acaba en puntos suspensivos')
      .toMatch(/text-overflow:\s*ellipsis/);
  });

  it('[25] la cabecera de módulo también se ancla, y también necesita fondo', () => {
    /* Es sticky como las otras dos de la primera columna, y una celda pegajosa
       transparente deja ver pasar el texto de debajo. Es la tercera vez que
       aparece la misma lección en este componente. */
    const r = regla('.pm-mod-nom');
    expect(r).toMatch(/position:\s*sticky/);
    expect(r, 'cabecera de módulo pegajosa y TRANSPARENTE').toMatch(/background:\s*var\(--/);
  });

  it('[20] la celda sin declarar se distingue también a la vista', () => {
    expect(regla('.pm-vacia::before'), 'el hueco se ve igual que una celda cualquiera')
      .toMatch(/content:/);
  });

  it('[22] `aparte` separa con una línea, y el carril de «sin base» existe', () => {
    expect(css, '`aparte` no dibuja nada').toMatch(/\.pm-col-aparte[^{]*\{[^}]*border-left/);
    expect(css, 'la fila sin su base no se distingue').toMatch(/\.pm-sin-base\s+\.pm-nom/);
  });

  it('[20] los cuatro motivos se distinguen por ICONO y RÓTULO, no por color', () => {
    /* Esta prueba se llamaba «color propio» y solo comprobaba que el SELECTOR
       `.pp-no-<t>` existiera: una auditoría puso los cuatro motivos del mismo
       color y las 54 pruebas pasaron. Dos cosas estaban mal, y la peor era la
       promesa: la regla 2 promete «icono, etiqueta y motivo propios», y eso es
       lo que hay que medir — por VALOR, no por presencia del selector.

       Y se deja dicho lo que sí pasa con el color: `cerrado` y `noAplica`
       comparten `--texto-pista`, a propósito. Los dos dicen «aquí no hay nada
       que conceder, no insista»; lo que los separa —un candado o una equis, y
       su rótulo— no es el color. Ampliar la paleta autorizada no es decisión
       del sistema, así que se distinguen por donde se pueden distinguir. */
    const tipos = ['cerrado', 'ajeno', 'pendiente', 'noAplica'] as const;
    const { container } = render(
      <PanelPrivilegios base={null} valor={{}} onCambio={() => {}} abiertos={['m']}
        modulos={[{ id: 'm', nombre: 'M', privilegios: tipos.map((t) => ({
          id: t, nombre: t, cerrado: { tipo: t, motivo: 'porque sí' } })) }] as any} />
    );
    const filas = tipos.map((t) => container.querySelector(`.pp-no-${t}`)!);
    expect(filas.every(Boolean), 'algún motivo no se dibuja').toBe(true);
    const iconos = filas.map((f) => f.querySelector('.pp-cerrado-ic')!.innerHTML);
    const rotulos = filas.map((f) => f.querySelector('.pp-cerrado-eti')!.textContent);
    expect(new Set(iconos).size, 'dos motivos dibujan el MISMO icono').toBe(4);
    expect(new Set(rotulos).size, 'dos motivos dicen lo MISMO').toBe(4);
  });

  it('[20] y el que sí tiene color semántico no lo pierde', () => {
    /* `ajeno` es azul porque manda a hablar con alguien, y `depende` ámbar
       porque se resuelve solo: ésos sí llevan información en el color, y
       confundirlos con el gris de «no insista» cambiaría lo que dicen. */
    const color = (sel: string) => {
      const m = new RegExp(sel.replace('.', '\\.') + '\\s+\\.pp-cerrado-ic\\{([^}]*)\\}').exec(css);
      return /color:\s*var\((--[a-z-]+)\)/.exec(m?.[1] ?? '')?.[1] ?? '';
    };
    expect(color('.pp-no-ajeno'), 'ajeno perdió su color propio').toBe('--info-acento');
    expect(color('.pp-no-depende')).toBe('--aviso-acento');
    expect(color('.pp-no-ajeno')).not.toBe(color('.pp-no-cerrado'));
    expect(color('.pp-no-depende')).not.toBe(color('.pp-no-noAplica'));
  });
});

describe('R151 · lo que encontró la TERCERA auditoría, sobre el arreglo', () => {
  /* Un arreglo a medias es peor que el defecto: ahora hay una regla escrita que
     dice que está resuelto. Estas cinco son las que faltaban. */

  const SIN_FILAS: ModuloPrivilegios[] = [{ id: 'cont', nombre: 'Contratos',
    privilegios: [
      { id: 'cont-ver', nombre: 'Ver', columna: 'ver' },
      { id: 'cont-ed', nombre: 'Editar', columna: 'editar' },
    ] }];
  const DOS_COL: ColumnaPrivilegios[] = [
    { id: 'ver', titulo: 'Ver' }, { id: 'editar', titulo: 'Editar' }];

  it('[23] una matriz SIN `filas` tampoco se vacía: el arreglo cubría la mitad', () => {
    /* `baseDe` miraba `m.filas?.length`, así que un módulo de un solo recurso
       —lo que sale al omitir `filas`— volvía a la búsqueda por id literal y
       seguía devolviendo `{}` para el módulo entero. El mismo borrado
       silencioso por la puerta de al lado. Lo que cambia la semántica es que
       los privilegios se coloquen por COLUMNA, no que haya `filas`. */
    expect(privilegiosEfectivos(SIN_FILAS, { cont: { 'cont-ver': true, 'cont-ed': true } }, 'ver'))
      .toEqual({ cont: { 'cont-ver': true, 'cont-ed': true } });
    expect(baseDe(SIN_FILAS[0], SIN_FILAS[0].privilegios[1], 'ver')).toBe('cont-ver');
  });

  it('[23] y ahí SÍ se ve el carril de «sin base», que antes no salía nunca', () => {
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={DOS_COL}
      modulos={SIN_FILAS} base="ver" valor={{}} onCambio={() => {}} />);
    expect(container.querySelectorAll('tbody tr.pm-sin-base'),
      'lo efectivo viaja vacío y la pantalla no da ninguna señal').toHaveLength(1);
  });

  it('[16] la LISTA no arrastra el base a escondidas — la regresión del arreglo', () => {
    /* `cambiar()` pasó a `baseDe` y `fila()` se quedó con el `base` literal,
       porque `fila()` NO consumía `estado()`: era una segunda copia completa
       del cálculo. Así que la lista empezó a encender el base de rebote SIN
       decirlo, que es exactamente lo que la regla 16 prohíbe. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'trab', nombre: 'Trab' }],
      privilegios: [
        { id: 't-ver', nombre: 'Ver', columna: 'ver', fila: 'trab' },
        { id: 't-ed', nombre: 'Editar', columna: 'editar', fila: 'trab' },
      ] }];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={M} base="ver" valor={{}}
      onCambio={onCambio} abiertos={['m']} />);
    const avisos = container.querySelectorAll('.pp-junto').length;
    fireEvent.click([...container.querySelectorAll('[role="switch"]')][1]);
    const [completo] = onCambio.mock.calls[0];
    if (completo.m['t-ver'] === true) {
      expect(avisos, 'enciende el base de rebote y no lo dice en ninguna parte')
        .toBeGreaterThan(0);
    }
  });

  it('[24] `filas: []` no hace desaparecer el módulo en silencio', () => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={DOS_COL}
      modulos={[{ id: 'm', nombre: 'M', filas: [],
        privilegios: [{ id: 'ver', nombre: 'Ver', columna: 'ver' }] }]}
      base={null} valor={{ m: { ver: true } }} onCambio={() => {}} />);
    expect(container.querySelectorAll('tbody tr.pm-fila').length,
      'el módulo entero desapareció de la tabla').toBeGreaterThan(0);
    expect(gritar.mock.calls.flat().join(' ')).toContain('filas: []');
    gritar.mockRestore();
  });

  it('[24] la QUINTA forma: `fila` en un módulo sin `filas`', () => {
    /* La regla enumeraba cinco y el código cubría cuatro. Los dos caen en la
       fila implícita, se dibuja uno, y el otro sigue concedido. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios presentacion="matriz" columnas={DOS_COL}
      modulos={[{ id: 'm', nombre: 'M', privilegios: [
        { id: 'a', nombre: 'A', columna: 'ver', fila: 'trab' },
        { id: 'b', nombre: 'B', columna: 'ver', fila: 'cont' }] }]}
      base={null} valor={{}} onCambio={() => {}} />);
    const dicho = gritar.mock.calls.flat().join(' ');
    /* `/fila|celda/` lo tapaba el aviso de «MISMA celda», que también salta
       aquí. Se exige el diagnóstico PROPIO: el que dice qué hacer. Un aviso
       genérico manda a buscar el problema donde no está. */
    expect(dicho, 'no se dice que el módulo no declara `filas`')
      .toContain('pero su modulo no declara');
    expect(dicho).toContain('«a»');
    gritar.mockRestore();
  });

  it('[24] y `baseSinResolver` no acusa a una fila que SÍ tiene su columna base', () => {
    /* Decía «la fila X no tiene privilegio en la columna base» de un módulo que
       sí lo tenía: hablaba de columnas y comprobaba ids. Un aviso que se
       equivoca enseña a ignorar los avisos. */
    expect(baseSinResolver(SIN_FILAS[0], 'ver')).toEqual([]);
    expect(baseSinResolver(SIN_FILAS[0], 'leer')).toEqual(['cont']);
  });

  it('[21] un nombre que no es texto NO sale como «[object Object]»', () => {
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f', nombre: <b>F</b> }],
      privilegios: [
        { id: 'a', nombre: <b>A</b>, columna: 'ver', fila: 'f', clave: 'k' },
        { id: 'b', nombre: <b>B</b>, columna: 'editar', fila: 'f', clave: 'k' },
      ] }];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={DOS_COL}
      modulos={M} base={null} valor={{}} onCambio={() => {}} />);
    expect(container.innerHTML, 'un nombre en JSX se imprime como objeto')
      .not.toContain('[object Object]');
    expect(container.textContent).toContain('Va con');
  });

  it('[24] el mismo aviso no se repite en cada pintada', () => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(<PanelPrivilegios presentacion="matriz"
      columnas={[{ id: 'ver', titulo: 'Ver' }]}
      modulos={[{ id: 'm', nombre: 'M', privilegios: [{ id: 'x', nombre: 'X' }] }]}
      base={null} valor={{}} onCambio={() => {}} />);
    const primera = gritar.mock.calls.length;
    for (let i = 0; i < 3; i++) {
      rerender(<PanelPrivilegios presentacion="matriz"
        columnas={[{ id: 'ver', titulo: 'Ver' }]}
        modulos={[{ id: 'm', nombre: 'M', privilegios: [{ id: 'x', nombre: 'X' }] }]}
        base={null} valor={{}} onCambio={() => {}} />);
    }
    expect(gritar.mock.calls.length, 'la consola se llena con el mismo aviso')
      .toBe(primera);
    gritar.mockRestore();
  });
});

describe('R151 · lo que encontró la CUARTA auditoría', () => {
  const C2: ColumnaPrivilegios[] = [
    { id: 'consultar', titulo: 'Consultar' }, { id: 'modificar', titulo: 'Modificar' }];

  it('[26] un módulo con `columna` presentado como LISTA no se vacía', () => {
    /* REGRESIÓN del arreglo anterior. `baseDe` preguntaba «¿hay privilegios con
       columna?» en vez de «¿existe una columna que se llame como el base?», así
       que ids `ver`/`editar` con columnas `consultar`/`modificar` perdían su
       base y el módulo entero viajaba `{}`. También en lista, donde antes del
       R151 funcionaba — y basta declarar `columna` una vez para pintar las dos
       presentaciones, que es lo que las reglas 18 y 21 invitan a hacer. */
    const M: ModuloPrivilegios[] = [{ id: 'memos', nombre: 'Memos', privilegios: [
      { id: 'ver', nombre: 'Ver', columna: 'consultar' },
      { id: 'editar', nombre: 'Editar', columna: 'modificar' }] }];
    expect(privilegiosEfectivos(M, { memos: { ver: true, editar: true } }, 'ver'))
      .toEqual({ memos: { ver: true, editar: true } });
    expect(baseDe(M[0], M[0].privilegios[1], 'ver')).toBe('ver');
  });

  it('[26] el base sin conceder vacía el módulo, y eso INCLUYE al base', () => {
    /* Al unificar las dos ramas, `b === p.id → continue` dejaba sobrevivir un
       `{ver:false}`: el módulo ya no estaba vacío. Lo cazó la prueba del R97,
       que es de hace cincuenta versiones. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M', privilegios: [
      { id: 'ver', nombre: 'Ver' }, { id: 'ed', nombre: 'Editar' }] }];
    expect(privilegiosEfectivos(M, { m: { ver: false, ed: true } }, 'ver')).toEqual({ m: {} });
  });

  it('[26] un base declarado que NO resuelve deja el módulo SIN EFECTO', () => {
    /* La guarda `b === null` se podía girar en cualquier dirección y nada
       protestaba — y es la línea que produce el vaciado silencioso. */
    const M: ModuloPrivilegios[] = [{ id: 'x', nombre: 'X', privilegios: [
      { id: 'otra', nombre: 'Otra' }] }];
    expect(privilegiosEfectivos(M, { x: { otra: true } }, 'ver'), 'sin base, no se aplica nada')
      .toEqual({ x: {} });
  });

  it('[12] un base declarado que NO resuelve también marca el módulo', () => {
    /* Es lo más importante que se puede decir: `privilegiosEfectivos` lo vacía
       entero. Al pasar a `baseDe` quedó en `false` y el carril dejó de salir. */
    const { container } = render(
      <PanelPrivilegios modulos={[{ id: 'x', nombre: 'X', privilegios: [
        { id: 'otra', nombre: 'Otra' }] }]} base="ver" valor={{}} onCambio={() => {}}
        abiertos={['x']} />
    );
    expect(container.querySelector('.pp-sin-base'), 'no se marca').not.toBeNull();
    expect(container.querySelectorAll('.pp-aviso').length, 'carril sin leyenda')
      .toBeGreaterThan(0);
  });

  it('[11] y NO se marca cuando el base de columna sí está concedido', () => {
    /* Con `sinBase` por id literal, un módulo colocado por columnas salía
       marcado CON TODO CONCEDIDO: la pantalla contradiciendo al backend. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f', nombre: 'F' }],
      privilegios: [
        { id: 'f-ver', nombre: 'Ver', columna: 'consultar', fila: 'f' },
        { id: 'f-ed', nombre: 'Editar', columna: 'modificar', fila: 'f' }] }];
    const { container } = render(<PanelPrivilegios modulos={M} base="consultar"
      valor={{ m: { 'f-ver': true, 'f-ed': true } }} onCambio={() => {}} abiertos={['m']} />);
    expect(container.querySelector('.pp-sin-base'),
      'dice que falta el base con todo concedido').toBeNull();
  });

  it('[24] y se avisa en LISTA, no solo en matriz', () => {
    /* El diagnóstico existía y salía por un `return` antes de consultarse donde
       hacía falta: un módulo colocado por columnas y pintado como lista se
       vaciaba sin una sola señal. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios modulos={[{ id: 'x', nombre: 'X', privilegios: [
      { id: 'a', nombre: 'A', columna: 'consultar' }] }]} base="ver" valor={{}}
      onCambio={() => {}} abiertos={['x']} />);
    expect(gritar.mock.calls.flat().join(' ')).toContain('encarne el base');
    gritar.mockRestore();
  });

  it('[27] una clave guardada que ya NO es un privilegio no se aplica', () => {
    /* Viajaba concedida: sin interruptor, sin chip, sin contar en el «4 de 6»,
       y aplicándose. Se dispara justo al migrar de lista a matriz, que renombra
       los ids. El mapa COMPLETO la conserva —eso es R98—; el efecto no. */
    const M: ModuloPrivilegios[] = [{ id: 'p', nombre: 'P', privilegios: [
      { id: 'ver', nombre: 'Ver' }] }];
    expect(privilegiosEfectivos(M, { p: { ver: true, borrar: true, 'borrar:doc': 'todo' } }, 'ver'))
      .toEqual({ p: { ver: true } });
  });

  it('[27] una `clave` repartida entre filas sube el base de LAS DOS', () => {
    /* Encender arrastraba al compañero de otra fila pero solo subía el base de
       la fila del pulsado: el compañero se veía ENCENDIDO y no viajaba. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }],
      privilegios: [
        { id: 'a-ver', nombre: 'Ver A', columna: 'consultar', fila: 'a' },
        { id: 'b-ver', nombre: 'Ver B', columna: 'consultar', fila: 'b' },
        { id: 'a-ed', nombre: 'Ed A', columna: 'modificar', fila: 'a', clave: 'k' },
        { id: 'b-ed', nombre: 'Ed B', columna: 'modificar', fila: 'b', clave: 'k' },
      ] }];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C2}
      modulos={M} base="consultar" valor={{}} onCambio={onCambio} />);
    fireEvent.click(celda(container, 'A', 1).querySelector('[role="switch"]')!);
    const [, efectivo] = onCambio.mock.calls[0];
    expect(efectivo.m['a-ed'], 'el pulsado no viaja').toBe(true);
    expect(efectivo.m['b-ed'], 'el compañero se ve encendido y NO viaja').toBe(true);
  });

  it('[28] en la matriz, la fila sin base lo dice con PALABRAS', () => {
    /* El filete de color era el único portador de «esta fila no concede nada»
       —SC 1.4.1—, mientras la lista lleva su frase desde el R144. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'a', nombre: 'A' }],
      privilegios: [
        { id: 'a-ver', nombre: 'Ver A', columna: 'consultar', fila: 'a' },
        { id: 'a-ed', nombre: 'Editar A', columna: 'modificar', fila: 'a' }] }];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C2}
      modulos={M} base="consultar" valor={{}} onCambio={() => {}} />);
    const th = container.querySelector('tr.pm-sin-base .pm-nom')!;
    expect(th.textContent, 'la fila no dice por qué no concede nada')
      .toContain('nada de esta fila se aplica');
  });

  it('[28] con varios módulos, el nombre del módulo llega al lector', () => {
    /* `headers` SUSTITUYE la asociación por `scope`, así que dos sedes con una
       fila «Contratos» cada una daban cuatro interruptores con dos pares de
       nombres accesibles idénticos: la regla 25 se cumplía mirando y no sin
       ver, que es justo lo que dice cubrir. */
    const dos: ModuloPrivilegios[] = [
      { id: 'lima', nombre: 'Sede Lima', filas: [{ id: 'c', nombre: 'Contratos' }],
        privilegios: [{ id: 'l-c', nombre: 'Ver', columna: 'consultar', fila: 'c' }] },
      { id: 'hz', nombre: 'Sede Huaraz', filas: [{ id: 'c', nombre: 'Contratos' }],
        privilegios: [{ id: 'h-c', nombre: 'Ver', columna: 'consultar', fila: 'c' }] },
    ];
    const { container } = render(<PanelPrivilegios presentacion="matriz" columnas={C2}
      modulos={dos} base={null} valor={{}} onCambio={() => {}} />);
    const celdas = [...container.querySelectorAll('td.pm-celda')]
      .filter((c) => c.querySelector('[role="switch"]'));
    const nombres = celdas.map((c) => c.getAttribute('headers')!.split(' ')
      .map((id) => container.querySelector(`#${CSS.escape(id)}`)?.textContent ?? '')
      .join(' · '));
    expect(new Set(nombres).size, 'dos celdas de módulos distintos se llaman igual')
      .toBe(celdas.length);
    expect(nombres[0]).toContain('Sede Lima');
  });

  it('[24] dos columnas con el mismo `id` se dicen', () => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios presentacion="matriz"
      columnas={[{ id: 'ver', titulo: 'Ver' }, { id: 'ver', titulo: 'Ver otra vez' }]}
      modulos={[{ id: 'm', nombre: 'M', privilegios: [
        { id: 'a', nombre: 'A', columna: 'ver' }] }]}
      base={null} valor={{}} onCambio={() => {}} />);
    expect(gritar.mock.calls.flat().join(' ')).toContain('declarada dos veces');
    gritar.mockRestore();
  });

  it('[27] los dos PUNTOS FIJOS son UNO, y una pasada no basta', () => {
    /* `while` → `if` en cualquiera de los dos bucles pasaba las 132 pruebas.
       Son el código que tres auditorías tuvieron que arreglar. Cadena de tres:
       quitar el primero tumba al segundo, y el segundo al tercero. */
    /* LA CADENA VA AL REVÉS DEL RECORRIDO A PROPÓSITO. Declarada `a→b→c→d`,
       una sola pasada ya la limpia entera —el bucle los visita en ese orden—,
       así que `while`→`if` sobrevivía. Declarada al revés, cada vuelta solo
       puede quitar uno: eso es lo que distingue un punto fijo de una pasada. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M', privilegios: [
      { id: 'ver', nombre: 'Ver' },
      { id: 'd', nombre: 'D', depende: 'c' },
      { id: 'c', nombre: 'C', depende: 'b' },
      { id: 'b', nombre: 'B', depende: 'a' },
      { id: 'a', nombre: 'A', cerrado: 'nunca' },
    ] }];
    expect(privilegiosEfectivos(M, { m: { ver: true, a: true, b: true, c: true, d: true } }, 'ver'))
      .toEqual({ m: { ver: true } });
  });

  it('[27] y el base encadena CON el `depende`, en la misma vuelta', () => {
    /* Igual: el que se cae va DESPUÉS del que depende de él, así una pasada
       no alcanza. Con `f-ver` declarado primero, el orden ya lo resolvía. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f', nombre: 'F' }, { id: 'g', nombre: 'G' }],
      privilegios: [
        { id: 'g-ed', nombre: 'Ed G', columna: 'modificar', fila: 'g' },
        { id: 'g-ver', nombre: 'Ver G', columna: 'consultar', fila: 'g', depende: 'f-ed' },
        { id: 'f-ed', nombre: 'Ed F', columna: 'modificar', fila: 'f' },
        { id: 'f-ver', nombre: 'Ver F', columna: 'consultar', fila: 'f', cerrado: 'nunca' },
      ] }];
    // «ver» se cae por `cerrado`; al caerse, «editar» pierde su base y también.
    /* `f-ver` cae por `cerrado`; sin él, `f-ed` pierde su base; sin `f-ed`,
       `g-ver` pierde su `depende`; y sin `g-ver`, `g-ed` pierde el suyo. */
    expect(privilegiosEfectivos(M, { m: {
      'f-ver': true, 'f-ed': true, 'g-ver': true, 'g-ed': true } }, 'consultar'))
      .toEqual({ m: {} });
  });

  it('[27] los niveles de lo NO concedido no viajan', () => {
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M', privilegios: [
      { id: 'ver', nombre: 'Ver' },
      { id: 'editar', nombre: 'Editar', niveles: [{ id: 'doc', nombre: 'Doc',
        opciones: [{ valor: 'a', texto: 'A' }, { valor: 'b', texto: 'B' }] }] }] }];
    expect(privilegiosEfectivos(M, { m: { ver: true, editar: false, 'editar:doc': 'b' } }, 'ver'))
      .toEqual({ m: { ver: true, editar: false } });
  });

  it('[16] no se promete un arrastre que `cambiar` se niega a hacer', () => {
    /* Sin `!elBase.deshabilitado`, la etiqueta prometía encender un base que
       R148 impide encender: el aviso y el hecho, en desacuerdo. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M', privilegios: [
      { id: 'ver', nombre: 'Ver', deshabilitado: true },
      { id: 'ed', nombre: 'Editar' }] }];
    const { container } = render(<PanelPrivilegios modulos={M} base="ver" valor={{}}
      onCambio={() => {}} abiertos={['m']} />);
    expect(container.querySelector('.pp-junto'),
      'promete encender un base que R148 impide encender').toBeNull();
  });

  it('[19] el control de la celda bloqueada tiene NOMBRE accesible', () => {
    const { container } = render(<Matriz />);
    const ctrl = celda(container, 'Trabajadores', 2).querySelector('[role="switch"]')!;
    const id = ctrl.getAttribute('aria-labelledby');
    expect(id, 'el interruptor bloqueado se quedó sin nombre').not.toBeNull();
    const texto = id!.split(' ')
      .map((x) => container.querySelector(`#${CSS.escape(x)}`)?.textContent ?? '').join(' ');
    expect(texto).toContain('Trabajadores');
    expect(texto).toContain('Crear');
  });
});
