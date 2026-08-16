/**
 * R69 · Segmentado. Lo pidió Control Administrativos V2.0: un dato sensible no
 * se ve o no se ve, y tiene un punto medio —*****303— que es el que hace útil
 * el sistema. Con el interruptor, de dos posiciones, no se podía expresar sin
 * mentir.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Segmentado, type OpcionSegmento } from '../src/Segmentado';

const TRES: OpcionSegmento[] = [
  { valor: 'completo', texto: 'Completo', ejemplo: '71602303' },
  { valor: 'parcial', texto: 'Parcial', ejemplo: '*****303' },
  { valor: 'oculto', texto: 'Oculto', ejemplo: '—' },
];

describe('Segmentado — R69', () => {
  it('los niveles son excluyentes: solo uno marcado, y elegir otro lo dice', async () => {
    const onCambio = vi.fn();
    render(<Segmentado etiqueta="Documento" opciones={TRES} valor="parcial" onCambio={onCambio} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios.filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
    expect(screen.getByRole('radio', { name: 'Parcial' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Completo' }));
    expect(onCambio).toHaveBeenCalledWith('completo');
  });

  /* El ejemplo es la DEFINICIÓN del nivel. Si solo se viera bajo la opción
     activa, para saber qué concede «parcial» habría que concederlo primero:
     cambiar un privilegio real de un cargo real para aprender qué significa. */
  it('el ejemplo está en CADA nivel, no solo en el elegido', () => {
    render(<Segmentado etiqueta="Documento" opciones={TRES} valor="parcial" onCambio={() => {}} />);

    expect(screen.getByText('71602303')).toBeInTheDocument();
    expect(screen.getByText('*****303')).toBeInTheDocument();
  });

  /* El `<label>` envuelve rótulo y ejemplo, así que sin `aria-labelledby` el
     nombre saldría «Completo 71602303» y la descripción repetiría el número. */
  it('el nombre es el rótulo SOLO, y el ejemplo va de descripción', () => {
    render(<Segmentado etiqueta="Documento" opciones={TRES} valor="parcial" onCambio={() => {}} />);

    const completo = screen.getByRole('radio', { name: 'Completo' });
    expect(completo).toHaveAccessibleName('Completo');
    expect(completo).toHaveAccessibleDescription('71602303');
  });

  /* La dirección no tiene punto medio —media dirección ya dice el barrio—. Un
     nivel que no aplica no se pasa, y el componente no lo inventa. */
  it('con dos opciones no se inventa la tercera', () => {
    render(
      <Segmentado
        etiqueta="Dirección"
        valor="oculta"
        onCambio={() => {}}
        opciones={[
          { valor: 'completa', texto: 'Completa' },
          { valor: 'oculta', texto: 'Oculta' },
        ]}
      />
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  /* R66 · Quien reparte privilegios no puede conceder uno que lo iguale a él
     mismo. Eso cierra UN NIVEL, no el campo. */
  it('un nivel cerrado deja de ser control, sigue a la vista y dice por qué', () => {
    render(
      <Segmentado
        etiqueta="Documento"
        valor="parcial"
        onCambio={() => {}}
        opciones={[
          { valor: 'completo', texto: 'Completo', cerrado: 'Tú lo ves en parcial' },
          { valor: 'parcial', texto: 'Parcial', ejemplo: '*****303' },
          { valor: 'oculto', texto: 'Oculto' },
        ]}
      />
    );

    // No desaparece: si desapareciera, quien reparte no entendería por qué su
    // lista no coincide con la de al lado.
    expect(screen.getByText('Completo')).toBeInTheDocument();
    // Y el motivo, que es la mitad del estado.
    expect(screen.getByText('Tú lo ves en parcial')).toBeInTheDocument();
    // Pero ya no es un control: no es un radio deshabilitado, es texto.
    expect(screen.queryByRole('radio', { name: 'Completo' })).toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('el control entero cerrado no deja ni un radio, y deja el motivo', () => {
    render(
      <Segmentado
        etiqueta="Privilegios"
        cerrado="No puedes conceder el reparto de privilegios"
        opciones={TRES}
        valor="parcial"
        onCambio={() => {}}
      />
    );

    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByText('Privilegios')).toBeInTheDocument();
    expect(screen.getByText('No puedes conceder el reparto de privilegios')).toBeInTheDocument();
  });

  /* «Documento, parcial» no dice de qué grupo. En pantalla el encabezado de la
     sección ya lo dice; con lector de pantalla puede quedar lejos. */
  it('el contexto se antepone al rótulo para el lector, y no se ve', () => {
    const { container } = render(
      <Segmentado
        etiqueta="Documento"
        contexto="Trabajadores"
        opciones={TRES}
        valor="parcial"
        onCambio={() => {}}
      />
    );

    expect(screen.getByRole('group')).toHaveAccessibleName('Trabajadores · Documento');
    expect(container.querySelector('.sr-solo')).toHaveTextContent('Trabajadores');
  });

  /* aria-disabled y no `disabled`: el nativo saca el control del tabulador y su
     estado se vuelve indescubrible con teclado. Mismo criterio que R41. */
  it('deshabilitado se anuncia sin salir del tabulador, y no cambia nada', async () => {
    const onCambio = vi.fn();
    render(
      <Segmentado etiqueta="Celular" opciones={TRES} valor="parcial" onCambio={onCambio} deshabilitado />
    );

    const completo = screen.getByRole('radio', { name: 'Completo' });
    expect(completo).toHaveAttribute('aria-disabled', 'true');
    expect(completo).not.toBeDisabled();

    await userEvent.click(completo);
    expect(onCambio).not.toHaveBeenCalled();
  });
});
