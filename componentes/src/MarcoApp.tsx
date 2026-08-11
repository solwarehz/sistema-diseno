/**
 * MARCO DE APLICACIÓN — navegación lateral, barra superior y contenido
 *
 * La pieza más grande del sistema: 196 de las 446 reglas de estilo. Y la que
 * más se reconstruía, porque hasta ahora se entregaba **cómo se ve** y cada
 * proyecto rehacía **cómo se comporta**.
 *
 * Lo que trae dentro, y que nadie tiene que volver a escribir:
 *
 *   · plegar el panel, con el escudo que se queda y el texto que se va
 *   · grupos que se despliegan, con `aria-expanded` de verdad
 *   · la opción activa marcada con `aria-current="page"`, no solo pintada
 *   · el menú de usuario con su tema y su salida
 *   · el velo que cierra el panel en pantalla estrecha
 *   · Escape cierra lo que esté abierto y devuelve el foco
 *
 * Y una que no se ve y es la que más cuesta descubrir: **sobre el marco el
 * anillo de foco cambia de token**. El ámbar da 2,48:1 sobre `marco-nivel-1`,
 * por debajo del 3:1 que exige SC 1.4.11. La regla viaja en `tokens.css`, así
 * que se hereda sin saberla — pero conviene saber que está.
 *
 * QUÉ DECIDE EL PROYECTO: qué secciones hay, a dónde llevan y cuál está activa.
 * Eso no puede vivir aquí.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { MenuUsuario, type MenuUsuarioProps } from './MenuUsuario';
import { MarcaMenu } from './MarcaMenu';
import { Icono } from './Icono';
import { Avatar } from './Avatar';

export type OpcionNav = {
  /** Identificador estable. Es lo que se compara con `activa`. */
  clave: string;
  texto: string;
  /** A dónde lleva. Si falta, la opción solo agrupa. */
  href?: string;
  /**
   * R17 · Icono de la opción hija.
   *
   * Faltaba, y obligaba a una elección que no debería existir: cuando es el
   * SEGUNDO nivel el que lleva las pantallas, el icono pertenece al hijo. Sin
   * esto había que elegir entre conservar la jerarquía y perder los iconos, o
   * aplanar el menú y perder los rótulos de grupo.
   */
  icono?: React.ReactNode;
};

export type GrupoNav = {
  clave: string;
  texto: string;
  /** SVG del icono. Sale de `iconos.mjs`; el marco no elige por ti. */
  icono?: React.ReactNode;
  href?: string;
  hijos?: OpcionNav[];
  /**
   * R18 · Este grupo va al FONDO del panel, con un separador encima.
   *
   * Casi toda aplicación tiene uno que va el último y aparte —ajustes,
   * administración—. Es convención, no gusto: quien busca configurar mira
   * abajo. Es lo mismo que `MenuUsuario` hace con «Salir del sistema», y por
   * la misma razón.
   */
  alPie?: boolean;
};

export type MarcoAppProps = {
  /** El nombre del producto o del colegio, junto al escudo. */
  titulo: string;
  /**
   * Logo del cliente, horizontal, para el menú desplegado.
   *
   * Se pasa la URL, NO un elemento. Antes era `React.ReactNode` y eso dejaba
   * abierta la decisión que este componente existe para cerrar: con un nodo
   * libre, cada proyecto ponía su `<img>` con sus medidas y la imagen del
   * cliente volvía a poder romper el marco. Ahora el sistema decide el tamaño,
   * la proporción y el respaldo, y el proyecto solo aporta el archivo.
   */
  logo?: string;
  /** Versión compacta —el escudo— para el menú plegado. Sin ella se encoge la
   *  otra en un cuadrado de 40px, que funciona pero rara vez se lee. */
  logoCompacto?: string;
  /** A dónde lleva pulsar la marca. Siempre existe: sin ella, no hay vuelta a
   *  casa desde ninguna pantalla. */
  hrefInicio: string;
  navegacion: GrupoNav[];
  /** Clave de la opción en curso. De aquí sale el `aria-current`. */
  activa?: string;
  onNavegar?: (clave: string, href?: string) => void;
  usuario: Omit<MenuUsuarioProps, 'children'>;
  /** Opciones propias en el menú de usuario. */
  opcionesUsuario?: React.ReactNode;
  /** Acciones de la barra superior —mensajes, notificaciones—. Con `Boton`. */
  accionesBarra?: React.ReactNode;
  /**
   * `web` es lo normal: lateral plegable y barra arriba.
   * `app` es la aplicación en un teléfono: **sin lateral** y con pestañas
   * abajo.
   *
   * No es un tamaño de pantalla, es una forma de navegar. La web en un móvil
   * estrecho sigue siendo `web` —lateral que se despliega sobre el contenido—;
   * `app` es otra cosa y se elige a propósito.
   *
   * En `app` el marco respeta las zonas del dispositivo con
   * `env(safe-area-inset-*)`: la barra de gestos no se come la última pestaña
   * y la muesca de la cámara no tapa la barra superior. **No las dibuja**: en
   * un teléfono de verdad esas zonas existen, y pintarlas taparía con un
   * rectángulo justo lo que el sistema operativo ya ocupa.
   */
  vista?: 'web' | 'app';
  /**
   * R21 · Estado del panel, si el producto quiere mandarlo.
   *
   * Sin esto no se podía recordar: un producto que guarda las preferencias en
   * el perfil de la persona —para que le sigan de un equipo a otro— no tenía
   * forma de leer ni de fijar el plegado.
   *
   * Mismo patrón que `activa` / `onNavegar`: **si no se pasa, el marco se
   * gobierna solo**. Pasarlo lo convierte en controlado.
   */
  plegado?: boolean;
  onPlegar?: (plegado: boolean) => void;
  children: React.ReactNode;
};

export function MarcoApp({
  titulo,
  logo,
  logoCompacto,
  hrefInicio,
  navegacion,
  activa,
  onNavegar,
  usuario,
  opcionesUsuario,
  accionesBarra,
  vista = 'web',
  plegado: plegadoFuera,
  onPlegar,
  children,
}: MarcoAppProps) {
  const id = useId();
  const [plegadoDentro, setPlegadoDentro] = useState(false);
  // Controlado si llega de fuera; si no, se gobierna solo. El aviso sale en los
  // dos casos: un producto puede querer PERSISTIR sin querer MANDAR.
  const plegado = plegadoFuera ?? plegadoDentro;
  const setPlegado = (v: boolean | ((p: boolean) => boolean)) => {
    const nuevo = typeof v === 'function' ? v(plegado) : v;
    if (plegadoFuera === undefined) setPlegadoDentro(nuevo);
    onPlegar?.(nuevo);
    // Al plegar cambia la REGLA de apertura, así que el estado se re-sincroniza
    // —igual que hace el catálogo—. Plegado, los grupos cierran: si quedaran
    // abiertos, cada uno sería un panel flotante atascado, y como arrancan
    // TODOS abiertos, plegar mostraba todos los flotantes a la vez. Desplegado,
    // vuelven todos abiertos, que es como nace el menú.
    setAbiertos(nuevo ? new Set() : new Set(navegacion.map((g) => g.clave)));
  };
  // «Más» en la vista de app: la lista de lo que no cupo en las cinco pestañas.
  const [masAbierto, setMasAbierto] = useState(false);
  // Qué grupos están abiertos. Arrancan ABIERTOS: un menú que empieza cerrado
  // esconde la navegación entera y obliga a un clic antes de poder mirar.
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () => new Set(navegacion.map((g) => g.clave))
  );
  const lateral = useRef<HTMLElement>(null);
  const plegarBtn = useRef<HTMLButtonElement>(null);

  // R39 · al CRUZAR a la banda del cajón (≤700px), el marco se pliega solo.
  // Sin esto, estrechar la ventana con el menú extendido dejaba el cajón
  // plantado sobre el contenido — y como el botón de plegar queda DEBAJO del
  // cajón, con el ratón no había salida. La ref evita el cierre rancio: el
  // efecto corre una vez pero pliega con el setPlegado del render vigente.
  const plegarRef = useRef(setPlegado);
  plegarRef.current = setPlegado;
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return; // jsdom, sin pena
    const banda = window.matchMedia('(max-width: 700px)');
    const alCruzar = (e: MediaQueryListEvent) => { if (e.matches) plegarRef.current(true); };
    banda.addEventListener('change', alCruzar);
    // Montado ya en angosto, arranca plegado: un cajón abierto de inicio tapa.
    if (banda.matches) plegarRef.current(true);
    return () => banda.removeEventListener('change', alCruzar);
  }, []);

  // Escape pliega el panel cuando está desplegado sobre el contenido. Sin esto,
  // en pantalla estrecha el panel tapa y no hay forma de cerrarlo con teclado.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !plegado) {
        setPlegado(true);
        plegarBtn.current?.focus();
      }
    };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [plegado]);

  const alternarGrupo = (clave: string) =>
    setAbiertos((previos) => {
      const s = new Set(previos);
      s.has(clave) ? s.delete(clave) : s.add(clave);
      return s;
    });

  const navegar = (e: React.MouseEvent, clave: string, href?: string) => {
    if (!onNavegar) return;
    e.preventDefault();
    onNavegar(clave, href);
  };

  // CINCO PESTAÑAS COMO MÁXIMO. A partir de ahí ni se leen las etiquetas ni se
  // aciertan con el pulgar, así que el resto entra en «Más». El recorte lo hace
  // el sistema y no cada proyecto: es una regla de uso, no una preferencia.
  const TOPE_PESTANAS = 5;
  const enApp = vista === 'app';
  const pestanas = enApp
    ? navegacion.length > TOPE_PESTANAS
      ? navegacion.slice(0, TOPE_PESTANAS - 1)
      : navegacion
    : [];
  const sobran = enApp ? navegacion.slice(pestanas.length) : [];

  return (
    // `app` Y `app-cascaron`, las DOS. Faltaba la primera, y es la que lleva el
    // `display: flex` que pone la lateral y el contenido uno al lado del otro.
    // Sin ella se apilaban: la lateral ocupaba todo el ancho y el contenido caía
    // bajo el pliegue. El catálogo emite las dos —`class="app app-cascaron"`— y
    // el componente solo emitía una: un olvido al portarlo, no una decisión.
    // Lo encontró Control Administrativos V2.0 montándolo.
    <div className={['app', 'app-cascaron', enApp ? 'app-marco' : ''].filter(Boolean).join(' ')}>
      {/* En `app` NO se dibujan ni la lateral ni el velo ni el botón de plegar.
          Se podrían ocultar con CSS —y la hoja lo hace—, pero entonces la
          garantía depende de que la hoja cargue: sin ella quedaría un botón
          que no hace nada dentro del recorrido del tabulador. Lo que no tiene
          función no se dibuja. */}
      {!enApp && (
      <aside className={['lat', plegado ? 'colapsado' : ''].filter(Boolean).join(' ')} ref={lateral}>
        <MarcaMenu
          titulo={titulo}
          logo={logo}
          logoCompacto={logoCompacto}
          plegado={plegado}
          href={hrefInicio}
          onIr={onNavegar ? () => onNavegar('inicio', hrefInicio) : undefined}
        />

        <nav className="lat-nav" aria-label="Navegación principal">
          {[...navegacion.filter((g) => !g.alPie), ...navegacion.filter((g) => g.alPie)].map((g) => {
            const abierto = abiertos.has(g.clave);
            const tieneHijos = !!g.hijos?.length;
            const idHijos = `${id}-${g.clave}`;

            if (!tieneHijos) {
              return (
                <a
                  key={g.clave}
                  // `nav-al-pie` va tambien aqui: un grupo del pie puede no
                  // tener hijos —«Configuracion» suele ser una sola pantalla— y
                  // entonces se dibuja como enlace, no como grupo.
                  className={['nav-item', activa === g.clave ? 'activo' : '', g.alPie ? 'nav-al-pie' : ''].filter(Boolean).join(' ')}
                  href={g.href}
                  // `aria-current` y no solo el color: quien usa lector de
                  // pantalla no ve el sombreado, y saber dónde está es lo
                  // primero que necesita.
                  aria-current={activa === g.clave ? 'page' : undefined}
                  onClick={(e) => navegar(e, g.clave, g.href)}
                >
                  {g.icono && <span className="nav-ic">{g.icono}</span>}
                  <span className="nav-txt">{g.texto}</span>
                </a>
              );
            }

            return (
              // R16 · la hoja abre el grupo con `.abierto` sobre `.nav-grupo`,
              // y el componente marcaba el estado con `hidden` sobre los hijos.
              // Dos piezas que no se hablaban: el grupo no se abria NUNCA.
              //
              // Y el `hidden` tampoco ocultaba, que es lo que lo hacia dificil
              // de ver: `.nav-hijos { display: grid }` gana a la regla
              // `[hidden] { display: none }` del navegador. Un grupo que ni se
              // abria ni se cerraba. Lo midio Control Administrativos V2.0 en el
              // navegador: 0px de alto sin la clase, 39,5px con ella.
              <div
                className={['nav-grupo', abierto ? 'abierto' : '', g.alPie ? 'nav-al-pie' : ''].filter(Boolean).join(' ')}
                key={g.clave}
                // Plegado, el panel flotante abre AL PASAR EL CURSOR y cierra al
                // salir — el clic sigue ahí para el teclado. El manejador va en
                // el grupo entero, no en el título: el panel es hijo del grupo,
                // así que entrar al panel no lo cierra.
                onMouseEnter={plegado ? () => setAbiertos((s) => new Set(s).add(g.clave)) : undefined}
                onMouseLeave={plegado ? () => setAbiertos((s) => { const n = new Set(s); n.delete(g.clave); return n; }) : undefined}
              >
                <button
                  className="nav-item nav-grupo-tit"
                  aria-expanded={abierto}
                  aria-controls={idHijos}
                  onClick={() => alternarGrupo(g.clave)}
                >
                  {g.icono && <span className="nav-ic">{g.icono}</span>}
                  <span className="nav-txt">{g.texto}</span>
                  <span className="nav-chev" aria-hidden="true"><Icono nombre="chevron" tam="control" /></span>
                </button>

                {/* `hidden` y no desmontar: desmontar pierde el foco si estaba
                    dentro, y el lector anuncia un cambio de página que no hubo. */}
                <div className="nav-hijos" id={idHijos} hidden={!abierto}>
                  <div className="nav-hijos-in">
                    {/* Plegado, el panel flota lejos de su icono: sin este
                        título no dice DE QUÉ grupo son las opciones. La hoja lo
                        enseña solo bajo .colapsado; desplegado no existe. */}
                    <span className="nav-flot-tit">{g.texto}</span>
                    {g.hijos!.map((h) => (
                      <a
                        key={h.clave}
                        className={['nav-hijo', activa === h.clave ? 'activo' : ''].filter(Boolean).join(' ')}
                        href={h.href}
                        aria-current={activa === h.clave ? 'page' : undefined}
                        onClick={(e) => navegar(e, h.clave, h.href)}
                      >
                        {h.icono && <span className="nav-ic">{h.icono}</span>}
                        <span className="nav-txt">{h.texto}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
        {/* R30: la identidad de la sesión, a la vista y en permanencia. En un
            producto con varios perfiles, saber quién está dentro de un vistazo
            evita operar con la sesión equivocada; el avatar de la barra lo dice
            solo tras un clic. Es EL MISMO Avatar que arriba —misma persona,
            mismo color, mismas iniciales— y con el lateral plegado el texto se
            va y queda el círculo, como el resto del lateral. */}
        <div className="lat-usuario">
          <Avatar id={usuario.id} nombre={usuario.nombre} foto={usuario.foto} tamano="m" />
          <div className="lat-user-txt">
            <span className="lat-user-nom">{usuario.nombre}</span>
            {usuario.correo && <span className="lat-user-mail">{usuario.correo}</span>}
          </div>
        </div>
      </aside>
      )}

      {/* El velo solo existe cuando el panel tapa el contenido. Cierra al
          pulsarlo, que es lo que espera cualquiera en pantalla estrecha. */}
      {!enApp && (
        <div className="velo" hidden={plegado} onClick={() => setPlegado(true)} aria-hidden="true" />
      )}

      <div className="app-main">
        <div className="top">
          {!enApp && (
            <button
              ref={plegarBtn}
              className="top-plegar"
              aria-expanded={!plegado}
              aria-label={plegado ? 'Desplegar menú' : 'Plegar menú'}
              onClick={() => setPlegado((v) => !v)}
            >
              {/* Un icono por vista: la hamburguesa es lo que se reconoce en un
                  teléfono; el de plegar panel no significa nada ahí. */}
              <span className="ic-escritorio"><Icono nombre="panelIzq" tam="control" /></span>
              <span className="ic-movil"><Icono nombre="hamburguesa" tam="control" /></span>
            </button>
          )}

          <div className="top-acciones">
            {accionesBarra}
            <MenuUsuario {...usuario}>{opcionesUsuario}</MenuUsuario>
          </div>
        </div>

        <main className="app-contenido">{children}</main>
      </div>

      {/* Lo que no cupo en las cinco pestañas. Se abre SOBRE las pestañas, no
          las sustituye: quien lo abre tiene que seguir viendo dónde estaba. */}
      {enApp && sobran.length > 0 && (
        <div className="app-lista" id="app-mas" hidden={!masAbierto}>
          {sobran.map((g) => (
            <a
              key={g.clave}
              className={['app-lista-it', activa === g.clave ? 'activo' : ''].filter(Boolean).join(' ')}
              href={g.href}
              aria-current={activa === g.clave ? 'page' : undefined}
              onClick={(e) => { setMasAbierto(false); navegar(e, g.clave, g.href); }}
            >
              {g.icono && <span className="nav-ic" aria-hidden="true">{g.icono}</span>}
              <span className="app-lista-tx">{g.texto}</span>
            </a>
          ))}
        </div>
      )}

      {enApp && (
        <nav className="app-tabs" aria-label="Secciones">
          {pestanas.map((g) => (
            <a
              key={g.clave}
              className={['app-tab', activa === g.clave ? 'activo' : ''].filter(Boolean).join(' ')}
              href={g.href}
              aria-current={activa === g.clave ? 'page' : undefined}
              onClick={(e) => navegar(e, g.clave, g.href)}
            >
              {g.icono && <span className="nav-ic" aria-hidden="true">{g.icono}</span>}
              <span className="app-tab-txt">{g.texto}</span>
            </a>
          ))}

          {sobran.length > 0 && (
            <button
              type="button"
              className={['app-tab', sobran.some((g) => g.clave === activa) ? 'activo' : ''].filter(Boolean).join(' ')}
              aria-expanded={masAbierto}
              aria-controls="app-mas"
              onClick={() => setMasAbierto((v) => !v)}
            >
              <span className="nav-ic" aria-hidden="true"><Icono nombre="mas" tam="control" /></span>
              <span className="app-tab-txt">Más</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}





