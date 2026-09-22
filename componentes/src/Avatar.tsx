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

/**
 * R157 · `fluido` lo añade una rejilla densa: **manda la celda, no la escala.**
 *
 * Los cuatro tamaños fijos son la escala del sistema y siguen siendo lo normal.
 * Pero en una cuadrícula de seis columnas en un teléfono, el avatar tiene que
 * ocupar lo que le dejen —con un tope, para que en una pantalla ancha no crezca
 * hasta ser un retrato—. Lo pidió Tableros con el dato delante: 6 columnas a
 * 375 px son ~52 px de celda, y ninguno de los cuatro encaja ahí.
 */
export type TamanoAvatar = 's' | 'm' | 'l' | 'xl' | 'fluido';

/**
 * R157 · EL ANILLO DE ESTADO, y va con los TONOS DEL SISTEMA.
 *
 * Lo pidieron como `'presente' | 'ausente'`, que es el vocabulario de su
 * pantalla. Entra con el del sistema —el mismo de `Chip`— porque el anillo no
 * sabe de asistencia: el mismo verde sirve para «está dentro», «en línea»,
 * «pagado» y «activo», y el mismo rojo para sus contrarios. Un tipo que dijera
 * `presente` obligaría al siguiente producto a llamar «presente» a una factura
 * cobrada.
 *
 * **El color no va solo.** El anillo REFUERZA una distinción que ya tiene que
 * estar dicha con texto en otro sitio —un `Segmentado` con su recuento, un
 * rótulo debajo—, nunca la sostiene él. Es la misma regla que `TarjetaPersona`
 * lleva escrita: «el color solo no distingue nada».
 */
export type EstadoAvatar = 'exito' | 'aviso' | 'error' | 'info';

export type AvatarProps = {
  /** Identificador estable de la persona. NO el nombre. */
  id: string;
  /** «QUISPE MAMANI, Rosa». De aquí salen las iniciales. */
  nombre: string;
  /** URL de la foto. **Si falla la carga, se cae a las iniciales.** */
  foto?: string;
  tamano?: TamanoAvatar;
  /**
   * R157 · Anillo de estado alrededor del avatar. Ver `EstadoAvatar`: refuerza
   * una distinción dicha con texto en otro sitio, no la sostiene él solo.
   */
  estado?: EstadoAvatar;
  /**
   * R157 · **Relieve.** `plana` por omisión. Con `relieve`, el avatar se
   * despega del fondo con la elevación del sistema.
   *
   * Lo pidió Tableros —«las fotos con sombra, que parezca 3D»— y entra porque
   * en una rejilla de fotos pequeñas el relieve es lo que separa una cuadrícula
   * de personas de una hoja de cálculo. Sale de `--sombra-relieve`, que es la
   * escala del sistema: si cada producto inventa su sombra, la misma pantalla
   * acaba con tres profundidades distintas.
   */
  elevacion?: 'plana' | 'relieve';
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

export function Avatar({
  id, nombre, foto, tamano = 'm', estado, elevacion = 'plana', className = '',
}: AvatarProps) {
  const ini = iniciales(nombre);
  const [roto, setRoto] = useState(false);
  // Se rearma al cambiar de foto: si no, una persona con la imagen caída
  // dejaría rota la del siguiente que ocupe el mismo hueco de la lista.
  useEffect(() => { setRoto(false); }, [foto]);
  const clases = [
    'avatar', `avatar-${tamano}`, `avatar-${colorIdentidad(id)}`,
    estado && `avatar-estado avatar-${estado}`,
    elevacion === 'relieve' && 'avatar-relieve',
    className,
  ].filter(Boolean).join(' ');
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
