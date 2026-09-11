/**
 * BOTÓN
 *
 * Seis variantes, y la elección NO es estética: la hace la acción.
 * Ver `comportamiento.md` y la tabla «Qué botón para qué acción» del catálogo.
 *
 * Regla dura del sistema: UNA principal por pantalla. Si hay dos, ninguna lo es.
 */

import { forwardRef, Fragment, isValidElement, useMemo, useState, useRef, useEffect } from 'react';

export type VarianteBoton =
  /** La acción de la pantalla. Una sola. Guardar, Matricular, Registrar. */
  | 'principal'
  /** Acompaña a la principal. Filtros, Columnas, Exportar. */
  | 'secundaria'
  /** Neutra: no compite. Cancelar, Volver. */
  | 'neutra'
  /** Sin superficie. Acciones de fila y de barra. */
  | 'terciaria'
  /** Irreversible. Eliminar, Anular. Nunca para «Cancelar». */
  | 'destructiva';

const CLASE: Record<VarianteBoton, string> = {
  principal: 'btn-1',
  secundaria: 'btn-2',
  neutra: 'btn-neutro',
  terciaria: 'btn-terc',
  destructiva: 'btn-destr',
};

export type BotonProps = {
  variante?: VarianteBoton;
  /** Icono a la izquierda. Va oculto al lector: quien nombra es el botón. */
  icono?: React.ReactNode;
  /** Solo icono. Entonces `aria-label` es OBLIGATORIO y se comprueba en
   *  desarrollo: un botón sin nombre no se puede usar con lector de pantalla. */
  soloIcono?: boolean;
  mini?: boolean;
  /**
   * Fuerza el estado ocupado. **Casi nunca hace falta:** si `onClick` devuelve
   * una promesa, el botón se ocupa y se libera solo. Esto es para cuando el
   * estado vive fuera —por ejemplo, en un formulario que envía otro—.
   */
  ocupado?: boolean;
  /**
   * Qué decir mientras la acción viaja. «Guardando…», «Consultando…».
   *
   * POR QUÉ EXISTE, y por qué antes decíamos que no. La objeción era real:
   * cambiar el texto mueve el ancho del botón y la fila entera baila. Pero la
   * objeción no tumbaba el requerimiento, solo obligaba a resolverlo bien.
   *
   * Con dos acciones cerca —«Consultar» y «Guardar»— el giro solo dice que
   * algo pasa, no CUÁL. Quien pulsó una y ve girar la otra lee mal el estado
   * del sistema, y eso pasa justo cuando la red va lenta, que es cuando más se
   * mira la pantalla. Lo reportó Control Administrativos V2.0.
   *
   * El salto de ancho se resuelve en DOS sitios, y durante mucho tiempo solo
   * estuvo uno: (1) los dos textos se dibujan siempre, uno visible y el otro
   * transparente ocupando sitio, así que se reserva el del MÁS LARGO; y (2)
   * desde la v1.107.0, el giro reserva TAMBIÉN el suyo. Con las dos, un botón
   * **con `textoOcupado` y sin icono** mide igual antes, durante y después.
   * Los otros casos están medidos y declarados abajo, donde se dibuja.
   *
   * Y se resuelve AQUÍ porque fuera no puede resolverse bien: un proyecto que
   * lo quisiera tendría que envolver el botón y duplicar por fuera un estado
   * que ya vive dentro. Dos fuentes para lo mismo, en cada pantalla.
   *
   * Sin `textoOcupado`, el comportamiento es el de siempre.
   */
  textoOcupado?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Boton = forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  { variante = 'neutra', icono, soloIcono = false, mini = false, ocupado = false, textoOcupado, className = '', children, onClick, ...resto },
  ref
) {
  // ───────────────────────────────────────────────────────────────────────────
  // DOBLE ENVÍO: se impide AQUÍ, no en cada proyecto.
  //
  // Una propiedad `ocupado` que el proyecto tiene que acordarse de poner no
  // garantiza nada: el día que se olvida, se pulsa dos veces y se graba dos
  // veces. Y no se olvida por descuido —se pulsa dos veces porque el servidor
  // tarda y la persona insiste—.
  //
  // Así que el botón lo resuelve solo, con dos capas:
  //
  //   1 · Si `onClick` devuelve una promesa, el botón se ocupa mientras viaja
  //       y se libera al terminar, RESUELVA O FALLE. Sin liberar en el fallo,
  //       un error de red dejaría el botón muerto para siempre.
  //   2 · Mientras está ocupado, los clics se descartan ANTES de llegar al
  //       manejador. Es el cinturón por si el estado va con retraso: entre
  //       pulsar y repintar caben dos clics de alguien impaciente.
  //
  // No cubre lo que no puede: si la acción no devuelve promesa —un `fetch` sin
  // `return`— la capa 1 no se entera. Por eso existe también `ocupado`.
  // ───────────────────────────────────────────────────────────────────────────
  const [enVuelo, setEnVuelo] = useState(false);
  // `vivo` evita tocar el estado de un componente ya desmontado. Y se pone a
  // `true` EN EL CUERPO del efecto, no solo al declararlo.
  //
  // Esa línea de más es el arreglo de un fallo real, reportado por Control
  // Administrativos V2.0 tras migrar: en modo estricto —activado por omisión—
  // React monta, limpia y vuelve a montar. La limpieza dejaba `vivo` en
  // `false` y nada lo devolvía a `true`, así que desde ese momento la
  // liberación NO OCURRÍA NUNCA y el botón se quedaba deshabilitado para
  // siempre tras la primera acción.
  //
  // Y no se podía sortear desde fuera: `trabajando` es `ocupado || enVuelo`, y
  // `enVuelo` solo baja por aquí. La prueba de modo estricto lo fija.
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => { vivo.current = false; };
  }, []);

  const trabajando = ocupado || enVuelo;

  // `textoOcupado` es un ReactNode, y hay MUCHOS ReactNode legales que no
  // pintan una sola letra. Con la guarda `=== undefined` todos pasaban: el
  // texto de reposo quedaba con `aria-hidden`, el hueco del gerundio salia
  // vacio y el «, enviando» se suprimia — el boton ocupado se quedaba SIN
  // NINGUN NOMBRE ACCESIBLE. Es la mudez que R118 vino a arreglar, con otro
  // valor, y llega sola con `t('dialogo.grabando')` y la clave ausente.
  //
  // La primera version de este arreglo comparaba VALORES —`null`, `false`,
  // cadena vacia— y dejaba fuera seis variantes mas que una auditoria encontro
  // el mismo dia: `true`, `[]`, `[null, false]`, un espacio en blanco, y el
  // caso realista `<span>{t(clave)}</span>` con la traduccion vacia. Una
  // guarda por identidad no puede cubrir un arbol: hay que MIRAR DENTRO.
  //
  // Lo que no alcanza, declarado: un componente que devuelve `null` se cuenta
  // como texto, porque desde aqui no se puede saber que pinta. Un elemento SIN
  // prop `children` —`<span />`, `<Trans i18nKey="x" />`— tambien, y es a
  // proposito: `<Trans>` es el caso real y `<span />` vacio no lo es. Y no hay
  // guarda de ciclo: una estructura ciclica revienta la pila, pero React
  // revienta igual con esa entrada antes de llegar aqui.
  const tieneTexto = (n: React.ReactNode): boolean => {
    if (n === null || n === undefined || typeof n === 'boolean') return false;
    if (typeof n === 'string') return n.trim() !== '';
    if (typeof n === 'number') return true;
    if (Array.isArray(n)) return n.some(tieneTexto);
    if (isValidElement(n)) {
      const hijos = (n.props as { children?: React.ReactNode } | null)?.children;
      // Un FRAGMENTO vacio no tiene otra forma de pintar nada, asi que
      // `children === undefined` ahi si significa vacio. En cualquier otro
      // elemento significa «no lo se»: `<Trans i18nKey="x" />` pinta y no
      // tiene `children`, y ese es el caso real.
      if (hijos === undefined) return n.type !== Fragment;
      return tieneTexto(hijos);
    }
    return true;
  };

  /**
   * EL GERUNDIO SE MATERIALIZA ANTES DE MIRARLO, y esto costo dos intentos.
   *
   * `Set`, `Map`, un generador o cualquier iterable son hijos validos para
   * React. Mirarlos para saber si pintan texto obliga a recorrerlos, y un
   * iterador de UN SOLO USO se agota al recorrerlo. En desarrollo no se
   * notaba —React lo agota igual en su pasada de validacion de claves— pero
   * en un build de PRODUCCION React lo pinta de una sola pasada: mirarlo aqui
   * lo vaciaba y el boton salia EN BLANCO y sin nombre accesible.
   *
   * El segundo intento fue estrechar a `Set`/`Map`, y devolvio la mudez por el
   * otro lado: todo lo demas caia en el `return true` de arriba, asi que un
   * generador VACIO pasaba por «tiene texto» y volvia a dejar el boton sin
   * nombre. Las dos las midio una auditoria el 2026-09-11.
   *
   * Asi que no se mira el iterable: se copia UNA vez y se mira —y se pinta— la
   * copia. Lo que React recibe es un array, que se recorre las veces que haga
   * falta.
   */
  const gerundio = useMemo(() => {
    const n = textoOcupado as unknown;
    const suelto = typeof n === 'object' && n !== null
      && !Array.isArray(n) && !isValidElement(n)
      && typeof (n as Iterable<unknown>)[Symbol.iterator] === 'function';
    return suelto ? [...(n as Iterable<React.ReactNode>)] : textoOcupado;
  }, [textoOcupado]);

  // `soloIcono` queda fuera ENTERO, no solo del hueco del giro. Un botón de
  // solo icono no tiene texto que sustituir: dejarle el apilado le reservaba
  // el ancho completo del gerundio —«Exportando…» al lado del icono— y al
  // ocuparse el icono desaparecía y salía el texto. Dejaba de ser un botón de
  // icono. Medido el 2026-09-11. Con el gerundio fuera, se cae al «, enviando»
  // de siempre, que es lo que ese botón necesita.
  const diceElGerundio = !soloIcono && tieneTexto(gerundio);

  const alPulsar = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (trabajando) { e.preventDefault(); return; }
    const r = onClick?.(e) as unknown;
    if (r && typeof (r as Promise<unknown>).finally === 'function') {
      setEnVuelo(true);
      // `finally` y no `then`: si la petición falla, el botón tiene que volver.
      // POR QUE HAY UN `.catch`, Y POR QUE NO ESTA VACIO. Las dos mitades se
      // midieron el 2026-09-11, la segunda corrigiendo a la primera.
      //
      //  · Sin `.catch`: `.finally()` devuelve una promesa DERIVADA que
      //    rechaza con la misma razon, y el `void` la tiraba sin manejar. Cada
      //    accion fallida dejaba un `unhandledRejection` AUNQUE el proyecto
      //    capturara la suya. En Node >=15 eso tumba el proceso — y las
      //    pruebas de quien nos consume.
      //  · Con un `.catch` VACIO se arreglaba eso y se rompia otra cosa: para
      //    el patron normal —`onClick={() => guardar(datos)}`, sin capturar,
      //    que es justo por lo que se pasa `textoOcupado`— el aviso dejaba de
      //    llegar a NINGUN sitio. Un error de red pasaba a ser silencio.
      //
      // Observar el rechazo es obligado: es lo que libera el boton. Y observar
      // lo marca como manejado, asi que `unhandledrejection` DEJA DE
      // DISPARARSE. Eso no es gratis y se dice tal cual: para Sentry, Datadog
      // o Bugsnag un `unhandledrejection` es un EVENTO y un `console.error` es
      // una miga de pan. El aviso no desaparece, pero BAJA DE RANGO.
      //
      // No hay forma de tener las dos cosas: quien mira un rechazo lo apaga.
      // Si su producto depende de que el fallo llegue como evento, capturenlo
      // ustedes en `onClick` y repórtenlo — que ademas es donde saben QUE
      // estaban guardando.
      void (r as Promise<unknown>)
        .finally(() => { if (vivo.current) setEnVuelo(false); })
        .catch((razon) => {
          console.error('Boton: la acción falló y el botón se ha liberado.', razon);
        });
    }
  };
  // process.env y no import.meta.env: import.meta.env es de Vite y ata el
  // componente a un empaquetador concreto. Un componente del sistema no puede
  // exigir que quien lo consuma use Vite.
  if (process.env.NODE_ENV !== 'production' && soloIcono && !resto['aria-label']) {
    // Se avisa en desarrollo en vez de fallar: romper el build de un consumidor
    // por una etiqueta es desproporcionado, callarlo es peor.
    console.warn('Boton: `soloIcono` exige `aria-label`. Sin él no tiene nombre accesible.');
  }

  const clases = ['btn', CLASE[variante]];
  if (mini) clases.push('btn-mini');
  if (icono) clases.push('btn-ic');
  if (soloIcono) clases.push('btn-solo-ic');
  if (trabajando) clases.push('btn-ocupado');
  if (className) clases.push(className);

  return (
    <button
      type="button"
      ref={ref}
      className={clases.join(' ')}
      {...resto}
      // Estas TRES van despues del reparto a proposito: si fueran antes, un
      // `disabled={false}` del proyecto pisaria el bloqueo y el doble envio
      // volveria. La garantia no puede depender de lo que pase quien llama.
      //
      // `disabled` y no solo una clase: un boton que parece apagado pero
      // responde al Enter no previene nada. Y `aria-busy` para que el lector
      // diga que esta ocupado en vez de callar.
      disabled={trabajando || resto.disabled}
      aria-busy={trabajando || undefined}
      onClick={alPulsar}
    >
      {/* EL GIRO TAMBIEN RESERVA SU SITIO, y no lo hacia. Se reservaba el ancho
          del TEXTO y despues se INSERTABA el giro como un hijo mas del flex:
          14px + 8px de hueco = 22px de salto, justo en los botones que este
          sistema dibuja sin icono. Lo midio una auditoria el 2026-09-11 contra
          la promesa «el boton mide igual antes, durante y despues», que era
          falsa. Con `icono` no pasaba: ahi el giro SUSTITUYE al icono.
          Se resuelve con `btn-texto-oculto`, que ya existe y solo hace
          `visibility:hidden`: el hueco sigue ahi, la rueda no se ve.

          DOS LIMITES, medidos y declarados:
           · Solo con `textoOcupado`. Un boton sin gerundio y sin icono SIGUE
             creciendo 22px al ocuparse. Reservarlo siempre cambiaria el ancho
             en reposo de TODOS los botones de texto de todos los productos, y
             eso es una version mayor, no un arreglo.
           · Con `icono` el boton ENCOGE 4px: el icono mide 18 por omision y el
             giro 14. Viene de antes de R118 y no lo toca esta version.
           · `soloIcono` queda fuera del gerundio ENTERO —ver arriba—, asi que
             tampoco llega aqui. */}
      {trabajando
        ? <span className="btn-giro" aria-hidden="true" />
        : icono
          ? <span aria-hidden="true">{icono}</span>
          : diceElGerundio && <span className="btn-giro btn-texto-oculto" aria-hidden="true" />}

      {!diceElGerundio ? (
        children
      ) : (
        // LOS DOS TEXTOS SE DIBUJAN SIEMPRE, apilados: el que toca se ve y el
        // otro queda transparente ocupando su sitio. La caja mide lo que el más
        // largo, así que el ancho NO CAMBIA al pasar a ocupado.
        //
        // `aria-hidden` en el que no toca, y no `visibility`: hace falta que
        // siga ocupando espacio —que es todo el propósito— pero que el lector
        // no lea las dos versiones seguidas.
        <span className="btn-textos">
          <span className={trabajando ? 'btn-texto-oculto' : undefined} aria-hidden={trabajando || undefined}>
            {children}
          </span>
          <span className={trabajando ? undefined : 'btn-texto-oculto'} aria-hidden={!trabajando || undefined}>
            {gerundio}
          </span>
        </span>
      )}
      {/* Sin `textoOcupado`, el estado solo lo dicen el giro y `aria-busy`, así
          que hace falta decirlo también para el lector. CON `textoOcupado` ya
          lo dice el propio texto y repetirlo sería oírlo dos veces. */}
      {trabajando && !diceElGerundio && <span className="sr-solo">, enviando</span>}
    </button>
  );
});
