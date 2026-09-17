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
    const nombres = [...container.querySelectorAll('.pp-mod-cuerpo .sw-et, .pp-mod-cuerpo .pp-cerrado-nom')]
      .map((e) => e.textContent);
    expect(nombres).toEqual(['Ver trabajadores', 'Editar', 'Crear trabajador', 'Descargar', 'Carga masiva']);
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

  it('[13] la hoja lo esconde en escritorio y lo enseña bajo 900 px', () => {
    /* Decide la HOJA y no el componente: preguntar cuánto mide la pantalla
       obliga a medir, y medir para decidir marcado es lo que hace que el
       servidor y el navegador pinten cosas distintas. */
    const fuera = css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '');
    expect(fuera).toMatch(/\.pp-tags \.pp-tags-mas\s*\{[^}]*display:\s*none/);
    const movil = css.match(/@media \(max-width: 900px\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(movil).toMatch(/\.pp-tags \.pp-tags-mas\s*\{[^}]*display:\s*inline-block/);
  });

  it('[13] y los chips bajan a una segunda línea en vez de desaparecer', () => {
    const movil = css.match(/@media \(max-width: 900px\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(movil, 'seguían ocultándose').not.toMatch(/\.pp-tags\s*\{[^}]*display:\s*none/);
    expect(movil).toMatch(/grid-template-areas/);
    expect(movil).toMatch(/\.pp-tags\s*\{[^}]*grid-area:\s*tags/);
    // Y solo los dos primeros, o seis chips vuelven a partir el título en tres.
    expect(movil).toMatch(/\.pp-tags \.chip:nth-child\(n\+3\)\s*\{[^}]*display:\s*none/);
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
    const nom = container.querySelector(`#${CSS.escape(fila.getAttribute('aria-labelledby')!)}`);
    const mot = container.querySelector(`#${CSS.escape(fila.getAttribute('aria-describedby')!)}`);
    expect(nom!.textContent).toBe('Carga masiva');
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
