/**
 * R97 · Panel de privilegios.
 *
 * Lo que se fija aquí no es el dibujo: son las cinco decisiones que hacen que
 * dos productos repartan permisos igual. La primera —que hay un privilegio que
 * manda— es la que evita que se guarde «editar sin ver» y que cada backend
 * decida por su cuenta qué significa eso.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PanelPrivilegios, resumirPrivilegios, privilegiosEfectivos, claveNivel,
  comoNoRepartible, type ModuloPrivilegios, type ValorPrivilegios } from '../src/PanelPrivilegios';

const MODULOS: ModuloPrivilegios[] = [
  { id: 'trab', nombre: 'Trabajadores', privilegios: [
      { id: 'ver', nombre: 'Ver', niveles: [
          { id: 'documento', nombre: 'Documento', opciones: [
              { valor: 'completo', texto: 'Completo', ejemplo: '71602303' },
              { valor: 'parcial', texto: 'Parcial', ejemplo: '*****303' },
              { valor: 'oculto', texto: 'Oculto' },
            ] },
          { id: 'correo', nombre: 'Correo', opciones: [
              { valor: 'completo', texto: 'Completo' },
              { valor: 'oculto', texto: 'Oculto', cerrado: 'Su cargo no ve el correo: no puede ocultarlo a otros.' },
            ] },
        ] },
      { id: 'editar', nombre: 'Editar' },
      { id: 'alta', nombre: 'Dar de alta', cerrado: 'Dar de alta es del Jefe de personal.' },
    ],
    grupos: [{ titulo: 'Dentro del módulo', privilegios: [{ id: 'datos', nombre: 'Ver documento' }] }] },
  // Sin «descargar»: lo que no aplica no se pasa.
  { id: 'marc', nombre: 'Marcaciones', privilegios: [{ id: 'ver', nombre: 'Ver' }] },
  // R99 · los tres motivos, y dos privilegios que son el MISMO permiso.
  { id: 'org', nombre: 'Organigrama', privilegios: [
      { id: 'ver', nombre: 'Ver' },
      { id: 'editar', nombre: 'Editar', clave: 'escritura' },
      { id: 'crear', nombre: 'Crear', clave: 'escritura' },
      { id: 'exportar', nombre: 'Exportar',
        cerrado: { tipo: 'ajeno', motivo: 'Su cargo no exporta el organigrama, así que no puede concederlo.' } },
      { id: 'auditar', nombre: 'Auditar',
        cerrado: { tipo: 'pendiente', motivo: 'Llega en la próxima entrega.' } },
      { id: 'borrar', nombre: 'Borrar', cerrado: 'Un organigrama no se borra: se cierra con fecha.' },
    ] },
];

function Montado({ inicial, ...resto }: { inicial: ValorPrivilegios } & Record<string, unknown>) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return <PanelPrivilegios modulos={MODULOS} valor={v} onCambio={setV} {...resto} />;
}

const abrir = async (nombre: string) => {
  await userEvent.click(screen.getByRole('button', { name: new RegExp(nombre) }));
};

describe('Panel de privilegios — R97', () => {
  /* R98 cambió esto: apagar el base ya NO borra el módulo. Lo que se mantiene
     es que sin el base nada se aplica —lo dice el panel y lo resuelve
     `privilegiosEfectivos`— y que encender otro enciende el base. */
  it('R97 · el privilegio base manda: sin él, el módulo no concede nada', async () => {
    const onCambio = vi.fn();
    render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio}
      valor={{ trab: { ver: true, editar: true, datos: true } }} abiertos={['trab']} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Ver' }));
    const tras = onCambio.mock.calls[0][0];
    expect(tras.trab.ver).toBe(false);
    expect(privilegiosEfectivos(MODULOS, tras).trab).toEqual({});
  });

  it('R97 · encender otro enciende el base solo', async () => {
    const onCambio = vi.fn();
    render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio}
      valor={{ trab: { ver: false, editar: false } }} abiertos={['trab']} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Editar' }));
    expect(onCambio.mock.calls[0][0].trab).toMatchObject({ ver: true, editar: true });
  });

  it('R97 · con base={null} los privilegios son independientes', async () => {
    const onCambio = vi.fn();
    render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio} base={null}
      valor={{ trab: { ver: false } }} abiertos={['trab']} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Editar' }));
    expect(onCambio.mock.calls[0][0].trab).toMatchObject({ ver: false, editar: true });
  });

  /* El motivo ES el estado: sin él queda un candado mudo. */
  it('R97 · lo cerrado no es un interruptor y enseña su motivo', () => {
    render(<Montado inicial={{ trab: { ver: true } }} abiertos={['trab']} />);
    expect(screen.queryByRole('switch', { name: 'Dar de alta' })).toBeNull();
    expect(screen.getByText(/Jefe de personal/)).toBeTruthy();
  });

  /* El nombre se consulta por el ROL, no por el atributo: el Interruptor nombra
     con `aria-labelledby` —envolver en <label> no nombra a un <button>— y leer
     `aria-label` a pelo devolvía null. */
  it('R97 · lo que no aplica no aparece: Marcaciones no tiene «Editar»', () => {
    render(<Montado inicial={{ marc: { ver: true } }} abiertos={['marc']} />);
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(screen.getByRole('switch', { name: 'Ver' })).toBeTruthy();
    expect(screen.queryByRole('switch', { name: 'Editar' })).toBeNull();
  });

  it('R97 · lo concedido se ve SIN abrir el módulo', () => {
    const { container } = render(<Montado inicial={{ trab: { ver: true, editar: true } }} />);
    const cab = container.querySelector('.pp-mod-cab')!;
    expect(cab.textContent).toContain('Ver');
    expect(cab.textContent).toContain('Editar');
    expect(cab.textContent).toContain('2 de 3');   // «alta» está cerrado y no cuenta
    expect(container.querySelector('.pp-mod-cuerpo')?.hasAttribute('hidden')).toBe(true);
  });

  it('R97 · sin el base, el resto se atenúa pero sigue ahí', () => {
    const { container } = render(<Montado inicial={{ trab: { ver: false, editar: true } }} abiertos={['trab']} />);
    expect(container.querySelector('.pp-sin-base')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Editar' })).toBeTruthy();
    expect(container.textContent).toContain('el resto del módulo no se aplica');
  });

  it('R97 · con preset, lo modificado se marca y se puede volver', async () => {
    const volver = vi.fn();
    render(<Montado inicial={{ trab: { ver: true, editar: true } }}
      preset={{ trab: { ver: true, editar: false } }} onVolverAlPreset={volver} />);
    expect(screen.getByText('modificado')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Volver al preset/ }));
    expect(volver).toHaveBeenCalled();
  });

  it('R97 · sin preset no se promete nada: ni marca ni botón', () => {
    render(<Montado inicial={{ trab: { ver: true } }} />);
    expect(screen.queryByText('modificado')).toBeNull();
    expect(screen.queryByRole('button', { name: /Volver al preset/ })).toBeNull();
  });

  it('R97 · el resumen se puede usar fuera del panel', () => {
    const frases = resumirPrivilegios(MODULOS, { trab: { ver: true, editar: true }, marc: { ver: true } });
    expect(frases).toEqual(['ver, editar en trabajadores', 'ver en marcaciones']);
  });

  it('R97 · el encabezado lo pone el producto, el panel no sabe qué configura', () => {
    render(<Montado inicial={{}}><label>Cargo<select><option>Administradora</option></select></label></Montado>);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  /* ── R98 · niveles por campo ─────────────────────────────────────────── */

  it('R98 · los niveles se reparten solo si el privilegio está concedido', () => {
    // Dos montajes y no un `rerender`: `Montado` siembra su estado al montar,
    // así que volver a pintarlo con otro `inicial` no lo cambiaba y la prueba
    // pasaba por el motivo equivocado.
    const apagado = render(<Montado inicial={{ trab: { ver: false } }} abiertos={['trab']} />);
    expect(screen.queryByRole('group', { name: /Documento/ })).toBeNull();
    apagado.unmount();
    render(<Montado inicial={{ trab: { ver: true } }} abiertos={['trab']} />);
    expect(screen.getByRole('group', { name: /Documento/ })).toBeTruthy();
  });

  it('R98 · el nivel se guarda bajo «privilegio:nivel» y no choca con los permisos', async () => {
    const onCambio = vi.fn();
    render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio}
      valor={{ trab: { ver: true } }} abiertos={['trab']} />);
    await userEvent.click(screen.getByRole('radio', { name: /Parcial/ }));
    expect(onCambio.mock.calls[0][0].trab).toMatchObject({
      ver: true, [claveNivel('ver', 'documento')]: 'parcial',
    });
  });

  it('R98 · un nivel cerrado por regla no es un control, y dice por qué', () => {
    render(<Montado inicial={{ trab: { ver: true } }} abiertos={['trab']} />);
    expect(screen.getByText(/no puede ocultarlo a otros/)).toBeTruthy();
  });

  /* ── R98 · la pregunta que hizo Control Administrativos ───────────────── */

  it('R98 · apagar el base CONSERVA lo configurado, no lo borra', async () => {
    const onCambio = vi.fn();
    render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio} abiertos={['trab']}
      valor={{ trab: { ver: true, editar: true, [claveNivel('ver', 'documento')]: 'parcial' } }} />);
    await userEvent.click(screen.getByRole('switch', { name: 'Ver' }));
    // Hasta la v1.72.0 esto devolvía todo en false y el nivel se perdía. Con
    // guardado en cada pulsación, se perdía de verdad y sin vuelta atrás.
    expect(onCambio.mock.calls[0][0].trab).toEqual({
      ver: false, editar: true, [claveNivel('ver', 'documento')]: 'parcial',
    });
  });

  it('R98 · pero sin el base nada se aplica: eso lo resuelve privilegiosEfectivos', () => {
    const guardado: ValorPrivilegios = {
      trab: { ver: false, editar: true, [claveNivel('ver', 'documento')]: 'parcial' },
      marc: { ver: true },
    };
    expect(privilegiosEfectivos(MODULOS, guardado)).toMatchObject({ trab: {}, marc: { ver: true } });
  });

  it('R98 · con base={null} lo efectivo es lo guardado', () => {
    const g: ValorPrivilegios = { trab: { editar: true }, marc: {} };
    expect(privilegiosEfectivos(MODULOS, g, null)).toMatchObject(g);
  });

  it('R98 · el resumen no cuenta lo que no se aplica', () => {
    // Sin «ver», el módulo no concede nada aunque su mapa diga que sí.
    const efectivo = privilegiosEfectivos(MODULOS, { trab: { ver: false, editar: true } });
    expect(resumirPrivilegios(MODULOS, efectivo)).toEqual([]);
  });

  /* ── R99 · tres motivos, tres lecturas ────────────────────────────────── */

  it('R99 · los tres motivos se distinguen en pantalla, no solo en el texto', () => {
    const { container } = render(<Montado inicial={{ org: { ver: true } }} abiertos={['org']} />);
    const org = within(container.querySelector('.pp-mod:last-child') as HTMLElement);
    expect(container.querySelector('.pp-no-cerrado')).toBeTruthy();
    expect(container.querySelector('.pp-no-ajeno')).toBeTruthy();
    expect(container.querySelector('.pp-no-pendiente')).toBeTruthy();
    // Y cada uno dice en una etiqueta qué hacer al respecto.
    expect(org.getByText('no se puede conceder')).toBeTruthy();
    expect(org.getByText('no lo tiene usted')).toBeTruthy();
    expect(org.getByText('todavía no existe')).toBeTruthy();
  });

  it('R99 · ninguno de los tres es un interruptor: no invitan a encenderlos', () => {
    const { container } = render(<Montado inicial={{ org: { ver: true } }} abiertos={['org']} />);
    const org = within(container.querySelector('.pp-mod:last-child') as HTMLElement);
    for (const n of ['Exportar', 'Auditar', 'Borrar']) {
      expect(org.queryByRole('switch', { name: new RegExp(n) })).toBeNull();
      expect(org.getByText(n)).toBeTruthy();   // pero siguen a la vista
    }
  });

  it('R99 · `cerrado: "texto"` sigue significando cerrado', () => {
    expect(comoNoRepartible('porque sí')).toEqual({ tipo: 'cerrado', motivo: 'porque sí' });
    expect(comoNoRepartible(undefined)).toBeUndefined();
  });

  it('R99 · el pendiente puede no llevar motivo', () => {
    expect(comoNoRepartible({ tipo: 'pendiente' })).toEqual({ tipo: 'pendiente' });
  });

  /* ── R99 · privilegios que son el mismo permiso ───────────────────────── */

  it('R99 · los que comparten clave se encienden juntos', async () => {
    const onCambio = vi.fn();
    // El `container` del render, no `document`: con varios montajes en el mismo
    // archivo, buscar en el documento entero encuentra los de antes.
    const { container } = render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio} abiertos={['org']}
      valor={{ org: { ver: true, editar: false, crear: false } }} />);
    const org = within(container.querySelector('.pp-mod:last-child') as HTMLElement);
    await userEvent.click(org.getByRole('switch', { name: /^Editar/ }));
    expect(onCambio.mock.calls[0][0].org).toMatchObject({ editar: true, crear: true });
  });

  it('R99 · y se apagan juntos', async () => {
    const onCambio = vi.fn();
    const { container } = render(<PanelPrivilegios modulos={MODULOS} onCambio={onCambio} abiertos={['org']}
      valor={{ org: { ver: true, editar: true, crear: true } }} />);
    const org = within(container.querySelector('.pp-mod:last-child') as HTMLElement);
    await userEvent.click(org.getByRole('switch', { name: /^Crear/ }));
    expect(onCambio.mock.calls[0][0].org).toMatchObject({ editar: false, crear: false });
  });

  it('R99 · se avisa ANTES de pulsar, en la propia etiqueta', () => {
    const { container } = render(<Montado inicial={{ org: { ver: true } }} abiertos={['org']} />);
    const org = within(container.querySelector('.pp-mod:last-child') as HTMLElement);
    expect(org.getByRole('switch', { name: /^Editar · va con Crear/ })).toBeTruthy();
    // Y al revés: el nombre accesible de «Crear» también lo dice, así que un
    // lector de pantalla anuncia el enlace antes de que se pulse.
    expect(org.getByRole('switch', { name: /^Crear · va con Editar/ })).toBeTruthy();
  });

  it('R99 · lo no repartible no cuenta en el «de N»: el cargo no parece incompleto', () => {
    const { container } = render(<Montado inicial={{ org: { ver: true } }} />);
    // Seis privilegios, tres de ellos no repartibles → «1 de 3».
    const org = container.querySelector('.pp-mod:last-child .pp-conteo')!;
    expect(org.textContent).toBe('1 de 3');
  });

  it('R97 · en solo lectura no se puede cambiar nada', () => {
    render(<Montado inicial={{ trab: { ver: true } }} abiertos={['trab']} soloLectura />);
    expect(screen.getByRole('switch', { name: 'Ver' }).getAttribute('aria-disabled')).toBe('true');
  });
});
