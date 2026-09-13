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
 * Y la regla de `≤660px` que colapsa el calendario a una columna cuelga de
 * `.fc-cal-cuerpo`: sin esa clase **no podía dispararse nunca**.
 *
 * NINGÚN CANDADO LO VEÍA, y es la misma familia que R116: el cuerpo del
 * calendario del catálogo es un `<div id="fc-cuerpo">` VACÍO que rellena su
 * guion, así que los candados que leen marcado estático no tenían con qué
 * comparar. Igual que la lista del selector antes de que R116 la ejecutara.
 */
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RangoFecha, ATAJOS_POR_OMISION } from '../src/RangoFecha';
import { MenuUsuario } from '../src/MenuUsuario';

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

  it('el cuerpo lleva `.fc-cal-cuerpo`, de la que cuelga el colapso a ≤660px', async () => {
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
  it('R130.3 · sin rango CALLA, pero la región viva sigue en el árbol', () => {
    // Decía «Sin rango elegido.» y era una tercera frase para lo mismo: los dos
    // disparadores ya dicen «Elegir fecha». Lo reportó el equipo consumidor.
    // Lo que NO se hace es dejar de pintarlo: una región viva creada en el
    // momento no la anuncian la mayoría de lectores, así que la primera
    // elección no se anunciaría. Se queda el elemento y se vacía el texto.
    const { container } = pintar();
    const p = container.querySelector('.fc-resumen');
    expect(p, 'la región viva tiene que existir desde el primer pintado').not.toBeNull();
    expect(p!.getAttribute('role')).toBe('status');
    expect(p!.textContent).toBe('');
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

  it('[2] R130.1 · el rótulo va FUERA del recuadro, en su `.cg`, como en todo campo', () => {
    // Hasta la v1.108.0 el rótulo iba DENTRO del botón y era el único del
    // sistema que lo hacía: `Campo` compone `.campo-grupo` > `.campo-etiqueta`
    // + `.campo`. Puestos en la misma fila, uno arriba y otro dentro, y las
    // cajas ni siquiera medían lo mismo.
    const { container } = pintar({ desde: '2026-03-05' });
    const grupo = container.querySelector('.fc-campos > .cg')!;
    expect(grupo, 'el disparador vive en un .cg, como cualquier campo').not.toBeNull();

    const et = grupo.querySelector('.cg-et')!;
    const campo = grupo.querySelector('button.fc-campo')!;
    expect(et.textContent).toBe('Desde');
    // El rótulo es HERMANO del recuadro, no hijo.
    expect(campo.contains(et)).toBe(false);
    expect(et.nextElementSibling).toBe(campo);
    // Y dentro del recuadro solo queda el valor, en formato peruano.
    expect(campo.textContent).toBe('05/03/2026');
    expect(campo.tagName).toBe('BUTTON');
  });

  it('[2b] R130.2 · el disparador muestra la fecha en peruano, y el ISO es solo lo que se guarda', () => {
    // El componente YA formateaba —el resumen usa `enPalabras`— y el
    // disparador imprimía el valor tal cual. Una superficie del mismo
    // componente cumplía la regla del catálogo y la otra no.
    const cambios: Array<{ desde: string | null; hasta: string | null }> = [];
    const { container } = pintar({
      desde: '2026-03-05', hasta: '2026-12-31',
      onCambio: (v: { desde: string | null; hasta: string | null }) => cambios.push(v),
    });
    const botones = [...container.querySelectorAll('button.fc-campo')];
    expect(botones.map((b) => b.textContent)).toEqual(['05/03/2026', '31/12/2026']);
    // Con cero a la izquierda: `5/3/2026` no alinea en una columna.
    expect(botones[0].textContent).not.toBe('5/3/2026');
    // Y en ninguna superficie visible aparece el ISO.
    expect(container.textContent).not.toContain('2026-03-05');
  });

  it('[2] R130.1 · y el rótulo sigue nombrando al botón, que un `<label>` no puede', async () => {
    const u = userEvent.setup();
    pintar({ desde: '2026-03-05' });
    // El nombre accesible es el mismo que se leía cuando el rótulo iba dentro.
    const b = screen.getByRole('button', { name: 'Desde 05/03/2026' });
    expect(b).toBeInTheDocument();
    await u.click(b);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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

/**
 * R129 DEL EQUIPO · EL SUELO DEL CALENDARIO, SOBRE LA HOJA QUE VIAJA.
 *
 * Cuidado con el número: `R129` es también, en este repositorio, «cambiar de
 * mes no desborda» (v1.103.0) — un número que este sistema se acuñó y que el
 * 2026-09-13 chocó con el R129 real del equipo. La concordancia está al
 * principio de `comportamiento.md`.
 *
 * QUÉ SE COMPRUEBA AQUÍ Y QUÉ NO. Estas tres reglas son sobre **medidas**, y
 * jsdom no maqueta: no puede decir cuánto mide una columna. Lo que sí se puede
 * comprobar, y es lo que importa entregar, es que **la hoja que viaja declara
 * el suelo**. Quien resuelve la cascada a los once anchos es
 * `sistema/candado/verificar-cascada.mjs`, cuya afirmación `R129` sale en
 * **rojo contra la v1.107.0** — así se comprobó que protege algo.
 *
 * Se lee `sistema/componentes/componentes.css`, el archivo que se entrega, y
 * no el catálogo: son dos hojas y el defecto vivía en la que viaja.
 */
describe('R129 del equipo · el calendario no se encoge con su disparador', () => {
  const hoja = readFileSync(
    resolve(process.cwd(), '..', 'sistema', 'componentes', 'componentes.css'),
    'utf8',
  );
  /**
   * TODAS las reglas cuyo selector describe a `sel`, no la primera.
   *
   * La primera version devolvia el primer cuerpo que casaba, y una auditoria la
   * engano metiendo `.fc-d{ min-width: 0 }` DESPUES de la regla buena: la
   * prueba seguia en verde con el suelo muerto. Quien resuelve la cascada de
   * verdad es `verificar-cascada`; aqui se comprueba algo mas simple y que
   * tambien basta: que NINGUNA regla de la hoja entregada baje el suelo.
   */
  const reglasDe = (base: string) => {
    const fuera: string[] = [];
    const re = /([^{}]+)\{([^}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(hoja)) !== null) {
      const sel = m[1].trim();
      // `.fc-d` describe a `.fc-d`, `button.fc-d`, `X .fc-d` — pero no a
      // `.fc-dias` ni a `.fc-dentro`: la clase tiene que terminar ahi.
      if (new RegExp(`\\${base}(?![\\w-])`).test(sel)) fuera.push(m[2]);
    }
    expect(fuera.length, `la hoja entregada no declara ${base}`).toBeGreaterThan(0);
    return fuera;
  };
  /** px de un valor de CSS a un ancho de ventana dado. `null` si no se sabe. */
  const enPx = (txt: string, w: number): number | null => {
    const t = txt.trim().toLowerCase();
    const fn = /^(min|max)\(([\s\S]*)\)$/.exec(t);
    if (fn) {
      const partes: string[] = []; let prof = 0; let act = '';
      for (const c of fn[2]) {
        if (c === '(') prof += 1;
        if (c === ')') prof -= 1;
        if (c === ',' && prof === 0) { partes.push(act); act = ''; continue; }
        act += c;
      }
      partes.push(act);
      const v = partes.map((x) => enPx(x, w));
      return v.some((x) => x === null) ? null : (fn[1] === 'min' ? Math.min(...v as number[]) : Math.max(...v as number[]));
    }
    const c = /^calc\(([\s\S]*)\)$/.exec(t);
    if (c) return enPx(c[1], w);
    const term = t.split(/\s+([+-])\s+/);
    if (term.length > 1) {
      let acc = enPx(term[0], w);
      if (acc === null) return null;
      for (let i = 1; i < term.length; i += 2) {
        const v = enPx(term[i + 1], w);
        if (v === null) return null;
        acc = term[i] === '+' ? acc + v : acc - v;
      }
      return acc;
    }
    const u = /^(-?\d+(?:\.\d+)?)(px|rem|em|vw)?$/.exec(t);
    if (!u) return null;
    const n = Number(u[1]);
    if (u[2] === 'vw') return (n / 100) * w;
    if (u[2] === 'rem' || u[2] === 'em') return n * 16;
    return n;
  };

  it('[12] NINGUNA regla de `.fc-d` baja el suelo de 30px', () => {
    const mins = reglasDe('.fc-d')
      .map((c) => /min-width:\s*([^;]+)/.exec(c)?.[1])
      .filter((v): v is string => Boolean(v));
    expect(mins.length, '.fc-d no declara min-width en ninguna regla').toBeGreaterThan(0);
    for (const v of mins) {
      const px = enPx(v, 1440);
      expect(px, `no se sabe cuanto vale min-width: ${v}`).not.toBeNull();
      expect(px!, `min-width: ${v} deja la rejilla colapsar`).toBeGreaterThanOrEqual(30);
    }
    // Y sigue siendo cuadrada: el mínimo es la altura que ya tenía.
    expect(reglasDe('.fc-d').some((c) => /height:\s*30px/.test(c))).toBe(true);
  });

  it('[13] el tope de `.fc-cal` no queda por debajo de los 626px, EVALUADO', () => {
    const topes = reglasDe('.fc-cal')
      .map((c) => /max-width:\s*([^;]+)/.exec(c)?.[1])
      .filter((v): v is string => Boolean(v))
      .filter((v) => v.trim() !== 'none');
    expect(topes.length, '.fc-cal no declara max-width').toBeGreaterThan(0);
    for (const v of topes) {
      const px = enPx(v, 1440);
      expect(px, `no se sabe cuanto vale max-width: ${v}`).not.toBeNull();
      expect(px!, `max-width: ${v} recorta a 1440px de ventana`).toBeGreaterThanOrEqual(626);
    }
    // El recorte se queda: hace falta para las esquinas redondeadas.
    expect(reglasDe('.fc-cal').some((c) => /overflow:\s*hidden/.test(c))).toBe(true);
  });

  it('[14] la reserva APILA de verdad, y corta antes de que el tope recorte', () => {
    const medias = [...hoja.matchAll(/@media[^{]*\(max-width:\s*(\d+)px\)[^{]*\{([\s\S]*?)\n\}/g)]
      .map(([, px, cuerpo]) => ({ px: Number(px), cuerpo }))
      // No basta con que MENCIONE la clase: tiene que apilar. Una auditoría
      // cambió `grid-auto-flow: row` por `background: red` y esto pasaba.
      .filter((m) => /\.fc-cal-cuerpo\s*\{[^}]*grid-auto-flow:\s*row/.test(m.cuerpo)
        && /\.fc-cal-marco\s*\{[^}]*flex-direction:\s*column/.test(m.cuerpo));
    expect(medias.length, 'no hay reserva que apile el calendario de verdad').toBeGreaterThan(0);
    // El contenido pide 626 y el tope descuenta el canalón de ventana (32):
    // por debajo de 658 hay que apilar, o se recorta sin avisar.
    expect(Math.max(...medias.map((m) => m.px))).toBeGreaterThanOrEqual(658);
  });
});

/**
 * R131 DEL EQUIPO · EL CALENDARIO SE PUEDE CERRAR.
 *
 * `cerrar()` existía y funcionaba desde siempre; lo que faltaba era quién lo
 * llamara. Control Administrativos lo midió con ratón y teclado reales, acción
 * por acción, y las cuatro dejaban el calendario abierto: clic fuera, Escape,
 * volver a pulsar el disparador, y pulsar otro botón de la página. La única
 * forma de cerrarlo era **elegir un rango completo**.
 *
 * El daño no es estético: son 626 px flotando sobre los resultados que la
 * persona acaba de pedir, sin forma de quitarlos.
 *
 * Se prueban las cuatro, y la quinta que NO debe pasar: cerrar no descarta.
 */
describe('R131 del equipo · el calendario se cierra', () => {
  const abierto = (c: HTMLElement) => c.querySelector('.fc-cal') !== null;

  it('[15] clic FUERA cierra, y NO le quita el foco a donde se pulsó', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    render(<button>Buscar</button>);
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    expect(abierto(container)).toBe(true);

    const otro = screen.getByRole('button', { name: 'Buscar' });
    const disparador = screen.getByRole('button', { name: /Desde/ });
    // El destino recibe el foco, que es lo que hace un navegador al pulsar
    // sobre algo enfocable. Se le enfoca ANTES para poder medir si se lo
    // quitamos: con un clic entero el navegador lo enfoca después y la
    // aserción no distinguiría — se comprobó, y por eso se mide así.
    otro.focus();
    fireEvent.pointerDown(otro);
    expect(abierto(container), 'pulsar otro botón de la página no cerraba').toBe(false);
    expect(otro, 'se le robó el foco a donde se acababa de pulsar').toHaveFocus();
    expect(disparador).not.toHaveFocus();
  });

  it('[15] pero si el foco se IBA A PERDER, lo devuelve al campo', async () => {
    // El otro lado de la misma moneda: si lo que se pulsa no es enfocable, el
    // foco cae a `<body>` y quien va con teclado tiene que tabular desde el
    // principio de la página. Es la guarda que `Dialogo` ya tenía escrita.
    const u = userEvent.setup();
    const { container } = pintar();
    const disparador = screen.getByRole('button', { name: /Desde/ });
    await u.click(disparador);
    expect(abierto(container)).toBe(true);

    fireEvent.pointerDown(document.body);
    expect(abierto(container)).toBe(false);
    expect(disparador, 'el foco se quedó en el limbo').toHaveFocus();
  });

  it('[15] Escape cierra AUNQUE el foco esté fuera, y devuelve el foco al campo', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    const disparador = screen.getByRole('button', { name: /Desde/ });
    await u.click(disparador);
    expect(abierto(container)).toBe(true);

    // El foco se va fuera: es lo que pasa en cuanto se pulsa en la página.
    (document.activeElement as HTMLElement)?.blur();
    document.body.focus();
    await u.keyboard('{Escape}');
    expect(abierto(container), 'Escape solo funcionaba con el foco dentro').toBe(false);
    expect(disparador).toHaveFocus();
  });

  it('[15] volver a pulsar el disparador cierra: es un interruptor', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    const disparador = screen.getByRole('button', { name: /Desde/ });
    await u.click(disparador);
    expect(abierto(container)).toBe(true);
    await u.click(disparador);
    expect(abierto(container), 'reabría sobre lo ya abierto').toBe(false);
    // Y vuelve a abrir: alternar es alternar.
    await u.click(disparador);
    expect(abierto(container)).toBe(true);
  });

  it('[15] pulsar DENTRO del calendario no lo cierra', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.click(container.querySelector('.fc-cal-cab')!);
    expect(abierto(container)).toBe(true);
  });

  it('[15] cerrar NO descarta lo ya elegido', async () => {
    // Si cerrar equivaliera a limpiar, rozar la pantalla costaría el rango.
    const u = userEvent.setup();
    const { container } = pintar({ desde: '2026-03-05', hasta: '2026-03-12' });
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    await u.keyboard('{Escape}');
    expect(abierto(container)).toBe(false);
    const botones = [...container.querySelectorAll('button.fc-campo')];
    expect(botones.map((b) => b.textContent)).toEqual(['05/03/2026', '12/03/2026']);
  });
});

/**
 * R131 · LO QUE UNA CAPA NO PUEDE HACERLE A LAS DEMÁS.
 *
 * La primera versión de R131 escribió en `RangoFecha` su propio efecto con
 * escuchas en `document`, **en fase de captura y con `stopPropagation()`**. Una
 * auditoría lo tumbó midiendo el daño: con el calendario y el menú de usuario
 * abiertos a la vez, una Escape cerraba **el calendario** —la capa que la
 * persona no estaba usando— y dejaba el menú abierto, además de llevarse el
 * foco. Le robaba el Escape a las otras tres escuchas de `document` que este
 * mismo sistema registra.
 *
 * Se arregló componiendo sobre `interno/desplegable.ts`, que es donde ese
 * comportamiento ya vivía. Esto lo fija para que no vuelva.
 */
describe('R131 · el calendario no decide por las demás capas', () => {
  it('[15] Escape NO se para: las otras escuchas de `document` siguen llegando', async () => {
    const u = userEvent.setup();
    pintar();
    const oidas: string[] = [];
    const espia = (e: KeyboardEvent) => { if (e.key === 'Escape') oidas.push('burbuja'); };
    document.addEventListener('keydown', espia);
    try {
      await u.click(screen.getByRole('button', { name: /Desde/ }));
      await u.keyboard('{Escape}');
      expect(oidas, 'el calendario se comía el Escape de las demás capas').toEqual(['burbuja']);
    } finally {
      document.removeEventListener('keydown', espia);
    }
  });

  it('[15] pero SÍ impide el defecto, para que un `Dialogo` de fuera no cierre', async () => {
    // Sin `preventDefault`, una sola Escape cerraría el calendario Y el diálogo
    // que lo contiene. La capa de más adentro primero.
    const u = userEvent.setup();
    pintar();
    let impedido: boolean | null = null;
    const espia = (e: KeyboardEvent) => { if (e.key === 'Escape') impedido = e.defaultPrevented; };
    // El espía se registra DESPUÉS de abrir, a propósito: las escuchas de
    // burbuja corren en orden de registro, así que registrándolo antes vería
    // siempre `false` y la prueba pasaría dijera lo que dijera el componente.
    // Se comprobó: así pasaba también con el `preventDefault` quitado.
    await u.click(screen.getByRole('button', { name: /Desde/ }));
    // Y con el foco FUERA de la rejilla, que es el caso que importa: dentro, el
    // `preventDefault` que se mediría sería el del manejador de teclas del
    // calendario, no el de la capa. Se comprobó: así pasaba con el de la capa
    // quitado.
    (document.activeElement as HTMLElement)?.blur();
    document.addEventListener('keydown', espia);
    try {
      await u.keyboard('{Escape}');
      expect(impedido, 'sin impedir el defecto, un Dialogo de fuera cerraría también').toBe(true);
    } finally {
      document.removeEventListener('keydown', espia);
    }
  });

  it('[15] abrir el calendario cierra los demás desplegables del sistema', async () => {
    // El conjunto «solo uno abierto» de `interno/desplegable.ts`. La primera
    // versión no se apuntaba en él, así que el calendario y el menú de usuario
    // podían quedarse los dos encima del contenido — el defecto exacto que ese
    // conjunto existe para evitar.
    const u = userEvent.setup();
    render(<MenuUsuario id="p-1" nombre="Ana Pérez" onSalir={() => {}} />);
    const menu = screen.getByRole('button', { name: /Ana Pérez/ });
    await u.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');

    pintar();
    // Se abre CON TECLADO: un clic dispararía el `pointerdown` fuera del menú y
    // lo cerraría su propia escucha, así que la prueba pasaría sin que el
    // calendario se apuntara en el conjunto. Se comprobó, y pasaba.
    screen.getByRole('button', { name: /Desde/ }).focus();
    await u.keyboard('{Enter}');
    expect(menu, 'el menú se quedó abierto debajo del calendario').toHaveAttribute('aria-expanded', 'false');
  });
});
