/**
 * R43 · CARGA DE PDF.
 *
 * Lo que jsdom NO puede y hay que decirlo: no hay `canvas`, así que la
 * recompresión de imágenes —lo que de verdad adelgaza un escaneo— no pasa por
 * aquí. Se verificó en el catálogo, con el navegador.
 *
 * Lo que sí se prueba es el contrato: qué se admite, qué se rechaza, en qué
 * orden se mide el peso máximo y qué se entrega.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CargaPdf, type PdfListo } from '../src/CargaPdf';
import { pdfCrudo } from './pdf-muestras';

const comoPdf = (nombre = 'acta.pdf', paginas = 3) =>
  new File([pdfCrudo(paginas)], nombre, { type: 'application/pdf' });

/** Un .docx renombrado: el caso que `accept` no ve y los bytes sí. */
const disfrazado = () =>
  new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3])], 'trampa.pdf', { type: 'application/pdf' });

function soltar(container: HTMLElement, archivos: File[]) {
  const zona = container.querySelector('.cpdf-zona')!;
  fireEvent.drop(zona, { dataTransfer: { files: archivos } });
}

function elegir(container: HTMLElement, archivos: File[]) {
  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: archivos } });
}

describe('Carga de PDF — qué entra', () => {
  it('un PDF de verdad se admite, se comprime y se entrega con los dos pesos', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta de notas" onCambio={alCambiar} />);
    elegir(container, [comoPdf()]);

    await waitFor(() => expect(alCambiar).toHaveBeenCalled());
    const r: PdfListo = alCambiar.mock.calls[0][0];
    expect(r.archivo.name).toBe('acta.pdf');
    expect(r.comprimido).toBe(true);
    expect(r.pesoFinal).toBeLessThan(r.pesoInicial);
    expect(r.paginas).toBe(3);
    expect(await screen.findByText('acta.pdf')).toBeInTheDocument();
  });

  it('lo que no es PDF se rechaza AUNQUE la extensión y el type digan que lo es', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    elegir(container, [disfrazado()]);

    expect(await screen.findByRole('alert')).toHaveTextContent('no es un PDF');
    expect(alCambiar).not.toHaveBeenCalled();
  });

  it('soltar equivale a elegir', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    soltar(container, [comoPdf('constancia.pdf')]);
    await waitFor(() => expect(alCambiar).toHaveBeenCalled());
  });

  it('dos archivos a la vez se rechazan en vez de coger el primero en silencio', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    soltar(container, [comoPdf('a.pdf'), comoPdf('b.pdf')]);

    expect(await screen.findByRole('alert')).toHaveTextContent('un solo archivo');
    expect(alCambiar).not.toHaveBeenCalled();
  });
});

describe('Carga de PDF — el peso máximo se mide DESPUÉS de comprimir', () => {
  it('un PDF que solo cabe una vez comprimido se admite', async () => {
    const original = pdfCrudo(6);
    const alCambiar = vi.fn();
    // Un tope por debajo del original y por encima del comprimido: si el orden
    // fuera el otro, esto se rechazaría. Es la prueba de la regla, no un caso.
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={alCambiar} pesoMaximo={Math.floor(original.length / 2)} />,
    );
    elegir(container, [new File([original], 'grande.pdf', { type: 'application/pdf' })]);

    await waitFor(() => expect(alCambiar).toHaveBeenCalled());
    expect(alCambiar.mock.calls[0][0].pesoFinal).toBeLessThan(original.length / 2);
  });

  it('si ni comprimido cabe, se dice cuánto pesa y cuánto cabía', async () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={alCambiar} pesoMaximo={10} />,
    );
    elegir(container, [comoPdf()]);

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('el máximo es');
    expect(alCambiar).not.toHaveBeenCalled();
  });
});

describe('Carga de PDF — lo que se ve', () => {
  it('la etiqueta, las instrucciones y la pista son del proyecto', () => {
    render(
      <CargaPdf
        etiqueta="Constancia firmada"
        onCambio={() => {}}
        instrucciones="Arrastra aquí el acta ya firmada por Dirección."
        pista="Solo PDF · una hoja"
        ayuda="La firma digital se comprueba al subirla."
      />,
    );
    expect(screen.getByText('Constancia firmada')).toBeInTheDocument();
    expect(screen.getByText(/ya firmada por Dirección/)).toBeInTheDocument();
    expect(screen.getByText('Solo PDF · una hoja')).toBeInTheDocument();
    expect(screen.getByText(/La firma digital/)).toBeInTheDocument();
  });

  it('sin pista propia, el peso máximo se dice solo', () => {
    render(<CargaPdf etiqueta="Acta" onCambio={() => {}} pesoMaximo={2 * 1024 * 1024} />);
    expect(screen.getByText(/máximo 2,0 MB una vez comprimido/)).toBeInTheDocument();
  });

  it('los dos pesos NO se ven por defecto, y sí con mostrarPesos', async () => {
    const { container, rerender } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    expect(screen.queryByText(/% menos/)).not.toBeInTheDocument();

    rerender(<CargaPdf etiqueta="Acta" onCambio={() => {}} mostrarPesos />);
    expect(await screen.findByText(/% menos/)).toBeInTheDocument();
  });

  it('con `comprimir` apagado viaja el original y se dice por qué', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} comprimir={false} />);
    elegir(container, [comoPdf()]);

    await waitFor(() => expect(alCambiar).toHaveBeenCalled());
    const r: PdfListo = alCambiar.mock.calls[0][0];
    expect(r.comprimido).toBe(false);
    expect(r.motivo).toBe('sin-comprimir');
    expect(r.pesoFinal).toBe(r.pesoInicial);
  });

  it('«Quitar» solo aparece si hay a dónde volver', async () => {
    const alQuitar = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={() => {}} onQuitar={alQuitar} />,
    );
    expect(screen.queryByRole('button', { name: 'Quitar' })).not.toBeInTheDocument();
    elegir(container, [comoPdf()]);
    (await screen.findByRole('button', { name: 'Quitar' })).click();
    expect(alQuitar).toHaveBeenCalled();
  });

  it('el control accesible es el botón: la zona no se tabula', () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    expect(container.querySelector('.cpdf-zona')).not.toHaveAttribute('tabindex');
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('button', { name: /Acta/ })).toBeInTheDocument();
  });
});
