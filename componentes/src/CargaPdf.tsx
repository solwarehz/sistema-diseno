/**
 * CARGA DE PDF — R43 · R45 (cuántos archivos) · R46 (cabe en un formulario)
 *
 * DÓNDE VIVE, que es lo que decide su forma. Lo corrigió el responsable:
 *
 *   «porque mostrar un campo tan grande, rompera todo formulario, en el
 *    formulario se pondra un boton subir documento […] y ese boton llama al
 *    componente, que al finalizar me actualiza la informacion del form»
 *
 * Tenía razón, y no era un detalle de estética: un recuadro de soltar de 100px
 * de alto entre dos campos de 34px rompe la rejilla del formulario y se lleva
 * la atención de todo lo demás. Así que por defecto el componente ES UN BOTÓN.
 *
 * Y NO ABRE UNA VENTANA FLOTANTE, que fue la segunda corrección:
 *
 *   «nosotros no trabajamos con pop up, lo que hacemos es aparecer este
 *    componente y desplazar el contenido del formulario debajo, cerramos y el
 *    formulario vuelve a su diseño inicial guardando la info»
 *
 * El panel se despliega EN SU SITIO y empuja hacia abajo lo que venga después.
 * Nada tapa el formulario. Al cerrar, todo vuelve donde estaba con la
 * información puesta.
 *
 *   presentacion="panel"     (por defecto)  el formulario ve un botón
 *   presentacion="en-linea"                 el recuadro siempre visible, para
 *                                           una pantalla dedicada a subir
 *
 * LO PROVISIONAL Y LO CONFIRMADO. Con el panel abierto la elección es un
 * BORRADOR: `onCambio` **no** se dispara al elegir, se dispara al **Grabar**.
 * Cancelar lo tira. Es lo que hace que «al finalizar me actualiza el form» sea
 * cierto — si emitiera al elegir, cancelar dejaría el formulario ya cambiado.
 * En `en-linea` no hay borrador: no hay dónde cancelar.
 *
 * QUÉ ES Y QUÉ NO. El componente **NO sube nada**. Comprueba, comprime y
 * entrega los `File` listos; a qué ruta y cuándo es del producto. `onGrabar`
 * existe para que el producto enganche ahí su escritura, no para que la haga
 * este componente.
 *
 * TRES DECISIONES QUE NO SON DE ASPECTO:
 *
 *   1 · SOLO PDF, Y SE COMPRUEBA EN LOS BYTES. El `accept` del navegador filtra
 *       el diálogo de archivos y nada más: arrastrando entra cualquier cosa, y
 *       renombrar un .docx a .pdf lo cuela. Se exige `%PDF-`.
 *   2 · EL PESO MÁXIMO SE MIDE DESPUÉS DE COMPRIMIR. Al revés se rechazan
 *       archivos que sí habrían cabido, y la persona ve «pesa demasiado» en
 *       algo que el sistema mismo podía arreglar.
 *   3 · SI NO SE GANA PESO, VIAJA EL ORIGINAL. El compresor nunca devuelve algo
 *       más grande ni algo que no sepa volver a leer, y cuando no puede tocar un
 *       archivo —cifrado, roto— lo dice en `motivo` en vez de fingir.
 *
 * SE COMPONE, no se reconstruye: el disparador, «Grabar» y el tachito son
 * `Boton`; el progreso es `Progreso`; el ahorro, `Chip`;
 * el icono, `Icono`. Lo único propio es la zona de soltar, que no existía.
 */

import { useId, useRef, useState } from 'react';
import { Boton } from './Boton';
import { Chip } from './Chip';
import { Icono } from './Icono';
import { Progreso } from './Estados';
import { comprimirPdf, formatearPeso, ahorro, esPdf } from './interno/comprimir-pdf.mjs';
import { FilaCarga, AdjuntoArchivo } from './interno/FilaCarga';

/** Lo que se entrega al producto por cada PDF listo. */
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
  /** Dónde vive. Ver la cabecera: en un formulario, `panel`. */
  presentacion?: 'panel' | 'en-linea';
  /**
   * CUÁNTOS PDF admite: 1, 2, 3… o `'sin-limite'`.
   *
   * Se escribe así y no con `Infinity` porque una configuración de producto
   * acaba viajando en JSON alguna vez, y `Infinity` no sobrevive a `JSON`: se
   * convierte en `null` por el camino y el límite desaparece sin que nadie lo
   * haya decidido.
   *
   * Con 1 —lo normal— elegir otro **sustituye**. Con más de 1 se **añade**
   * hasta llenar, y cuando está lleno el botón de elegir desaparece: ofrecer un
   * botón que solo puede dar error no es ofrecer nada.
   */
  maximoArchivos?: number | 'sin-limite';
  /** Los PDF que el producto ya tiene guardados. Si se pasa, manda sobre lo
   *  que el componente recuerde. */
  valor?: { nombre: string; peso: number }[] | null;
  /**
   * Se llama con **la lista entera**, nunca con un archivo suelto: el producto
   * no tiene que llevar la cuenta. Con el panel se dispara **al Grabar**; en
   * `en-linea`, en cuanto cambia. También al quitar, y también con lista vacía.
   */
  onCambio: (archivos: PdfListo[]) => void;
  /** Avisa además de cuál se quitó. La lista nueva llega por `onCambio`. */
  onQuitar?: (indice: number) => void;
  /**
   * Se llama al pulsar «Grabar», después de `onCambio`. Es donde el producto
   * engancha su escritura — el componente no escribe nada.
   *
   * En `en-linea` es opcional y sin ella no hay botón de grabar. En `panel`
   * el botón siempre está: es lo que cierra.
   */
  onGrabar?: (archivos: PdfListo[]) => void | Promise<void>;
  /** Texto del disparador del formulario. */
  textoBoton?: string;
  /** Texto del botón que confirma. */
  textoGrabar?: string;
  /**
   * Lo que hay que hacer, dentro de la zona. Es la frase que convierte un
   * recuadro en una instrucción: «Arrastra aquí el acta firmada» dice más que
   * «Arrastra el PDF aquí».
   */
  instrucciones?: React.ReactNode;
  /** La línea pequeña de condiciones. Si no se pasa, se arma con lo que se
   *  sabe: cuántos caben y el peso máximo. */
  pista?: React.ReactNode;
  /** Ayuda permanente bajo el control. */
  ayuda?: React.ReactNode;
  /** El error del producto. El del componente se pinta en el mismo sitio. */
  error?: string;
  /** En bytes, POR ARCHIVO. Se comprueba DESPUÉS de comprimir — ver arriba. */
  pesoMaximo?: number;
  /** Apagarlo entrega el original sin tocarlo. Para un PDF **firmado**, donde
   *  reescribir el archivo invalidaría la firma. */
  comprimir?: boolean;
  /** Ancho máximo y calidad de las imágenes incrustadas. */
  opcionesCompresion?: { anchoMaximoImagen?: number; calidadImagen?: number };
  /**
   * Enseña «3,8 MB → 1,2 MB · 68 % menos» junto a cada archivo.
   *
   * APAGADO por defecto y a propósito: a quien sube un acta no le importa
   * cuánto adelgazó, le importa que se subió. Se enciende en el catálogo, que
   * es donde la cifra es la demostración de que la compresión ocurre. Los dos
   * pesos viajan SIEMPRE en `onCambio`.
   */
  mostrarPesos?: boolean;
};

type Ficha = { nombre: string; peso: number };

export function CargaPdf({
  etiqueta,
  presentacion = 'panel',
  maximoArchivos = 1,
  valor = null,
  onCambio,
  onQuitar,
  onGrabar,
  textoBoton,
  textoGrabar = 'Grabar',
  instrucciones,
  pista,
  ayuda,
  error,
  pesoMaximo,
  comprimir = true,
  opcionesCompresion,
  mostrarPesos = false,
}: CargaPdfProps) {
  const id = useId();
  const entrada = useRef<HTMLInputElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  const enPanel = presentacion === 'panel';
  const [abierto, setAbierto] = useState(false);
  const [encima, setEncima] = useState(false);
  const [trabajo, setTrabajo] = useState<{ hecho: number; total: number } | null>(null);
  const [propio, setPropio] = useState<string | null>(null);

  /** Lo que el formulario ya tiene. */
  const [confirmados, setConfirmados] = useState<PdfListo[]>([]);
  /** Lo que se está eligiendo dentro del diálogo, todavía sin confirmar. */
  const [borrador, setBorrador] = useState<PdfListo[]>([]);

  const tope = maximoArchivos === 'sin-limite' ? Infinity : Math.max(1, Math.floor(maximoArchivos));
  const uno = tope === 1;

  const elError = error ?? propio;
  const idError = elError ? `${id}-error` : undefined;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const descrito = [idError, idAyuda].filter(Boolean).join(' ') || undefined;

  // Dentro del diálogo se trabaja sobre el borrador; en línea, sobre lo real.
  const trabajando = enPanel ? borrador : confirmados;
  const setTrabajando = enPanel ? setBorrador : setConfirmados;

  const fichaDe = (m: PdfListo): Ficha => ({ nombre: m.archivo.name, peso: m.pesoFinal });
  /** Lo que se ve fuera: `valor` manda si el producto controla la lista. */
  const puestos: Ficha[] = valor ?? confirmados.map(fichaDe);
  const enCurso: Ficha[] = enPanel ? borrador.map(fichaDe) : puestos;
  const libres = tope - enCurso.length;

  function abrir() {
    // El borrador arranca de lo que ya hay: entrar a añadir un segundo archivo
    // no puede empezar en blanco y hacer creer que el primero se perdió.
    setBorrador(confirmados);
    setPropio(null);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
    setBorrador([]);
    setPropio(null);
  }

  function emitir(nueva: PdfListo[]) {
    setConfirmados(nueva);
    onCambio(nueva);
  }

  async function grabar() {
    emitir(borrador);
    setAbierto(false);
    setPropio(null);
    await onGrabar?.(borrador);
    setBorrador([]);
  }

  async function tomar(archivos: FileList | File[] | null) {
    const entrantes = archivos ? [...archivos] : [];
    setPropio(null);
    if (!entrantes.length) return;

    // Con hueco para uno, elegir otro SUSTITUYE. Con hueco para varios se añade
    // — y si no caben todos NO se cogen los que quepan en silencio: quien soltó
    // cinco se quedaría creyendo que subió cinco.
    const sitio = uno ? 1 : libres;
    if (entrantes.length > sitio) {
      setPropio(sitio <= 0
        ? `Ya hay ${enCurso.length} ${enCurso.length === 1 ? 'archivo' : 'archivos'} y no caben más. Quita alguno antes de añadir.`
        : `Soltaste ${entrantes.length} y solo ${sitio === 1 ? 'cabe 1' : `caben ${sitio}`}. Quita alguno o suelta menos.`);
      if (entrada.current) entrada.current.value = '';
      return;
    }

    setTrabajo({ hecho: 0, total: entrantes.length });
    const listos: PdfListo[] = [];
    const rechazados: string[] = [];
    try {
      for (let k = 0; k < entrantes.length; k++) {
        const archivo = entrantes[k];
        setTrabajo({ hecho: k, total: entrantes.length });

        // La comprobación que no se puede esquivar: los bytes, no la extensión.
        if (!(await esPdf(archivo))) {
          rechazados.push(`${archivo.name} no es un PDF`);
          continue;
        }

        const r = comprimir
          ? await comprimirPdf(archivo, opcionesCompresion ?? {})
          : {
            archivo, pesoInicial: archivo.size, pesoFinal: archivo.size,
            comprimido: false, motivo: 'sin-comprimir', detalle: {} as { paginas?: number },
          };

        const listo: PdfListo = {
          archivo: new File([r.archivo], archivo.name, { type: 'application/pdf' }),
          pesoInicial: r.pesoInicial,
          pesoFinal: r.pesoFinal,
          comprimido: r.comprimido,
          motivo: r.motivo,
          paginas: r.detalle?.paginas ?? -1,
        };

        // El tope se mide sobre lo que de verdad va a viajar.
        if (pesoMaximo !== undefined && listo.pesoFinal > pesoMaximo) {
          rechazados.push(`${archivo.name} pesa ${formatearPeso(listo.pesoFinal)} y el máximo es ${formatearPeso(pesoMaximo)}`);
          continue;
        }
        listos.push(listo);
      }

      if (rechazados.length) {
        setPropio(rechazados.length === 1
          ? `${rechazados[0]}.`
          : `No entraron ${rechazados.length} archivos: ${rechazados.join('; ')}.`);
      }
      if (listos.length) {
        const nueva = uno ? listos.slice(-1) : [...trabajando, ...listos];
        setTrabajando(nueva);
        if (!enPanel) onCambio(nueva);
      }
    } finally {
      setTrabajo(null);
      // Se vacía para que elegir EL MISMO archivo vuelva a disparar `change`:
      // repetir la elección tras un error es el camino normal.
      if (entrada.current) entrada.current.value = '';
    }
  }

  function quitar(indice: number) {
    const nueva = trabajando.filter((_, k) => k !== indice);
    setTrabajando(nueva);
    setPropio(null);
    onQuitar?.(indice);
    if (!enPanel) onCambio(nueva);
  }

  /** Fuera del diálogo, quitar sí toca lo confirmado y avisa al formulario. */
  function quitarConfirmado(indice: number) {
    const nueva = confirmados.filter((_, k) => k !== indice);
    onQuitar?.(indice);
    emitir(nueva);
  }

  const laInstruccion = instrucciones ?? (uno
    ? 'Arrastra el PDF aquí o elígelo desde tu equipo.'
    : 'Arrastra los PDF aquí o elígelos desde tu equipo.');

  const cuantos = tope === Infinity
    ? 'Solo PDF · los que hagan falta'
    : uno ? 'Solo PDF' : `Solo PDF · hasta ${tope}`;
  const laPista = pista ?? (pesoMaximo === undefined
    ? `${cuantos}.`
    : `${cuantos} · máximo ${formatearPeso(pesoMaximo)} cada uno una vez comprimido.`);

  const hayBoton = uno || libres > 0;
  /**
   * El segundo botón del pie. Con contenido válido y quieto es «Grabar»; sin
   * nada, con error, o mientras comprime, es «Cancelar».
   *
   * `error` del producto también lo tumba: si el formulario está diciendo que
   * algo no cuadra, ofrecer «Grabar» sería invitar a guardar lo que él mismo
   * acaba de rechazar.
   */
  const hayQueGrabar = borrador.length > 0 && !trabajo && !elError;

  /** Una fila de archivo: nombre y tachito EN LA MISMA LÍNEA. */
  const fila = (f: Ficha, k: number, medida: PdfListo | undefined, alQuitar: (i: number) => void) => (
    <li className="cpdf-puesto" key={`${f.nombre}-${k}`}>
      <span className="cpdf-ico" aria-hidden="true"><Icono nombre="documento" tam="estado" /></span>
      <span className="cpdf-datos">
        {/* EL TACHITO VA EN LA MISMA LÍNEA QUE EL NOMBRE, no al final de la
            fila: así se ve exactamente qué archivo se lleva antes de pulsarlo.
            Con cinco seguidos, un botón alineado al centro del bloque no dice
            a cuál pertenece. */}
        <span className="cpdf-linea">
          <span className="cpdf-nombre">{f.nombre}</span>
          {/* El nombre va en el rótulo accesible: cinco «Quitar» seguidos no le
              dicen nada a un lector de pantalla. `soloIcono` lo exige. */}
          <Boton
            mini
            soloIcono
            variante="terciaria"
            className="cpdf-quitar"
            aria-label={`Quitar ${f.nombre}`}
            onClick={() => alQuitar(k)}
          >
            <Icono nombre="papelera" />
          </Boton>
        </span>
        <span className="cpdf-peso">
          {formatearPeso(f.peso)}
          {medida && medida.paginas > 0 && ` · ${medida.paginas} ${medida.paginas === 1 ? 'página' : 'páginas'}`}
        </span>
        {/* Los dos pesos, solo si se piden. Va en un `Chip`, que ya existe y ya
            tiene sus pares medidos: pintar aquí un verde a mano habría metido
            un par de contraste que nadie midió. */}
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
    </li>
  );

  /* La zona: el recuadro de soltar con su lista. Con `panel` va dentro del
     desplegable; en `en-linea`, directamente en la pantalla. */
  const zona = (
    <div
      className={['cpdf-zona', encima ? 'cpdf-encima' : '', elError ? 'cpdf-mal' : ''].filter(Boolean).join(' ')}
      onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
      onDragLeave={() => setEncima(false)}
      onDrop={(e) => { e.preventDefault(); setEncima(false); tomar(e.dataTransfer.files); }}
    >
      {enCurso.length > 0 && (
        <ul className="cpdf-lista">
          {enCurso.map((f, k) => fila(f, k, trabajando[k], quitar))}
        </ul>
      )}

      {enCurso.length === 0 && (
        <p className="cpdf-invita">
          <span className="cpdf-ico" aria-hidden="true"><Icono nombre="subir" tam="estado" /></span>
          <span className="cpdf-instr">{laInstruccion}</span>
        </p>
      )}

      {/* En formulario NO se pinta aquí: el botón «Subir PDF» de fuera está
          siempre y ya hace esto. Dos botones idénticos a diez píxeles uno de
          otro no son dos opciones, son una duda. */}
      {hayBoton && !enPanel && (
        <div className="cpdf-acciones">
          <Boton
            mini
            variante="neutra"
            className="btn-ic"
            disabled={!!trabajo}
            aria-describedby={descrito}
            onClick={() => entrada.current?.click()}
          >
            <Icono nombre="pdf" />
            {enCurso.length === 0 ? 'Subir PDF' : uno ? 'Cambiar PDF' : 'Añadir otro'}
          </Boton>
          {/* En línea no hay diálogo que cierre, así que «Grabar» va aquí — y
              solo si el producto lo pidió. */}
          {!enPanel && onGrabar && (
            <Boton
              mini
              variante="principal"
              disabled={enCurso.length === 0 || !!trabajo}
              onClick={() => onGrabar(confirmados)}
            >
              {textoGrabar}
            </Boton>
          )}
        </div>
      )}

      <span className="cpdf-pista">{laPista}</span>

      {/* Comprimir un escaneo tarda. Sin esto la pantalla se queda muda y
          parece rota; con `Progreso` indeterminado se dice que hay algo en
          marcha sin inventar un porcentaje que no se conoce. */}
      {trabajo && (
        <div className="cpdf-trabajo">
          <Progreso etiqueta={trabajo.total > 1
            ? `Comprimiendo ${trabajo.hecho + 1} de ${trabajo.total}…`
            : 'Comprimiendo el PDF…'} />
        </div>
      )}

      {elError && <span className="cpdf-error" id={idError} role="alert">{elError}</span>}

      {/* El input real, fuera del tabulador: el control accesible es el Boton.
          `hidden` no: algunos navegadores ignoran click() sobre hidden. */}
      <input
        ref={entrada}
        className="cpdf-entrada"
        type="file"
        accept="application/pdf,.pdf"
        multiple={!uno}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => tomar(e.target.files)}
      />
    </div>
  );

  if (!enPanel) {
    return (
      <div className="cpdf">
        <span className="cpdf-et" id={`${id}-et`}>{etiqueta}</span>
        {zona}
        {/* R102 · la misma nota que en formulario. Era `.cpdf-ayuda`, con una
            declaración idéntica a la de la fila común: dos nombres para el
            mismo estilo es la manera de que un día se separen. */}
        {ayuda && <span className="cx-nota" id={idAyuda}>{ayuda}</span>}
      </div>
    );
  }

  // ── En formulario ─────────────────────────────────────────────────────────
  // Cerrado es un botón y el resumen de lo que ya hay. Abierto, el panel se
  // despliega AQUÍ MISMO y empuja hacia abajo lo que venga después: nada flota
  // sobre el formulario, nada lo tapa, y al cerrar vuelve a su sitio con la
  // información puesta.
  //
  // Se monta y se desmonta de verdad, no se colapsa con CSS. Un panel colapsado
  // a altura cero sigue en el árbol de accesibilidad y sus botones se alcanzan
  // con el tabulador — ese defecto acaba de aparecer en `.cf-banda` y no se
  // vuelve a sembrar aquí.
  const idPanel = `${id}-panel`;

  /* R102 · LA FILA COMÚN. Antes el resumen se apilaba ENCIMA del disparador,
     así que la carga crecía hacia arriba cada vez que se añadía un archivo y
     el formulario se movía entero. Ahora lo cargado va AL COSTADO del botón,
     en una fila que mide lo que un `.campo` y no crece nunca: es el mismo
     arranque y el mismo final que `CargaImagen` y `CargaId`. */
  return (
    <FilaCarga
      etiqueta={etiqueta}
      idEtiqueta={`${id}-et`}
      /* El error del PRODUCTO se ve siempre; el del componente vive dentro del
         panel, que es donde se puede corregir. */
      error={error}
      idError={idError}
      nota={ayuda}
      idNota={idAyuda}
      /* CON EL PANEL ABIERTO NO HAY ESTADO VACÍO QUE CONTAR, y esto fue un
         defecto real: `total` se pone a 0 para no listar dos veces lo mismo, y
         eso encendía además el mensaje de vacío. La fila decía «ningún archivo
         todavía» mientras el panel de debajo enseñaba el archivo — dos frases
         contradictorias en pantalla a la vez.

         Lo decide AQUÍ quien sabe qué significa `abierto`, no la fila: ella es
         genérica y no tiene por qué saber que un panel abierto invalida el
         mensaje. (Aun así la fila se protege sola, por si otra carga repite
         el descuido.) */
      vacio={abierto ? undefined : uno ? 'Ningún archivo' : 'Ningún archivo todavía'}
      /* Cerrado: el resumen al costado. Abierto no, o la misma lista saldría
         dos veces —en la fila y en el panel—. */
      adjuntos={!abierto ? puestos.map((f, k) => (
        <AdjuntoArchivo
          key={`${f.nombre}-${k}`}
          nombre={f.nombre}
          /* El peso del archivo puesto se veía antes y se sigue viendo.
             Lo que NO cabe en 27 px de alto y se queda solo en el panel son
             DOS cosas, no una: el recuento de páginas y —con `mostrarPesos`
             encendido— el `Chip` del ahorro. El resumen anterior se apilaba en
             tres renglones y por eso los tenía; una fila de una línea no.

             No se meten a la fuerza: el chip del ahorro son ~30 caracteres, y
             en una columna de formulario se saldría del ancho y lo recortaría
             `.cx-adjuntos`. Un dato cortado a la mitad es peor que ese dato en
             el sitio donde sí se lee — el panel, que es justo donde se está
             comprimiendo cuando la cifra significa algo.

             Los dos siguen viajando enteros en `onCambio`. */
          peso={formatearPeso(f.peso)}
          onQuitar={() => quitarConfirmado(k)}
        />
      )) : []}
      total={abierto ? 0 : puestos.length}
      /* El disparador lleva el icono `pdf` —la hoja con renglones—, distinto
         del `documento` en blanco que marca cada archivo ya puesto.

         CON EL PANEL ABIERTO SE QUEDA, APAGADO. Antes se desmontaba, y con él
         se iba el ancla de la fila. Apagado y no cerrando: lo que hace el
         panel no cambia —las salidas siguen siendo «Grabar» y «Cancelar», que
         es lo que decide qué pasa con el borrador—, y pulsarlo con el panel
         abierto tampoco hacía nada antes, porque no estaba. */
      disparador={
        <Boton
          mini
          variante="neutra"
          className="btn-ic"
          ref={disparador}
          disabled={abierto}
          aria-expanded={abierto}
          aria-controls={idPanel}
          aria-describedby={descrito}
          onClick={abrir}
        >
          <Icono nombre="pdf" />
          {textoBoton ?? 'Subir PDF'}
        </Boton>
      }
      panel={abierto && (
        <div className="cx-panel" id={idPanel}>
          {zona}
          {/* EXACTAMENTE DOS BOTONES, decidido por el responsable.
              · «Subir» está SIEMPRE: es lo que trae el archivo.
              · El segundo MUTA: «Cancelar» mientras no hay nada que grabar o
                hay error, «Grabar» en cuanto hay un PDF válido.

              Se avisó del riesgo y se eligió con él delante: un botón que
              cambia de significado puede confirmar cuando se iba a descartar,
              porque basta que un archivo termine de comprimirse en ese
              instante. Lo que sí se hace para amortiguarlo es que los dos
              estados NO se parezcan —«Cancelar» es terciario y plano,
              «Grabar» es el principal, azul y macizo—: el cambio se ve, no
              solo se lee. */}
          <div className="cpdf-pie">
            <Boton
              mini
              variante="neutra"
              className="btn-ic"
              disabled={!!trabajo || !hayBoton}
              onClick={() => entrada.current?.click()}
            >
              <Icono nombre="subir" />
              Subir
            </Boton>
            {hayQueGrabar ? (
              <Boton variante="principal" onClick={grabar}>{textoGrabar}</Boton>
            ) : (
              /* Nunca apagado, tampoco mientras comprime: es LA SALIDA. Sin
                 ella, elegir un .docx dejaba encerrado. */
              <Boton variante="terciaria" onClick={cerrar}>Cancelar</Boton>
            )}
          </div>
        </div>
      )}
    />
  );
}
