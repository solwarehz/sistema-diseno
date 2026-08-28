/**
 * R109 · `CargaPdf` deja de decidir por el producto qué acepta.
 *
 * Tres cosas estaban clavadas: el `accept` del JSX, `esPdf()` en el bucle y un
 * `type: 'application/pdf'` que reetiquetaba el archivo reconstruido. La
 * tercera era la peor: un archivo que pasara la validación salía del componente
 * mintiendo sobre lo que era, y el servidor se lo creía.
 *
 * El caso que lo trajo: carga masiva de trabajadores en CSV, con `comprimir`
 * apagado y la validación de firma y separador en el servidor.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CargaPdf, type PdfListo } from '../src/CargaPdf';
import { pdfCrudo } from './pdf-muestras';

const csv = (nombre = 'trabajadores.csv') =>
  new File(['dni;nombre\n71602303;Ana\n'], nombre, { type: 'text/csv' });

const pdf = (nombre = 'acta.pdf') =>
  new File([pdfCrudo(1)], nombre, { type: 'application/pdf' });

const entradaDe = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement;

describe('R109 · accept', () => {
  it('por omisión sigue ofreciendo PDF: lo que ya funcionaba no cambia', () => {
    const { container } = render(
      <CargaPdf etiqueta="Acta" presentacion="en-linea" onCambio={() => {}} />,
    );
    expect(entradaDe(container).accept).toBe('application/pdf,.pdf');
  });

  it('el producto lo cambia, con el mismo nombre y forma que en CargaImagen', () => {
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" accept=".csv,text/csv" onCambio={() => {}} />,
    );
    expect(entradaDe(container).accept).toBe('.csv,text/csv');
  });
});

describe('R109 · validar', () => {
  it('sin `validar` sigue exigiendo %PDF- en los bytes, no la extensión', async () => {
    const alCambio = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" presentacion="en-linea" onCambio={alCambio} />,
    );
    // Un CSV renombrado a .pdf. Al renombrarlo, el navegador le pone `type`
    // por la extensión, así que el archivo miente por partida doble: en el
    // nombre y en el MIME. Solo los bytes lo delatan, que es de lo que va esto.
    await userEvent.upload(
      entradaDe(container),
      new File(['dni;nombre\n'], 'trampa.pdf', { type: 'application/pdf' }),
    );
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('trampa.pdf no es un PDF'));
    expect(alCambio).not.toHaveBeenCalled();
  });

  it('con `validar` manda el producto: acepta el CSV y rechaza el PDF', async () => {
    const alCambio = vi.fn();
    const soloCsv = async (f: File) => (f.name.endsWith('.csv') ? true as const : 'no es un CSV');
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" comprimir={false} accept=".csv,text/csv"
        validar={soloCsv} onCambio={alCambio} />,
    );
    // Se ARRASTRA, que es justo lo que el `accept` no filtra: el diálogo de
    // archivos no habría ofrecido este PDF, pero soltarlo encima sí entra. Es
    // la razón por la que `validar` mira el contenido y no la extensión.
    fireEvent.drop(container.querySelector('.cpdf-zona')!, { dataTransfer: { files: [pdf()] } });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('acta.pdf no es un CSV'));

    await userEvent.upload(entradaDe(container), csv());
    await waitFor(() => expect(alCambio).toHaveBeenCalled());
    const [lista] = alCambio.mock.calls.at(-1) as [PdfListo[]];
    expect(lista[0].archivo.name).toBe('trabajadores.csv');
  });

  it('el motivo se pega detrás del nombre, que es como está documentado', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" comprimir={false} accept=".csv,text/csv"
        validar={async () => 'está vacío'} onCambio={() => {}} />,
    );
    await userEvent.upload(entradaDe(container), csv());
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('trabajadores.csv está vacío'));
  });

  it('se llama UNA vez por archivo y antes de comprimir', async () => {
    const espia = vi.fn(async () => true as const);
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" comprimir={false} accept=".csv,text/csv"
        validar={espia} onCambio={() => {}} />,
    );
    await userEvent.upload(entradaDe(container), csv());
    await waitFor(() => expect(espia).toHaveBeenCalledTimes(1));
  });
});

describe('R109 · el archivo entregado no miente sobre lo que es', () => {
  it('conserva el `type` original en vez de reetiquetarlo como PDF', async () => {
    const alCambio = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" comprimir={false} accept=".csv,text/csv"
        validar={async () => true as const} onCambio={alCambio} />,
    );
    await userEvent.upload(entradaDe(container), csv());
    await waitFor(() => expect(alCambio).toHaveBeenCalled());
    const [lista] = alCambio.mock.calls.at(-1) as [PdfListo[]];
    expect(lista[0].archivo.type).toBe('text/csv');
  });

  it('y un PDF sigue saliendo como PDF: no se pierde nada por el camino', async () => {
    const alCambio = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" presentacion="en-linea" onCambio={alCambio} />,
    );
    await userEvent.upload(entradaDe(container), pdf());
    await waitFor(() => expect(alCambio).toHaveBeenCalled());
    const [lista] = alCambio.mock.calls.at(-1) as [PdfListo[]];
    expect(lista[0].archivo.type).toBe('application/pdf');
  });
});

describe('R111 · nombreTipo, icono y textoBoton en las DOS presentaciones', () => {
  it('con nombreTipo="CSV" ningún texto por omisión dice PDF', () => {
    const { container } = render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" nombreTipo="CSV"
        accept=".csv,text/csv" comprimir={false} pesoMaximo={2 * 1024 * 1024}
        onCambio={() => {}} />,
    );
    expect(container.textContent).not.toMatch(/PDF/);
    expect(screen.getByText(/Arrastra el CSV aquí/)).toBeInTheDocument();
    expect(screen.getByText(/Solo CSV/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Subir CSV/ })).toBeInTheDocument();
  });

  it('textoBoton SÍ manda en «en-linea» — antes se ignoraba en silencio', () => {
    render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" textoBoton="Elegir el padrón"
        onCambio={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /Elegir el padrón/ })).toBeInTheDocument();
  });

  it('y sigue mandando en «panel», que es donde ya funcionaba', () => {
    render(<CargaPdf etiqueta="Acta" textoBoton="Subir el acta" onCambio={() => {}} />);
    expect(screen.getByRole('button', { name: /Subir el acta/ })).toBeInTheDocument();
  });

  it('la pista no promete compresión cuando comprimir está apagado', () => {
    render(
      <CargaPdf etiqueta="Padrón" presentacion="en-linea" comprimir={false}
        pesoMaximo={2 * 1024 * 1024} onCambio={() => {}} />,
    );
    expect(screen.getByText(/máximo 2,0 MB cada uno./)).toBeInTheDocument();
    expect(screen.queryByText(/una vez comprimido/)).toBeNull();
  });
});
