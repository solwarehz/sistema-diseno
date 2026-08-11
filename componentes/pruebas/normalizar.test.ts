/**
 * La frontera de escritura: cómo entra cada dato a la base, decidido UNA vez.
 * La prueba clave es la del nombre — la que protege la mayúscula del registro
 * que se exhibe ante inspección.
 */
import { describe, it, expect } from 'vitest';
import { alGuardar } from '../src/normalizar';

describe('alGuardar — la frontera de escritura', () => {
  it('todo recibe trim y colapso de espacios', () => {
    expect(alGuardar('  hola   mundo  ')).toBe('hola mundo');
  });

  it('texto genérico baja a minúsculas: da igual cómo lo escriba la API o la persona', () => {
    expect(alGuardar('  DoCeNtE  ')).toBe('docente');
  });

  it('el NOMBRE conserva su caja: minúsculas ahí es pérdida de dato', () => {
    expect(alGuardar('  QUISPE   MAMANI, Rosa ', 'nombre')).toBe('QUISPE MAMANI, Rosa');
  });

  it('el correo es canónico en minúsculas', () => {
    expect(alGuardar(' Jose.Pineda@AE.edu.pe ', 'correo')).toBe('jose.pineda@ae.edu.pe');
  });

  it('DNI y RUC quedan solo con dígitos: espacios y guiones son formato', () => {
    expect(alGuardar(' 71 234 567 ', 'dni')).toBe('71234567');
    expect(alGuardar('20-6008-8639-0', 'ruc')).toBe('20600886390');
  });

  it('el teléfono conserva su «+» inicial y suelta el resto del formato', () => {
    expect(alGuardar(' +51 943 123 456 ', 'telefono')).toBe('+51943123456');
    expect(alGuardar('(043) 42-1234', 'telefono')).toBe('043421234');
  });
});
