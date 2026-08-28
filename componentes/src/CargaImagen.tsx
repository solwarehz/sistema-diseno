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

import { useRef, useState } from 'react';
import { Boton } from './Boton';
import { Dialogo } from './Dialogo';
import { Icono } from './Icono';
import { EditorEncuadre, type ManejoEncuadre } from './interno/EditorEncuadre';
import { FilaCarga, AdjuntoImagen } from './interno/FilaCarga';
import { Avatar } from './Avatar';

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
export type FormatoCarga = 'foto' | 'logo-extendido' | 'logo-comprimido' | 'medio-tarjeta';

const FORMATOS: Record<FormatoCarga, {
  vw: number; vh: number; redondo: boolean; icono: 'camara' | 'subir';
  subir: string; cambiar: string;
}> = {
  'foto':            { vw: 318, vh: 318, redondo: true,  icono: 'camara', subir: 'Subir foto', cambiar: 'Cambiar foto' },
  'logo-extendido':  { vw: 318, vh: 66,  redondo: false, icono: 'subir',  subir: 'Subir logo', cambiar: 'Cambiar logo' },
  'logo-comprimido': { vw: 318, vh: 318, redondo: false, icono: 'subir',  subir: 'Subir logo', cambiar: 'Cambiar logo' },
  // R57 · 320×180 es 16:9 EXACTO, la proporción que `.tn-medio` declara. Se
  // sale de los 318 de los otros tres a propósito: aquí el hueco no es fijo
  // —en una cuadrícula el ancho es fluido—, así que lo que tiene que casar es
  // la proporción, y 318 no da un 16:9 redondo.
  'medio-tarjeta':   { vw: 320, vh: 180, redondo: false, icono: 'subir',  subir: 'Subir imagen', cambiar: 'Cambiar imagen' },
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
  /**
   * R50 · DE QUIÉN es la foto. Solo para personas — trabajador, usuario—, y
   * por eso solo se atiende con `formato="foto"`: un logo no tiene iniciales
   * ni identidad que colorear, y ponerle un avatar sería inventar una persona
   * donde hay una institución.
   *
   * Con esto y sin foto, el hueco lo ocupa el `Avatar` del sistema en vez del
   * texto «Sin foto». En cuanto llega la foto, la foto manda.
   *
   * El `id` tiene que ser **estable** —el de la persona en la base, no su
   * nombre—: el color sale de él, y un color que cambia al corregir un
   * apellido deja de identificar a nadie.
   */
  persona?: { id: string; nombre: string; /** Su retrato, si la ficha ya lo tiene. Con foto manda la foto. */ foto?: string };
  /**
   * R102 · DÓNDE VIVE, que es lo que decide su forma.
   *
   *   fila  (por defecto)  UNA FILA DE FORMULARIO: el disparador, y la
   *                        miniatura de lo cargado AL COSTADO. Mide lo que un
   *                        `.campo` y no crece nunca.
   *   caja                 la vista previa a tamaño real — el círculo del
   *                        avatar, el hueco de 212×44 del logo—. Para una
   *                        pantalla dedicada a poner esa imagen.
   *
   * El defecto a resolver era medible: la caja mide 96 px de alto y un campo
   * 36,45, así que entre dos campos rompía la rejilla. Es la misma fila que
   * usan `CargaPdf` y `CargaId`, y por eso las tres arrancan y terminan igual.
   *
   * EL DEFECTO CAMBIÓ EN LA v1.78.0, y con su coste declarado. En la v1.77.0
   * salió al revés —`caja` por defecto, `fila` a petición— por no reformar en
   * silencio los selectores de foto y de logo ya en producción. El responsable
   * lo revisó en el catálogo y decidió lo contrario: **si se pidió que las
   * tres arrancaran igual, la que hay que pedir es la excepción, no la regla.**
   * Quien quiera la vista previa grande la pide con `presentacion="caja"`.
   */
  presentacion?: 'caja' | 'fila';
};


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
  persona,
  presentacion = 'fila',
}: CargaImagenProps) {
  const F = FORMATOS[formato];
  // Solo la FOTO tiene persona detras: un logo no tiene iniciales que poner.
  /**
   * R55 · LA FOTO DE LA PERSONA TAMBIÉN VIENE EN `persona`.
   *
   * Lo reportó el responsable desde la pantalla de contrato: al buscar por DNI
   * salía el avatar **aunque el trabajador ya tuviera foto**. Y era trampa mía:
   * `persona` llevaba quién es —id y nombre— pero no su foto, así que al
   * enganchar el resultado de la consulta lo natural era pasar `persona` y
   * dejarse `valor`, y entonces el hueco enseñaba iniciales de alguien que sí
   * tiene retrato.
   *
   * Ahora la regla se cumple con una sola prop: **foto si la hay, avatar si
   * no**. `valor` sigue mandando cuando llega —es la que el producto acaba de
   * recortar y todavía no ha guardado—, y por debajo está la de la ficha.
   */
  const conAvatar = !!persona && formato === 'foto';
  const retrato = valor ?? (conAvatar ? persona!.foto ?? null : null);
  const entrada = useRef<HTMLInputElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  // R51 · el lienzo, el arrastre, el zoom, las flechas, el acotado y la
  // exportación viven en `EditorEncuadre`, que es EL MISMO que usa `CargaId`.
  // Estaban aquí dentro; se extrajeron al necesitarlos dos veces, antes de
  // escribir el segundo, que es cuando toca.
  const editor = useRef<ManejoEncuadre>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [urlCruda, setUrlCruda] = useState<string | null>(null);

  const abierto = !!urlCruda;

  function elegirArchivo(archivo: File) {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => setImagen(img);
    img.src = url;
    setImagen(null);
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


  const idError = error ? 'ci-error-' + etiqueta.replace(/\s+/g, '-') : undefined;
  const esExtendida = formato === 'logo-extendido';
  // R57 · El medio de tarjeta tampoco es cuadrado: su vista previa es 16:9,
  // igual que el hueco donde va a caer.
  const esMedio = formato === 'medio-tarjeta';
  const cajaClases = [
    'ci-caja',
    esExtendida ? 'ci-extendida' : esMedio ? 'ci-medio' : `ci-${tamano}`,
    F.redondo ? 'ci-redonda' : '',
  ].filter(Boolean).join(' ');

  /* El disparador es el MISMO en las dos presentaciones: mismo icono, mismo
     texto, mismo `aria-describedby`. Lo que cambia es dónde se pone. */
  const elDisparador = (
    <Boton
      mini
      variante="neutra"
      className="btn-ic"
      ref={disparador}
      aria-describedby={idError}
      onClick={() => entrada.current?.click()}
    >
      <Icono nombre={F.icono} />
      {textoBoton ?? (retrato ? F.cambiar : F.subir)}
    </Boton>
  );

  /* El input real, fuera del tabulador: el control accesible es el Boton.
     `hidden` no: algunos navegadores ignoran click() sobre hidden. */
  const laEntrada = (
    <input
      ref={entrada}
      className="ci-entrada"
      type="file"
      accept={accept}
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => { const f = e.target.files?.[0]; if (f) elegirArchivo(f); }}
    />
  );

  const elEditor = (
    <Dialogo
      abierto={abierto}
      titulo={`Encuadrar — ${etiqueta}`}
      origen={disparador}
      onCerrar={cerrarEditor}
      cerrarAlPulsarFuera={false}
      accion={imagen ? { texto: 'Grabar', onClick: () => editor.current?.grabar() } : undefined}
      textoCerrar="Cancelar"
    >
      <EditorEncuadre
        ref={editor}
        imagen={imagen}
        marco={{ vw: F.vw, vh: F.vh, redondo: F.redondo }}
        lado={lado}
        onGrabado={(r) => { onCambio(r); cerrarEditor(); }}
      />
    </Dialogo>
  );

  /* R102 · EN FILA. El mismo arranque y el mismo final que `CargaPdf` y
     `CargaId`: rótulo, una fila con el alto de un campo, y debajo el error y
     la nota. Aquí no hay avatar de reserva —a 22 px unas iniciales no se
     leen—: eso es lo que la caja hace bien y por lo que sigue existiendo. */
  if (presentacion === 'fila') {
    return (
      <FilaCarga
        etiqueta={etiqueta}
        disparador={elDisparador}
        adjuntos={retrato
          ? [<AdjuntoImagen key="imagen" url={retrato} alt={etiqueta} forma={F.redondo ? 'redonda' : 'cuadrada'} onQuitar={onQuitar} />]
          : []}
        vacio={vacio}
        error={error}
        idError={idError}
        nota={!retrato ? nota : undefined}
      >
        {laEntrada}
        {elEditor}
      </FilaCarga>
    );
  }

  return (
    <div className="ci">
      {/* R102 · EL ROTULO, LA NOTA, EL ERROR Y EL VACIO SON LOS COMUNES.
          Eran `.ci-et`, `.ci-nota`, `.ci-error` y `.ci-vacia`, con la misma
          declaracion que sus equivalentes `.cx-*` —salvo `.ci-et`, que ni
          siquiera fijaba el color y por eso el rotulo de la imagen podia salir
          de otro tono que el del PDF y el del ID en el mismo formulario—.
          Dos nombres para el mismo estilo es la manera de que un dia se
          separen, y ese argumento ya se habia aplicado a `CargaPdf` y no aqui.
          De `.ci-*` solo queda lo que de verdad es suyo: la caja, la mascara y
          el editor de encuadre. */}
      <span className="cx-et">{etiqueta}</span>
      {/* La vista previa ES el hueco real: la foto en círculo (así se ve el
          avatar), el logo extendido a 212×44 (el hueco del lateral), el
          comprimido en cuadrado. Se ve cómo va a quedar, no una aproximación.
          La clase se arma FUERA del className: una comparación de formato ahí
          dentro se la toma por clase el candado de huérfanas, y con razón. */}
      <div className={cajaClases}>
        {retrato ? (
          <img className="ci-img" src={retrato} alt="" />
        ) : conAvatar ? (
          /* R50 · SIN FOTO PERO CON PERSONA DETRÁS.
             «Sin foto» no dice nada que no se sepa ya; las iniciales con su
             color sí dicen DE QUIÉN es el hueco. Y es EL MISMO `Avatar` del
             sistema —no un círculo parecido—, así que la ficha, la tabla y
             esta carga pintan a la misma persona igual: mismo color por
             identificador estable, mismas iniciales.
             Al subir la foto, `valor` deja de estar vacío y la foto ocupa su
             sitio: el avatar no se queda debajo ni se suma. */
          <>
            <Avatar id={persona!.id} nombre={persona!.nombre} tamano="xl" className="ci-avatar" />
            {/* El avatar se ve, pero no DICE que falte la foto. Quien usa
                lector de pantalla necesita el estado, no el adorno. */}
            <span className="sr-solo">{vacio}</span>
          </>
        ) : (
          <span className="cx-vacio">{vacio}</span>
        )}
      </div>
      <div className="ci-acciones">
        {elDisparador}
        {retrato && onQuitar && (
          <Boton mini variante="terciaria" onClick={onQuitar}>Quitar</Boton>
        )}
      </div>
      {error && <span className="cx-error" id={idError}><Icono nombre="alerta" />{error}</span>}
      {/* R71 · LA NOTA SE RETIRA CUANDO YA HAY IMAGEN.
          Es instrucción para ELEGIR un archivo —qué se sube, dónde se ve, cuánto
          puede pesar—, y en cuanto la imagen está, ya se cumplió: se queda
          debajo de cada campo lleno ocupando sitio y sin decir nada nuevo. Lo
          reportó el responsable con una nota de tres frases que no cabía.

          Se retira con `retrato`, no con `persona`: el avatar de reserva
          significa que la foto TODAVÍA falta, y ahí la instrucción sigue
          haciendo falta.

          Y no se mueve al diálogo, aunque se pidió así. El orden real es clic →
          selector de archivos del sistema → diálogo de encuadre, así que una
          nota que viviera en el diálogo diría «hasta 8 MB» DESPUÉS de haber
          elegido el archivo. La restricción tiene que leerse antes de elegir.

          No se pierde nada para el lector de pantalla: la nota nunca estuvo
          enlazada por `aria-describedby` —solo el error lo está—. */}
      {nota && !retrato && <span className="cx-nota">{nota}</span>}

      {laEntrada}
      {elEditor}
    </div>
  );
}
