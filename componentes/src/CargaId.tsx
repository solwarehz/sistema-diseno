/**
 * CARGA DE DOCUMENTO DE IDENTIDAD — R51
 *
 * Las DOS CARAS del documento, encuadradas con su proporción real y entregadas
 * en WebP. Mismo guion que `CargaPdf` —botón, diálogo, borrador que solo se
 * confirma al final— y mismo editor que `CargaImagen`, porque es el mismo.
 *
 * EL GUION, tal como se pidió:
 *   1 · Un botón «Subir ID» con su icono. Abre el diálogo.
 *   2 · Se elige la imagen del ANVERSO, se encuadra —mover, acercar, flechas—
 *       y se graba.
 *   3 · El mismo diálogo pide entonces el REVERSO. Se graba, y se cierra.
 *   4 · Las dos miniaturas quedan al costado del botón, y el botón se
 *       DESACTIVA: ya está entregado.
 *   5 · Pulsar una miniatura la abre en grande; se cierra y se oculta.
 *
 * LA PROPORCIÓN NO ES UN NÚMERO BONITO. El documento de identidad es una
 * tarjeta **ID-1** (ISO/IEC 7810): **85,60 × 53,98 mm**, que da 1,5858:1. El
 * marco del editor mide 428×270 px — 1,5852:1, cuatro milésimas por debajo del
 * nominal y el error más pequeño que dan dos enteros de ese tamaño. Encuadrar
 * un carné en un cuadrado sería encuadrar a ciegas, que es la misma razón por
 * la que `CargaImagen` cerró sus tres formatos.
 *
 * POR QUÉ EL BOTÓN SE QUEDA DESACTIVADO Y NO SE REACTIVA SOLO. Lo pidió el
 * responsable: **volver a subir se autoriza desde atrás**, no desde la
 * pantalla. Un documento de identidad ya entregado no se reemplaza porque a
 * alguien se le ocurra; se reemplaza cuando el sistema que lo custodia dice que
 * toca. Por eso `bloqueado` es una prop: el producto la baja cuando su back se
 * lo indica, y hasta entonces el botón no vuelve.
 *
 * QUÉ ES Y QUÉ NO. Es la pieza visual. La subida —a qué ruta, cuándo, con qué
 * reintentos— y la custodia del dato son del producto. Aquí se entregan dos
 * Blobs y dos URL locales para pintar ya.
 *
 * CÓMO SE COMPONE, no se reconstruye: `Boton`, `Dialogo`, `Icono` y
 * `EditorEncuadre` —el mismo que usa `CargaImagen`, extraído de allí al
 * necesitarlo dos veces—. Aquí no hay ni un lienzo propio.
 */

import { useRef, useState } from 'react';
import { Boton } from './Boton';
import { Dialogo } from './Dialogo';
import { Icono } from './Icono';
import { EditorEncuadre, type ManejoEncuadre } from './interno/EditorEncuadre';
import { FilaCarga, AdjuntoImagen } from './interno/FilaCarga';

/** ID-1 (ISO/IEC 7810): 85,60 × 53,98 mm. 428×270 da 1,5852 contra 1,5858. */
export const MARCO_ID = { vw: 428, vh: 270 } as const;

/** Una cara ya encuadrada: lo que se sube y lo que se pinta mientras tanto. */
export type CaraId = { archivo: Blob; url: string };

/** Cuál de las dos caras se está pidiendo. */
export type PasoId = 'anverso' | 'reverso';

const PASOS: Record<PasoId, { titulo: string; pide: string }> = {
  anverso: { titulo: 'Anverso', pide: 'Elegir la imagen del anverso' },
  reverso: { titulo: 'Reverso', pide: 'Elegir la imagen del reverso' },
};

export type CargaIdProps = {
  /** Nombra el control. Dos documentos en la misma pantalla no se confunden. */
  etiqueta?: string;
  /** URL del anverso ya guardado, si el producto lo tiene. */
  anverso?: string | null;
  /** URL del reverso ya guardado. */
  reverso?: string | null;
  /**
   * Las dos caras, juntas y al final. **No se avisa cara a cara**: hasta que
   * el reverso está grabado esto es un borrador, y un anverso suelto en el
   * expediente es un documento a medias que nadie pidió — la misma regla que
   * `CargaPdf` (R46).
   */
  onCambio: (r: { anverso: CaraId; reverso: CaraId }) => void;
  /**
   * Si el botón puede volver a usarse. **Lo decide el producto con lo que le
   * diga su back.** Sin esta prop el componente se gobierna solo: con las dos
   * caras entregadas, el botón se desactiva.
   */
  bloqueado?: boolean;
  /** El error se pinta en su sitio, no encima. */
  error?: string;
  /** Nota al pie: peso máximo, formatos, para qué se pide. */
  nota?: React.ReactNode;
  /** Ancho exportado en px. 1024 por defecto: un documento hay que LEERLO. */
  lado?: number;
  /** Formatos aceptados por el selector de archivos. */
  accept?: string;
};

export function CargaId({
  etiqueta = 'Documento de identidad',
  anverso = null,
  reverso = null,
  onCambio,
  bloqueado,
  error,
  nota,
  lado = 1024,
  accept = 'image/*',
}: CargaIdProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const editor = useRef<ManejoEncuadre>(null);
  // Apunta a la miniatura pulsada, que cambia según cuál se pulse: al cerrar
  // el visor, `Dialogo` devuelve el foco ahí y no al principio de la pantalla.
  const origenVisor = useRef<HTMLElement | null>(null);

  const [paso, setPaso] = useState<PasoId | null>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [urlCruda, setUrlCruda] = useState<string | null>(null);
  /** El anverso grabado ESPERANDO al reverso. Borrador, no entrega. */
  const [borrador, setBorrador] = useState<CaraId | null>(null);
  /** Lo entregado, para pintarlo si el producto no devuelve las URL. */
  const [propias, setPropias] = useState<{ anverso: string; reverso: string } | null>(null);
  /** Qué miniatura está abierta en grande. */
  const [mirando, setMirando] = useState<PasoId | null>(null);

  // Controlado si el producto manda las URL; si no, se gobierna solo. Mismo
  // patrón que el plegado del marco: pasarlas lo hace controlado.
  const urlAnverso = anverso ?? propias?.anverso ?? null;
  const urlReverso = reverso ?? propias?.reverso ?? null;
  const completo = !!urlAnverso && !!urlReverso;
  const noSePuede = bloqueado ?? completo;

  function abrir() {
    setPaso('anverso');
    setBorrador(null);
  }

  function soltarCruda() {
    if (urlCruda) URL.revokeObjectURL(urlCruda);
    setUrlCruda(null);
    setImagen(null);
    // El input se vacía para que elegir EL MISMO archivo vuelva a disparar
    // `change`: repetir la elección tras cancelar es el camino normal.
    if (entrada.current) entrada.current.value = '';
  }

  function cerrar() {
    soltarCruda();
    setPaso(null);
    // El borrador se tira: cancelar a mitad tiene que dejarlo como estaba.
    setBorrador(null);
  }

  function elegirArchivo(archivo: File) {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => setImagen(img);
    img.src = url;
    setImagen(null);
    setUrlCruda(url);
  }

  function grabado(cara: CaraId) {
    soltarCruda();
    if (paso === 'anverso') {
      // Grabado el anverso, el MISMO diálogo pide el reverso: son dos caras de
      // un solo trámite, no dos trámites.
      setBorrador(cara);
      setPaso('reverso');
      return;
    }
    if (!borrador) return;
    setPropias({ anverso: borrador.url, reverso: cara.url });
    onCambio({ anverso: borrador, reverso: cara });
    setPaso(null);
    setBorrador(null);
  }

  const idError = error ? `cid-error-${etiqueta.replace(/\s+/g, '-')}` : undefined;
  const P = paso ? PASOS[paso] : null;

  /* R102 · Las dos caras van AL COSTADO del botón, no debajo: lo entregado y
     el mando de entregar se leen de una vez. Y ahora en la fila común de las
     tres cargas, con el alto de un campo: las miniaturas medían 76×48 y una
     fila de 48 entre campos de 37 rompía la rejilla igual que la caja de
     `CargaImagen`. A 35×22 la proporción ID-1 se conserva —1,5909 contra
     1,5858— y leer el documento sigue siendo trabajo del visor, que es donde
     se leía antes también: a 76 px tampoco se lee un DNI. */
  const lasCaras = (['anverso', 'reverso'] as PasoId[]).flatMap((cara) => {
    const url = cara === 'anverso' ? urlAnverso : urlReverso;
    if (!url) return [];
    return [
      <AdjuntoImagen
        key={cara}
        url={url}
        alt={PASOS[cara].titulo.toLowerCase()}
        forma="id"
        onVer={(e) => {
          // Se guarda LA MINIATURA pulsada: al cerrar el visor el foco vuelve
          // a ella, no al principio de la pantalla.
          origenVisor.current = e.currentTarget;
          setMirando(cara);
        }}
      />,
    ];
  });

  return (
    <FilaCarga
      etiqueta={etiqueta}
      error={error}
      idError={idError}
      nota={nota}
      adjuntos={lasCaras}
      disparador={
        <Boton
          ref={disparador}
          mini
          variante="neutra"
          className="btn-ic"
          disabled={noSePuede}
          aria-describedby={idError}
          onClick={abrir}
        >
          <Icono nombre="documento" />
          Subir ID
        </Boton>
      }
    >
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

      {/* UN SOLO DIÁLOGO para las dos caras. Con dos, la segunda tendría que
          reabrirse sola y el foco daría un salto que nadie pidió. */}
      <Dialogo
        abierto={paso !== null}
        titulo={`${etiqueta} — ${P?.titulo ?? ''}`}
        origen={disparador}
        onCerrar={cerrar}
        cerrarAlPulsarFuera={false}
        accion={imagen ? { texto: 'Grabar', onClick: () => editor.current?.grabar() } : undefined}
        textoCerrar="Cancelar"
      >
        {/* Cuál de las dos caras se está pidiendo, dicho con palabras: «paso 2
            de 2» sin decir de qué es un número sin sentido. */}
        <p className="cid-paso">
          {paso === 'anverso'
            ? 'Primero el anverso: la cara con la foto y los datos.'
            : 'Ahora el reverso. El anverso ya está encuadrado y se graba con este.'}
        </p>

        {imagen || urlCruda ? (
          <EditorEncuadre
            ref={editor}
            imagen={imagen}
            marco={MARCO_ID}
            lado={lado}
            onGrabado={grabado}
          />
        ) : (
          <Boton className="btn-ic" onClick={() => entrada.current?.click()}>
            <Icono nombre="subir" />
            {P?.pide}
          </Boton>
        )}
      </Dialogo>

      {/* El visor. Cerrar lo oculta y devuelve el foco a la miniatura. */}
      <Dialogo
        abierto={mirando !== null}
        titulo={`${etiqueta} — ${mirando ? PASOS[mirando].titulo : ''}`}
        origen={origenVisor as React.RefObject<HTMLElement>}
        onCerrar={() => setMirando(null)}
        textoCerrar="Cerrar"
      >
        {mirando && (
          <img
            className="cid-visor-img"
            src={(mirando === 'anverso' ? urlAnverso : urlReverso) ?? ''}
            alt={`${PASOS[mirando].titulo} del documento de identidad`}
          />
        )}
      </Dialogo>
    </FilaCarga>
  );
}
