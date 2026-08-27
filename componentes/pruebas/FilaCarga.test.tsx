/**
 * R102 · LA FILA COMÚN DE LAS TRES CARGAS.
 *
 * Qué se puede probar aquí y qué no, dicho antes de empezar:
 *
 *   SÍ · el MARCADO —que las tres emiten la misma fila, que lo cargado va al
 *        costado y no encima, que el sobrante se cuenta, que la extensión se
 *        separa del nombre— y que el comportamiento de las tres sigue igual.
 *   NO · las MEDIDAS. jsdom no maqueta: todo mide 0. Los 36,45 px de un campo
 *        contra los 36 de la fila se midieron en el navegador, sobre el
 *        catálogo, y quedan escritos en `comportamiento.md`. Aquí lo que se
 *        protege es que el marcado que produce esa medida no se deshaga.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CargaImagen } from '../src/CargaImagen';
import { CargaId } from '../src/CargaId';
import { CargaPdf } from '../src/CargaPdf';
import { FilaCarga, AdjuntoArchivo, AdjuntoImagen, TOPE_VISIBLE } from '../src/interno/FilaCarga';

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

const fila = (c: HTMLElement) => c.querySelector('.cx-fila') as HTMLElement;

describe('R102 · la fila de carga', () => {
  it('R102 · lo cargado va AL COSTADO del disparador, dentro de la misma fila', () => {
    const { container } = render(
      <FilaCarga
        etiqueta="Boleta"
        disparador={<button type="button">Cargar</button>}
        adjuntos={[<AdjuntoArchivo key="a" nombre="acta.pdf" />]}
      />,
    );
    const f = fila(container);
    // Las dos cosas DENTRO de la misma fila: si una se saliera, la carga
    // volvería a crecer hacia arriba o hacia abajo, que es el defecto.
    expect(within(f).getByRole('button', { name: 'Cargar' })).toBeInTheDocument();
    expect(f.querySelector('.cx-adjuntos')).not.toBeNull();
    expect(f.querySelector('.cx-adj')).not.toBeNull();
  });

  it('R102 · el sobrante se cuenta y no se apila: tres a la vista y +N', () => {
    const muchos = Array.from({ length: 6 }, (_, k) => (
      <AdjuntoArchivo key={k} nombre={`archivo-${k}.pdf`} />
    ));
    const { container } = render(
      <FilaCarga etiqueta="Anexos" disparador={<button type="button">Cargar</button>} adjuntos={muchos} />,
    );
    expect(container.querySelectorAll('.cx-adj')).toHaveLength(TOPE_VISIBLE);
    expect(container.querySelector('.cx-mas')?.textContent).toBe('+3');
    // Un solo renglón: la lista no envuelve porque no hay nada que envolver.
    expect(container.querySelectorAll('.cx-adjuntos')).toHaveLength(1);
  });

  it('R102 · el contador dice el TOTAL, no lo que le pasaron pintado', () => {
    const { container } = render(
      <FilaCarga
        etiqueta="Anexos"
        disparador={<button type="button">Cargar</button>}
        adjuntos={[<AdjuntoArchivo key="a" nombre="uno.pdf" />]}
        total={9}
      />,
    );
    expect(container.querySelector('.cx-mas')?.textContent).toBe('+8');
  });

  it('R102 · la extensión se separa del nombre y no se recorta', () => {
    const { container } = render(
      <AdjuntoArchivo nombre="boleta-bimestre-III-2026.pdf" />,
    );
    expect(container.querySelector('.cx-nombre')?.textContent).toBe('boleta-bimestre-III-2026');
    expect(container.querySelector('.cx-ext')?.textContent).toBe('.pdf');
  });

  it('R102 · un nombre sin extensión no se parte, y un punto inicial tampoco es extensión', () => {
    const { container: sin } = render(<AdjuntoArchivo nombre="acta" />);
    expect(sin.querySelector('.cx-nombre')?.textContent).toBe('acta');
    expect(sin.querySelector('.cx-ext')).toBeNull();

    // `.gitignore` no tiene extensión: tiene nombre.
    const { container: oculto } = render(<AdjuntoArchivo nombre=".gitignore" />);
    expect(oculto.querySelector('.cx-nombre')?.textContent).toBe('.gitignore');
    expect(oculto.querySelector('.cx-ext')).toBeNull();
  });

  it('R102 · la miniatura que se puede ver en grande ES UN BOTÓN, no una imagen con onClick', async () => {
    const ver = vi.fn();
    render(<AdjuntoImagen url="blob:x" alt="anverso" onVer={ver} />);
    const boton = screen.getByRole('button', { name: 'Ver anverso en grande' });
    await userEvent.click(boton);
    expect(ver).toHaveBeenCalledTimes(1);
  });

  it('R102 · sin visor la miniatura es una imagen con su alt, no un botón mudo', () => {
    render(<AdjuntoImagen url="blob:x" alt="Boleta de notas" />);
    expect(screen.getByAltText('Boleta de notas')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('R102 · el estado vacío se dice, y desaparece en cuanto hay algo', () => {
    const { container, rerender } = render(
      <FilaCarga etiqueta="Boleta" disparador={<button type="button">Cargar</button>} vacio="Ningún archivo" />,
    );
    expect(container.querySelector('.cx-vacio')?.textContent).toBe('Ningún archivo');
    rerender(
      <FilaCarga
        etiqueta="Boleta"
        disparador={<button type="button">Cargar</button>}
        vacio="Ningún archivo"
        adjuntos={[<AdjuntoArchivo key="a" nombre="acta.pdf" />]}
      />,
    );
    expect(container.querySelector('.cx-vacio')).toBeNull();
  });

  it('R102 · el error va debajo de la fila, con su icono, y no dentro', () => {
    const { container } = render(
      <FilaCarga etiqueta="Boleta" disparador={<button type="button">Cargar</button>} error="Pesa demasiado." />,
    );
    const err = container.querySelector('.cx-error') as HTMLElement;
    expect(err.textContent).toContain('Pesa demasiado.');
    expect(err.querySelector('svg.ic')).not.toBeNull();
    // Fuera de la fila: dentro la haría crecer, que es lo que no puede pasar.
    expect(fila(container).contains(err)).toBe(false);
  });
});

describe('R102 · las tres cargas emiten LA MISMA fila', () => {
  it('R102 · la carga de imagen en formulario, la de PDF y la de ID montan `.cx-fila`', () => {
    const { container: img } = render(
      <CargaImagen etiqueta="Foto" presentacion="fila" onCambio={() => {}} />,
    );
    const { container: pdf } = render(
      <CargaPdf etiqueta="Acta" onCambio={() => {}} />,
    );
    const { container: id } = render(<CargaId onCambio={() => {}} />);

    for (const c of [img, pdf, id]) {
      expect(c.querySelector('.cx')).not.toBeNull();
      expect(c.querySelector('.cx-et')).not.toBeNull();
      expect(c.querySelector('.cx-fila')).not.toBeNull();
      // El disparador, DENTRO de la fila y en su tamaño mini: es la pieza que
      // fija el alto, y un botón de tamaño completo ya no cabría.
      const boton = fila(c).querySelector('button.btn') as HTMLElement;
      expect(boton.className).toContain('btn-mini');
    }
  });

  it('R102 · la carga de imagen sigue en CAJA por defecto: nada cambió sin pedirlo', () => {
    const { container } = render(<CargaImagen etiqueta="Foto" onCambio={() => {}} />);
    expect(container.querySelector('.ci-caja')).not.toBeNull();
    expect(container.querySelector('.cx-fila')).toBeNull();
  });

  it('R102 · en fila, la imagen cargada se ve como miniatura y se puede quitar', async () => {
    const quitar = vi.fn();
    render(
      <CargaImagen
        etiqueta="Foto del trabajador"
        presentacion="fila"
        valor="blob:foto"
        onCambio={() => {}}
        onQuitar={quitar}
      />,
    );
    expect(screen.getByAltText('Foto del trabajador')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Foto del trabajador' }));
    expect(quitar).toHaveBeenCalledTimes(1);
  });

  it('R102 · las dos caras del ID conservan su proporción con la clase propia', () => {
    const { container } = render(
      <CargaId anverso="blob:a" reverso="blob:b" onCambio={() => {}} />,
    );
    const minis = container.querySelectorAll('img.cx-mini.cx-mini-id');
    expect(minis).toHaveLength(2);
  });
});

describe('R102 · el comportamiento NO cambió con la forma', () => {
  it('R102 · el disparador del PDF queda APAGADO con el panel abierto, no retirado', async () => {
    render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    const abrir = screen.getByRole('button', { name: /Subir PDF/ });
    expect(abrir).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(abrir);
    // Sigue estando —es el ancla de la fila— y ya no se puede pulsar: lo que
    // decide qué pasa con el borrador siguen siendo Grabar y Cancelar.
    expect(abrir).toBeInTheDocument();
    expect(abrir).toBeDisabled();
    expect(abrir).toHaveAttribute('aria-expanded', 'true');
  });

  it('R102 · con el panel abierto la fila no repite la lista que ya está dentro', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={() => {}} valor={[{ nombre: 'acta.pdf', peso: 1024 }]} />,
    );
    expect(container.querySelectorAll('.cx-adj')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /Subir PDF/ }));
    expect(container.querySelectorAll('.cx-adj')).toHaveLength(0);
  });

  it('R102 · el ID sigue desactivando su botón con las dos caras entregadas', () => {
    render(<CargaId anverso="blob:a" reverso="blob:b" onCambio={() => {}} />);
    expect(screen.getByRole('button', { name: /Subir ID/ })).toBeDisabled();
  });
});
