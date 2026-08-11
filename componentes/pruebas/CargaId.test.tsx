/**
 * R51 · las dos caras del documento de identidad.
 *
 * jsdom ni carga imágenes ni dibuja, así que se suplen las tres piezas justas
 * —`Image`, `createObjectURL` y el canvas— y se prueba EL GUION: qué se pide
 * primero, cuándo se avisa, cuándo se cierra el botón y qué pasa al pulsar una
 * miniatura. La geometría del recorte no se puede probar aquí y **decirlo
 * importa**: la proporción ID-1 se verificó en el catálogo, con el navegador.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CargaId, MARCO_ID } from '../src/CargaId';

class ImagenFalsa {
  onload: (() => void) | null = null;
  naturalWidth = 1600;
  naturalHeight = 900;
  set src(_: string) { queueMicrotask(() => this.onload?.()); }
}

beforeEach(() => {
  vi.stubGlobal('Image', ImagenFalsa);
  URL.createObjectURL = vi.fn(() => 'blob:cara');
  URL.revokeObjectURL = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
    cb(new Blob(['x'], { type: 'image/webp' }));
  };
  // jsdom no implementa <dialog>. Lo mínimo para que abra y cierre.
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

const pintar = (props: Partial<React.ComponentProps<typeof CargaId>> = {}) =>
  render(<CargaId onCambio={() => {}} {...props} />);

/** Elegir un archivo en el input escondido, como hace el navegador. */
function elegir(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const archivo = new File(['x'], 'dni.jpg', { type: 'image/jpeg' });
  Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('R1 · el marco lleva la proporción del documento', () => {
  it('ID-1: 85,60 × 53,98 mm, y el marco no se aleja más de una milésima', () => {
    // No es un número elegido: es la tarjeta ID-1 de la ISO/IEC 7810.
    const nominal = 85.6 / 53.98;
    const marco = MARCO_ID.vw / MARCO_ID.vh;
    expect(Math.abs(marco - nominal)).toBeLessThan(0.001);
  });
});

describe('R2 y R3 · primero el anverso, después el reverso, y se avisa una vez', () => {
  it('el diálogo pide el anverso, y tras grabarlo pide el reverso sin cerrarse', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));
    expect(screen.getByText(/Primero el anverso/)).toBeInTheDocument();

    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));

    // Sigue abierto, y ahora pide la otra cara.
    expect(await screen.findByText(/Ahora el reverso/)).toBeInTheDocument();
  });

  it('onCambio se dispara UNA vez y con las dos caras, no cara a cara', async () => {
    const u = userEvent.setup();
    const onCambio = vi.fn();
    const { container } = pintar({ onCambio });
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));

    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));
    // Grabado el anverso: TODAVÍA no se avisa. Es un borrador.
    expect(onCambio).not.toHaveBeenCalled();

    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));
    await waitFor(() => expect(onCambio).toHaveBeenCalledTimes(1));
    const r = onCambio.mock.calls[0][0];
    expect(r.anverso.archivo.type).toBe('image/webp');
    expect(r.reverso.archivo.type).toBe('image/webp');
  });

  it('cancelar a mitad tira el borrador: no queda medio documento', async () => {
    const u = userEvent.setup();
    const onCambio = vi.fn();
    const { container } = pintar({ onCambio });
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));
    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCambio).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.cid-mini')).toHaveLength(0);
    // Y volver a abrir empieza por el anverso, no por donde se quedó.
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));
    expect(screen.getByText(/Primero el anverso/)).toBeInTheDocument();
  });
});

describe('R4 · entregado el documento, el botón se cierra y lo abre el back', () => {
  it('con las dos caras el botón queda desactivado', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));
    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));
    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Subir ID/ })).toBeDisabled());
  });

  it('`bloqueado` manda: el producto lo baja cuando su back lo autoriza', () => {
    // Con las dos caras puestas pero permiso concedido, el botón vuelve.
    pintar({ anverso: 'blob:a', reverso: 'blob:b', bloqueado: false });
    expect(screen.getByRole('button', { name: /Subir ID/ })).toBeEnabled();
  });

  it('y sirve también para cerrarlo antes de tiempo', () => {
    pintar({ bloqueado: true });
    expect(screen.getByRole('button', { name: /Subir ID/ })).toBeDisabled();
  });
});

describe('R5 · las miniaturas se alcanzan y se abren', () => {
  it('son botones, no imágenes con onClick, y llevan cuál cara son', () => {
    pintar({ anverso: 'blob:a', reverso: 'blob:b' });
    expect(screen.getByRole('button', { name: 'Ver anverso en grande' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver reverso en grande' })).toBeInTheDocument();
  });

  it('pulsar una la abre en grande, y cerrar la oculta', async () => {
    const u = userEvent.setup();
    const { container } = pintar({ anverso: 'blob:a', reverso: 'blob:b' });
    await u.click(screen.getByRole('button', { name: 'Ver reverso en grande' }));

    const visor = container.querySelector('.cid-visor-img') as HTMLImageElement;
    expect(visor).not.toBeNull();
    expect(visor.src).toContain('blob:b');

    await u.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(container.querySelector('.cid-visor-img')).toBeNull();
  });
});

describe('R6 · el encuadre es el MISMO editor, no uno parecido', () => {
  it('el lienzo del editor sale con el marco del documento', async () => {
    const u = userEvent.setup();
    const { container } = pintar();
    await u.click(screen.getByRole('button', { name: /Subir ID/ }));
    elegir(container);

    const lienzo = await waitFor(() => {
      const c = container.querySelector('canvas.ci-lienzo') as HTMLCanvasElement;
      expect(c).not.toBeNull();
      return c;
    });
    // Las clases son las de `CargaImagen` porque la pieza es la misma.
    expect(lienzo.width).toBe(MARCO_ID.vw);
    expect(lienzo.height).toBe(MARCO_ID.vh);
    expect(container.querySelector('.ci-editor')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeInTheDocument();
  });
});
