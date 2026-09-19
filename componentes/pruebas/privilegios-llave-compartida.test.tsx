/**
 * R152 · UNA LLAVE QUE ABRE DOS PUERTAS.
 *
 * Lo pidió Control Administrativos V2.0 y el argumento es de seguridad, no de
 * comodidad: *«dar de alta enciende Contrato → Puesto → Cargo →
 * PrivilegioCargo… ese daño es idéntico se pulse el botón donde se pulse, y un
 * acto irreversible merece una sola llave. Con dos, quitar una da la sensación
 * de haber cerrado sin haber cerrado»*.
 *
 * Entra porque **no es de su proyecto**: la misma acción peligrosa alcanzable
 * desde dos pantallas es el patrón de cualquier sistema de permisos que crezca.
 * Y porque la salida que les quedaba —sincronizar las dos entradas en su
 * `onCambio`— es reimplementar `clave` por fuera, que es de lo que venían
 * huyendo desde el R151.
 */
import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PanelPrivilegios, privilegiosEfectivos, clavesEfectivas, mismosPermisos,
  type ModuloPrivilegios, type ValorPrivilegios } from '../src/PanelPrivilegios';

/* Los dos módulos del caso real: dos opciones distintas del menú, con «Dar
   alta» siendo el MISMO permiso en las dos. */
const MODS: ModuloPrivilegios[] = [
  { id: 'contrato', nombre: 'Contrato', privilegios: [
    { id: 'c-ver', nombre: 'Ver' },
    { id: 'c-alta', nombre: 'Dar alta', claveGlobal: 'alta-contrato' },
  ] },
  { id: 'historia', nombre: 'Historia de contratos', privilegios: [
    { id: 'h-ver', nombre: 'Ver' },
    { id: 'h-alta', nombre: 'Dar alta', claveGlobal: 'alta-contrato' },
  ] },
];

function Panel({ inicial = {} as ValorPrivilegios, ...extra }) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return (
    <PanelPrivilegios modulos={MODS} base="c-ver" valor={v} onCambio={(c) => setV(c)}
      abiertos={['contrato', 'historia']} {...extra} />
  );
}
const sw = (c: HTMLElement, nombre: string) =>
  [...c.querySelectorAll('.pp-priv')]
    .filter((f) => f.textContent?.includes(nombre))
    .map((f) => f.querySelector('[role="switch"]')!);

describe('[29] R152 · la misma llave, en módulos distintos', () => {
  it('[29] encender en un módulo enciende el gemelo del otro', () => {
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios modulos={MODS} base={null} valor={{}} onCambio={onCambio}
        abiertos={['contrato', 'historia']} />
    );
    fireEvent.click(sw(container, 'Dar alta')[0]);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.contrato['c-alta']).toBe(true);
    expect(completo.historia['h-alta'],
      'la llave se guardó en un módulo y no en el otro').toBe(true);
  });

  it('[29] y apagar también los apaga a los dos', () => {
    /* «Quitar una da la sensación de haber cerrado sin haber cerrado». */
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios modulos={MODS} base={null} onCambio={onCambio}
        valor={{ contrato: { 'c-alta': true }, historia: { 'h-alta': true } }}
        abiertos={['contrato', 'historia']} />
    );
    fireEvent.click(sw(container, 'Dar alta')[0]);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.contrato['c-alta']).toBe(false);
    expect(completo.historia['h-alta'], 'se cerró una puerta y la otra quedó abierta')
      .toBe(false);
  });

  it('[29] el aviso NOMBRA el otro módulo, no solo el privilegio', () => {
    /* «Va con Dar alta» no dice lo mismo que «va con Dar alta (Contrato)»: sin
       el módulo, el aviso dice la verdad a medias, y en una pantalla de
       permisos eso es peor que no decir nada. Lo pidieron con esas palabras. */
    const { container } = render(<Panel />);
    const vaCon = [...container.querySelectorAll('.pp-junto')]
      .map((x) => x.textContent ?? '').filter((t) => t.includes('va con'));
    expect(vaCon, 'no hay aviso de llave compartida').toHaveLength(2);
    /* CADA uno nombra SU módulo, y se comprueban los dos: mirando el montón
       junto, bastaba con que uno lo dijera. */
    expect(vaCon.some((t) => t.includes('(Contrato)')),
      'el aviso de Historia no dice que alcanza a Contrato').toBe(true);
    expect(vaCon.some((t) => t.includes('(Historia de contratos)')),
      'el aviso de Contrato no dice que alcanza a Historia').toBe(true);
  });

  it('[29] y una `clave` local NO se contagia por tener además `claveGlobal`', () => {
    /* El riesgo concreto de mezclar los dos ámbitos: si el que cruza arrastrara
       también a los que comparten su `clave` en otros módulos, bastaría poner
       `claveGlobal` en un privilegio para que su `clave` —una cadena corta y
       genérica— empezara a cruzar sin que nadie lo pidiera. */
    const mezcla: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [
        { id: 'a1', nombre: 'Editar A', clave: 'editar', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [
        { id: 'b1', nombre: 'Editar B', clave: 'editar' },
        { id: 'b2', nombre: 'Alta B', claveGlobal: 'g' }] },
    ];
    const juntos = mismosPermisos(mezcla, mezcla[0], mezcla[0].privilegios[0])
      .map((x) => `${x.modulo.id}/${x.privilegio.id}`);
    expect(juntos, 'la `clave` local cruzó de módulo por llevar al lado una global')
      .toEqual(['b/b2']);
  });

  it('[29] `clave` sigue siendo LOCAL: dos módulos con la misma no se unen', () => {
    /* Es el motivo de que `claveGlobal` sea una prop aparte y no una ampliación
       de `clave`: las claves son cadenas cortas y genéricas, y unirlas por
       omisión fundiría en un permiso dos que solo coinciden de nombre. */
    const locales: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [{ id: 'a1', nombre: 'Editar', clave: 'editar' }] },
      { id: 'b', nombre: 'B', privilegios: [{ id: 'b1', nombre: 'Editar', clave: 'editar' }] },
    ];
    const onCambio = vi.fn();
    const { container } = render(
      <PanelPrivilegios modulos={locales} base={null} valor={{}} onCambio={onCambio}
        abiertos={['a', 'b']} />
    );
    fireEvent.click(container.querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.a.a1).toBe(true);
    expect(completo.b?.b1, '`clave` cruzó módulos y fundió dos permisos distintos')
      .toBeUndefined();
  });

  it('[29] `mismosPermisos` une por las dos vías y no se repite a sí mismo', () => {
    const conAmbas: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [
        { id: 'a1', nombre: 'Uno', clave: 'k', claveGlobal: 'g' },
        { id: 'a2', nombre: 'Dos', clave: 'k' },
        { id: 'a3', nombre: 'Tres', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [{ id: 'b1', nombre: 'Cuatro', claveGlobal: 'g' }] },
    ];
    const r = mismosPermisos(conAmbas, conAmbas[0], conAmbas[0].privilegios[0]);
    expect(r.map((x) => `${x.modulo.id}/${x.privilegio.id}`).sort())
      .toEqual(['a/a2', 'a/a3', 'b/b1']);
  });

  it('[29] el gemelo del otro módulo arrastra el base DE SU MÓDULO', () => {
    /* Si no, viaja un permiso encendido en pantalla y vacío en lo efectivo: el
       defecto que el R151 cerró dentro de un módulo, reapareciendo entre
       módulos. */
    const onCambio = vi.fn();
    const conBase: ModuloPrivilegios[] = [
      { id: 'contrato', nombre: 'Contrato', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'c-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
      { id: 'historia', nombre: 'Historia', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'h-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
    ];
    const { container } = render(
      <PanelPrivilegios modulos={conBase} base="ver" valor={{}} onCambio={onCambio}
        abiertos={['contrato', 'historia']} />
    );
    fireEvent.click(sw(container, 'Dar alta')[0]);
    const [completo, efectivo] = onCambio.mock.calls[0];
    expect(completo.historia.ver, 'el gemelo se encendió sin el «ver» de su módulo').toBe(true);
    expect(efectivo.historia['h-alta'], 'se ve encendido y no viaja').toBe(true);
  });

  it('[29] y no enciende de rebote lo que quien reparte NO puede repartir', () => {
    /* R148 entre módulos: si una mitad de la llave no es mía, el permiso no es
       mío — y encenderla tumbaría el PUT entero con una regla anti-escalada. */
    const onCambio = vi.fn();
    const conCerrado: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [{ id: 'a1', nombre: 'Alta', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [
        { id: 'b1', nombre: 'Alta', claveGlobal: 'g', deshabilitado: true }] },
    ];
    const { container } = render(
      <PanelPrivilegios modulos={conCerrado} base={null} valor={{}} onCambio={onCambio}
        abiertos={['a', 'b']} />
    );
    fireEvent.click(container.querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.b?.b1, 'encendió de rebote lo que no se puede repartir').toBeUndefined();
  });
});

describe('[30] R152 · la pregunta que hicieron, respondida en código', () => {
  /* «¿Qué debería devolver `privilegiosEfectivos` para una clave compartida
     cuyo módulo A sobrevive y cuyo módulo B se vacía?» — pidieron que lo
     decidiéramos nosotros y lo escribiéramos, porque decidirlo ellos significa
     acertar hoy y divergir en la próxima versión. */

  const dos: ModuloPrivilegios[] = [
    { id: 'a', nombre: 'A', privilegios: [
      { id: 'a-ver', nombre: 'Ver' },
      { id: 'a-alta', nombre: 'Alta', claveGlobal: 'g' }] },
    { id: 'b', nombre: 'B', privilegios: [
      { id: 'b-ver', nombre: 'Ver' },
      { id: 'b-alta', nombre: 'Alta', claveGlobal: 'g' }] },
  ];

  it('[30] `privilegiosEfectivos` NO cambia: sigue diciendo la verdad por módulo', () => {
    /* B no tiene su base, así que B no aplica NADA — y eso es una verdad sobre
       B. Dejar colgada una entrada de un módulo vaciado sería mentir sobre B
       para acertar sobre la llave. */
    const efectivo = privilegiosEfectivos(dos,
      { a: { 'a-ver': true, 'a-alta': true }, b: { 'b-alta': true } }, 'a-ver');
    expect(efectivo.a['a-alta']).toBe(true);
    expect(efectivo.b['b-alta'], 'un módulo sin su base aplicó algo').toBeUndefined();
  });

  it('[30] y la llave está CONCEDIDA si sobrevive en al menos un módulo', () => {
    /* Es UNA llave: si en alguna puerta abre de verdad, está dada. Exigir que
       sobreviva en todos convertiría un módulo sin base en un revocador
       silencioso de permisos concedidos en otra pantalla — el borrado que el
       R150 cerró. */
    expect(clavesEfectivas(dos,
      { a: { 'a-ver': true, 'a-alta': true }, b: { 'b-alta': true } }, 'a-ver'))
      .toEqual(new Set(['g']));
  });

  it('[30] y NO está concedida si no sobrevive en ninguno', () => {
    expect(clavesEfectivas(dos, { a: { 'a-alta': true }, b: { 'b-alta': true } }, 'a-ver'))
      .toEqual(new Set());
  });

  it('[30] una llave sin conceder en ninguna parte no aparece', () => {
    expect(clavesEfectivas(dos, { a: { 'a-ver': true } }, 'a-ver')).toEqual(new Set());
  });
});

describe('[29] R152 · lo que casi siempre es un error, se dice', () => {
  it('[29] `claveGlobal` repetida DENTRO de un módulo avisa: eso es `clave`', () => {
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<PanelPrivilegios base={null} valor={{}} onCambio={() => {}} abiertos={['m']}
      modulos={[{ id: 'm', nombre: 'M', privilegios: [
        { id: 'x', nombre: 'X', claveGlobal: 'g' },
        { id: 'y', nombre: 'Y', claveGlobal: 'g' }] }]} />);
    const dicho = gritar.mock.calls.flat().join(' ');
    expect(dicho).toContain('claveGlobal');
    expect(dicho).toContain('mismo modulo');
    gritar.mockRestore();
  });
});

describe('R152 · lo que encontró la auditoría sobre el propio R152', () => {
  /* Seis defectos, y el primero es el peor que puede tener este componente:
     conceder un permiso que nadie tocó. */

  it('[32] encender la llave ANUNCIA el base que subirá en el otro módulo', () => {
    /* UNA AUDITORÍA LO REPORTÓ COMO CONCESIÓN SILENCIOSA y hubo que medirlo
       antes de creerlo: pulsar «Dar alta» en Contrato sube el «Ver» de Historia
       —el gemelo lo necesita o no viajaría— y al subirlo entra en vigor todo lo
       que Historia tuviera guardado y dormido, `editar` incluido.
       NO ES UN DEFECTO DEL R152: se midió el MISMO escenario dentro de un solo
       módulo y hace exactamente lo mismo, y lo hace desde el R97 — conceder el
       base concede el módulo, y R98 conserva lo repartido sin aplicarlo. Es la
       semántica del base, coherente en todo el componente.
       LO QUE SÍ FALTABA ERA DECIRLO, y entre módulos importa más que dentro de
       uno: quien reparte está mirando OTRA pantalla. El daño escrito en R149
       —un 403 anti-escalada que tumba el guardado entero— aplica igual. */
    const M: ModuloPrivilegios[] = [
      { id: 'contrato', nombre: 'Contrato', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'c-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
      { id: 'historia', nombre: 'Historia', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'editar', nombre: 'Editar' },
        { id: 'h-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
    ];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={M} base="ver" onCambio={onCambio}
      valor={{ contrato: { ver: true }, historia: { editar: true } }}
      abiertos={['contrato', 'historia']} />);
    // ANTES de pulsar, la etiqueta dice las dos cosas que van a pasar.
    const fila = [...container.querySelectorAll('.pp-priv')]
      .find((f) => f.textContent?.includes('Dar alta'))!;
    expect(fila.textContent, 'no dice que alcanza a la otra pantalla').toContain('(Historia)');
    expect(fila.textContent, 'no dice que encenderá el base de la otra pantalla')
      .toContain('Ver');
    fireEvent.click(fila.querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.historia.editar, 'el mapa completo no debe perder nada (R98)').toBe(true);
    expect(completo.historia.ver, 'el gemelo se quedó sin el base de su módulo').toBe(true);
  });

  it('[32] y conserva lo que el otro módulo ya tenía guardado', () => {
    /* La otra mitad: sembrar el mapa del otro módulo en blanco lo borraría
       entero — R98 al revés, y con los niveles de campo dentro. */
    const M: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [{ id: 'a1', nombre: 'Alta', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [
        { id: 'b1', nombre: 'Alta', claveGlobal: 'g' },
        { id: 'b2', nombre: 'Otro', niveles: [{ id: 'n', nombre: 'N', opciones: [
          { valor: 'p', texto: 'P' }, { valor: 'q', texto: 'Q' }] }] }] },
    ];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={M} base={null} onCambio={onCambio}
      valor={{ b: { b2: true, 'b2:n': 'p' } }} abiertos={['a', 'b']} />);
    fireEvent.click(container.querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.b.b2, 'se perdió lo que el otro módulo ya tenía').toBe(true);
    expect(completo.b['b2:n'], 'se destruyó un nivel de campo del otro módulo').toBe('p');
  });

  it('[31] «el mismo permiso» es TRANSITIVO: A=B por clave, B=C por llave global', () => {
    /* Si A y B son el mismo permiso y B y C son el mismo permiso, A y C lo son.
       Devolviendo solo los compañeros DIRECTOS, pulsar A encendía B y dejaba C
       apagado — mientras la etiqueta anunciaba que iban juntos. Es el defecto
       del R152 reaparecido dentro del mecanismo que vino a cerrarlo. */
    const cadena: ModuloPrivilegios[] = [
      { id: 'm1', nombre: 'M1', privilegios: [
        { id: 'a', nombre: 'A', clave: 'k' },
        { id: 'b', nombre: 'B', clave: 'k', claveGlobal: 'g' }] },
      { id: 'm2', nombre: 'M2', privilegios: [{ id: 'c', nombre: 'C', claveGlobal: 'g' }] },
    ];
    expect(mismosPermisos(cadena, cadena[0], cadena[0].privilegios[0])
      .map((x) => `${x.modulo.id}/${x.privilegio.id}`).sort()).toEqual(['m1/b', 'm2/c']);
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={cadena} base={null} valor={{}}
      onCambio={onCambio} abiertos={['m1', 'm2']} />);
    fireEvent.click(container.querySelector('[role="switch"]')!);
    const [completo] = onCambio.mock.calls[0];
    expect(completo.m1.b).toBe(true);
    expect(completo.m2?.c, 'la cadena se cortó: C quedó apagado').toBe(true);
  });

  it('[31] el gemelo de otro módulo arrastra su cadena `depende`', () => {
    /* Sin esto quedaba guardado en `true` e INVISIBLE, y entraba en vigor el
       día que alguien concediera su dependencia: un permiso que se cuela sin
       que nadie lo pulse. */
    const M: ModuloPrivilegios[] = [
      { id: 'm1', nombre: 'M1', privilegios: [{ id: 'a-alta', nombre: 'Alta', claveGlobal: 'g' }] },
      { id: 'm2', nombre: 'M2', privilegios: [
        { id: 'b-crear', nombre: 'Crear' },
        { id: 'b-alta', nombre: 'Alta', claveGlobal: 'g', depende: 'b-crear' }] },
    ];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={M} base={null} valor={{}}
      onCambio={onCambio} abiertos={['m1', 'm2']} />);
    fireEvent.click(container.querySelector('[role="switch"]')!);
    const [completo, efectivo] = onCambio.mock.calls[0];
    expect(completo.m2['b-crear'], 'el gemelo no arrastró su dependencia').toBe(true);
    expect(efectivo.m2['b-alta'], 'se ve encendido y no viaja').toBe(true);
  });

  it('[32] el aviso NO nombra a quien no se va a mover', () => {
    /* `cambiar()` salta los `cerrado`/`deshabilitado` y el aviso no lo hacía:
       prometía abrir una puerta de otra pantalla que no se iba a abrir. */
    const M: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [{ id: 'a1', nombre: 'Alta', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [
        { id: 'b1', nombre: 'Alta', claveGlobal: 'g', cerrado: 'nunca' }] },
    ];
    const { container } = render(<PanelPrivilegios modulos={M} base={null} valor={{}}
      onCambio={() => {}} abiertos={['a', 'b']} />);
    expect([...container.querySelectorAll('.pp-junto')].map((x) => x.textContent).join(' '),
      'promete arrastrar a un compañero que no se mueve').not.toContain('(B)');
  });

  it('[32] y SÍ dice el base del otro módulo que se va a encender', () => {
    /* La regla 16 existe para que el arrastre del base no sea invisible, y
       cruzando módulos lo era: pulsar aquí encendía el «ver» de la otra
       pantalla sin decirlo. El daño de R149 —403 anti-escalada que tumba el
       guardado entero— aplica igual entre módulos. */
    const M: ModuloPrivilegios[] = [
      { id: 'contrato', nombre: 'Contrato', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'c-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
      { id: 'historia', nombre: 'Historia', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'h-alta', nombre: 'Dar alta', claveGlobal: 'g' }] },
    ];
    const { container } = render(<PanelPrivilegios modulos={M} base="ver"
      valor={{ contrato: { ver: true } }} onCambio={() => {}}
      abiertos={['contrato', 'historia']} />);
    const junto = [...container.querySelectorAll('.pp-junto')].map((x) => x.textContent).join(' ');
    expect(junto, 'enciende el base de la otra pantalla y no lo dice').toContain('(Historia)');
  });

  it('[29] con `filas`, el gemelo de otra fila sube el base de SU fila', () => {
    /* El registro de «tocados» filtraba por `clave` y no por la llave global,
       así que el gemelo se veía encendido en la rejilla y no viajaba. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f1', nombre: 'F1' }, { id: 'f2', nombre: 'F2' }],
      privilegios: [
        { id: 'f1-ver', nombre: 'Ver 1', columna: 'ver', fila: 'f1' },
        { id: 'f1-alta', nombre: 'Alta 1', columna: 'alta', fila: 'f1', claveGlobal: 'g' },
        { id: 'f2-ver', nombre: 'Ver 2', columna: 'ver', fila: 'f2' },
        { id: 'f2-alta', nombre: 'Alta 2', columna: 'alta', fila: 'f2', claveGlobal: 'g' },
      ] }];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios presentacion="matriz" modulos={M} base="ver"
      columnas={[{ id: 'ver', titulo: 'Ver' }, { id: 'alta', titulo: 'Alta' }]}
      valor={{}} onCambio={onCambio} />);
    fireEvent.click([...container.querySelectorAll('[role="switch"]')].at(-1)!);
    const [, efectivo] = onCambio.mock.calls[0];
    expect(efectivo.m['f1-alta'], 'el gemelo de la otra fila se ve encendido y no viaja')
      .toBe(true);
    expect(efectivo.m['f2-alta']).toBe(true);
  });

  it('[31] la llave cruza aunque los dos gemelos se llamen igual', () => {
    /* `alta` y `alta` es el nombrado más natural, y saltarse «el mismo id» sin
       mirar el módulo dejaba de cruzar justo ahí. */
    const M: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [{ id: 'alta', nombre: 'Alta', claveGlobal: 'g' }] },
      { id: 'b', nombre: 'B', privilegios: [{ id: 'alta', nombre: 'Alta', claveGlobal: 'g' }] },
    ];
    expect(mismosPermisos(M, M[0], M[0].privilegios[0])
      .map((x) => `${x.modulo.id}/${x.privilegio.id}`)).toEqual(['b/alta']);
  });

  it('[32] con `filas`, no se despierta el recurso EQUIVOCADO', () => {
    /* Subir el base sólo de lo recién encendido importa de verdad aquí: con
       `filas`, cada recurso tiene su propio base. Recorriendo el mapa entero,
       encender algo en la fila 1 le subía el «ver» a la fila 2 porque tenía
       algo guardado y dormido — y ese recurso no lo había tocado nadie. Dentro
       de un módulo plano el efecto se confunde con la semántica del base; con
       filas se ve que son cosas distintas. */
    const M: ModuloPrivilegios[] = [{ id: 'm', nombre: 'M',
      filas: [{ id: 'f1', nombre: 'F1' }, { id: 'f2', nombre: 'F2' }],
      privilegios: [
        { id: 'f1-ver', nombre: 'Ver 1', columna: 'ver', fila: 'f1' },
        { id: 'f1-alta', nombre: 'Alta 1', columna: 'alta', fila: 'f1' },
        { id: 'f2-ver', nombre: 'Ver 2', columna: 'ver', fila: 'f2' },
        { id: 'f2-editar', nombre: 'Editar 2', columna: 'alta', fila: 'f2' },
      ] }];
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios presentacion="matriz" modulos={M} base="ver"
      columnas={[{ id: 'ver', titulo: 'Ver' }, { id: 'alta', titulo: 'Alta' }]}
      valor={{ m: { 'f2-editar': true } }} onCambio={onCambio} />);
    // Se enciende «Alta 1», de la PRIMERA fila.
    fireEvent.click([...container.querySelectorAll('[role="switch"]')][1]);
    const [completo, efectivo] = onCambio.mock.calls[0];
    expect(completo.m['f1-ver'], 'su propia fila no recibió su base').toBe(true);
    expect(completo.m['f2-ver'],
      'se le subió el base a un recurso que nadie tocó').toBeUndefined();
    expect(efectivo.m['f2-editar'],
      'se concedió un permiso dormido de OTRO recurso').toBeUndefined();
  });

  it('[31] y ningún compañero sale repetido en el aviso', () => {
    const M: ModuloPrivilegios[] = [
      { id: 'a', nombre: 'A', privilegios: [
        { id: 'a1', nombre: 'Uno', clave: 'k', claveGlobal: 'g' },
        { id: 'a2', nombre: 'Dos', clave: 'k', claveGlobal: 'g' }] },
    ];
    const r = mismosPermisos(M, M[0], M[0].privilegios[0]);
    expect(r).toHaveLength(1);
    expect(r[0].privilegio.id).toBe('a2');
  });
});
