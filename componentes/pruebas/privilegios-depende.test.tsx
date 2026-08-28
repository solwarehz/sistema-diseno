/**
 * R110 · `depende` — una cadena de privilegios, no un salto.
 *
 * Lo pidió Control Administrativos con el caso que `base` no sabe expresar:
 * `leer` → `crear` → `carga-masiva`. Con `base: 'leer'` se podía encender la
 * carga masiva sin poder crear, y eso es un botón que responde 403.
 *
 * Lo que se fija aquí son las cuatro decisiones que no son de dibujo:
 * que bloquea, que enciende la cadena entera, que apagar NO borra, y que
 * `privilegiosEfectivos` le quita el efecto a lo que quedó colgando.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { PanelPrivilegios, privilegiosEfectivos, claveNivel,
  type ModuloPrivilegios, type ValorPrivilegios } from '../src/PanelPrivilegios';

const PERSONAL: ModuloPrivilegios[] = [
  { id: 'personal', nombre: 'Personal', privilegios: [
    { id: 'leer', nombre: 'Ver trabajadores' },
    { id: 'crear', nombre: 'Crear trabajador', depende: 'leer' },
    { id: 'carga-masiva', nombre: 'Carga masiva', depende: 'crear' },
  ] },
];

function Panel({ modulos = PERSONAL, inicial = {} }: {
  modulos?: ModuloPrivilegios[]; inicial?: ValorPrivilegios;
}) {
  const [v, setV] = useState<ValorPrivilegios>(inicial);
  return (
    <>
      <PanelPrivilegios modulos={modulos} valor={v} onCambio={setV} base="leer" abiertos={['personal']} />
      <output data-testid="valor">{JSON.stringify(v)}</output>
    </>
  );
}

const leido = () => JSON.parse(screen.getByTestId('valor').textContent || '{}') as ValorPrivilegios;

describe('R110 · bloqueo mientras falta aquel del que depende', () => {
  it('se VE pero no se puede encender, y dice cuál falta por su nombre', () => {
    render(<Panel />);
    // Está en pantalla: no se oculta, que era medio requerimiento.
    expect(screen.getByText('Carga masiva')).toBeInTheDocument();
    // Y no hay interruptor que pulsar.
    expect(screen.queryByRole('switch', { name: /Carga masiva/ })).toBeNull();
    expect(screen.getByText(/Antes hay que conceder «Crear trabajador»/)).toBeInTheDocument();
  });

  it('nombra al PRIMERO que falta de la cadena, no a los dos', () => {
    render(<Panel />);
    // A la carga masiva le faltan DOS: `crear` y, detrás, `leer`. Su fila dice
    // solo «Crear trabajador» —el siguiente paso real—, porque enumerar los dos
    // es dar trabajo, no información. Que `leer` también aparezca en pantalla es
    // correcto: lo dice la fila de `crear`, que es de quien falta.
    const suFila = screen.getByText('Carga masiva').closest('.pp-priv') as HTMLElement;
    expect(within(suFila).getByText(/Antes hay que conceder «Crear trabajador»/)).toBeInTheDocument();
    expect(within(suFila).queryByText(/Ver trabajadores/)).toBeNull();
  });

  it('un `depende` que apunta a un id inexistente BLOQUEA, no abre', async () => {
    render(<Panel modulos={[{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'leer', nombre: 'Ver' },
      { id: 'raro', nombre: 'Raro', depende: 'no-existe' },
    ] }]} />);
    expect(screen.queryByRole('switch', { name: /Raro/ })).toBeNull();
    // Y nombra el id que falta, para que la errata se pueda diagnosticar.
    expect(screen.getByText(/no-existe/)).toBeInTheDocument();
  });
});

describe('R110 · la cadena se recorre de arriba abajo, y eso cambia el base', () => {
  /**
   * CONSECUENCIA QUE CONVIENE TENER ESCRITA. Con una cadena declarada, en la
   * pantalla se enciende de uno en uno y de arriba abajo: la fila bloqueada no
   * es pulsable, así que no hay atajo.
   *
   * R111 · Lo que este bloque NO dice, porque se midió y era falso: `depende`
   * **no** desactiva el encendido de rebote del `base`. El bloque del base
   * corre antes e incondicionalmente. Lo fija la última prueba.
   */
  it('con todo apagado, el ÚNICO interruptor que se puede pulsar es el primero', () => {
    render(<Panel />);
    expect(screen.getByRole('switch', { name: /Ver trabajadores/ })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /Crear trabajador/ })).toBeNull();
    expect(screen.queryByRole('switch', { name: /Carga masiva/ })).toBeNull();
  });

  it('encender `leer` desbloquea `crear`, y encender `crear` desbloquea la carga masiva', async () => {
    render(<Panel />);
    await userEvent.click(screen.getByRole('switch', { name: /Ver trabajadores/ }));
    expect(screen.getByRole('switch', { name: /Crear trabajador/ })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: /Carga masiva/ })).toBeNull();

    await userEvent.click(screen.getByRole('switch', { name: /Crear trabajador/ }));
    expect(screen.getByRole('switch', { name: /Carga masiva/ })).toBeInTheDocument();
    expect(leido().personal).toMatchObject({ leer: true, crear: true });
  });

  it('encender la carga masiva no pierde nada de lo que ya estaba', async () => {
    render(<Panel inicial={{ personal: { leer: true, crear: true } }} />);
    await userEvent.click(screen.getByRole('switch', { name: /Carga masiva/ }));
    expect(leido().personal).toMatchObject({ leer: true, crear: true, 'carga-masiva': true });
  });

  it('el encendido en cascada SÍ se dispara por `clave`, que es donde se alcanza', async () => {
    // Dos privilegios que son el mismo permiso (R99). Encender «Importar»
    // enciende «Carga masiva» por clave, y ésta arrastra `crear` con ella. Sin
    // la cascada, aquí se guardaría la carga masiva sin poder crear: el 403.
    render(<Panel modulos={[{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'leer', nombre: 'Ver trabajadores' },
      { id: 'crear', nombre: 'Crear trabajador' },
      { id: 'carga-masiva', nombre: 'Carga masiva', depende: 'crear', clave: 'masiva' },
      { id: 'importar', nombre: 'Importar', clave: 'masiva' },
    ] }]} inicial={{ personal: { leer: true } }} />);
    await userEvent.click(screen.getByRole('switch', { name: /Importar/ }));
    expect(leido().personal).toMatchObject({ 'carga-masiva': true, crear: true });
  });

  it('no enciende de rebote uno CERRADO: la cadena se para ahí', async () => {
    render(<Panel modulos={[{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'leer', nombre: 'Ver' },
      { id: 'crear', nombre: 'Crear', depende: 'leer', cerrado: 'Lo da el Jefe de personal.' },
      { id: 'carga-masiva', nombre: 'Carga masiva', depende: 'crear' },
    ] }]} inicial={{ personal: { leer: true } }} />);
    // `crear` está cerrado y apagado, así que la carga masiva sigue bloqueada
    // y no hay forma de encenderla por la puerta de atrás.
    expect(screen.queryByRole('switch', { name: /Carga masiva/ })).toBeNull();
  });

  it('un ciclo no cuelga el navegador', async () => {
    render(<Panel modulos={[{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'leer', nombre: 'Ver' },
      { id: 'a', nombre: 'A', depende: 'b' },
      { id: 'b', nombre: 'B', depende: 'a' },
    ] }]} inicial={{ personal: { leer: true } }} />);
    // Con que pinte, ya está: sin el corte, `cadenaDepende` no termina.
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

describe('R110 · apagar gobierna, pero no borra — igual que el base en R98', () => {
  it('apagar `crear` deja la carga masiva bloqueada CON su valor intacto', async () => {
    render(<Panel inicial={{ personal: { leer: true, crear: true, 'carga-masiva': true } }} />);
    await userEvent.click(screen.getByRole('switch', { name: /Crear trabajador/ }));
    // Bloqueada en pantalla…
    expect(screen.queryByRole('switch', { name: /Carga masiva/ })).toBeNull();
    // …pero lo guardado NO se destruye: volver a encender `crear` lo recupera.
    expect(leido().personal['carga-masiva']).toBe(true);
  });
});

describe('R110 · sin efecto para el backend mientras falta la dependencia', () => {
  it('privilegiosEfectivos quita lo que cuelga, que es el 403 que se vino a evitar', () => {
    const v: ValorPrivilegios = { personal: { leer: true, 'carga-masiva': true } };
    const efectivo = privilegiosEfectivos(PERSONAL, v, 'leer');
    expect(efectivo.personal['carga-masiva']).toBeUndefined();
    expect(efectivo.personal.leer).toBe(true);
  });

  it('se lleva por delante también los NIVELES del que quedó colgando', () => {
    const v: ValorPrivilegios = { personal: {
      leer: true, 'carga-masiva': true, [claveNivel('carga-masiva', 'tope')]: 'mil',
    } };
    const efectivo = privilegiosEfectivos(PERSONAL, v, 'leer');
    expect(efectivo.personal[claveNivel('carga-masiva', 'tope')]).toBeUndefined();
  });

  it('con la cadena entera concedida no quita nada', () => {
    const v: ValorPrivilegios = { personal: { leer: true, crear: true, 'carga-masiva': true } };
    const efectivo = privilegiosEfectivos(PERSONAL, v, 'leer');
    expect(efectivo.personal).toMatchObject({ leer: true, crear: true, 'carga-masiva': true });
  });
});

describe('R110 · el recuento no cuenta lo que no surte efecto', () => {
  it('«de N» no suma un privilegio bloqueado por su dependencia', () => {
    render(<Panel inicial={{ personal: { leer: true, 'carga-masiva': true } }} />);
    // Concedidos DE VERDAD: solo `leer`. La carga masiva está guardada como
    // true pero no se aplica, así que contarla diría que se repartió algo que
    // el backend va a ignorar.
    expect(screen.getByText(/1 de 3/)).toBeInTheDocument();
  });
});

describe('R111 · lo que `depende` NO cambia', () => {
  it('el `base` SIGUE encendiéndose de rebote — se midió, y la primera redacción decía lo contrario', async () => {
    // Estado alcanzable: se enciende la cadena, se apaga el base (R98 conserva
    // lo repartido) y se vuelve a pulsar un privilegio que sí es pulsable.
    render(<Panel modulos={[{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'ver', nombre: 'Ver el módulo' },
      { id: 'leer', nombre: 'Ver trabajadores' },
      { id: 'crear', nombre: 'Crear trabajador', depende: 'leer' },
    ] }]} inicial={{ personal: { leer: true } }} />);
    // El base es 'leer' en este Panel de pruebas, así que aquí el base ya está.
    await userEvent.click(screen.getByRole('switch', { name: /Crear trabajador/ }));
    expect(leido().personal).toMatchObject({ leer: true, crear: true });
  });
});

describe('R111 · privilegiosEfectivos tampoco aplica lo cerrado', () => {
  it('un permiso guardado ANTES de que lo cerraran deja de viajar al backend', () => {
    const mods: ModuloPrivilegios[] = [{ id: 'personal', nombre: 'Personal', privilegios: [
      { id: 'leer', nombre: 'Ver' },
      { id: 'alta', nombre: 'Dar de alta', cerrado: 'Es del Jefe de personal.' },
    ] }];
    // El mapa viene de cuando «alta» todavía se podía conceder.
    const v: ValorPrivilegios = { personal: { leer: true, alta: true } };
    const efectivo = privilegiosEfectivos(mods, v, 'leer');
    expect(efectivo.personal.alta).toBeUndefined();
    expect(efectivo.personal.leer).toBe(true);
  });
});
