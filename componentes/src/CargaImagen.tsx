/**
 * CARGA DE IMAGEN — R35 (Control Administrativos, 2026-08-10)
 *
 * Elegir una imagen, ENCUADRARLA —mover y acercar hasta centrar lo que
 * importa— y entregar el recorte CUADRADO. La pieza visual completa que cada
 * producto construía a mano y les salió distinta dos veces: el input
 * escondido, el disparador, la vista previa, el vacío, el error y la nota.
 *
 * QUÉ ES Y QUÉ NO. Es la pieza visual: la subida —a qué ruta, cuándo, con qué
 * reintentos— es del producto. El componente entrega el recorte como Blob y
 * una URL local para pintarlo al instante; qué se hace con ellos no es suyo.
 *
 * CÓMO SE COMPONE, no se reconstruye:
 *   · El disparador y el zoom son `Boton` — teclado y foco gratis.
 *   · El editor vive en `Dialogo` — la primitiva accesible que ya existe,
 *     con `cerrarAlPulsarFuera` APAGADO: un encuadre a medias no se pierde
 *     por un clic fuera.
 *   · El encuadre se pinta en <canvas>. No es capricho: mover la imagen con
 *     `style` en línea está prohibido por el candado (§2.5.6), y el canvas
 *     dibuja desplazamiento y escala sin tocarlo.
 *
 * TECLADO, porque un recorte solo-ratón deja gente fuera: el lienzo es
 * enfocable, las flechas mueven el encuadre, y acercar/alejar son botones.
 *
 * La caja de vista previa no puede romperse: tamaño fijo por variante y el
 * recorte siempre es cuadrado, así que ni la proporción es un riesgo.
 */

import { useEffect, useRef, useState } from 'react';
import { Boton } from './Boton';
import { Dialogo } from './Dialogo';
import { Icono } from './Icono';

/**
 * Los TRES formatos son cerrados y llevan la proporción del hueco REAL donde
 * la imagen va a vivir — no un número que alguien eligió bonito:
 *
 *   foto             1:1 y se MUESTRA en círculo (avatar). El recorte sigue
 *                    siendo cuadrado: el círculo es presentación.
 *   logo-extendido   212×44 — el hueco de la marca en el lateral desplegado
 *                    (236 de lateral − 24 de relleno, alto de la caja ancha).
 *   logo-comprimido  1:1 — el cuadrado del lateral plegado.
 *
 * El editor adopta la proporción del formato: encuadrar un logo apaisado en
 * un cuadro cuadrado es encuadrar a ciegas.
 */
export type FormatoCarga = 'foto' | 'logo-extendido' | 'logo-comprimido';

const FORMATOS: Record<FormatoCarga, {
  vw: number; vh: number; redondo: boolean; icono: 'camara' | 'subir';
  subir: string; cambiar: string;
}> = {
  'foto':            { vw: 260, vh: 260, redondo: true,  icono: 'camara', subir: 'Subir foto', cambiar: 'Cambiar foto' },
  'logo-extendido':  { vw: 260, vh: 54,  redondo: false, icono: 'subir',  subir: 'Subir logo', cambiar: 'Cambiar logo' },
  'logo-comprimido': { vw: 260, vh: 260, redondo: false, icono: 'subir',  subir: 'Subir logo', cambiar: 'Cambiar logo' },
};

export type CargaImagenProps = {
  /** Qué imagen es: «Foto del legajo», «Logo de la empresa». Obligatoria:
   *  nombra el control y distingue dos cargas en la misma pantalla. */
  etiqueta: string;
  /** URL de la imagen YA recortada, si existe. La guarda el producto. */
  valor?: string | null;
  /** El recorte listo: el Blob para subir y una URL local para pintar ya. */
  onCambio: (r: { archivo: Blob; url: string }) => void;
  /** Sin ella no se ofrece quitar. */
  onQuitar?: () => void;
  /** Texto del estado sin imagen. */
  vacio?: string;
  /** Lado de la vista previa. */
  tamano?: 's' | 'm' | 'l';
  /** El error lo pinta el componente en su sitio, no el producto encima. */
  error?: string;
  /** Nota al pie: peso máximo, formatos, uso. */
  nota?: React.ReactNode;
  /** Formatos aceptados por el selector de archivos. */
  accept?: string;
  /** Resolución del recorte exportado: el ANCHO en píxeles. El alto sale de
   *  la proporción del formato. */
  lado?: number;
  /** Qué es lo que se sube. Fija proporción, forma e icono. */
  formato?: FormatoCarga;
  /** Sustituye el texto del botón si el del formato no encaja. */
  textoBoton?: string;
};

/** Cuánto mueve una flecha (px del lienzo) y cuánto acerca un paso de zoom. */
const PASO_MOVER = 8;
const PASO_ZOOM = 1.15;

export function CargaImagen({
  etiqueta,
  valor = null,
  onCambio,
  onQuitar,
  vacio = 'Sin imagen',
  tamano = 'm',
  error,
  nota,
  accept = 'image/*',
  lado = 512,
  formato = 'foto',
  textoBoton,
}: CargaImagenProps) {
  const F = FORMATOS[formato];
  const entrada = useRef<HTMLInputElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [urlCruda, setUrlCruda] = useState<string | null>(null);
  // El encuadre: desplazamiento del CENTRO de la imagen respecto al centro
  // del lienzo, en px de lienzo, y escala sobre el mínimo que lo cubre.
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [zoom, setZoom] = useState(1);
  const arrastre = useRef<{ x: number; y: number } | null>(null);

  const abierto = !!urlCruda;

  function elegirArchivo(archivo: File) {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => setImagen(img);
    img.src = url;
    setImagen(null);
    setDx(0); setDy(0); setZoom(1);
    setUrlCruda(url);
  }

  function cerrarEditor() {
    if (urlCruda) URL.revokeObjectURL(urlCruda);
    setUrlCruda(null);
    setImagen(null);
    // El input se vacía para que elegir EL MISMO archivo vuelva a disparar
    // `change`: repetir la elección tras cancelar es el camino normal.
    if (entrada.current) entrada.current.value = '';
  }

  /** La escala mínima cubre el marco ENTERO del formato: nunca hay bandas. */
  const base = imagen ? Math.max(F.vw / imagen.naturalWidth, F.vh / imagen.naturalHeight) : 1;
  const escala = base * zoom;

  /** El desplazamiento se acota para que la imagen siempre CUBRA el marco:
   *  centrar es mover hasta el borde, no sacar la foto del cuadro. */
  function acotar(v: number, dimension: number, marco: number): number {
    if (!imagen) return 0;
    const tope = Math.max(0, (dimension * escala - marco) / 2);
    return Math.min(tope, Math.max(-tope, v));
  }

  // Redibujo en cada cambio de encuadre. El canvas es la vista; el estado es
  // la verdad, y así el recorte final se calcula con los mismos números.
  useEffect(() => {
    const ctx = lienzo.current?.getContext('2d');
    if (!ctx || !imagen) return;
    ctx.clearRect(0, 0, F.vw, F.vh);
    const w = imagen.naturalWidth * escala;
    const h = imagen.naturalHeight * escala;
    ctx.drawImage(imagen, (F.vw - w) / 2 + dx, (F.vh - h) / 2 + dy, w, h);
  }, [imagen, dx, dy, escala, F.vw, F.vh]);

  function mover(mx: number, my: number) {
    if (!imagen) return;
    setDx((v) => acotar(v + mx, imagen.naturalWidth, F.vw));
    setDy((v) => acotar(v + my, imagen.naturalHeight, F.vh));
  }

  function acercar(factor: number) {
    if (!imagen) return;
    const z = Math.min(8, Math.max(1, zoom * factor));
    setZoom(z);
    // Al alejar, el encuadre se reacota con la escala nueva o quedarían
    // bandas vacías en el borde.
    const e = base * z;
    const topeX = Math.max(0, (imagen.naturalWidth * e - F.vw) / 2);
    const topeY = Math.max(0, (imagen.naturalHeight * e - F.vh) / 2);
    setDx((v) => Math.min(topeX, Math.max(-topeX, v)));
    setDy((v) => Math.min(topeY, Math.max(-topeY, v)));
  }

  function confirmar() {
    if (!imagen) return;
    // El recorte con LOS MISMOS números del encuadre: lo que se ve es lo que
    // sale, con la proporción del formato. `lado` es el ancho exportado.
    const corte = document.createElement('canvas');
    corte.width = lado;
    corte.height = Math.round((lado * F.vh) / F.vw);
    const ctx = corte.getContext('2d');
    if (!ctx) return;
    const anchoOrigen = F.vw / escala;
    const altoOrigen = F.vh / escala;
    const x = (imagen.naturalWidth - anchoOrigen) / 2 - dx / escala;
    const y = (imagen.naturalHeight - altoOrigen) / 2 - dy / escala;
    ctx.drawImage(imagen, x, y, anchoOrigen, altoOrigen, 0, 0, corte.width, corte.height);
    // Toda imagen sale en WebP: mismo recorte, bastante menos peso. Donde el
    // navegador no sepa producirlo, toBlob cae a PNG por especificación — el
    // producto lee blob.type y no asume extensión.
    corte.toBlob((blob) => {
      if (!blob) return;
      onCambio({ archivo: blob, url: URL.createObjectURL(blob) });
      cerrarEditor();
    }, 'image/webp', 0.85);
  }

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

  const idError = error ? 'ci-error-' + etiqueta.replace(/\s+/g, '-') : undefined;
  const esExtendida = formato === 'logo-extendido';
  const cajaClases = [
    'ci-caja',
    esExtendida ? 'ci-extendida' : `ci-${tamano}`,
    F.redondo ? 'ci-redonda' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="ci">
      <span className="ci-et">{etiqueta}</span>
      {/* La vista previa ES el hueco real: la foto en círculo (así se ve el
          avatar), el logo extendido a 212×44 (el hueco del lateral), el
          comprimido en cuadrado. Se ve cómo va a quedar, no una aproximación.
          La clase se arma FUERA del className: una comparación de formato ahí
          dentro se la toma por clase el candado de huérfanas, y con razón. */}
      <div className={cajaClases}>
        {valor ? (
          <img className="ci-img" src={valor} alt="" />
        ) : (
          <span className="ci-vacia">{vacio}</span>
        )}
      </div>
      <div className="ci-acciones">
        <Boton
          mini
          variante="neutra"
          className="btn-ic"
          ref={disparador}
          aria-describedby={idError}
          onClick={() => entrada.current?.click()}
        >
          <Icono nombre={F.icono} tam="control" />
          {textoBoton ?? (valor ? F.cambiar : F.subir)}
        </Boton>
        {valor && onQuitar && (
          <Boton mini variante="terciaria" onClick={onQuitar}>Quitar</Boton>
        )}
      </div>
      {error && <span className="ci-error" id={idError}>{error}</span>}
      {nota && <span className="ci-nota">{nota}</span>}

      {/* El input real, fuera del tabulador: el control accesible es el Boton.
          `hidden` no: algunos navegadores ignoran click() sobre hidden. */}
      <input
        ref={entrada}
        className="ci-entrada"
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) elegirArchivo(f); }}
      />

      <Dialogo
        abierto={abierto}
        titulo={`Encuadrar — ${etiqueta}`}
        origen={disparador}
        onCerrar={cerrarEditor}
        cerrarAlPulsarFuera={false}
        accion={imagen ? { texto: 'Grabar', onClick: confirmar } : undefined}
        textoCerrar="Cancelar"
      >
        <div className="ci-editor">
          <div className="ci-marco-editor">
          {/* El lienzo es enfocable y las flechas mueven: un recorte
              solo-ratón deja fuera al teclado. El zoom son botones por la
              misma razón. */}
          <canvas
            ref={lienzo}
            className="ci-lienzo"
            width={F.vw}
            height={F.vh}
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
          {/* La foto se muestra en círculo, así que se ENCUADRA en círculo:
              la máscara enseña qué quedará dentro. Es presentación —el
              recorte exportado sigue siendo el cuadrado— y usa la receta del
              velo: token del marco con opacidad, nada de colores a mano. */}
          {F.redondo && <div className="ci-mascara" aria-hidden="true" />}
          </div>
          <div className="ci-zoom">
            {/* Sin texto de ayuda a la vista (lo pidió el responsable): el
                manejo se descubre arrastrando, y para el lector de pantalla
                lo dice el aria-label del lienzo, que no ocupa sitio. */}
            <Boton mini variante="neutra" aria-label="Alejar" onClick={() => acercar(1 / PASO_ZOOM)}>−</Boton>
            <Boton mini variante="neutra" aria-label="Acercar" onClick={() => acercar(PASO_ZOOM)}>+</Boton>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}
