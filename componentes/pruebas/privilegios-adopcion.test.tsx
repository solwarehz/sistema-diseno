/**
 * R144–R146 · las cuatro cosas que Control Administrativos V2.0 pidió antes de
 * adoptar el panel.
 *
 * El panel nació por petición suya —R97, v1.72.0— y llegó a su forma actual en
 * la v1.91.0. **Nunca lo adoptaron.** Al ir a hacerlo leyeron el contrato entero
 * y salieron cuatro; dos de ellas **las llevaba declaradas abiertas el propio
 * sistema desde la v1.91.0**, sin que nadie las cerrara en dos meses.
 *
 * Lo que fijan estas pruebas es lo que no es de dibujo: que el apagado a medias
 * dejó de expresarse con opacidad, que el aviso está donde se lee, que el móvil
 * conserva la respuesta y no solo el número, y que el único bloqueado
 * **transitorio** se alcanza con teclado.
 */
import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
// El motor de cascada del repositorio, en .mjs sin tipos propios.
import { parsear, resolver, elem } from '../../sistema/candado/verificar-cascada.mjs';
import { PanelPrivilegios, type ModuloPrivilegios, type ValorPrivilegios } from '../src/PanelPrivilegios';

const HOJA = join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css');
const css = readFileSync(HOJA, 'utf8');

const MODULOS: ModuloPrivilegios[] = [
  { id: 'personal', nombre: 'Personal', privilegios: [
    { id: 'ver', nombre: 'Ver trabajadores' },
    { id: 'editar', nombre: 'Editar' },
    { id: 'crear', nombre: 'Crear trabajador' },
    { id: 'descargar', nombre: 'Descargar' },
    { id: 'carga-masiva', nombre: 'Carga masiva', depende: 'crear' },
  ] },
];

function Panel({ inicial = {} as ValorPrivilegios }) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return <PanelPrivilegios modulos={MODULOS} valor={v} onCambio={setV} abiertos={['personal']} />;
}

describe('[11] R144 · sin base se marca con un carril, no apagando', () => {
  it('[11] la hoja YA NO baja la opacidad de las filas sin base', () => {
    /* Era `opacity: .5` con los interruptores AÚN PULSABLES: el nombre a
       2,07:1 y el icono a 2,03:1 —cifras del propio sistema, declaradas
       abiertas desde la v1.91.0—, así que la excepción de WCAG para controles
       inactivos no aplicaba. Y no es un caso raro: es el estado INICIAL de la
       pantalla. */
    const regla = css.match(/\.pp-sin-base \.pp-priv:not\(\.pp-priv-base\)\s*\{[^}]*\}/)?.[0] ?? '';
    expect(regla, 'falta la regla entera').not.toBe('');
    expect(regla, 'la opacidad volvió').not.toMatch(/opacity/);
    expect(regla, 'sin carril no queda señal por fila').toMatch(/border-left:\s*3px solid var\(--aviso-acento\)/);
    /* Y EN NINGUNA OTRA REGLA DEL PANEL. Mirando solo el cuerpo de ésta, un
       `opacity: .5` puesto en cualquier otro selector `.pp-*` sobrevivía la
       mutación: la prueba habría dado verde con el defecto mudado de sitio.
       Lo cazó una auditoría adversaria. */
    const delPanel = (css.match(/(?:^|[}\n;])\s*[^{}\n]*\.pp-[^{}\n]*\{[^}]*\}/g) ?? []);
    const conOpacidad = delPanel.filter((r) => /opacity/.test(r));
    expect(conOpacidad, 'hay opacidad en la familia .pp-*').toEqual([]);
  });

  it('[11] y los interruptores siguen pulsables: encender antes del base es legítimo', () => {
    /* Bloquearlos habría hecho que la excepción de WCAG aplicara sola, y era
       una de las tres salidas que ofrecían. No se toma: le quitaría a quien
       reparte el orden en que quiere trabajar. */
    const { container } = render(<Panel />);
    expect(container.querySelector('.pp-sin-base')).not.toBeNull();
    /* Se excluye el bloqueado por `depende`: ése SÍ va `aria-disabled`, y por
       razón propia —la regla 14—. Lo que esta prueba sostiene es que no haber
       concedido el base no apaga nada por sí solo. */
    const sw = [...container.querySelectorAll(
      '.pp-priv:not(.pp-priv-base):not(.pp-no-depende) [role="switch"]')];
    expect(sw.length).toBeGreaterThan(0);
    for (const s of sw) expect(s.getAttribute('aria-disabled')).toBeNull();
  });

  it('[12] el aviso va justo DEBAJO del base, no al final del módulo', () => {
    /* Estaba después de las seis filas que describe: se leían seis permisos
       antes de enterarse de que ninguno se aplica. */
    const { container } = render(<Panel />);
    const cuerpo = container.querySelector('.pp-mod-cuerpo')!;
    const hijos = [...cuerpo.children];
    const iBase = hijos.findIndex((h) => h.classList.contains('pp-priv-base'));
    const iAviso = hijos.findIndex((h) => h.classList.contains('pp-aviso'));
    expect(iBase, 'no hay fila base').toBeGreaterThanOrEqual(0);
    expect(iAviso, 'el aviso no se pinta').toBe(iBase + 1);
  });

  it('[12] y el orden de la lista no se reordena para colocarlo', () => {
    const { container } = render(<Panel />);
    /* Se recorta el aviso del arrastre del base (R149), que forma parte de la
       etiqueta desde la v1.126.0: lo que esta prueba sostiene es el ORDEN. */
    const nombres = [...container.querySelectorAll('.pp-mod-cuerpo .sw-et, .pp-mod-cuerpo .pp-cerrado-nom')]
      .map((e) => (e.textContent ?? '').split(' · ')[0]);
    expect(nombres).toEqual(['Ver trabajadores', 'Editar', 'Crear trabajador', 'Descargar', 'Carga masiva']);
  });

  it('[12] y si el módulo NO declara el base, el aviso sale igual', () => {
    /* REGRESIÓN CAZADA POR UNA AUDITORÍA. Al subir el aviso bajo la fila del
       base se colgó de que esa fila exista, y un módulo que no declara el
       privilegio base —«lo que no aplica no se pasa», dice el propio
       componente— se quedaba ENTERO acarrilado en naranja SIN UNA LÍNEA que
       dijera por qué. Antes del R144 el aviso colgaba solo de `sinBase`. */
    const sinVer: ModuloPrivilegios[] = [
      { id: 'x', nombre: 'X', privilegios: [{ id: 'editar', nombre: 'Editar' }] },
    ];
    const { container } = render(
      <PanelPrivilegios modulos={sinVer} valor={{}} onCambio={() => {}} abiertos={['x']} />
    );
    expect(container.querySelector('.pp-sin-base'), 'ni siquiera se marca').not.toBeNull();
    expect(container.querySelectorAll('.pp-aviso'), 'carril sin leyenda').toHaveLength(1);
  });

  it('[12] y si el base vive en un GRUPO, no se acarrila a sí mismo', () => {
    /* `fila(m, p, false)` iba con el tercer argumento fijo dentro de los
       grupos, así que la propia fila del base recibía el carril de «esto no se
       aplica». */
    const enGrupo: ModuloPrivilegios[] = [
      { id: 'y', nombre: 'Y', privilegios: [{ id: 'editar', nombre: 'Editar' }],
        grupos: [{ titulo: 'Dentro', privilegios: [{ id: 'ver', nombre: 'Ver' }] }] },
    ];
    const { container } = render(
      <PanelPrivilegios modulos={enGrupo} valor={{}} onCambio={() => {}} abiertos={['y']} />
    );
    const filaVer = [...container.querySelectorAll('.pp-priv')]
      .find((f) => (f.textContent ?? '').startsWith('Ver'))!;
    expect(filaVer.classList.contains('pp-priv-base'), 'el base no se reconoce en un grupo').toBe(true);
    expect(container.querySelectorAll('.pp-aviso'), 'o falta el aviso o sale dos veces').toHaveLength(1);
  });

  it('[11] con el base concedido no hay ni carril ni aviso', () => {
    const { container } = render(<Panel inicial={{ personal: { ver: true } }} />);
    expect(container.querySelector('.pp-sin-base')).toBeNull();
    expect(container.querySelector('.pp-aviso')).toBeNull();
  });
});

describe('[13] R145 · en el teléfono la cabecera conserva QUÉ, no solo CUÁNTOS', () => {
  it('[13] el componente emite el resumen «+N» en cuanto pasan de dos', () => {
    const { container } = render(
      <Panel inicial={{ personal: { ver: true, editar: true, crear: true, descargar: true } }} />
    );
    const mas = container.querySelector('.pp-tags-mas')!;
    expect(mas, 'sin resumen, el móvil se queda con dos chips y nada más').not.toBeNull();
    expect(mas.textContent).toBe('+2');
  });

  it('[13] con dos o menos no hay resumen: no hay nada que resumir', () => {
    const { container } = render(<Panel inicial={{ personal: { ver: true, editar: true } }} />);
    expect(container.querySelector('.pp-tags-mas')).toBeNull();
  });

  it('[13] la hoja lo esconde en escritorio y lo enseña bajo 900 px — RESOLVIENDO la cascada', () => {
    /* ESTA PRUEBA COMPROBABA QUE EL TEXTO EXISTIERA EN EL ARCHIVO, no que
       ganara, y era verde con el defecto delante: `:nth-child(n+3)` cuenta como
       clase, así que la regla que OCULTA (0,3,0) le ganaba a la que ENSEÑA
       (0,2,0) y el «+N» —que siempre cae en posición tercera o más— no se veía
       EN NINGÚN ANCHO. Lo cazó una auditoría midiendo en un navegador.
       Ahora se resuelve la cascada con el motor del repositorio, que es la
       pregunta que había que hacer. */
    const fuera = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
    expect(fuera).toMatch(/\.pp-tags \.pp-tags-mas\s*\{[^}]*display:\s*none/);
    const reglas = parsear(css);
    const cadena = (clases: string[]) => [elem('span', ['pp-tags']), elem('span', clases)];
    const gana = (clases: string[], ancho: number) =>
      resolver(reglas, cadena(clases), 'display', ancho)?.valor?.trim() ?? null;
    // El «+N» se ve en móvil y NO en escritorio.
    expect(gana(['chip', 'pp-tags-mas'], 390), 'el «+N» no se ve en el teléfono').toBe('inline-block');
    expect(gana(['chip', 'pp-tags-mas'], 1280), 'el «+N» se cuela en escritorio').toBe('none');
  });

  it('[13] y el tercer chip se oculta en móvil sin llevarse el «+N» por delante', () => {
    /* La regla que oculta y la que enseña conviven sobre elementos distintos:
       `:not(.pp-tags-mas)` es lo que impide que la primera se coma a la
       segunda. Sin ese `:not` el entregable entero está muerto. */
    expect(css).toMatch(/\.pp-tags \.chip:nth-child\(n\+3\):not\(\.pp-tags-mas\)\s*\{[^}]*display:\s*none/);
  });

  it('[13] y los chips bajan a una segunda línea en vez de desaparecer', () => {
    const movil = css.match(/@media \(max-width: 900px\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(movil, 'seguían ocultándose').not.toMatch(/\.pp-tags\s*\{[^}]*display:\s*none/);
    expect(movil).toMatch(/grid-template-areas/);
    expect(movil).toMatch(/\.pp-tags\s*\{[^}]*grid-area:\s*tags/);
    // Y solo los dos primeros, o seis chips vuelven a partir el título en tres.
    expect(movil).toMatch(/\.pp-tags \.chip:nth-child\(n\+3\):not\(\.pp-tags-mas\)\s*\{[^}]*display:\s*none/);
  });
});

describe('[14] R146 · el bloqueado por `depende` se alcanza con teclado', () => {
  const conCargaBloqueada = () => render(<Panel inicial={{ personal: { ver: true } }} />);

  it('[14] se anuncia como interruptor deshabilitado y ENTRA en el recorrido', () => {
    /* `aria-disabled` y no `disabled`: apagado de verdad vuelve a salir del
       recorrido, que es el defecto. Misma decisión que el calendario en R139. */
    const { container } = conCargaBloqueada();
    const fila = container.querySelector('.pp-no-depende .pp-cerrado')!;
    expect(fila.getAttribute('role')).toBe('switch');
    expect(fila.getAttribute('aria-checked')).toBe('false');
    expect(fila.getAttribute('aria-disabled')).toBe('true');
    expect(fila.getAttribute('tabindex'), 'sigue fuera del recorrido').toBe('0');
  });

  it('[14] y dice QUÉ le falta, que es lo único que hace falta para desbloquearlo', () => {
    const { container } = conCargaBloqueada();
    const fila = container.querySelector('.pp-no-depende .pp-cerrado')!;
    /* `aria-labelledby` apunta a DOS ids desde la v1.126.0: el nombre y el chip.
       Con él presente, el contenido del control deja de componer el nombre, así
       que «necesita otro permiso» —la etiqueta visible— tenía que entrar o no
       se anunciaba (SC 2.5.3). */
    const refs = fila.getAttribute('aria-labelledby')!.split(/\s+/);
    const nombre = refs.map((r) => container.querySelector(`#${CSS.escape(r)}`)!.textContent).join(' ');
    expect(nombre).toContain('Carga masiva');
    expect(nombre, 'el chip visible no se anuncia').toContain('necesita otro permiso');
    const mot = container.querySelector(`#${CSS.escape(fila.getAttribute('aria-describedby')!)}`);
    expect(mot!.textContent).toContain('Crear trabajador');
  });

  it('[14] los otros tres siguen FUERA del recorrido: son estables y son texto', () => {
    const cerrados: ModuloPrivilegios[] = [
      { id: 'm', nombre: 'M', privilegios: [
        { id: 'ver', nombre: 'Ver' },
        { id: 'a', nombre: 'Alta', cerrado: { tipo: 'cerrado', motivo: 'Es del Jefe.' } },
        { id: 'b', nombre: 'Baja', cerrado: { tipo: 'ajeno', motivo: 'No lo tiene usted.' } },
        { id: 'c', nombre: 'Cese', cerrado: { tipo: 'pendiente', motivo: 'Llega con planilla.' } },
      ] },
    ];
    const { container } = render(
      <PanelPrivilegios modulos={cerrados} valor={{ m: { ver: true } }} onCambio={() => {}} abiertos={['m']} />
    );
    for (const t of ['cerrado', 'ajeno', 'pendiente']) {
      const fila = container.querySelector(`.pp-no-${t} .pp-cerrado`)!;
      expect(fila, `falta el estado ${t}`).not.toBeNull();
      expect(fila.getAttribute('tabindex'), `${t} entró en el recorrido`).toBeNull();
      expect(fila.getAttribute('role'), `${t} se anuncia como control`).toBeNull();
    }
  });

  it('[14] y la fila alcanzable tiene anillo de foco', () => {
    /* Llegar con tabulador a una fila que no da señal de tenerlo es peor que
       no alcanzarla. */
    expect(css).toMatch(/\.pp-cerrado:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--foco\)/);
  });
});

describe('[15] R148 · apagado por fila, sin esconder el dato', () => {
  const CON_REPARTIBLES: ModuloPrivilegios[] = [
    { id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'ver', nombre: 'Ver trabajadores' },
      // Concedido, y quien mira NO puede repartirlo.
      { id: 'editar', nombre: 'Editar', deshabilitado: true },
      { id: 'crear', nombre: 'Crear trabajador' },
    ] },
  ];
  const pintar = () => render(
    <PanelPrivilegios modulos={CON_REPARTIBLES} abiertos={['personal']} onCambio={() => {}}
      valor={{ personal: { ver: true, editar: true } }} />
  );

  it('[15] el estado SIGUE VISIBLE: el interruptor está encendido, no desaparecido', () => {
    /* Lo único que había por fila era `cerrado`, y `cerrado` sustituye el
       interruptor por un chip: un cargo con el permiso concedido se veía como
       si no lo tuviera. La pantalla mentía sobre lo único que existe para
       responder. */
    const { container } = pintar();
    const sw = [...container.querySelectorAll('[role="switch"]')]
      .find((s2) => (s2.closest('.pp-priv')?.textContent ?? '').startsWith('Editar'))!;
    expect(sw, 'el interruptor desapareció').not.toBeUndefined();
    expect(sw.getAttribute('aria-checked'), 'el estado concedido no se ve').toBe('true');
  });

  it('[15] y está apagado con `aria-disabled`, no con `disabled`', () => {
    /* Apagado de verdad sale del recorrido del teclado, y entonces el apagado
       además esconde el dato: es el defecto, no el remedio. */
    const { container } = pintar();
    const sw = [...container.querySelectorAll('[role="switch"]')]
      .find((s2) => (s2.closest('.pp-priv')?.textContent ?? '').startsWith('Editar'))!;
    expect(sw.getAttribute('aria-disabled')).toBe('true');
    expect(sw.hasAttribute('disabled'), 'sale del recorrido del teclado').toBe(false);
  });

  it('[15] SIGUE CONTANDO en el «4 de 6» y en los chips de la cabecera', () => {
    /* `cerrado` excluye del recuento, y con razón. Esto no: el permiso está
       concedido; lo que no se puede es cambiarlo. */
    const { container } = pintar();
    expect(container.querySelector('.pp-conteo')!.textContent).toBe('2 de 3');
    const chips = [...container.querySelectorAll('.pp-tags .chip')].map((c) => c.textContent);
    expect(chips).toContain('Editar');
  });

  it('[15] y los demás siguen pulsándose: es por fila, no por panel', () => {
    const { container } = pintar();
    const otro = [...container.querySelectorAll('[role="switch"]')]
      .find((s2) => (s2.closest('.pp-priv')?.textContent ?? '').startsWith('Crear'))!;
    expect(otro.getAttribute('aria-disabled')).toBeNull();
  });
});
