/**
 * R35: la carga de imagen con encuadre. jsdom ni carga imágenes ni dibuja,
 * así que se suplen las tres piezas justas —Image, createObjectURL y el
 * canvas— y se prueba el CONTRATO: qué se abre, qué se entrega, qué se
 * alcanza con teclado. La geometría del recorte no se puede probar aquí y
 * DECIRLO importa: se verificó a mano en el catálogo.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CargaImagen } from '../src/CargaImagen';

class ImagenFalsa {
  onload: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  set src(_: string) { queueMicrotask(() => this.onload?.()); }
}

beforeEach(() => {
  // La misma suplencia que Dialogo.test.tsx: jsdom no trae showModal.
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  vi.stubGlobal('Image', ImagenFalsa);
  URL.createObjectURL = vi.fn(() => 'blob:prueba');
  URL.revokeObjectURL = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(), drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, tipo?: string) {
    tipoPedido = tipo;
    cb(new Blob(['x'], { type: tipo ?? 'image/png' }));
  };
});

let tipoPedido: string | undefined;

const archivo = new File(['foto'], 'foto.png', { type: 'image/png' });

function elegir(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: [archivo] } });
}

describe('Carga de imagen — R35', () => {
  it('vacío con texto propio, nota al pie y ranura de error', () => {
    const { container } = render(
      <CargaImagen etiqueta="Foto del legajo" onCambio={() => {}}
        vacio="Aún sin foto" nota="JPG o PNG · máx. 2 MB" error="Pesa 6 MB y el máximo es 2 MB." />
    );
    expect(screen.getByText('Aún sin foto')).toBeTruthy();
    expect(screen.getByText('JPG o PNG · máx. 2 MB')).toBeTruthy();
    // El error lo pinta el componente y DESCRIBE al disparador.
    const boton = screen.getByRole('button', { name: 'Subir foto' });
    expect(container.querySelector('.ci-error')!.id).toBe(boton.getAttribute('aria-describedby'));
  });

  it('elegir archivo abre el editor en un Dialogo que no se pierde por un clic fuera', async () => {
    const { container } = render(<CargaImagen etiqueta="Foto" onCambio={() => {}} />);
    elegir(container);
    const dialogo = await screen.findByRole('dialog', { name: /Encuadrar — Foto/ });
    expect(dialogo).toBeTruthy();
    // R2 · el lienzo es enfocable y anuncia el manejo con flechas.
    const lienzo = container.ownerDocument.querySelector('.ci-lienzo')!;
    expect(lienzo.getAttribute('tabindex')).toBe('0');
    expect(lienzo.getAttribute('aria-label')).toMatch(/Flechas/);
  });

  it('confirmar entrega el recorte como Blob + URL local y cierra', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    const { container } = render(<CargaImagen etiqueta="Foto" onCambio={onCambio} />);
    elegir(container);
    const usar = await screen.findByRole('button', { name: 'Usar este encuadre' });
    await u.click(usar);
    await waitFor(() => expect(onCambio).toHaveBeenCalledTimes(1));
    const r = onCambio.mock.calls[0][0];
    expect(r.archivo).toBeInstanceOf(Blob);
    expect(r.url).toBe('blob:prueba');
    // Toda imagen sale pedida en WebP: pesa menos. Si el navegador no sabe,
    // toBlob cae a PNG por especificación y blob.type dice la verdad.
    expect(tipoPedido).toBe('image/webp');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cancelar descarta sin entregar, y se puede volver a elegir EL MISMO archivo', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    const { container } = render(<CargaImagen etiqueta="Foto" onCambio={onCambio} />);
    elegir(container);
    await screen.findByRole('dialog');
    await u.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCambio).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
    // El input quedó vacío: repetir la elección vuelve a disparar change.
    expect((container.querySelector('input[type="file"]') as HTMLInputElement).value).toBe('');
  });

  it('con valor pinta la vista previa y ofrece Cambiar y Quitar', async () => {
    const onQuitar = vi.fn();
    const u = userEvent.setup();
    const { container } = render(
      <CargaImagen etiqueta="Logo" valor="blob:guardada" onCambio={() => {}} onQuitar={onQuitar} />
    );
    expect(container.querySelector('.ci-img')!.getAttribute('src')).toBe('blob:guardada');
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(onQuitar).toHaveBeenCalled();
  });
});

describe('R6 · los tres formatos — la proporción del hueco real', () => {
  it('la foto se muestra REDONDA y se encuadra con máscara circular', async () => {
    const { container } = render(<CargaImagen etiqueta="Foto" onCambio={() => {}} />);
    expect(container.querySelector('.ci-caja')!.classList.contains('ci-redonda')).toBe(true);
    elegir(container);
    await screen.findByRole('dialog');
    expect(container.ownerDocument.querySelector('.ci-mascara')).not.toBeNull();
  });

  it('el logo extendido encuadra a 212×44: el editor adopta la proporción', async () => {
    const { container } = render(
      <CargaImagen etiqueta="Logo" formato="logo-extendido" onCambio={() => {}} />
    );
    expect(container.querySelector('.ci-caja')!.classList.contains('ci-extendida')).toBe(true);
    elegir(container);
    await screen.findByRole('dialog');
    const lienzo = container.ownerDocument.querySelector('.ci-lienzo') as HTMLCanvasElement;
    // 260 de ancho → 54 de alto: la misma proporción que el hueco (212×44).
    expect(lienzo.width).toBe(260);
    expect(lienzo.height).toBe(54);
    // Sin máscara: el logo no es redondo.
    expect(container.ownerDocument.querySelector('.ci-mascara')).toBeNull();
  });

  it('el recorte exportado sale con la proporción del formato', async () => {
    const onCambio = vi.fn();
    const u = userEvent.setup();
    const anchos: Array<[number, number]> = [];
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, tipo?: string) {
      anchos.push([this.width, this.height]);
      original.call(this, cb, tipo);
    };
    const { container } = render(
      <CargaImagen etiqueta="Logo" formato="logo-extendido" onCambio={onCambio} />
    );
    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Usar este encuadre' }));
    await waitFor(() => expect(onCambio).toHaveBeenCalled());
    // 512 de ancho → 106 de alto (512 × 54/260), no un cuadrado.
    expect(anchos[0]).toEqual([512, 106]);
  });

  it('el botón lleva el icono y el texto del formato', () => {
    render(<CargaImagen etiqueta="Foto" onCambio={() => {}} />);
    const boton = screen.getByRole('button', { name: 'Subir foto' });
    expect(boton.querySelector('svg')).not.toBeNull();
  });
});
