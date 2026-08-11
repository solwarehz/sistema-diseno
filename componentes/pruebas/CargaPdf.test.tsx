/**
 * R43 · CARGA DE PDF — y R45/R46, que cambiaron su forma.
 *
 * Lo que jsdom NO puede y hay que decirlo: no hay `canvas`, así que la
 * recompresión de imágenes —lo que de verdad adelgaza un escaneo— no pasa por
 * aquí. Se verificó en el catálogo, con el navegador: 3,6 MB → 223 KB.
 *
 * Lo que sí se prueba es el contrato: dónde vive, qué se admite, qué se
 * rechaza, en qué orden se mide el peso máximo, y —lo que más importa desde
 * R46— CUÁNDO se entrega al formulario.
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

const boton = (nombre: RegExp | string) => screen.getByRole('button', { name: nombre });

function abrir() {
  fireEvent.click(boton(/Subir PDF/));
}

/** El boton de dentro del panel. Se llama «Subir» a secas. */
const subir = () => boton('Subir');
/** El segundo del pie, que MUTA entre «Cancelar» y «Grabar». */
const segundo = () => screen.getByRole('button', { name: /^(Grabar|Cancelar)$/ });

function elegir(container: HTMLElement, archivos: File[]) {
  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, { target: { files: archivos } });
}

function soltar(container: HTMLElement, archivos: File[]) {
  fireEvent.drop(container.querySelector('.cpdf-zona')!, { dataTransfer: { files: archivos } });
}

describe('Carga de PDF — dónde vive (R46)', () => {
  it('en un formulario es UN BOTÓN, no un recuadro: el panel no está hasta que se abre', () => {
    const { container } = render(<CargaPdf etiqueta="Acta de notas" onCambio={() => {}} />);
    expect(boton(/Subir PDF/)).toBeInTheDocument();
    expect(container.querySelector('.cpdf-panel')).toBeNull();
    expect(container.querySelector('.cpdf-zona')).toBeNull();
  });

  it('el panel se despliega EN SU SITIO, sin ventana flotante', () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    expect(container.querySelector('.cpdf-panel')).toBeInTheDocument();
    // Nada de `dialog`: el contenido del formulario se desplaza, no se tapa.
    expect(container.querySelector('dialog')).toBeNull();
    // Y abierto se ven EXACTAMENTE DOS botones de accion: el disparador de
    // fuera se retira. El tachito no cuenta: pertenece a su archivo.
    expect(container.querySelectorAll('.cpdf-pie button')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Subir PDF/ })).not.toBeInTheDocument();
  });

  it('R10 · cerrado no queda nada del panel en el árbol: se desmonta, no se colapsa', () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    fireEvent.click(segundo());
    expect(container.querySelector('.cpdf-panel')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Grabar' })).not.toBeInTheDocument();
  });

  it('`en-linea` enseña el recuadro directamente, sin botón que abrir', () => {
    const { container } = render(
      <CargaPdf etiqueta="Acta" presentacion="en-linea" onCambio={() => {}} />,
    );
    expect(container.querySelector('.cpdf-zona')).toBeInTheDocument();
    expect(container.querySelector('.cpdf-panel')).toBeNull();
  });
});

describe('Carga de PDF — cuándo se entrega al formulario', () => {
  it('R8 · elegir NO entrega: entrega Grabar', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    abrir();
    elegir(container, [comoPdf()]);

    await screen.findByText('acta.pdf');
    // Está elegido y a la vista, pero el formulario todavía no se ha enterado.
    expect(alCambiar).not.toHaveBeenCalled();

    fireEvent.click(segundo());
    expect(alCambiar).toHaveBeenCalledTimes(1);
    const lista: PdfListo[] = alCambiar.mock.calls[0][0];
    expect(lista).toHaveLength(1);
    expect(lista[0].archivo.name).toBe('acta.pdf');
    expect(lista[0].comprimido).toBe(true);
    expect(lista[0].pesoFinal).toBeLessThan(lista[0].pesoInicial);
    expect(lista[0].paginas).toBe(3);
  });

  it('cancelar tira el borrador y el formulario se queda como estaba', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');

    // CONSECUENCIA DEL BOTÓN QUE MUTA, y conviene tenerla escrita: con un PDF
    // válido puesto YA NO HAY «Cancelar» — ese botón es ahora «Grabar». La
    // salida sin guardar existe, pero son dos pasos: quitar el archivo con el
    // tachito y entonces el botón vuelve a ser «Cancelar».
    expect(segundo()).toHaveTextContent('Grabar');
    fireEvent.click(boton('Quitar acta.pdf'));
    expect(segundo()).toHaveTextContent('Cancelar');

    fireEvent.click(segundo());
    expect(alCambiar).not.toHaveBeenCalled();
    expect(screen.queryByText('acta.pdf')).not.toBeInTheDocument();
  });

  it('grabar cierra el panel y el archivo se queda en el resumen', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    fireEvent.click(segundo());

    expect(container.querySelector('.cpdf-panel')).toBeNull();
    expect(screen.getByText('acta.pdf')).toBeInTheDocument();
  });

  it('volver a abrir arranca del archivo YA GUARDADO, no en blanco', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    fireEvent.click(segundo());

    abrir();
    // Si arrancara vacío, parecería que se perdió lo que ya había.
    expect(container.querySelector('.cpdf-panel')!.textContent).toContain('acta.pdf');
    expect(segundo()).toHaveTextContent('Grabar');
  });

  it('`onGrabar` recibe la lista, después de `onCambio`', async () => {
    const orden: string[] = [];
    const { container } = render(
      <CargaPdf
        etiqueta="Acta"
        onCambio={() => orden.push('cambio')}
        onGrabar={() => { orden.push('grabar'); }}
      />,
    );
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    fireEvent.click(segundo());
    await waitFor(() => expect(orden).toEqual(['cambio', 'grabar']));
  });
});

describe('Carga de PDF — Grabar y Cancelar', () => {
  it('el segundo boton MUTA: Cancelar sin nada, Grabar con contenido valido', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    expect(segundo()).toHaveTextContent('Cancelar');
    elegir(container, [comoPdf()]);
    await waitFor(() => expect(segundo()).toHaveTextContent('Grabar'));
  });

  it('con un archivo inválido, Grabar sigue apagado y Cancelar SIGUE SIENDO LA SALIDA', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [disfrazado()]);

    expect(await screen.findByRole('alert')).toHaveTextContent('no es un PDF');
    expect(segundo()).toHaveTextContent('Cancelar');
    // Sin esto se quedaba encerrado: Grabar apagado y el otro botón volviendo
    // a abrir el diálogo de archivos.
    expect(segundo()).toBeEnabled();
  });

  it('quitar dentro del panel apaga Grabar otra vez', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [comoPdf()]);
    await waitFor(() => expect(segundo()).toHaveTextContent('Grabar'));
    fireEvent.click(boton('Quitar acta.pdf'));
    expect(segundo()).toHaveTextContent('Cancelar');
  });
});

describe('Carga de PDF — qué entra', () => {
  it('lo que no es PDF se rechaza AUNQUE la extensión y el type digan que lo es', async () => {
    const alCambiar = vi.fn();
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={alCambiar} />);
    abrir();
    elegir(container, [disfrazado()]);
    expect(await screen.findByRole('alert')).toHaveTextContent('no es un PDF');
    expect(alCambiar).not.toHaveBeenCalled();
  });

  it('soltar equivale a elegir', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    soltar(container, [comoPdf('constancia.pdf')]);
    expect(await screen.findByText('constancia.pdf')).toBeInTheDocument();
  });
});

describe('Carga de PDF — cuántos archivos (R45)', () => {
  it('por defecto es UNO, y elegir otro sustituye', async () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [comoPdf('primera.pdf')]);
    await screen.findByText('primera.pdf');
    elegir(container, [comoPdf('segunda.pdf')]);
    await screen.findByText('segunda.pdf');
    expect(screen.queryByText('primera.pdf')).not.toBeInTheDocument();
  });

  it('con varios se AÑADE hasta llenar', async () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Anexos" maximoArchivos={3} onCambio={alCambiar} />,
    );
    abrir();
    elegir(container, [comoPdf('a.pdf')]);
    await screen.findByText('a.pdf');
    elegir(container, [comoPdf('b.pdf')]);
    await screen.findByText('b.pdf');
    expect(screen.getByText('a.pdf')).toBeInTheDocument();

    fireEvent.click(segundo());
    expect(alCambiar.mock.calls[0][0]).toHaveLength(2);
  });

  it('si no caben todos NO se cogen los que quepan en silencio', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Anexos" maximoArchivos={2} onCambio={() => {}} />,
    );
    abrir();
    soltar(container, [comoPdf('a.pdf'), comoPdf('b.pdf'), comoPdf('c.pdf')]);

    expect(await screen.findByRole('alert')).toHaveTextContent('caben 2');
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
  });

  it('`sin-limite` no pone tope y lo dice en la pista', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Anexos" maximoArchivos="sin-limite" onCambio={() => {}} />,
    );
    abrir();
    expect(screen.getByText(/los que hagan falta/)).toBeInTheDocument();
    soltar(container, [comoPdf('a.pdf'), comoPdf('b.pdf'), comoPdf('c.pdf')]);
    await screen.findByText('c.pdf');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('Carga de PDF — el peso máximo se mide DESPUÉS de comprimir', () => {
  it('un PDF que solo cabe una vez comprimido se admite', async () => {
    const original = pdfCrudo(6);
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={() => {}} pesoMaximo={Math.floor(original.length / 2)} />,
    );
    abrir();
    elegir(container, [new File([original], 'grande.pdf', { type: 'application/pdf' })]);
    // Si el orden fuera el otro, esto se rechazaría. Es la prueba de la regla.
    expect(await screen.findByText('grande.pdf')).toBeInTheDocument();
  });

  it('si ni comprimido cabe, se dice cuánto pesa y cuánto cabía', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={() => {}} pesoMaximo={10} />,
    );
    abrir();
    elegir(container, [comoPdf()]);
    expect(await screen.findByRole('alert')).toHaveTextContent('el máximo es');
    expect(segundo()).toHaveTextContent('Cancelar');
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
    expect(screen.getByText(/La firma digital/)).toBeInTheDocument();
    abrir();
    expect(screen.getByText(/ya firmada por Dirección/)).toBeInTheDocument();
    expect(screen.getByText('Solo PDF · una hoja')).toBeInTheDocument();
  });

  it('sin pista propia, el peso máximo se dice solo', () => {
    render(<CargaPdf etiqueta="Acta" onCambio={() => {}} pesoMaximo={2 * 1024 * 1024} />);
    abrir();
    expect(screen.getByText(/máximo 2,0 MB cada uno una vez comprimido/)).toBeInTheDocument();
  });

  it('el tachito lleva el NOMBRE del archivo en su rótulo accesible', async () => {
    const { container } = render(
      <CargaPdf etiqueta="Anexos" maximoArchivos={2} onCambio={() => {}} />,
    );
    abrir();
    elegir(container, [comoPdf('acta-3B.pdf')]);
    await screen.findByText('acta-3B.pdf');
    elegir(container, [comoPdf('anexo-1.pdf')]);
    await screen.findByText('anexo-1.pdf');
    // Con dos «Quitar» iguales, un lector de pantalla no diría cuál es cuál.
    expect(boton('Quitar acta-3B.pdf')).toBeInTheDocument();
    expect(boton('Quitar anexo-1.pdf')).toBeInTheDocument();
  });

  it('los dos pesos NO se ven por defecto, y sí con mostrarPesos', async () => {
    const { container, rerender } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    expect(screen.queryByText(/% menos/)).not.toBeInTheDocument();

    rerender(<CargaPdf etiqueta="Acta" onCambio={() => {}} mostrarPesos />);
    expect(await screen.findByText(/% menos/)).toBeInTheDocument();
  });

  it('con `comprimir` apagado viaja el original y se dice por qué', async () => {
    const alCambiar = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={alCambiar} comprimir={false} />,
    );
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    fireEvent.click(segundo());

    const r: PdfListo = alCambiar.mock.calls[0][0][0];
    expect(r.comprimido).toBe(false);
    expect(r.motivo).toBe('sin-comprimir');
    expect(r.pesoFinal).toBe(r.pesoInicial);
  });

  it('quitar desde el resumen avisa al formulario con la lista nueva', async () => {
    const alCambiar = vi.fn();
    const alQuitar = vi.fn();
    const { container } = render(
      <CargaPdf etiqueta="Acta" onCambio={alCambiar} onQuitar={alQuitar} />,
    );
    abrir();
    elegir(container, [comoPdf()]);
    await screen.findByText('acta.pdf');
    fireEvent.click(segundo());
    alCambiar.mockClear();

    fireEvent.click(boton('Quitar acta.pdf'));
    expect(alQuitar).toHaveBeenCalledWith(0);
    expect(alCambiar).toHaveBeenCalledWith([]);
  });

  it('el control accesible es el botón: la zona no se tabula', () => {
    const { container } = render(<CargaPdf etiqueta="Acta" onCambio={() => {}} />);
    abrir();
    expect(container.querySelector('.cpdf-zona')).not.toHaveAttribute('tabindex');
    expect(container.querySelector('input[type="file"]')).toHaveAttribute('tabindex', '-1');
  });
});
