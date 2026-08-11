/**
 * EDITOR DE ENCUADRE — la pieza que mueve, acerca y recorta
 *
 * NO ES UN COMPONENTE DEL SISTEMA: es interno, y por eso vive aquí. Lo que un
 * producto usa son `CargaImagen` y `CargaId`; esto es lo que las dos comparten.
 *
 * POR QUÉ EXISTE. Estaba dentro de `CargaImagen` —lienzo, arrastre, zoom,
 * flechas, acotado y exportación a WebP— y `CargaId` necesitaba exactamente lo
 * mismo con otro marco. Copiarlo habría dado dos editores que se parecen: el
 * día que uno arregle el acotado, el otro se queda con el defecto. Es
 * literalmente lo que la política de creación prohíbe («se usan los componentes
 * ya creados»), así que se extrajo antes de escribir el segundo.
 *
 * QUÉ SE QUEDA FUERA, a propósito: el `Dialogo` y su botón de Grabar. Cada
 * carga tiene su propio guion —una sola imagen en `CargaImagen`, dos caras
 * seguidas en `CargaId`— y ese guion manda sobre el pie del diálogo. Por eso
 * la orden de grabar entra por `ref`: el pie es del que llama.
 *
 * TECLADO, porque un recorte solo-ratón deja gente fuera: el lienzo es
 * enfocable, las flechas mueven, y acercar/alejar son botones.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Boton } from '../Boton';

/** Cuánto mueve una flecha (px del lienzo) y cuánto acerca un paso de zoom. */
export const PASO_MOVER = 8;
export const PASO_ZOOM = 1.15;

/** El hueco real donde la imagen va a vivir. `redondo` solo es presentación. */
export type MarcoEncuadre = { vw: number; vh: number; redondo?: boolean };

/** Lo que el que llama puede pedirle: graba con los números del encuadre. */
export type ManejoEncuadre = { grabar: () => void };

export type EditorEncuadreProps = {
  /** La imagen ya cargada. Con `null` el editor no pinta nada. */
  imagen: HTMLImageElement | null;
  marco: MarcoEncuadre;
  /** Ancho exportado en px. El alto sale de la proporción del marco. */
  lado: number;
  /** El recorte listo: Blob en WebP y URL local para pintar ya. */
  onGrabado: (r: { archivo: Blob; url: string }) => void;
};

export const EditorEncuadre = forwardRef<ManejoEncuadre, EditorEncuadreProps>(
  function EditorEncuadre({ imagen, marco, lado, onGrabado }, ref) {
    const lienzo = useRef<HTMLCanvasElement>(null);
    // El encuadre: desplazamiento del CENTRO de la imagen respecto al centro
    // del lienzo, en px de lienzo, y escala sobre el mínimo que lo cubre.
    const [dx, setDx] = useState(0);
    const [dy, setDy] = useState(0);
    const [zoom, setZoom] = useState(1);
    const arrastre = useRef<{ x: number; y: number } | null>(null);

    // Imagen nueva, encuadre nuevo: heredar el zoom de la anterior encuadra a
    // ciegas. Importa en `CargaId`, donde se encadenan dos caras seguidas.
    useEffect(() => { setDx(0); setDy(0); setZoom(1); }, [imagen]);

    /** La escala mínima cubre el marco ENTERO: nunca hay bandas. */
    const base = imagen
      ? Math.max(marco.vw / imagen.naturalWidth, marco.vh / imagen.naturalHeight)
      : 1;
    const escala = base * zoom;

    /** El desplazamiento se acota para que la imagen siempre CUBRA el marco:
     *  centrar es mover hasta el borde, no sacar la foto del cuadro. */
    function acotar(v: number, dimension: number, lim: number): number {
      if (!imagen) return 0;
      const tope = Math.max(0, (dimension * escala - lim) / 2);
      return Math.min(tope, Math.max(-tope, v));
    }

    // Redibujo en cada cambio de encuadre. El canvas es la vista; el estado es
    // la verdad, y así el recorte final se calcula con los mismos números.
    useEffect(() => {
      const ctx = lienzo.current?.getContext('2d');
      if (!ctx || !imagen) return;
      ctx.clearRect(0, 0, marco.vw, marco.vh);
      const w = imagen.naturalWidth * escala;
      const h = imagen.naturalHeight * escala;
      ctx.drawImage(imagen, (marco.vw - w) / 2 + dx, (marco.vh - h) / 2 + dy, w, h);
    }, [imagen, dx, dy, escala, marco.vw, marco.vh]);

    function mover(mx: number, my: number) {
      if (!imagen) return;
      setDx((v) => acotar(v + mx, imagen.naturalWidth, marco.vw));
      setDy((v) => acotar(v + my, imagen.naturalHeight, marco.vh));
    }

    function acercar(factor: number) {
      if (!imagen) return;
      const z = Math.min(8, Math.max(1, zoom * factor));
      setZoom(z);
      // Al alejar, el encuadre se reacota con la escala nueva o quedarían
      // bandas vacías en el borde.
      const e = base * z;
      const topeX = Math.max(0, (imagen.naturalWidth * e - marco.vw) / 2);
      const topeY = Math.max(0, (imagen.naturalHeight * e - marco.vh) / 2);
      setDx((v) => Math.min(topeX, Math.max(-topeX, v)));
      setDy((v) => Math.min(topeY, Math.max(-topeY, v)));
    }

    function grabar() {
      if (!imagen) return;
      // El recorte con LOS MISMOS números del encuadre: lo que se ve es lo que
      // sale, con la proporción del marco. `lado` es el ancho exportado.
      const corte = document.createElement('canvas');
      corte.width = lado;
      corte.height = Math.round((lado * marco.vh) / marco.vw);
      const ctx = corte.getContext('2d');
      if (!ctx) return;
      const anchoOrigen = marco.vw / escala;
      const altoOrigen = marco.vh / escala;
      const x = (imagen.naturalWidth - anchoOrigen) / 2 - dx / escala;
      const y = (imagen.naturalHeight - altoOrigen) / 2 - dy / escala;
      ctx.drawImage(imagen, x, y, anchoOrigen, altoOrigen, 0, 0, corte.width, corte.height);
      // Toda imagen sale en WebP: mismo recorte, bastante menos peso. Donde el
      // navegador no sepa producirlo, toBlob cae a PNG por especificación — el
      // producto lee blob.type y no asume extensión.
      corte.toBlob((blob) => {
        if (!blob) return;
        onGrabado({ archivo: blob, url: URL.createObjectURL(blob) });
      }, 'image/webp', 0.85);
    }

    useImperativeHandle(ref, () => ({ grabar }));

    function teclas(e: React.KeyboardEvent) {
      const salto: Record<string, [number, number]> = {
        ArrowLeft: [PASO_MOVER, 0], ArrowRight: [-PASO_MOVER, 0],
        ArrowUp: [0, PASO_MOVER], ArrowDown: [0, -PASO_MOVER],
      };
      if (e.key in salto) {
        e.preventDefault();
        mover(...salto[e.key]);
      }
    }

    return (
      <div className="ci-editor">
        <div className="ci-marco-editor">
          {/* El lienzo es enfocable y las flechas mueven: un recorte
              solo-ratón deja fuera al teclado. El zoom son botones por la
              misma razón. */}
          <canvas
            ref={lienzo}
            className="ci-lienzo"
            width={marco.vw}
            height={marco.vh}
            tabIndex={0}
            role="img"
            aria-label="Encuadre. Flechas para mover la imagen; los botones acercan y alejan."
            onKeyDown={teclas}
            onPointerDown={(e) => {
              arrastre.current = { x: e.clientX, y: e.clientY };
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!arrastre.current) return;
              mover(e.clientX - arrastre.current.x, e.clientY - arrastre.current.y);
              arrastre.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={() => { arrastre.current = null; }}
          />
          {/* La foto se muestra en círculo, así que se ENCUADRA en círculo: la
              máscara enseña qué quedará dentro. Es presentación —el recorte
              exportado sigue siendo rectangular— y usa la receta del velo:
              token del marco con opacidad, nada de colores a mano. */}
          {marco.redondo && <div className="ci-mascara" aria-hidden="true" />}
        </div>
        <div className="ci-zoom">
          {/* Sin texto de ayuda a la vista (lo pidió el responsable): el manejo
              se descubre arrastrando, y para el lector de pantalla lo dice el
              aria-label del lienzo, que no ocupa sitio. */}
          <Boton mini variante="neutra" aria-label="Alejar" onClick={() => acercar(1 / PASO_ZOOM)}>−</Boton>
          <Boton mini variante="neutra" aria-label="Acercar" onClick={() => acercar(PASO_ZOOM)}>+</Boton>
        </div>
      </div>
    );
  }
);
