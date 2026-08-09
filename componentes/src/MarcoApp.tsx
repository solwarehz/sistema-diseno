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

export type OpcionNav = {
  /** Identificador estable. Es lo que se compara con `activa`. */
  clave: string;
  texto: string;
  /** A dónde lleva. Si falta, la opción solo agrupa. */
  href?: string;
};

export type GrupoNav = {
  clave: string;
  texto: string;
  /** SVG del icono. Sale de `iconos.mjs`; el marco no elige por ti. */
  icono?: React.ReactNode;
  href?: string;
  hijos?: OpcionNav[];
};

export type MarcoAppProps = {
  /** El nombre del producto o del colegio, junto al escudo. */
  titulo: string;
  /**
   * Logotipo horizontal del cliente, para el menú desplegado.
   *
   * Se pasa la URL, NO un elemento. Antes era `React.ReactNode` y eso dejaba
   * abierta la decisión que este componente existe para cerrar: con un nodo
   * libre, cada proyecto ponía su `<img>` con sus medidas y la imagen del
   * cliente volvía a poder romper el marco. Ahora el sistema decide el tamaño,
   * la proporción y el respaldo, y el proyecto solo aporta el archivo.
   */
  marca?: string;
  /** Versión compacta —el escudo— para el menú plegado. Sin ella se encoge la
   *  otra en un cuadrado de 40px, que funciona pero rara vez se lee. */
  marcaCompacta?: string;
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
  children: React.ReactNode;
};

export function MarcoApp({
  titulo,
  marca,
  marcaCompacta,
  hrefInicio,
  navegacion,
  activa,
  onNavegar,
  usuario,
  opcionesUsuario,
  accionesBarra,
  vista = 'web',
  children,
}: MarcoAppProps) {
  const id = useId();
  const [plegado, setPlegado] = useState(false);
  // «Más» en la vista de app: la lista de lo que no cupo en las cinco pestañas.
  const [masAbierto, setMasAbierto] = useState(false);
  // Qué grupos están abiertos. Arrancan ABIERTOS: un menú que empieza cerrado
  // esconde la navegación entera y obliga a un clic antes de poder mirar.
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () => new Set(navegacion.map((g) => g.clave))
  );
  const lateral = useRef<HTMLElement>(null);
  const plegarBtn = useRef<HTMLButtonElement>(null);

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
    <div className={['app-cascaron', enApp ? 'app-marco' : ''].filter(Boolean).join(' ')}>
      {/* En `app` NO se dibujan ni la lateral ni el velo ni el botón de plegar.
          Se podrían ocultar con CSS —y la hoja lo hace—, pero entonces la
          garantía depende de que la hoja cargue: sin ella quedaría un botón
          que no hace nada dentro del recorrido del tabulador. Lo que no tiene
          función no se dibuja. */}
      {!enApp && (
      <aside className={['lat', plegado ? 'colapsado' : ''].filter(Boolean).join(' ')} ref={lateral}>
        <MarcaMenu
          titulo={titulo}
          expandida={marca}
          comprimida={marcaCompacta}
          plegado={plegado}
          href={hrefInicio}
          onIr={onNavegar ? () => onNavegar('inicio', hrefInicio) : undefined}
        />

        <nav className="lat-nav" aria-label="Navegación principal">
          {navegacion.map((g) => {
            const abierto = abiertos.has(g.clave);
            const tieneHijos = !!g.hijos?.length;
            const idHijos = `${id}-${g.clave}`;

            if (!tieneHijos) {
              return (
                <a
                  key={g.clave}
                  className={['nav-item', activa === g.clave ? 'activo' : ''].filter(Boolean).join(' ')}
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
              <div className="nav-grupo" key={g.clave}>
                <button
                  className="nav-item nav-grupo-tit"
                  aria-expanded={abierto}
                  aria-controls={idHijos}
                  onClick={() => alternarGrupo(g.clave)}
                >
                  {g.icono && <span className="nav-ic">{g.icono}</span>}
                  <span className="nav-txt">{g.texto}</span>
                  <span className="nav-chev" aria-hidden="true"><Chevron /></span>
                </button>

                {/* `hidden` y no desmontar: desmontar pierde el foco si estaba
                    dentro, y el lector anuncia un cambio de página que no hubo. */}
                <div className="nav-hijos" id={idHijos} hidden={!abierto}>
                  <div className="nav-hijos-in">
                    {g.hijos!.map((h) => (
                      <a
                        key={h.clave}
                        className={['nav-hijo', activa === h.clave ? 'activo' : ''].filter(Boolean).join(' ')}
                        href={h.href}
                        aria-current={activa === h.clave ? 'page' : undefined}
                        onClick={(e) => navegar(e, h.clave, h.href)}
                      >
                        <span className="nav-txt">{h.texto}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
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
              <span className="ic-escritorio"><IconoPanel /></span>
              <span className="ic-movil"><IconoHamburguesa /></span>
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
              <span className="nav-ic" aria-hidden="true"><IconoMas /></span>
              <span className="app-tab-txt">Más</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}

/* Mismos trazos que `chevron`, `panelIzq` y `hamburguesa` de `iconos.mjs`. Se
   dibujan aquí porque ese módulo devuelve cadenas para plantillas, no elementos
   de React. */

const Chevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconoPanel = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

const IconoMas = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
  </svg>
);

const IconoHamburguesa = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
