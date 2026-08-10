/**
 * R29: la zona de avisos. Lo que se prueba es lo que no es de estilo — que
 * las regiones vivas existan ANTES del primer aviso, que el error vaya a la
 * que interrumpe, y que el aviso de dentro no repita el rol de su región.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ZonaAvisos } from '../src/ZonaAvisos';
import { Aviso } from '../src/Estados';

describe('Zona de avisos — las dos regiones y su reparto', () => {
  it('las regiones alert y status existen desde la carga, VACÍAS', () => {
    const { container } = render(<ZonaAvisos />);
    // Una región viva creada en el momento del fallo no la anuncian la
    // mayoría de lectores: tienen que estar en el árbol desde el principio.
    expect(container.querySelector('.av-grupo[role="alert"]')).not.toBeNull();
    expect(container.querySelector('.av-grupo[role="status"]')).not.toBeNull();
  });

  it('el error va a la región que interrumpe; el resto, a la que espera', () => {
    const { container } = render(
      <ZonaAvisos>
        <Aviso tono="exito" texto="Se guardó" onCerrar={() => {}} />
        <Aviso tono="error" texto="No se guardó" onCerrar={() => {}} />
        <Aviso tono="info" texto="38 filas" onCerrar={() => {}} />
      </ZonaAvisos>
    );
    const alerta = container.querySelector('[role="alert"]')!;
    const estado = container.querySelector('[role="status"]')!;
    expect(alerta.querySelectorAll('.av').length).toBe(1);
    expect(alerta.textContent).toContain('No se guardó');
    expect(estado.querySelectorAll('.av').length).toBe(2);
  });

  it('el aviso DENTRO de la zona no repite rol: lo pone la región', () => {
    const { container } = render(
      <ZonaAvisos>
        <Aviso tono="error" texto="No se guardó" onCerrar={() => {}} />
      </ZonaAvisos>
    );
    // role=alert dentro de una región viva se comporta distinto en cada
    // lector: el rol vive en la región, no en el aviso.
    expect(container.querySelector('.av')!.getAttribute('role')).toBeNull();
  });

  it('el aviso SUELTO conserva su rol de siempre', () => {
    const { container } = render(
      <Aviso tono="error" texto="No se guardó" onCerrar={() => {}} />
    );
    expect(container.querySelector('.av')!.getAttribute('role')).toBe('alert');
    const { container: c2 } = render(
      <Aviso tono="exito" texto="Se guardó" onCerrar={() => {}} />
    );
    expect(c2.querySelector('.av')!.getAttribute('role')).toBe('status');
  });

  it('el error no caduca ni dentro de la zona', () => {
    vi.useFakeTimers();
    const onCerrar = vi.fn();
    render(
      <ZonaAvisos>
        <Aviso tono="error" texto="No se guardó" onCerrar={onCerrar} duracion={4000} />
      </ZonaAvisos>
    );
    vi.advanceTimersByTime(10_000);
    expect(onCerrar).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
