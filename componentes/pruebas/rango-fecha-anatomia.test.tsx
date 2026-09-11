/**
 * RANGO DE FECHAS · LA ANATOMÍA QUE FALTABA.
 *
 * Lo reportó el equipo como «hay un error» y no era un error suelto: el
 * componente entregaba **la mitad del calendario que el catálogo enseña**. La
 * hoja estilizaba 24 clases `fc-*` y el componente emitía 14. Once viajaban en
 * el paquete sin que ningún producto pudiera activarlas:
 *
 *   · `.fc-cal-marco` y `.fc-cal-cuerpo` — el marco y la rejilla de DOS meses
 *   · `.fc-atajos`, `.fc-atajo`, `.fc-atajos-tit` — el panel de periodos
 *   · `.fc-resumen` — lo elegido en palabras
 *   · `.fc-guion` — el separador entre los dos campos
 *   · `.fc-meses`, `.fc-previo`, `.fc-vacio`, `.fc-activo`
 *
 * Y la regla de `≤620px` que colapsa el calendario a una columna cuelga de
 * `.fc-cal-cuerpo`: sin esa clase **no podía dispararse nunca**.
 *
 * NINGÚN CANDADO LO VEÍA, y es la misma familia que R116: el cuerpo del
 * calendario del catálogo es un `<div id="fc-cuerpo">` VACÍO que rellena su
 * guion, así que los candados que leen marcado estático no tenían con qué
 * comparar. Igual que la lista del selector antes de que R116 la ejecutara.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RangoFecha, ATAJOS_POR_OMISION } from '../src/RangoFecha';

const HOY = new Date(2026, 2, 15); // 15 de marzo de 2026

const pintar = (props: Partial<React.ComponentProps<typeof RangoFecha>> = {}) =>
  render(<RangoFecha titulo="Periodo" hoy={HOY} {...props} />);

/** Pinta y abre por «Desde». Los que necesitan props propias llaman a `pintar`
 *  antes y pasan `yaPintado`. */
const abrir = async (
  u: ReturnType<typeof userEvent.setup>,
  yaPintado = false,
) => {
  if (!yaPintado) pintar();
  await u.click(screen.getByRole('button', { name: /Desde/ }));
  return screen.getByRole('dialog');
};

describe('los dos meses', () => {
  it('[3] se ven dos meses, y la cabecera los nombra a los dos', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    expect(within(dialogo).getAllByRole('grid')).toHaveLength(2);
    expect(within(dialogo).getByRole('grid', { name: 'marzo de 2026' })).toBeInTheDocument();
    expect(within(dialogo).getByRole('grid', { name: 'abril de 2026' })).toBeInTheDocument();
  });

  it('el cuerpo lleva `.fc-cal-cuerpo`, de la que cuelga el colapso a ≤620px', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    // Sin esta clase la regla responsive de la hoja es inalcanzable.
    expect(dialogo.querySelector('.fc-cal-cuerpo')).not.toBeNull();
    expect(dialogo.querySelector('.fc-cal-marco')).not.toBeNull();
  });

  it('[3] con `meses={1}` se vuelve a un solo mes', async () => {
    const u = userEvent.setup();
    pintar({ meses: 1 });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    expect(within(screen.getByRole('dialog')).getAllByRole('grid')).toHaveLength(1);
  });

  it('[4] no se pintan días del mes vecino: los huecos son huecos', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    const marzo = within(dialogo).getByRole('grid', { name: 'marzo de 2026' });
    // Marzo de 2026 tiene 31 días. Ni uno más con nombre de día.
    expect(within(marzo).getAllByRole('button')).toHaveLength(31);
    expect(marzo.querySelectorAll('.fc-vacio').length).toBeGreaterThan(0);
  });
});

describe('el panel de periodos', () => {
  it('[5] trae los cuatro del catálogo, en su orden', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    const nombres = ATAJOS_POR_OMISION.map((a) => a.texto);
    expect(nombres).toEqual(['Este mes', 'Mes pasado', 'Últimos 2 meses', 'Este año']);
    for (const n of nombres) {
      expect(within(dialogo).getByRole('button', { name: n })).toBeInTheDocument();
    }
  });

  it('[5] «Este mes» fija el rango entero y cierra', async () => {
    const u = userEvent.setup();
    const onCambio = vi.fn();
    pintar({ onCambio });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.click(screen.getByRole('button', { name: 'Este mes' }));

    expect(onCambio).toHaveBeenCalledWith({ desde: '2026-03-01', hasta: '2026-03-31' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('«Mes pasado» respeta el largo del mes anterior', async () => {
    const u = userEvent.setup();
    const onCambio = vi.fn();
    pintar({ onCambio });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.click(screen.getByRole('button', { name: 'Mes pasado' }));
    // Febrero de 2026 tiene 28 días: si el atajo restara 30 días, saldría mal.
    expect(onCambio).toHaveBeenCalledWith({ desde: '2026-02-01', hasta: '2026-02-28' });
  });

  it('[5] se puede sustituir por los periodos del producto', async () => {
    const u = userEvent.setup();
    pintar({
      atajos: [{
        texto: 'I bimestre',
        rango: () => ({ desde: new Date(2026, 2, 1), hasta: new Date(2026, 3, 30) }),
      }],
    });
    const dialogo = await abrir(u, true);
    expect(within(dialogo).getByRole('button', { name: 'I bimestre' })).toBeInTheDocument();
    expect(within(dialogo).queryByRole('button', { name: 'Este mes' })).not.toBeInTheDocument();
  });

  it('[5] con `atajos={[]}` el panel no se pinta', async () => {
    const u = userEvent.setup();
    pintar({ atajos: [] });
    const dialogo = await abrir(u, true);
    expect(dialogo.querySelector('.fc-atajos')).toBeNull();
  });
});

describe('el resumen y el guion', () => {
  it('sin rango, lo dice', () => {
    const { container } = pintar();
    expect(container.querySelector('.fc-resumen')!.textContent).toBe('Sin rango elegido.');
  });

  it('[6] con el rango puesto, lo dice EN PALABRAS y no en ISO', () => {
    const { container } = pintar({ desde: '2026-03-02', hasta: '2026-03-06' });
    const t = container.querySelector('.fc-resumen')!.textContent!;
    expect(t).toContain('lunes 2 de marzo de 2026');
    expect(t).toContain('viernes 6 de marzo de 2026');
  });

  it('a medias, dice qué falta', () => {
    const { container } = pintar({ desde: '2026-03-02' });
    expect(container.querySelector('.fc-resumen')!.textContent).toContain('Falta la fecha final');
  });

  it('el guion separa los dos campos y no lo lee el lector', () => {
    const { container } = pintar();
    const g = container.querySelector('.fc-guion')!;
    expect(g).not.toBeNull();
    expect(g.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('el campo activo y la vista previa', () => {
  it('el campo que está eligiendo lleva `.fc-activo`', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    expect(container.querySelector('.fc-activo')).toBeNull();
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    expect(container.querySelector('.fc-activo')).not.toBeNull();
  });

  it('[7] eligiendo el final, sobrevolar enseña el rango que SALDRÍA', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ desde: '2026-03-02' });
    await u.click(screen.getByRole('button', { name: /Hasta/ }));

    const dia6 = screen.getByRole('button', { name: /viernes 6 de marzo de 2026/ });
    await u.hover(dia6);

    // El día sobrevolado hace de extremo provisional…
    expect(dia6.className).toContain('fc-previo');
    // …y los de en medio se pintan como dentro del rango.
    expect(container.querySelectorAll('.fc-dentro').length).toBeGreaterThan(0);
  });
});

/**
 * R126 · LO QUE REPORTÓ CONTROL ADMINISTRATIVOS, y que la v1.101.0 NO arregló.
 *
 * Rehacer la anatomía no tocó la discordancia que ellos midieron: el catálogo
 * mete las 42 celdas PLANAS en `.fc-dias`, y el componente anida FILAS porque
 * el patrón `grid` de ARIA las exige. Con `grid-template-columns: repeat(7,1fr)`
 * sobre `.fc-dias`, sus siete hijos —las siete semanas— caían en siete columnas
 * de ~33px: cabeceras «LMXJVSD» pegadas y días de dos en dos.
 *
 * Estas pruebas fijan el MARCADO que la hoja necesita para no repetirlo. El
 * aspecto se comprobó en un navegador con la hoja entregada.
 */
describe('R126 · el calendario se pinta como rejilla', () => {
  it('[1] R126 · cada semana es una fila propia, no un hijo suelto de `.fc-dias`', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    const dias = dialogo.querySelector('.fc-dias')!;

    // Todos los hijos directos son filas. Si alguna celda cuelga suelta de
    // `.fc-dias`, la rejilla de siete columnas vuelve a repartir semanas.
    const hijos = [...dias.children];
    expect(hijos.length).toBeGreaterThan(1);
    for (const h of hijos) expect(h.getAttribute('role')).toBe('row');

    // Y cada fila lleva exactamente siete celdas.
    for (const fila of hijos.slice(1)) {
      expect(fila.children.length).toBe(7);
    }
  });

  it('[1] R126 · la cabecera de días es una fila más, con sus siete columnas', async () => {
    const u = userEvent.setup();
    const dialogo = await abrir(u);
    const sem = dialogo.querySelector('.fc-sem')!;
    expect(sem.getAttribute('role')).toBe('row');
    expect(sem.children.length).toBe(7);
  });

  it('[2] R126.2 · el rótulo y el valor son DOS hijos del botón, para poder apilarse', async () => {
    const { container } = pintar({ desde: '2026-03-05' });
    const campo = container.querySelector('button.fc-campo')!;
    expect(campo.querySelector('.cg-et')!.textContent).toBe('Desde');
    expect(campo.querySelector('.cg-in')!.textContent).toBe('2026-03-05');
    // Se leía «DesdeElegir fecha» de corrido porque las reglas que los apilan
    // estaban escritas para `input.fc-campo` y esto es un <button>.
    expect(campo.tagName).toBe('BUTTON');
  });
});

/**
 * R129 · CAMBIAR DE MES NO DESBORDA.
 *
 * `new Date(a, m+n, 31)` con destino en un mes de 30 salta al siguiente. Lo
 * encontró una auditoría adversaria, no una queja: AvPág desde el 31 de enero
 * aterrizaba el **3 de marzo** —febrero entero saltado— y RePág desde el 31 de
 * marzo no se movía. La prueba que cubría el teclado usaba siempre el día 15,
 * que es el único tramo donde el desbordamiento no puede ocurrir.
 */
describe('R129 · los meses límite', () => {
  const enDia = (dia: number, mes: number) => new Date(2026, mes, dia);

  it('[10] AvPág desde un 31 cae en el último día del mes destino, no dos meses después', async () => {
    const u = userEvent.setup();
    // 31 de enero de 2026. Febrero tiene 28.
    pintar({ hoy: enDia(31, 0), atajos: [] });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.keyboard('{PageDown}');

    expect(screen.getByRole('button', { name: /28 de febrero de 2026/ })).toHaveFocus();
    expect(screen.queryByRole('button', { name: /de marzo de 2026/ })).toBeNull();
  });

  it('[10] RePág desde un 31 sí cambia de mes', async () => {
    const u = userEvent.setup();
    // 31 de marzo. Antes se quedaba en marzo, porque 31 de febrero desborda.
    pintar({ hoy: enDia(31, 2), atajos: [] });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.keyboard('{PageUp}');

    expect(screen.getByRole('button', { name: /28 de febrero de 2026/ })).toHaveFocus();
  });

  it('[10] los cuatro atajos siguen cuadrando en meses de distinto largo', async () => {
    const u = userEvent.setup();
    const onCambio = vi.fn();
    // 31 de marzo: «Mes pasado» tiene que dar febrero entero, no 3 de marzo.
    pintar({ hoy: enDia(31, 2), onCambio });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.click(screen.getByRole('button', { name: 'Mes pasado' }));
    expect(onCambio).toHaveBeenCalledWith({ desde: '2026-02-01', hasta: '2026-02-28' });
  });
});

describe('R129 · la vista previa se suelta', () => {
  it('[7] al cerrar no queda medio mes pintado', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ desde: '2026-03-02', atajos: [] });
    await u.click(screen.getByRole('button', { name: /Hasta/ }));
    await u.hover(screen.getByRole('button', { name: /viernes 6 de marzo de 2026/ }));
    expect(container.querySelectorAll('.fc-dentro').length).toBeGreaterThan(0);

    // Escape cierra. Antes `sobre` solo se limpiaba con `mouseleave`, así que
    // al reabrir seguía pintado el tramo de un ratón que ya no está.
    await u.keyboard('{Escape}');
    await u.click(screen.getByRole('button', { name: /Hasta/ }));
    expect(container.querySelectorAll('.fc-previo').length).toBe(0);
  });
});
