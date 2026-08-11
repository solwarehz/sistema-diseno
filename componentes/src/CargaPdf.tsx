/**
 * CARGA DE PDF — R43
 *
 * Elegir o soltar UN PDF, comprimirlo y entregarlo. La pieza visual completa:
 * la zona donde se suelta, el disparador, el archivo puesto, el progreso
 * mientras comprime, el error y la pista.
 *
 * QUÉ ES Y QUÉ NO. Igual que `CargaImagen`: la subida —a qué ruta, cuándo, con
 * qué reintentos— es del producto. Aquí se entrega un `File` listo y los dos
 * pesos, y qué se hace con ellos no es asunto del componente.
 *
 * TRES DECISIONES QUE NO SON DE ASPECTO:
 *
 *   1 · SOLO PDF, Y SE COMPRUEBA EN LOS BYTES. El `accept` del navegador filtra
 *       el diálogo de archivos y nada más: arrastrando entra cualquier cosa, y
 *       renombrar un .docx a .pdf lo cuela. Se leen los primeros bytes y se
 *       exige `%PDF-`. Es la única comprobación que no se puede esquivar.
 *
 *   2 · EL PESO MÁXIMO SE MIDE DESPUÉS DE COMPRIMIR. Al revés se rechazan
 *       archivos que sí habrían cabido, y la persona no tiene forma de saberlo:
 *       ve «pesa demasiado» en algo que el sistema mismo podía arreglar.
 *
 *   3 · SI NO SE GANA PESO, VIAJA EL ORIGINAL. El compresor nunca devuelve algo
 *       más grande ni algo que no sepa volver a leer, y cuando no puede tocar un
 *       archivo —cifrado, roto— lo dice en `motivo` en vez de fingir.
 *
 * CÓMO SE COMPONE, no se reconstruye: el disparador y «Quitar» son `Boton`, el
 * progreso es `Progreso`, el icono es `Icono`. Lo único propio de este
 * componente es la zona de soltar, que no existía.
 */

import { useId, useRef, useState } from 'react';
import { Boton } from './Boton';
import { Chip } from './Chip';
import { Icono } from './Icono';
import { Progreso } from './Estados';
import { comprimirPdf, formatearPeso, ahorro, esPdf } from './interno/comprimir-pdf.mjs';

/** Lo que se entrega al producto cuando hay un PDF listo. */
export type PdfListo = {
  /** El archivo ya comprimido, con su nombre. Es lo que se sube. */
  archivo: File;
  pesoInicial: number;
  pesoFinal: number;
  /** `false` si el original viajó tal cual. `motivo` dice por qué. */
  comprimido: boolean;
  /** `null` si se comprimió. Si no: `cifrado`, `sin-ganancia`, `ilegible`… */
  motivo: string | null;
  /** Cuántas páginas se contaron. `-1` cuando no se pudo leer. */
  paginas: number;
};

export type CargaPdfProps = {
  /** Obligatoria. Nombra el control y distingue dos cargas en la misma
   *  pantalla: «Acta de notas» y «Constancia» no son «Archivo» dos veces. */
  etiqueta: string;
  /** El PDF que ya hay puesto, si el producto lo guardó. */
  valor?: { nombre: string; peso: number } | null;
  onCambio: (r: PdfListo) => void;
  /** Sin ella no se ofrece quitar. */
  onQuitar?: () => void;
  /**
   * Lo que hay que hacer, dentro de la zona. Es la frase que convierte un
   * recuadro en una instrucción, y por eso se puede cambiar: «Arrastra aquí el
   * acta firmada» dice más que «Arrastra el PDF aquí».
   */
  instrucciones?: React.ReactNode;
  /** La línea pequeña de condiciones. Si no se pasa, se arma con lo que se
   *  sabe: «Solo PDF» y el peso máximo. */
  pista?: React.ReactNode;
  /** Ayuda permanente bajo el control, fuera de la zona. */
  ayuda?: React.ReactNode;
  /** Sustituye el texto del botón. */
  textoBoton?: string;
  /** El error del producto. El del componente se pinta en el mismo sitio. */
  error?: string;
  /** En bytes. Se comprueba DESPUÉS de comprimir — ver arriba. */
  pesoMaximo?: number;
  /** Apagarlo entrega el original sin tocarlo. Sirve para un PDF firmado, donde
   *  reescribir el archivo rompería la firma. */
  comprimir?: boolean;
  /** Ancho máximo y calidad de las imágenes incrustadas. */
  opcionesCompresion?: { anchoMaximoImagen?: number; calidadImagen?: number };
  /**
   * Enseña «3,8 MB → 1,2 MB · 68 % menos» bajo el archivo.
   *
   * APAGADO por defecto y a propósito: a quien sube un acta no le importa
   * cuánto adelgazó, le importa que se subió. Se enciende en el catálogo, que
   * es donde la cifra es la demostración de que la compresión ocurre. Los dos
   * pesos viajan SIEMPRE en `onCambio`, así que un producto que los quiera
   * enseñar a su manera los tiene.
   */
  mostrarPesos?: boolean;
};

export function CargaPdf({
  etiqueta,
  valor = null,
  onCambio,
  onQuitar,
  instrucciones = 'Arrastra el PDF aquí o elígelo desde tu equipo.',
  pista,
  ayuda,
  textoBoton,
  error,
  pesoMaximo,
  comprimir = true,
  opcionesCompresion,
  mostrarPesos = false,
}: CargaPdfProps) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [propio, setPropio] = useState<string | null>(null);
  const [medida, setMedida] = useState<PdfListo | null>(null);

  const elError = error ?? propio;
  const idError = elError ? `${id}-error` : undefined;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const descrito = [idError, idAyuda].filter(Boolean).join(' ') || undefined;

  async function tomar(archivos: FileList | File[] | null) {
    const lista = archivos ? [...archivos] : [];
    setPropio(null);
    // Uno. Coger el primero en silencio deja a la persona creyendo que subió
    // los tres que soltó.
    if (lista.length > 1) {
      setPropio('Suelta un solo archivo. Si son varios, súbelos de uno en uno.');
      return;
    }
    const archivo = lista[0];
    if (!archivo) return;

    // La comprobación que no se puede esquivar: los bytes, no la extensión.
    if (!(await esPdf(archivo))) {
      setPropio('Ese archivo no es un PDF. Solo se admiten PDF.');
      return;
    }

    setTrabajando(true);
    try {
      const r = comprimir
        ? await comprimirPdf(archivo, opcionesCompresion ?? {})
        : { archivo, pesoInicial: archivo.size, pesoFinal: archivo.size, comprimido: false, motivo: 'sin-comprimir', detalle: {} as { paginas?: number } };

      const salida = new File([r.archivo], archivo.name, { type: 'application/pdf' });
      const listo: PdfListo = {
        archivo: salida,
        pesoInicial: r.pesoInicial,
        pesoFinal: r.pesoFinal,
        comprimido: r.comprimido,
        motivo: r.motivo,
        paginas: r.detalle?.paginas ?? -1,
      };

      // El tope se mide sobre lo que de verdad va a viajar.
      if (pesoMaximo !== undefined && listo.pesoFinal > pesoMaximo) {
        setMedida(null);
        setPropio(
          `El PDF pesa ${formatearPeso(listo.pesoFinal)} y el máximo es ${formatearPeso(pesoMaximo)}. `
          + 'Divídelo o quita las páginas que no hagan falta.',
        );
        return;
      }

      setMedida(listo);
      onCambio(listo);
    } finally {
      setTrabajando(false);
      // Se vacía para que elegir EL MISMO archivo vuelva a disparar `change`:
      // repetir la elección tras un error es el camino normal.
      if (entrada.current) entrada.current.value = '';
    }
  }

  const laPista = pista ?? (
    pesoMaximo === undefined
      ? 'Solo PDF.'
      : `Solo PDF · máximo ${formatearPeso(pesoMaximo)} una vez comprimido.`
  );

  const puesto = valor ?? (medida
    ? { nombre: medida.archivo.name, peso: medida.pesoFinal }
    : null);

  return (
    <div className="cpdf">
      <span className="cpdf-et" id={`${id}-et`}>{etiqueta}</span>

      {/* La zona NO es el control accesible: el control es el `Boton` de
          dentro. Soltar es un atajo de ratón, y un atajo de ratón no puede ser
          la única forma de hacer algo. */}
      <div
        className={['cpdf-zona', encima ? 'cpdf-encima' : '', elError ? 'cpdf-mal' : ''].filter(Boolean).join(' ')}
        onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => { e.preventDefault(); setEncima(false); tomar(e.dataTransfer.files); }}
      >
        {puesto ? (
          <div className="cpdf-puesto">
            <span className="cpdf-ico" aria-hidden="true"><Icono nombre="documento" tam="estado" /></span>
            <span className="cpdf-datos">
              <span className="cpdf-nombre">{puesto.nombre}</span>
              <span className="cpdf-peso">
                {formatearPeso(puesto.peso)}
                {medida && medida.paginas > 0 && ` · ${medida.paginas} ${medida.paginas === 1 ? 'página' : 'páginas'}`}
              </span>
              {/* Los dos pesos, solo si se piden. Ver `mostrarPesos`.
                  Va en un `Chip`, que ya existe y ya tiene sus pares medidos:
                  pintar aquí un verde a mano habría metido un par de contraste
                  que nadie midió. */}
              {mostrarPesos && medida && (
                medida.comprimido ? (
                  <Chip tono="exito">
                    {formatearPeso(medida.pesoInicial)} → {formatearPeso(medida.pesoFinal)}
                    {' · '}{ahorro(medida.pesoInicial, medida.pesoFinal)} % menos
                  </Chip>
                ) : (
                  <Chip tono="inactivo">
                    {formatearPeso(medida.pesoInicial)} · sin cambio ({medida.motivo})
                  </Chip>
                )
              )}
            </span>
          </div>
        ) : (
          <p className="cpdf-invita">
            <span className="cpdf-ico" aria-hidden="true"><Icono nombre="subir" tam="estado" /></span>
            <span className="cpdf-instr">{instrucciones}</span>
          </p>
        )}

        <div className="cpdf-acciones">
          <Boton
            mini
            variante="neutra"
            className="btn-ic"
            disabled={trabajando}
            aria-describedby={descrito}
            aria-labelledby={`${id}-et`}
            onClick={() => entrada.current?.click()}
          >
            <Icono nombre="documento" tam="control" />
            {textoBoton ?? (puesto ? 'Cambiar PDF' : 'Elegir PDF')}
          </Boton>
          {puesto && onQuitar && (
            <Boton mini variante="terciaria" disabled={trabajando} onClick={() => { setMedida(null); onQuitar(); }}>
              Quitar
            </Boton>
          )}
        </div>

        <span className="cpdf-pista">{laPista}</span>
      </div>

      {/* Comprimir un escaneo tarda. Sin esto la pantalla se queda muda y
          parece rota; con `Progreso` indeterminado se dice que hay algo en
          marcha sin inventar un porcentaje que no se conoce. */}
      {trabajando && (
        <div className="cpdf-trabajo">
          <Progreso etiqueta="Comprimiendo el PDF…" />
        </div>
      )}

      {elError && <span className="cpdf-error" id={idError} role="alert">{elError}</span>}
      {ayuda && <span className="cpdf-ayuda" id={idAyuda}>{ayuda}</span>}

      {/* El input real, fuera del tabulador: el control accesible es el Boton.
          `hidden` no: algunos navegadores ignoran click() sobre hidden. */}
      <input
        ref={entrada}
        className="cpdf-entrada"
        type="file"
        accept="application/pdf,.pdf"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => tomar(e.target.files)}
      />
    </div>
  );
}
