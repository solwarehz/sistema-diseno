/**
 * El teclado del calendario, probado.
 *
 * Cada prueba corresponde a un hallazgo de la auditoría de patrones accesibles.
 * Los cuatro críticos que traía el del catálogo están cubiertos aquí.
 */

import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { RangoFecha, ATAJOS_POR_OMISION, atajosDeDias } from '../src/RangoFecha';

// Fecha fija: un calendario que dependa del reloj da pruebas que fallan solas
// un martes cualquiera.
const HOY = new Date(2026, 2, 15); // 15 de marzo de 2026, domingo

const pintar = (props = {}) =>
  render(<RangoFecha titulo="Periodo" hoy={HOY} {...props} />);

const abrirDesde = async (u: ReturnType<typeof userEvent.setup>) => {
  await u.click(screen.getByRole('button', { name: /Desde/ }));
  return screen.getByRole('dialog');
};

const diaConNombre = (re: RegExp) => screen.getByRole('button', { name: re });

describe('Rango de fechas · el teclado, que antes no existía', () => {
  it('[9] las flechas mueven el foco por día y por semana', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);

    // Arranca sobre hoy.
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowRight}');
    expect(diaConNombre(/lunes 16 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowDown}');
    expect(diaConNombre(/lunes 23 de marzo/)).toHaveFocus();

    await u.keyboard('{ArrowUp}{ArrowLeft}');
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();
  });

  it('[9] Home y End van al principio y al fin de la SEMANA', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);
    await u.keyboard('{Home}');
    expect(diaConNombre(/lunes 9 de marzo/)).toHaveFocus();
    await u.keyboard('{End}');
    expect(diaConNombre(/domingo 15 de marzo/)).toHaveFocus();
  });

  it('[9] PageUp y PageDown cambian de mes; con Shift, de año', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);

    await u.keyboard('{PageDown}');
    expect(diaConNombre(/15 de abril de 2026/)).toHaveFocus();

    await u.keyboard('{PageUp}');
    expect(diaConNombre(/15 de marzo de 2026/)).toHaveFocus();

    await u.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(diaConNombre(/15 de marzo de 2027/)).toHaveFocus();
  });

  it('[9] roving tabindex: UN solo día alcanzable con Tab, no sesenta', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await abrirDesde(u);
    const alcanzables = container.querySelectorAll('.fc-d[tabindex="0"]');
    expect(alcanzables).toHaveLength(1);
    expect(container.querySelectorAll('.fc-d').length).toBeGreaterThan(30);
  });

  it('[9] Escape cierra Y devuelve el foco al campo, no a <body>', async () => {
    const u = userEvent.setup();
    pintar();
    await abrirDesde(u);
    await u.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desde/ })).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });

  it('[9] Enter y Espacio eligen el día que tiene el foco', async () => {
    const u = userEvent.setup();
    const alCambio = vi.fn();
    pintar({ onCambio: alCambio });
    await abrirDesde(u);
    await u.keyboard('{ArrowRight}{Enter}');
    expect(alCambio).toHaveBeenCalledWith({ desde: '2026-03-16', hasta: null });
  });
});

describe('Rango de fechas · el fallo que borraba la selección', () => {
  it('[8] volver a «Desde» NO borra el rango', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });

    // Abrir «Desde» otra vez —lo que un Shift+Tab provocaba— no destruye nada.
    await abrirDesde(u);
    // En pantalla va en formato peruano, no en ISO (R130.2): el ISO es lo que
    // se guarda, y lo que se guarda no se ensena.
    expect(screen.getByRole('button', { name: /Desde/ })).toHaveTextContent('10/03/2026');
    expect(screen.getByRole('button', { name: /Hasta/ })).toHaveTextContent('20/03/2026');
  });

  it('[11] elegir «hasta» anterior a «desde» reinicia el rango en vez de invertirlo', async () => {
    const u = userEvent.setup();
    const alCambio = vi.fn();
    pintar({ desde: '2026-03-20', onCambio: alCambio });
    await u.click(screen.getByRole('button', { name: /Hasta/ }));
    await u.click(diaConNombre(/10 de marzo de 2026/));
    expect(alCambio).toHaveBeenCalledWith({ desde: '2026-03-10', hasta: null });
  });
});

describe('Rango de fechas · lo que se anuncia', () => {
  it('«hoy» es aria-current="date", y los extremos NO', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });
    await abrirDesde(u);

    expect(diaConNombre(/domingo 15 de marzo/)).toHaveAttribute('aria-current', 'date');
    expect(diaConNombre(/10 de marzo de 2026, extremo/)).not.toHaveAttribute('aria-current');
  });

  it('[11] el interior del rango se dice con texto, no solo con color', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-10', hasta: '2026-03-20' });
    await abrirDesde(u);
    expect(screen.getByRole('button', { name: /12 de marzo de 2026, dentro del rango/ })).toBeInTheDocument();
  });

  it('la rejilla es una rejilla de verdad, con sus filas y celdas', async () => {
    const u = userEvent.setup();
    pintar();
    const dialogo = await abrirDesde(u);
    // Dos meses a la vista, dos rejillas: cada una con su propio nombre, que es
    // lo que el patrón pide cuando se enseña más de un mes.
    const rejillas = within(dialogo).getAllByRole('grid');
    expect(rejillas).toHaveLength(2);
    for (const rejilla of rejillas) {
      expect(within(rejilla).getAllByRole('columnheader')).toHaveLength(7);
      expect(within(rejilla).getAllByRole('row').length).toBeGreaterThanOrEqual(5);
      // Ya no se pintan días del mes vecino: los huecos son huecos, porque con
      // dos meses el mismo día saldría dos veces.
      const celdas = within(rejilla).getAllByRole('gridcell').length;
      expect(celdas % 7).toBe(0);
    }
  });

  it('el mes se anuncia al cambiar', async () => {
    const u = userEvent.setup();
    pintar();
    const dialogo = await abrirDesde(u);
    const titulo = dialogo.querySelector('[aria-live="polite"]')!;
    // Con dos meses, la cabecera los nombra a los dos.
    expect(titulo).toHaveTextContent('marzo – abril de 2026');
    await u.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(titulo).toHaveTextContent('abril – mayo de 2026');
  });
});

/* ── R139 · `RangoFecha` se comporta como un campo ──────────────────────────
   Tres huecos que el equipo consumidor llevaba anotados del mismo componente, y
   los tres son el mismo: era el único campo del sistema que no se comportaba
   como un campo. El que lo trajo a papel fue el del control — `useState(
   desdeProp)` leía la prop UNA VEZ, así que un producto que rechaza una
   selección no tenía forma de devolver el valor anterior. En sus palabras:
   «esto pasa de avisar a impedir y las líneas se borran». */
describe('[17] R139 · el rango MANDA, no siembra', () => {
  const props = { titulo: 'Rango de fechas', hoy: HOY };
  const dia = (c: HTMLElement, n: string) =>
    [...c.querySelectorAll('.fc-d')].find((b) => b.textContent === n) as HTMLElement;
  const disparadores = (c: HTMLElement) => [...c.querySelectorAll('.fc-campo')] as HTMLElement[];

  it('[17] el producto RECHAZA el cambio y el valor no se mueve', () => {
    /* El defecto del R139 en crudo: hoy el componente escribía en su propio
       estado y seguía adelante, así que el rechazo del producto no llegaba a
       ninguna parte. */
    const { container } = render(
      <RangoFecha {...props} desde="2026-03-02" hasta={null} onCambio={() => {}} />
    );
    fireEvent.click(disparadores(container)[0]);
    fireEvent.click(dia(container, '9'));
    expect(disparadores(container)[0], 'el componente se creyó dueño del valor')
      .toHaveTextContent('02/03/2026');
  });

  it('[17] y el producto APLICA el cambio y el valor sí se mueve', () => {
    /* La otra mitad: controlado no puede significar «no se puede cambiar». */
    function Envoltura() {
      const [r, setR] = useState<{ desde: string | null; hasta: string | null }>(
        { desde: '2026-03-02', hasta: null });
      return <RangoFecha {...props} desde={r.desde} hasta={r.hasta} onCambio={setR} />;
    }
    const { container } = render(<Envoltura />);
    fireEvent.click(disparadores(container)[0]);
    fireEvent.click(dia(container, '9'));
    expect(disparadores(container)[0]).toHaveTextContent('09/03/2026');
  });

  it('[18] CONTROLADO Y APLICANDO: dos clics fijan el rango y la capa cierra', () => {
    /* El defecto que casi se publica. `pedirRango` devolvía `!controlado` —«no
       hay props»— en vez de «se aplicó», así que un producto que guarda el
       valor y lo devuelve, que es EL PATRÓN QUE ESTA VERSIÓN ENSEÑA, se
       encontraba con que el calendario no encadenaba y no cerraba: el segundo
       clic reescribía el inicio y **no había forma de fijar un rango**. Las 19
       comprobaciones y las 934 pruebas estaban en verde. Lo cazó una auditoría
       adversaria, y las reglas 5 y 15 del contrato quedaban derogadas para el
       modo correcto sin que nada lo dijera. */
    function Envoltura() {
      const [r, setR] = useState<{ desde: string | null; hasta: string | null }>(
        { desde: null, hasta: null });
      return <RangoFecha titulo="Rango de fechas" hoy={HOY} desde={r.desde} hasta={r.hasta} onCambio={setR} />;
    }
    const { container } = render(<Envoltura />);
    const disp = () => [...container.querySelectorAll('.fc-campo')] as HTMLElement[];
    const dia = (n: string) =>
      [...container.querySelectorAll('.fc-d')].find((b) => b.textContent === n) as HTMLElement;

    fireEvent.click(disp()[0]);
    fireEvent.click(dia('10'));
    expect(disp()[0], 'el inicio no se fijó').toHaveTextContent('10/03/2026');
    // El segundo clic tiene que fijar el FINAL, no reescribir el inicio.
    fireEvent.click(dia('20'));
    expect(disp()[0], 'el segundo clic reescribió el inicio').toHaveTextContent('10/03/2026');
    expect(disp()[1], 'el segundo clic no fijó el final').toHaveTextContent('20/03/2026');
    expect(container.querySelector('[role="dialog"]'),
      'fijado el rango, la capa tenía que cerrarse').toBeNull();
  });

  it('[18] y un ATAJO aplicado mueve la ventana y cierra', () => {
    function Envoltura() {
      const [r, setR] = useState<{ desde: string | null; hasta: string | null }>(
        { desde: null, hasta: null });
      return <RangoFecha titulo="Rango de fechas" hoy={HOY} desde={r.desde} hasta={r.hasta} onCambio={setR} />;
    }
    const { container } = render(<Envoltura />);
    fireEvent.click(container.querySelectorAll('.fc-campo')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Este año' }));
    expect(container.querySelector('[role="dialog"]'), 'el atajo no cerró').toBeNull();
    expect(container.querySelectorAll('.fc-campo')[0]).toHaveTextContent('01/01/2026');
  });

  it('[19] un ATAJO que pasa del tope NO entra, y se dice cuál', () => {
    /* El tope vivía solo en `elegir()`, así que el camino más rápido de la
       interfaz —pulsar «Este año» con un tope de siete días— lo saltaba entero
       y metía un rango que el calendario no habría dejado construir a mano.
       Desde el añadido al R139 los que no caben no se pintan, así que por la
       interfaz esto ya no se alcanza: la guarda defiende del `rango` AJENO que
       no devuelve siempre lo mismo. Se prueba con uno así —el primer cálculo
       cabe, el del clic no— porque una guarda que ninguna prueba puede alcanzar
       es una guarda que nadie sabe si sigue ahí. */
    const alCambiar = vi.fn();
    const estado = { crecido: false };
    const tramposo = {
      texto: 'Este año',
      rango: () => (estado.crecido
        ? { desde: new Date(2026, 0, 1), hasta: new Date(2026, 11, 31) }
        : { desde: new Date(2026, 2, 10), hasta: new Date(2026, 2, 15) }),
    };
    const { container } = render(
      <RangoFecha titulo="Rango de fechas" hoy={HOY} maxDias={7} desde={null} hasta={null}
        atajos={[tramposo]} onCambio={alCambiar} />
    );
    fireEvent.click(container.querySelectorAll('.fc-campo')[0]);
    // Seis días: el filtro lo deja pasar y el botón está ahí.
    expect(screen.getByRole('button', { name: 'Este año' })).toBeTruthy();
    // Y ahora crece SIN que nada vuelva a pintarse. Es el único hueco que queda.
    estado.crecido = true;
    fireEvent.click(screen.getByRole('button', { name: 'Este año' }));
    expect(alCambiar, 'el atajo saltó el tope').not.toHaveBeenCalled();
    expect(container.querySelector('.cg-error')!.textContent, 'no dice qué periodo ni por qué')
      .toContain('«Este año»');
  });

  it('[19] la previsualización se RECORTA al techo', () => {
    /* El contrato dice que el tramo que se ve es el que se elegiría. Con el
       tope puesto dejaba de serlo, y quitar el recorte dejaba las 31 en verde:
       era la mutación superviviente que encontró la auditoría. */
    const { container } = render(
      <RangoFecha titulo="Rango de fechas" hoy={HOY} maxDias={7} desde="2026-03-01" hasta={null}
        onCambio={() => {}} />
    );
    fireEvent.click(container.querySelectorAll('.fc-campo')[1]);
    const d20 = [...container.querySelectorAll('.fc-d')].find((b) => b.textContent === '20')!;
    fireEvent.mouseEnter(d20);
    const previo = container.querySelector('.fc-previo')!;
    expect(previo.textContent, 'pinta un tramo que no se puede elegir').toBe('7');
  });

  it('[21] apagar con la capa ABIERTA la cierra', () => {
    /* `deshabilitado` solo se miraba al abrir: un calendario ya abierto se
       quedaba abierto y seguía emitiendo cambios. Un control apagado que cambia
       valores es peor que el rodeo con CSS que el R140 vino a corregir. */
    const alCambiar = vi.fn();
    function Envoltura({ off }: { off: boolean }) {
      return <RangoFecha titulo="Rango de fechas" hoy={HOY} deshabilitado={off} onCambio={alCambiar} />;
    }
    const { container, rerender } = render(<Envoltura off={false} />);
    fireEvent.click(container.querySelectorAll('.fc-campo')[0]);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    rerender(<Envoltura off />);
    expect(container.querySelector('[role="dialog"]'), 'apagado y la capa seguía abierta').toBeNull();
  });

  it('[19] `maxDias` que no es un tope se IGNORA, no apaga medio calendario', () => {
    /* `maxDias={0}` es falsy y desactivaba el tope en silencio; un negativo
       apagaba 55 de 61 días —el propio inicio incluido— con un nombre accesible
       que decía «fuera del máximo de -3 días». */
    for (const malo of [0, -3, 2.5 as number]) {
      const { container, unmount } = render(
        <RangoFecha titulo="Rango de fechas" hoy={HOY} maxDias={malo} desde="2026-03-01"
          hasta={null} onCambio={() => {}} />
      );
      fireEvent.click(container.querySelectorAll('.fc-campo')[1]);
      const apagados = container.querySelectorAll('.fc-d[aria-disabled]').length;
      if (malo === 2.5) {
        expect(apagados, 'un tope fraccionario debería truncarse, no ignorarse').toBeGreaterThan(0);
      } else {
        expect(apagados, `maxDias=${malo} apagó días`).toBe(0);
      }
      unmount();
    }
  });

  it('[17] `desde={null}` MANDA: el control no se pierde al vaciar', () => {
    /* Con `desdeProp ?? desdeDentro` el `null` del producto caería al estado
       interno y el control se perdería justo al vaciar, que es cuando más se
       nota. Es la familia del R103 del selector. */
    const { container, rerender } = render(
      <RangoFecha {...props} desde="2026-03-02" hasta={null} onCambio={() => {}} />
    );
    expect(disparadores(container)[0]).toHaveTextContent('02/03/2026');
    rerender(<RangoFecha {...props} desde={null} hasta={null} onCambio={() => {}} />);
    expect(disparadores(container)[0], 'vaciar desde fuera no llegó')
      .toHaveTextContent('Elegir fecha');
  });

  it('[17] SIN props se sigue gobernando solo: no se parte a quien no las pasa', () => {
    const { container } = render(<RangoFecha {...props} />);
    fireEvent.click(disparadores(container)[0]);
    fireEvent.click(dia(container, '9'));
    expect(disparadores(container)[0]).toHaveTextContent('09/03/2026');
  });

  it('[18] rechazado el final, el calendario NO se cierra', () => {
    /* Lo peor que podía pasar: cerrar y revertir. La pantalla no hace nada y
       nadie sabe por qué. Es la regla 7 del marco —pedir no es aplicar— con
       otro valor. */
    const { container } = render(
      <RangoFecha {...props} desde="2026-03-02" hasta={null} onCambio={() => {}} />
    );
    fireEvent.click(disparadores(container)[1]);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    fireEvent.click(dia(container, '9'));
    expect(container.querySelector('[role="dialog"]'), 'se cerró tras un cambio que no se aplicó')
      .not.toBeNull();
  });

  it('[18] rechazado un periodo, la ventana NO salta ni se cierra', () => {
    const { container } = render(
      <RangoFecha {...props} desde={null} hasta={null} onCambio={() => {}} />
    );
    fireEvent.click(disparadores(container)[0]);
    const antes = container.querySelector('.fc-meses')!.textContent;
    fireEvent.click(screen.getByRole('button', { name: 'Este año' }));
    expect(container.querySelector('.fc-meses')!.textContent,
      'movió la ventana por un cambio que no se aplicó').toBe(antes);
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe('[19] R139 · `maxDias`, que impide en vez de avisar', () => {
  const props = { titulo: 'Rango de fechas', hoy: HOY };
  const dia = (c: HTMLElement, n: string) =>
    [...c.querySelectorAll('.fc-d')].find((b) => b.textContent === n) as HTMLElement;
  const disparadores = (c: HTMLElement) => [...c.querySelectorAll('.fc-campo')] as HTMLElement[];

  it('[19] SIN `maxDias` no hay tope ninguno', () => {
    /* «Si es libre sin límite de días debe funcionar igual», dicho por el
       responsable. El tope es opcional y su ausencia no cambia nada. */
    const { container } = render(<RangoFecha {...props} desde="2026-03-01" hasta={null} onCambio={() => {}} />);
    fireEvent.click(disparadores(container)[1]);
    expect(container.querySelectorAll('.fc-d[aria-disabled]')).toHaveLength(0);
    expect(container.querySelector('.cg-error')).toBeNull();
  });

  it.each([7, 30])('[19] con `maxDias={%i}` el día de más no se elige', (tope) => {
    /* Un número cualquiera: 7 en un sitio, 30 en otro, y el componente se
       comporta igual. */
    const { container } = render(
      <RangoFecha {...props} maxDias={tope} desde="2026-03-01" hasta={null} onCambio={() => {}} />
    );
    fireEvent.click(disparadores(container)[1]);
    const ultimo = dia(container, String(tope));
    expect(ultimo.getAttribute('aria-disabled'), `el día ${tope} debería poder elegirse`).toBeNull();
    const pasado = dia(container, String(tope + 1));
    if (pasado) {
      expect(pasado.getAttribute('aria-disabled'), `el día ${tope + 1} pasa del tope`).toBe('true');
    }
  });

  it('[19] el día fuera de alcance CONSERVA el foco y dice por qué', () => {
    /* `aria-disabled` y no `disabled`: apagado de verdad sale del roving
       tabindex y las flechas dejan de recorrer la rejilla — quien navega con
       teclado se queda sin saber por qué un día no responde. */
    const { container } = render(
      <RangoFecha {...props} maxDias={7} desde="2026-03-01" hasta={null} onCambio={() => {}} />
    );
    fireEvent.click(disparadores(container)[1]);
    const d9 = dia(container, '9');
    expect(d9.hasAttribute('disabled'), 'lo apagó de verdad y rompió el recorrido').toBe(false);
    expect(d9.getAttribute('aria-disabled')).toBe('true');
    expect(d9.getAttribute('aria-label')).toContain('fuera del máximo de 7 días');
  });

  it('[19] y pulsarlo no hace nada', () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <RangoFecha {...props} maxDias={7} desde="2026-03-01" hasta={null} onCambio={alCambiar} />
    );
    fireEvent.click(disparadores(container)[1]);
    fireEvent.click(dia(container, '9'));
    expect(alCambiar, 'eligió un día que el tope prohíbe').not.toHaveBeenCalled();
  });

  it('[19] un rango que LLEGA ya pasado se pinta y se dice, no se recorta', () => {
    /* El componente no reescribe un valor que le dieron: recortarlo sería
       cambiar el dato de alguien en silencio, y rechazarlo, negarse a pintar un
       rango que ya está guardado en su base de datos. */
    const { container } = render(
      <RangoFecha {...props} maxDias={7} desde="2026-03-01" hasta="2026-03-14" onCambio={() => {}} />
    );
    expect(disparadores(container)[1], 'recortó el dato').toHaveTextContent('14/03/2026');
    expect(container.querySelector('.cg-error')!.textContent, 'no dice cuántos días son')
      .toContain('Has elegido 14');
  });

  it('[19] el tope NO bloquea el gesto que lo arregla', () => {
    /* Un tope que se hace cumplir sobre los dos extremos deja el rango largo
       inarreglable: la persona queda encerrada. Elegir un inicio nuevo no tiene
       techo, y «Limpiar» sigue vivo. */
    const alCambiar = vi.fn();
    const { container } = render(
      <RangoFecha {...props} maxDias={7} desde="2026-03-01" hasta="2026-03-14" onCambio={alCambiar} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(container.querySelectorAll('.fc-d[aria-disabled]'),
      'eligiendo el INICIO no puede haber techo').toHaveLength(0);
    fireEvent.click(dia(container, '20'));
    expect(alCambiar).toHaveBeenCalled();
  });

  it('[19] el error del PRODUCTO manda sobre el del tope', () => {
    const { container } = render(
      <RangoFecha {...props} maxDias={7} desde="2026-03-01" hasta="2026-03-14"
        error="La sede no tiene marcaciones en ese periodo." onCambio={() => {}} />
    );
    expect(container.querySelector('.cg-error')!.textContent).toContain('La sede no tiene');
    expect(container.querySelector('.cg-error')!.textContent).not.toContain('Has elegido');
  });
});

describe('[20] y [21] R139 · el error y el apagado, como en cualquier campo', () => {
  const props = { titulo: 'Rango de fechas', hoy: HOY };
  const disparadores = (c: HTMLElement) => [...c.querySelectorAll('.fc-campo')] as HTMLElement[];

  it('[20] el error marca los DOS disparadores y sale UNA vez', () => {
    /* Lo que está mal no es un extremo: es el rango. Dentro de cada `.cg`
       saldría dos veces diciendo lo mismo. */
    const { container } = render(<RangoFecha {...props} error="Revisa el periodo." />);
    expect(container.querySelectorAll('.fc-campo.cg-mal')).toHaveLength(2);
    expect(container.querySelectorAll('.cg-error')).toHaveLength(1);
    for (const d of disparadores(container)) {
      expect(d.getAttribute('aria-invalid')).toBe('true');
      expect(d.getAttribute('aria-describedby')).toBe(container.querySelector('.cg-error')!.id);
    }
  });

  it('[20] el error lleva ICONO: un renglón rojo suelto se confunde con una ayuda', () => {
    const { container } = render(<RangoFecha {...props} error="Revisa el periodo." />);
    expect(container.querySelector('.cg-error .ic'), 'el color solo no dice que algo falla').not.toBeNull();
  });

  it('[20] el `.fc-resumen` NO entra en `aria-describedby`', () => {
    /* Es `role="status"`, una región viva: metido ahí se lee dos veces. */
    const { container } = render(<RangoFecha {...props} error="Revisa el periodo." />);
    const descrito = disparadores(container)[0].getAttribute('aria-describedby')!;
    expect(descrito.split(' ')).not.toContain(container.querySelector('.fc-resumen')!.id);
  });

  it('[21] `deshabilitado` apaga los dos disparadores, y la capa no se abre', () => {
    /* Lo que de verdad lo impide es el `disabled` del marcado: un botón apagado
       no dispara `onClick`. La guarda de `abrir()` es defensa y está declarada
       como tal en el componente — quitarla deja estas 31 en verde, y no se
       escribe una prueba que finja sujetarla. */
    const { container } = render(<RangoFecha {...props} deshabilitado />);
    for (const d of disparadores(container)) {
      expect((d as HTMLButtonElement).disabled).toBe(true);
    }
    fireEvent.click(disparadores(container)[0]);
    expect(container.querySelector('[role="dialog"]'), 'apagado y aun así abrió').toBeNull();
  });

  it('[21] y sale del tabulador: NO es solo lectura, y se declara', () => {
    /* La transversal 0c distingue las dos cosas. Esta prueba fija la decisión
       para que nadie la «arregle» a `aria-disabled` sin cambiar el contrato:
       este control NO tiene variante de solo lectura. */
    const { container } = render(<RangoFecha {...props} deshabilitado />);
    for (const d of disparadores(container)) {
      expect(d.hasAttribute('disabled'), 'con aria-disabled seguiría enviándose').toBe(true);
    }
  });
});

/**
 * AÑADIDO AL R139 · los periodos que no caben en el tope.
 *
 * Lo reportó el responsable después de quitarlos a mano en su producto: con
 * `maxDias={7}`, los cuatro periodos por omisión —de un mes a un año— eran
 * cuatro botones que solo sabían dar un aviso. «Cualquiera que use maxDias se
 * va a encontrar con lo mismo.»
 */
describe('[22] añadido al R139 · un periodo que no cabe en el tope no se pinta', () => {
  const props = { titulo: 'Rango de fechas', hoy: HOY };
  const disparadores = (c: HTMLElement) => [...c.querySelectorAll('.fc-campo')] as HTMLElement[];
  const periodos = (c: HTMLElement) => [...c.querySelectorAll('.fc-atajo')].map((b) => b.textContent);

  it('[22] SIN tope siguen estando los cuatro, intactos', () => {
    const { container } = render(<RangoFecha {...props} />);
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(ATAJOS_POR_OMISION.map((a) => a.texto));
  });

  it('[22] con `maxDias={7}` no queda ninguno de los cuatro, y el panel desaparece', () => {
    /* Los cuatro van de un mes a un año: ninguno cabe en siete días. Y si no
       queda ninguno, lo que se va es el rótulo «Periodos» también — una sección
       con título y sin contenido es peor que no tenerla. */
    const { container } = render(<RangoFecha {...props} maxDias={7} />);
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual([]);
    expect(container.querySelector('.fc-atajos')).toBeNull();
  });

  it('[22] con un tope holgado se pintan los que caben y solo esos', () => {
    /* 31 días deja pasar «Este mes» —marzo tiene 31— y «Mes pasado» —febrero,
       28—, y deja fuera los dos meses y el año. El tope no es todo o nada. */
    const { container } = render(<RangoFecha {...props} maxDias={31} />);
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Este mes', 'Mes pasado']);
  });

  it('[22] `atajosDeDias` construye los que sí caben, y cuenta inclusive', () => {
    const { container } = render(
      <RangoFecha {...props} maxDias={7} atajos={atajosDeDias(1, 3, 7)} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Hoy', 'Últimos 3 días', 'Últimos 7 días']);
  });

  it('[22] y uno de ocho días NO se pinta con tope de siete: el límite es el límite', () => {
    /* La frontera es donde se cuelan los errores de uno. `atajosDeDias(8)` son
       ocho días contados inclusive y el tope son siete: fuera. */
    const { container } = render(
      <RangoFecha {...props} maxDias={7} atajos={atajosDeDias(7, 8)} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Últimos 7 días']);
  });

  /* EL FIXTURE A MEDIANOCHE ESCONDÍA UNA FAMILIA ENTERA DE DEFECTOS.
     `HOY = new Date(2026, 2, 15)` es medianoche exacta, así que las cinco
     pruebas de arriba no podían ver que `atajosDeDias` devolvía el `hoy`
     recibido CON SU HORA: la fracción de día subía el redondeo a partir de las
     12:00 y el periodo medía n+1. Medido por una auditoría: con `maxDias={7}`
     y `atajosDeDias(1, 3, 7)`, «Últimos 7 días» DESAPARECÍA a mediodía. */
  it.each([0, 9, 11, 12, 13, 18, 23])(
    '[22] a las %i:00 se pintan los mismos tres periodos: se cuentan DÍAS, no horas',
    (hora) => {
      const conHora = new Date(2026, 2, 15, hora, 30);
      const { container } = render(
        <RangoFecha titulo="Rango de fechas" hoy={conHora} maxDias={7}
          atajos={atajosDeDias(1, 3, 7)} />
      );
      fireEvent.click(disparadores(container)[0]);
      expect(periodos(container)).toEqual(['Hoy', 'Últimos 3 días', 'Últimos 7 días']);
    }
  );

  /* El arreglo está en DOS sitios a propósito —la medición y el origen— y por
     eso la prueba de arriba sobrevive si se revierte uno solo. Estas dos fijan
     cada mitad por separado, que es lo único que las hace protegerlas. */
  it('[22] la MEDICIÓN cuenta días: un `rango` del producto que devuelva `hoy` con su hora cabe igual', () => {
    const conHora = new Date(2026, 2, 15, 13, 30);
    const suyo = {
      texto: 'Su semana',
      rango: (h: Date) => ({ desde: new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6), hasta: h }),
    };
    const { container } = render(
      <RangoFecha titulo="Rango de fechas" hoy={conHora} maxDias={7} atajos={[suyo]} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Su semana']);
  });

  it('[22] y el ORIGEN sale a medianoche: `atajosDeDias` no arrastra la hora de `hoy`', () => {
    const conHora = new Date(2026, 2, 15, 13, 30);
    const r = atajosDeDias(7)[0].rango(conHora);
    expect([r.hasta.getHours(), r.hasta.getMinutes(), r.hasta.getSeconds()]).toEqual([0, 0, 0]);
    expect([r.desde.getHours(), r.desde.getMinutes()]).toEqual([0, 0]);
    expect(r.hasta.getDate()).toBe(15);
    expect(r.desde.getDate()).toBe(9);
  });

  it('[22] y el ejemplo de la documentación aguanta la tarde: maxDias={1} con «Hoy»', () => {
    const { container } = render(
      <RangoFecha titulo="Rango de fechas" hoy={new Date(2026, 2, 15, 13, 0)} maxDias={1}
        atajos={atajosDeDias(1)} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Hoy']);
  });

  it('[22] `atajosDeDias` sanea lo que recibe: 0, negativos y rotos no crean periodo', () => {
    /* Un rango invertido mide cero o menos, así que cabía en CUALQUIER tope:
       se pintaba y se aplicaba. `maxDias` ya tenía esta guarda; la función
       hermana no. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(atajosDeDias(0, -2, NaN, Infinity, 3)).toHaveLength(1);
    expect(atajosDeDias(3)[0].texto).toBe('Últimos 3 días');
    expect(gritar).toHaveBeenCalledTimes(4);
    gritar.mockRestore();
  });

  it('[22] un periodo cuyo `rango` LANZA se oculta, y no tumba el campo', () => {
    /* El filtro ejecuta código del producto DENTRO del render. Sin red, uno
       que lance reventaba el campo entero al montar —con el calendario cerrado
       y sin que nadie hubiera pulsado nada—, cuando antes solo fallaba al
       pulsarlo. */
    const gritar = vi.spyOn(console, 'error').mockImplementation(() => {});
    const bomba = { texto: 'Bomba', rango: () => { throw new Error('boom'); } };
    const { container } = render(
      <RangoFecha titulo="Rango de fechas" hoy={HOY} maxDias={7}
        atajos={[bomba, ...atajosDeDias(3)]} />
    );
    fireEvent.click(disparadores(container)[0]);
    expect(periodos(container)).toEqual(['Últimos 3 días']);
    expect(container.querySelector('[role="dialog"]'), 'el campo se cayó').not.toBeNull();
    gritar.mockRestore();
  });

  it('[22] el panel de periodos tiene nombre accesible, y su rótulo deja de ser un id muerto', () => {
    /* `${id}-per` llevaba desde que nació sin que nadie lo referenciara.
       «Periodos» era texto huérfano para quien usa lector de pantalla. */
    const { container } = render(<RangoFecha titulo="Rango de fechas" hoy={HOY} />);
    fireEvent.click(disparadores(container)[0]);
    const panel = container.querySelector('.fc-atajos') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('group');
    const ref = panel.getAttribute('aria-labelledby')!;
    expect(ref, 'sin aria-labelledby el rótulo no nombra nada').toBeTruthy();
    const rotulo = container.querySelector(`#${CSS.escape(ref)}`);
    expect(rotulo, 'apunta a un id que no existe').not.toBeNull();
    expect(rotulo!.textContent).toBe('Periodos');
  });

  it('[22] el que se pinta se aplica de verdad, y deja el rango dentro del tope', () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <RangoFecha {...props} maxDias={7} atajos={atajosDeDias(7)} onCambio={alCambiar} />
    );
    fireEvent.click(disparadores(container)[0]);
    fireEvent.click(container.querySelector('.fc-atajo') as HTMLElement);
    expect(alCambiar).toHaveBeenCalledWith({ desde: '2026-03-09', hasta: '2026-03-15' });
  });
});
