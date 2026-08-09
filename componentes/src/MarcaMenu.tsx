/**
 * MARCA DEL MENÚ — la imagen del cliente, sin que pueda romper el marco
 *
 * El cliente sube dos imágenes y entran. Nada más. No elige tamaño, ni
 * proporción, ni alineación: eso ya está decidido aquí y no se puede
 * sobrescribir desde el proyecto.
 *
 * POR QUÉ ESTÁ CERRADO. Este componente existe porque la imagen del cliente
 * **ya rompió el diseño en este proyecto**: el escudo llegó a dibujarse a
 * 1063px porque su altura solo estaba declarada bajo el estado plegado. Una
 * pieza que acepta un archivo de fuera no puede confiar en que el archivo sea
 * razonable.
 *
 * LO QUE SE GARANTIZA, y por qué es imposible que falle:
 *
 *   · La CAJA tiene tamaño fijo. El hueco existe antes de que la imagen cargue,
 *     así que el menú no da un salto cuando aparece.
 *   · La imagen lleva `max-width` y `max-height` al 100 % con las dimensiones
 *     en `auto`. Solo puede ENCOGERSE hasta caber; nunca estirarse.
 *   · `object-fit: contain` conserva la proporción pase lo que pase.
 *   · `overflow: hidden` en la caja es el cinturón, por si llegara un SVG con
 *     tamaño intrínseco absurdo.
 *
 * Da igual lo que suban: 4000×40, 40×4000 o un cuadrado. Cabe o se encoge.
 *
 * DOS COSAS QUE EL SISTEMA NO PUEDE ARREGLAR, y por eso avisa en vez de callar:
 *
 *   · Un logo ilegible a 40px. Ningún CSS lo resuelve — hace falta una versión
 *     compacta, que es justo para lo que sirve `comprimida`.
 *   · Una imagen que no carga. Ahí cae al nombre en texto: una imagen rota deja
 *     el menú sin identidad y sin explicación.
 */

import { useEffect, useState } from 'react';

export type MarcaMenuProps = {
  /** Nombre del colegio o del producto. Es el nombre accesible del enlace y el
   *  respaldo si la imagen no carga, así que es obligatorio. */
  titulo: string;
  /** Logotipo horizontal, para el menú desplegado. */
  expandida?: string;
  /** Versión compacta —el escudo—, para el menú plegado.
   *
   *  Si no se pasa, se usa `expandida` encogida en un cuadrado de 40px. Funciona
   *  y no rompe nada, pero un lockup apaisado a 40px casi nunca se lee: por eso
   *  se pide aparte. */
  comprimida?: string;
  /** `true` cuando el menú está plegado. Lo pasa `MarcoApp`. */
  plegado?: boolean;
  href: string;
  onIr?: () => void;
};

export function MarcaMenu({ titulo, expandida, comprimida, plegado = false, href, onIr }: MarcaMenuProps) {
  const [rota, setRota] = useState(false);
  const fuente = plegado ? comprimida ?? expandida : expandida;

  // Una imagen nueva merece otra oportunidad: sin esto, un fallo temporal de
  // red dejaría el texto para siempre aunque la imagen ya cargue.
  useEffect(() => { setRota(false); }, [fuente]);

  // Aviso en desarrollo, no fallo. Romper el arranque de un consumidor por una
  // proporción es desproporcionado; callarlo es peor, porque el logo se queda
  // ilegible y nadie sabe por qué.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (!expandida || comprimida) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > img.naturalHeight * 2.5) {
        console.warn(
          'MarcaMenu: la imagen es muy apaisada y con el menú plegado se encogerá ' +
          'hasta 40px de ancho, donde no se leerá. Pasa `comprimida` con una ' +
          'versión compacta —el escudo—.'
        );
      }
    };
    img.src = expandida;
  }, [expandida, comprimida]);

  return (
    <div className="lat-marca">
      <a
        className="lat-marca-enl"
        href={href}
        // El nombre accesible lo lleva el ENLACE, no la imagen. Por eso el
        // `alt` va vacío: con los dos, el lector lo diría dos veces.
        aria-label={`${titulo} — ir al inicio`}
        onClick={onIr ? (e) => { e.preventDefault(); onIr(); } : undefined}
      >
        <div className={['lat-marca-caja', plegado ? 'lat-marca-estrecha' : 'lat-marca-ancha'].join(' ')}>
          {fuente && !rota ? (
            <img src={fuente} alt="" onError={() => setRota(true)} />
          ) : (
            // Sin imagen o con la imagen rota: el nombre. Plegado se recorta a
            // las iniciales, que es lo que cabe en 40px.
            <span className="lat-marca-texto">{plegado ? iniciales(titulo) : titulo}</span>
          )}
        </div>
      </a>
    </div>
  );
}

/** Las iniciales de las tres primeras palabras. «Colegio Albert Einstein» → CAE. */
function iniciales(texto: string): string {
  return texto
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 3)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
