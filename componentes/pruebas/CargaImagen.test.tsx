/**
 * R35: la carga de imagen con encuadre. jsdom ni carga imágenes ni dibuja,
 * así que se suplen las tres piezas justas —Image, createObjectURL y el
 * canvas— y se prueba el CONTRATO: qué se abre, qué se entrega, qué se
 * alcanza con teclado. La geometría del recorte no se puede probar aquí y
 * DECIRLO importa: se verificó a mano en el catálogo.
 *
 * v1.78.0 · TODOS ESTOS CASOS PIDEN `presentacion="caja"` A PROPÓSITO. Lo que
 * prueban es la vista previa a tamaño real —el avatar de reserva, la
 * proporción de cada formato, el hueco rotulado—, y desde la v1.78.0 el
 * defecto es `fila`, para que las tres cargas arranquen iguales. Lo que hace
 * la fila se prueba en `FilaCarga.test.tsx`.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CargaImagen } from '../src/CargaImagen';
import { Avatar } from '../src/Avatar';

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
      <CargaImagen presentacion="caja" etiqueta="Foto del legajo" onCambio={() => {}}
        vacio="Aún sin foto" nota="JPG o PNG · máx. 2 MB" error="Pesa 6 MB y el máximo es 2 MB." />
    );
    expect(screen.getByText('Aún sin foto')).toBeTruthy();
    expect(screen.getByText('JPG o PNG · máx. 2 MB')).toBeTruthy();
    // El error lo pinta el componente y DESCRIBE al disparador.
    const boton = screen.getByRole('button', { name: 'Subir foto' });
    expect(container.querySelector('.cx-error')!.id).toBe(boton.getAttribute('aria-describedby'));
  });

  /* R71 · La nota es instrucción para ELEGIR. Cumplida esa función, se queda
     debajo de cada campo lleno ocupando sitio y sin decir nada nuevo. Lo
     reportó el responsable con una nota de tres frases que no cabía. */
  it('R71 · con imagen ya puesta, la nota se retira', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Logo" onCambio={() => {}}
        valor="/logo.webp" nota="Hasta 8 MB." />
    );
    expect(container.querySelector('.ci-img')).toBeTruthy();
    expect(screen.queryByText('Hasta 8 MB.')).toBeNull();
  });

  it('R71 · con el avatar de reserva la nota SIGUE, porque la foto aún falta', () => {
    render(
      <CargaImagen presentacion="caja" etiqueta="Foto" formato="foto" onCambio={() => {}}
        persona={{ id: '71234567', nombre: 'QUISPE MAMANI, Rosa' }}
        nota="Hasta 8 MB." />
    );
    expect(screen.getByText('Hasta 8 MB.')).toBeTruthy();
  });

  it('R71 · al quitar la imagen, la nota vuelve', () => {
    const { rerender } = render(
      <CargaImagen presentacion="caja" etiqueta="Logo" onCambio={() => {}} valor="/logo.webp" nota="Hasta 8 MB." />
    );
    expect(screen.queryByText('Hasta 8 MB.')).toBeNull();
    rerender(<CargaImagen presentacion="caja" etiqueta="Logo" onCambio={() => {}} valor={null} nota="Hasta 8 MB." />);
    expect(screen.getByText('Hasta 8 MB.')).toBeTruthy();
  });

  it('R71 · el error NO se retira con la imagen: eso hay que verlo siempre', () => {
    render(
      <CargaImagen presentacion="caja" etiqueta="Logo" onCambio={() => {}} valor="/logo.webp"
        nota="Hasta 8 MB." error="No se pudo guardar." />
    );
    expect(screen.queryByText('Hasta 8 MB.')).toBeNull();
    expect(screen.getByText('No se pudo guardar.')).toBeTruthy();
  });

  it('elegir archivo abre el editor en un Dialogo que no se pierde por un clic fuera', async () => {
    const { container } = render(<CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}} />);
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
    const { container } = render(<CargaImagen presentacion="caja" etiqueta="Foto" onCambio={onCambio} />);
    elegir(container);
    const usar = await screen.findByRole('button', { name: 'Grabar' });
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
    const { container } = render(<CargaImagen presentacion="caja" etiqueta="Foto" onCambio={onCambio} />);
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
      <CargaImagen presentacion="caja" etiqueta="Logo" valor="blob:guardada" onCambio={() => {}} onQuitar={onQuitar} />
    );
    expect(container.querySelector('.ci-img')!.getAttribute('src')).toBe('blob:guardada');
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeTruthy();
    await u.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(onQuitar).toHaveBeenCalled();
  });
});

describe('R6 · los tres formatos — la proporción del hueco real', () => {
  it('la foto se muestra REDONDA y se encuadra con máscara circular', async () => {
    const { container } = render(<CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}} />);
    expect(container.querySelector('.ci-caja')!.classList.contains('ci-redonda')).toBe(true);
    elegir(container);
    await screen.findByRole('dialog');
    expect(container.ownerDocument.querySelector('.ci-mascara')).not.toBeNull();
  });

  it('el logo extendido encuadra a 212×44: el editor adopta la proporción', async () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Logo" formato="logo-extendido" onCambio={() => {}} />
    );
    expect(container.querySelector('.ci-caja')!.classList.contains('ci-extendida')).toBe(true);
    elegir(container);
    await screen.findByRole('dialog');
    const lienzo = container.ownerDocument.querySelector('.ci-lienzo') as HTMLCanvasElement;
    // 318×66: ancho ÚNICO para los tres formatos, y proporción EXACTA del
    // hueco (53:11, sin redondeo). El alto es lo único que varía.
    expect(lienzo.width).toBe(318);
    expect(lienzo.height).toBe(66);
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
      <CargaImagen presentacion="caja" etiqueta="Logo" formato="logo-extendido" onCambio={onCambio} />
    );
    elegir(container);
    await u.click(await screen.findByRole('button', { name: 'Grabar' }));
    await waitFor(() => expect(onCambio).toHaveBeenCalled());
    // 512 de ancho → 106 de alto (512 × 66/318), no un cuadrado.
    expect(anchos[0]).toEqual([512, 106]);
  });

  it('el botón lleva el icono y el texto del formato', () => {
    render(<CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}} />);
    const boton = screen.getByRole('button', { name: 'Subir foto' });
    expect(boton.querySelector('svg')).not.toBeNull();
  });
});

/**
 * R7 y R8 (pedido R50) · el hueco de una persona sin foto.
 *
 * Lo pidió el responsable: «cuando no se tenga foto del trabajador y hay data
 * del trabajador, que se vea el componente avatar, y cuando se carga la foto
 * se reemplaza por la foto; eso solo para fotos del trabajador o persona».
 *
 * Se prueba que es EL MISMO `Avatar` del sistema —sus clases, su color por
 * identificador, sus iniciales—, no un círculo parecido: si alguien lo
 * reconstruyera aquí, la misma persona se pintaría de dos colores según la
 * pantalla, que es justo lo que el avatar existe para impedir.
 */
describe('R7 (pedido R50) · sin foto y con persona, el hueco es el avatar', () => {
  const PERSONA = { id: 'u-1', nombre: 'PINEDA, José Isidro' }; // iniciales: PJ

  it('sin foto y con persona: avatar con sus iniciales, no el texto «Sin foto»', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" persona={PERSONA} onCambio={() => {}} vacio="Sin foto" />
    );
    const av = container.querySelector('.ci-caja .avatar')!;
    expect(av).not.toBeNull();
    expect(av.textContent).toBe('PJ');
    expect(av.classList.contains('ci-avatar')).toBe(true);
    // El color sale del identificador, y es el mismo que pinta el Avatar suelto.
    expect([...av.classList].find((c) => /^avatar-\d$/.test(c))).toBe(
      [...render(<Avatar id={PERSONA.id} nombre={PERSONA.nombre} />).container
        .firstElementChild!.classList].find((c) => /^avatar-\d$/.test(c))
    );
    // El texto de vacío ya no se pinta como pista…
    expect(container.querySelector('.cx-vacio')).toBeNull();
    // …pero el estado se sigue ANUNCIANDO: el avatar se ve, no dice que falte.
    expect(container.querySelector('.sr-solo')!.textContent).toBe('Sin foto');
  });

  it('con foto manda la foto: el avatar no se queda debajo', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" persona={PERSONA} valor="blob:foto" onCambio={() => {}} />
    );
    expect(container.querySelector('.ci-caja img.ci-img')).not.toBeNull();
    expect(container.querySelector('.ci-caja .avatar')).toBeNull();
  });

  it('sin persona se queda el texto: no se inventa una identidad', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}} vacio="Sin foto" />
    );
    expect(container.querySelector('.ci-caja .avatar')).toBeNull();
    expect(container.querySelector('.cx-vacio')!.textContent).toBe('Sin foto');
  });

  it('SOLO para foto: un logo con persona sigue sin avatar', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Logo" formato="logo-extendido" persona={PERSONA}
        onCambio={() => {}} vacio="Sin logo" />
    );
    expect(container.querySelector('.ci-caja .avatar')).toBeNull();
    expect(container.querySelector('.cx-vacio')!.textContent).toBe('Sin logo');
  });
});

/**
 * R55 · la foto de la persona viene EN `persona`.
 *
 * Lo reportó el responsable desde la pantalla de contrato: al buscar por DNI
 * salía el avatar **aunque el trabajador ya tuviera foto**. La trampa era mía:
 * `persona` llevaba quién es pero no su retrato, así que al enganchar el
 * resultado de la consulta lo natural era pasar `persona` y dejarse `valor`.
 */
describe('R55 · foto si la hay, avatar si no — con una sola prop', () => {
  it('con `persona.foto` se pinta la foto, no las iniciales', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}}
        persona={{ id: 'u-1', nombre: 'PINEDA, José Isidro', foto: 'blob:retrato' }} />
    );
    const img = container.querySelector('.ci-caja img.ci-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('blob:retrato');
    expect(container.querySelector('.ci-caja .avatar')).toBeNull();
    // Y el botón dice «Cambiar», que es lo que toca cuando ya hay foto.
    expect(screen.getByRole('button', { name: 'Cambiar foto' })).toBeInTheDocument();
  });

  it('sin `persona.foto` sigue el avatar: la regla no cambia', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" onCambio={() => {}}
        persona={{ id: 'u-1', nombre: 'PINEDA, José Isidro' }} />
    );
    expect(container.querySelector('.ci-caja .avatar')).not.toBeNull();
    expect(container.querySelector('.ci-caja img.ci-img')).toBeNull();
  });

  it('`valor` manda sobre la foto de la ficha: es el recorte recién hecho', () => {
    const { container } = render(
      <CargaImagen presentacion="caja" etiqueta="Foto" valor="blob:recien" onCambio={() => {}}
        persona={{ id: 'u-1', nombre: 'PINEDA, José Isidro', foto: 'blob:vieja' }} />
    );
    const img = container.querySelector('.ci-caja img.ci-img') as HTMLImageElement;
    expect(img.src).toContain('blob:recien');
  });
});
