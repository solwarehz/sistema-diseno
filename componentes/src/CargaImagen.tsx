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
  /** Resolución del recorte exportado, en píxeles de lado. */
  lado?: number;
};

/** Cuánto mueve una flecha (px del lienzo) y cuánto acerca un paso de zoom. */
const PASO_MOVER = 8;
const PASO_ZOOM = 1.15;
const LIENZO = 260;

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
}: CargaImagenProps) {
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

  /** La escala mínima cubre el cuadrado entero: nunca hay bandas vacías. */
  const base = imagen ? Math.max(LIENZO / imagen.naturalWidth, LIENZO / imagen.naturalHeight) : 1;
  const escala = base * zoom;

  /** El desplazamiento se acota para que la imagen siempre CUBRA el lienzo:
   *  centrar es mover hasta el borde, no sacar la foto del cuadro. */
  function acotar(v: number, dimension: number): number {
    if (!imagen) return 0;
    const tope = Math.max(0, (dimension * escala - LIENZO) / 2);
    return Math.min(tope, Math.max(-tope, v));
  }

  // Redibujo en cada cambio de encuadre. El canvas es la vista; el estado es
  // la verdad, y así el recorte final se calcula con los mismos números.
  useEffect(() => {
    const ctx = lienzo.current?.getContext('2d');
    if (!ctx || !imagen) return;
    ctx.clearRect(0, 0, LIENZO, LIENZO);
    const w = imagen.naturalWidth * escala;
    const h = imagen.naturalHeight * escala;
    ctx.drawImage(imagen, (LIENZO - w) / 2 + dx, (LIENZO - h) / 2 + dy, w, h);
  }, [imagen, dx, dy, escala]);

  function mover(mx: number, my: number) {
    if (!imagen) return;
    setDx((v) => acotar(v + mx, imagen.naturalWidth));
    setDy((v) => acotar(v + my, imagen.naturalHeight));
  }

  function acercar(factor: number) {
    if (!imagen) return;
    const z = Math.min(8, Math.max(1, zoom * factor));
    setZoom(z);
    // Al alejar, el encuadre se reacota con la escala nueva o quedarían
    // bandas vacías en el borde.
    const e = base * z;
    setDx((v) => Math.min(Math.max(0, (imagen.naturalWidth * e - LIENZO) / 2), Math.max(-Math.max(0, (imagen.naturalWidth * e - LIENZO) / 2), v)));
    setDy((v) => Math.min(Math.max(0, (imagen.naturalHeight * e - LIENZO) / 2), Math.max(-Math.max(0, (imagen.naturalHeight * e - LIENZO) / 2), v)));
  }

  function confirmar() {
    if (!imagen) return;
    // El recorte con LOS MISMOS números del encuadre: lo que se ve es lo que
    // sale. El factor pasa de px de lienzo a px de imagen original.
    const corte = document.createElement('canvas');
    corte.width = lado; corte.height = lado;
    const ctx = corte.getContext('2d');
    if (!ctx) return;
    const enOrigen = LIENZO / escala; // lado del cuadro visible, en px de la imagen
    const x = (imagen.naturalWidth - enOrigen) / 2 - dx / escala;
    const y = (imagen.naturalHeight - enOrigen) / 2 - dy / escala;
    ctx.drawImage(imagen, x, y, enOrigen, enOrigen, 0, 0, lado, lado);
    corte.toBlob((blob) => {
      if (!blob) return;
      onCambio({ archivo: blob, url: URL.createObjectURL(blob) });
      cerrarEditor();
    }, 'image/png');
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

  return (
    <div className="ci">
      <span className="ci-et">{etiqueta}</span>
      <div className={`ci-caja ci-${tamano}`}>
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
          ref={disparador}
          aria-describedby={idError}
          onClick={() => entrada.current?.click()}
        >
          {valor ? 'Cambiar' : 'Elegir imagen'}
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
        accion={imagen ? { texto: 'Usar este encuadre', onClick: confirmar } : undefined}
        textoCerrar="Cancelar"
      >
        <div className="ci-editor">
          {/* El lienzo es enfocable y las flechas mueven: un recorte
              solo-ratón deja fuera al teclado. El zoom son botones por la
              misma razón. */}
          <canvas
            ref={lienzo}
            className="ci-lienzo"
            width={LIENZO}
            height={LIENZO}
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
          <div className="ci-zoom">
            <Boton mini variante="neutra" aria-label="Alejar" onClick={() => acercar(1 / PASO_ZOOM)}>−</Boton>
            <Boton mini variante="neutra" aria-label="Acercar" onClick={() => acercar(PASO_ZOOM)}>+</Boton>
            <span className="ci-ayuda">Arrastra o usa las flechas para centrar. Se recorta el cuadro.</span>
          </div>
        </div>
      </Dialogo>
    </div>
  );
}
