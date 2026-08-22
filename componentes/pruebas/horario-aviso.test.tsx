/**
 * R94 · `onAjuste` no puede llamarse durante el render.
 *
 * Lo reportó Control Administrativos, y tuvieron que blindarse por su cuenta.
 * En la v1.64.0 el aviso salía del cuerpo del componente, así que un consumidor
 * que hiciera lo natural —guardar los avisos en un estado para enseñarlos—
 * entraba en **bucle infinito**: `setState` durante el render provoca otro
 * render, que vuelve a avisar, que vuelve a renderizar.
 *
 * La prueba que lo reprodujo **se colgó diez minutos** antes de matarla. Por
 * eso esta lleva tope: si el arreglo se deshace, falla en vez de colgar el CI.
 */
import { render, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Horario, type AjusteHorario } from '../src/Horario';

const base = { titulo: 'x', dias: ['Lun'], inicio: '07:00', fin: '19:00', paso: 60 };
const FUERA = [{ dia: 0, de: '06:00', a: '07:00', titulo: 'FUERA' }];

/** El consumidor natural: guarda los avisos para enseñarlos en pantalla. */
function Consumidor({ tope, alRender }: { tope: number; alRender: () => number }) {
  const [avisos, setAvisos] = useState<AjusteHorario[]>([]);
  const n = alRender();
  if (n > tope) throw new Error(`BUCLE: ${n} renders`);
  return (
    <>
      <p data-testid="n">{avisos.length}</p>
      <Horario {...base} bloques={FUERA} onAjuste={setAvisos} />
    </>
  );
}

describe('Horario — R94 · el aviso sale de un efecto, no del render', () => {
  it('R94 · guardar los avisos en un estado NO entra en bucle', async () => {
    let renders = 0;
    const { getByTestId } = render(<Consumidor tope={25} alRender={() => ++renders} />);
    await waitFor(() => expect(getByTestId('n').textContent).toBe('1'));
    // Con el aviso en el render esto no llegaba aquí: se colgaba.
    expect(renders).toBeLessThan(25);
  });

  it('R94 · no se repite el aviso si los avisos no han cambiado', async () => {
    const onAjuste = vi.fn();
    function Padre() {
      const [, tic] = useState(0);
      useEffect(() => { tic(1); }, []);   // fuerza un segundo render
      return <Horario {...base} bloques={FUERA} onAjuste={onAjuste} />;
    }
    render(<Padre />);
    await waitFor(() => expect(onAjuste).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    // Un array nuevo en cada render no es un aviso nuevo: se compara el
    // CONTENIDO. Sin eso, el efecto se dispararía en cada render y el bucle
    // volvería un paso más allá.
    expect(onAjuste).toHaveBeenCalledTimes(1);
  });

  it('R94 · si no hay nada que avisar, no se llama', async () => {
    const onAjuste = vi.fn();
    render(<Horario {...base} onAjuste={onAjuste}
      bloques={[{ dia: 0, de: '08:00', a: '09:00', titulo: 'OK' }]} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(onAjuste).not.toHaveBeenCalled();
  });
});
