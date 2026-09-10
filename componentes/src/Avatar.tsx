/**
 * AVATAR
 *
 * El color NO significa nada: es ayuda de reconocimiento en una lista larga.
 * Usa la paleta de IDENTIDAD y no la de estado, porque un avatar rojo diría que
 * esa persona tiene un problema sin que nadie lo haya dicho.
 *
 * La asignación es determinista y por IDENTIFICADOR ESTABLE, nunca por nombre:
 * un cambio de apellido no debe cambiarle el color a nadie.
 */

import { useEffect, useState } from 'react';

export type TamanoAvatar = 's' | 'm' | 'l' | 'xl';

export type AvatarProps = {
  /** Identificador estable de la persona. NO el nombre. */
  id: string;
  /** «QUISPE MAMANI, Rosa». De aquí salen las iniciales. */
  nombre: string;
  /** URL de la foto. **Si falla la carga, se cae a las iniciales.** */
  foto?: string;
  tamano?: TamanoAvatar;
  className?: string;
};

/** Mismo reparto que el catálogo: 31 es primo y reparte bien cadenas cortas. */
export function colorIdentidad(id: string): 1 | 2 | 3 | 4 {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return ((n % 4) + 1) as 1 | 2 | 3 | 4;
}

/** Primera del apellido y primera del nombre: «QUISPE MAMANI, Rosa» → QR. */
export function iniciales(nombre: string): string {
  // R23 · SIN COMA, las dos primeras palabras.
  //
  // Antes se partía siempre por la coma, así que «Ada Lovelace» daba UNA letra.
  // Y no es un caso raro: un mismo producto formatea «Apellidos, Nombres» en
  // las fichas de personal y no lo hace en las cuentas de sistema, así que el
  // mismo avatar daba una letra en la barra y dos en la tabla de al lado.
  // Lo reportó Control Administrativos V2.0.
  const partes = nombre.includes(',')
    ? nombre.split(',')
    : nombre.trim().split(/\s+/);
  const a = partes[0]?.trim()[0] ?? '';
  const b = partes[1]?.trim()[0] ?? '';
  return (a + b).toUpperCase();
}

export function Avatar({ id, nombre, foto, tamano = 'm', className = '' }: AvatarProps) {
  const ini = iniciales(nombre);
  const [roto, setRoto] = useState(false);
  // Se rearma al cambiar de foto: si no, una persona con la imagen caída
  // dejaría rota la del siguiente que ocupe el mismo hueco de la lista.
  useEffect(() => { setRoto(false); }, [foto]);
  const clases = ['avatar', `avatar-${tamano}`, `avatar-${colorIdentidad(id)}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    // El avatar NO es un botón. Si abre algo, lo envuelve el control y el nombre
    // accesible lo pone ese control, no esto.
    <span className={clases} title={nombre}>
      {/* alt vacío a propósito: el nombre ya está en el título de la fila o en
          el texto de al lado. Con alt, el lector lo diría dos veces. */}
      {/* LA FOTO QUE NO CARGA CAE A LAS INICIALES, y hasta aquí no caía.
          El tipo lo prometía —«si falla la carga, quedan las iniciales
          debajo»— y era falso dos veces: no había `onError`, y con `foto`
          puesta las iniciales NI SIQUIERA ESTABAN en el DOM. Una URL firmada
          caducada o un 403 del almacén —lo normal en un colegio— pintaba el
          icono de imagen rota del navegador dentro del círculo, en la barra
          superior de todas las pantallas.
          El estado se rearma al cambiar `foto`: si no, una persona con la
          foto caída dejaría rota la del siguiente que ocupe el mismo hueco. */}
      {foto && !roto ? (
        <img src={foto} alt="" onError={() => setRoto(true)} />
      ) : (
        ini
      )}
    </span>
  );
}
