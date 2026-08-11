/**
 * MARCO DE APLICACIÓN — navegación lateral, barra superior y contenido
 *
 * La pieza más grande del sistema: 184 de las 707 reglas que viajan —la cifra
 * la da `extraer.mjs`, y esta línea decía 196 de 446 desde una versión en la
 * que eso era cierto—. Y la que
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
  /** R42a · el TERCER nivel: Configuración › Catálogos › (cada catálogo).
   *  La hoja lo estilizaba desde siempre (.nav-rama, .nav-nietos, .nav-nieto)
   *  y el React no lo emitía — el desvío promesa/entrega de la auditoría.
   *  Una opción con hijos se dibuja como RAMA plegable, no como enlace;
   *  arranca cerrada salvo que contenga a la activa. */
  hijos?: OpcionNav[];
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
  // Al plegar cambia la REGLA de apertura, así que la apertura de los grupos se
  // re-sincroniza —igual que hace el catálogo—. Plegado, los grupos cierran: si
  // quedaran abiertos, cada uno sería un panel flotante atascado, y como
  // arrancan TODOS abiertos, plegar mostraba todos los flotantes a la vez.
  // Desplegado, vuelven todos abiertos, que es como nace el menú.
  const sincronizarGrupos = (estaPlegado: boolean) =>
    setAbiertos(estaPlegado ? new Set() : new Set(navegacion.map((g) => g.clave)));

  const setPlegado = (v: boolean | ((p: boolean) => boolean)) => {
    const nuevo = typeof v === 'function' ? v(plegado) : v;
    // R48 · LOS GRUPOS SIGUEN AL PLEGADO QUE QUEDA, NO AL QUE SE PIDE.
    //
    // Aquí se re-sincronizaba siempre, con el valor PEDIDO. Sin control de
    // fuera da igual —pedir es aplicar—, pero controlado (R21) el que manda es
    // el producto: si no devuelve el nuevo valor, el carril se queda plegado y
    // los grupos se abrían igual. Y plegado, un grupo abierto es un panel
    // flotante: el clic dejaba los CUATRO paneles encima del contenido con la
    // barra todavía a 56px. Medido a 900px: `.lat.colapsado` de 56px y cuatro
    // `.nav-hijos` visibles a la vez. Es justo el estado que el comentario de
    // arriba dice que no puede existir.
    //
    // Lo reportó el responsable: «al dar clic sigue comprimido pero se ven las
    // opciones de extendido».
    if (plegadoFuera === undefined) {
      setPlegadoDentro(nuevo);
      sincronizarGrupos(nuevo);
    }
    onPlegar?.(nuevo);
  };

  // Controlado, la sincronización llega cuando el producto DEVUELVE el cambio,
  // no cuando se le pide. Y llega igual si lo cambia por su cuenta —restaurar
  // la preferencia del perfil al cargar la sesión— que es un pliegue que este
  // componente no ve pasar por su botón.
  const plegadoPrevio = useRef(plegado);
  useEffect(() => {
    if (plegadoPrevio.current === plegado) return;
    plegadoPrevio.current = plegado;
    if (plegadoFuera !== undefined) sincronizarGrupos(plegado);
  }, [plegado]);
  // «Más» en la vista de app: la lista de lo que no cupo en las cinco pestañas.
  const [masAbierto, setMasAbierto] = useState(false);
  // Qué grupos están abiertos. Arrancan ABIERTOS: un menú que empieza cerrado
  // esconde la navegación entera y obliga a un clic antes de poder mirar.
  //
  // R48 · salvo que NAZCA plegado, que es lo que pasa cuando el producto manda
  // `plegado` y restaura la preferencia de la persona. Plegado, un grupo
  // abierto es un panel flotante: arrancando todos abiertos, el marco se
  // pintaba con los cuatro paneles encima del contenido antes de tocar nada.
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () => (plegado ? new Set() : new Set(navegacion.map((g) => g.clave)))
  );
  // R42a · qué RAMAS (tercer nivel) están abiertas. Al revés que los grupos,
  // arrancan CERRADAS —«doce ítems seguidos no se leen»— salvo la que
  // contiene a la opción activa: llegar a una pantalla y no ver dónde estás
  // en el menú es peor que un clic de más.
  const [ramas, setRamas] = useState<Set<string>>(() => {
    const conActiva = new Set<string>();
    for (const g of navegacion)
      for (const h of g.hijos ?? [])
        if (h.hijos?.some((n) => n.clave === activa)) conActiva.add(h.clave);
    return conActiva;
  });
  const alternarRama = (clave: string) =>
    setRamas((previas) => {
      const s = new Set(previas);
      s.has(clave) ? s.delete(clave) : s.add(clave);
      return s;
    });
  const lateral = useRef<HTMLElement>(null);
  const plegarBtn = useRef<HTMLButtonElement>(null);

  /**
   * EL MARGEN PARA LLEGAR AL PANEL. Plegado, el panel flotante nace al lado del
   * carril y el cursor tiene que CRUZAR los 56px del carril para alcanzarlo.
   * Cerrando en el `mouseleave` a secas, el panel desaparece por el camino y no
   * hay forma de elegir nada: se abre, se va uno a por él, y ya no está.
   *
   * El catálogo llevaba estos 220ms desde el principio —con la razón escrita al
   * lado— y la entrega cerraba en seco. Lo reportó el responsable probando a
   * 900px: «ese cambio en la entrega no se puede, se cierra rápido el menú que
   * aparece».
   *
   * 220ms y no más: por encima, el panel se queda colgado cuando de verdad te
   * fuiste, y estorba.
   */
  const GRACIA_SALIDA = 220;
  const salidas = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const abrirGrupo = (clave: string) => {
    clearTimeout(salidas.current[clave]);
    setAbiertos((s) => (s.has(clave) ? s : new Set(s).add(clave)));
  };
  const cerrarGrupoConGracia = (clave: string) => {
    clearTimeout(salidas.current[clave]);
    salidas.current[clave] = setTimeout(() => {
      setAbiertos((s) => { const n = new Set(s); n.delete(clave); return n; });
    }, GRACIA_SALIDA);
  };

  // Los temporizadores pendientes se cancelan al desmontar: sin esto, salir de
  // la pantalla con un panel abierto dispara un `setState` sobre un componente
  // que ya no está.
  useEffect(() => () => {
    for (const t of Object.values(salidas.current)) clearTimeout(t);
  }, []);

  // R39 y R38a · al CRUZAR a una banda más angosta, el marco se pliega solo.
  // Dos bandas, dos motivos:
  //   ≤900 — la banda del RIEL (R38a): antes la hoja forzaba 56px con CSS y
  //          el React no se enteraba: aria decía «desplegada» y la marca
  //          quedaba estrujada. Plegado DE VERDAD, MarcaMenu conmuta el logo
  //          solo y el aria dice la verdad. Quien quiera, re-despliega: a ese
  //          ancho los 236px caben en línea.
  //   ≤700 — la banda del CAJÓN (R39): el menú extendido pasaría a tapar el
  //          contenido; se pliega para que nadie herede un cajón plantado.
  // La ref evita el cierre rancio: el efecto corre una vez pero pliega con el
  // setPlegado del render vigente.
  const plegarRef = useRef(setPlegado);
  plegarRef.current = setPlegado;
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return; // jsdom, sin pena
    const bandas = ['(max-width: 900px)', '(max-width: 700px)'].map((q) => window.matchMedia(q));
    const alCruzar = (e: { matches: boolean }) => { if (e.matches) plegarRef.current(true); };
    bandas.forEach((b) => b.addEventListener('change', alCruzar));
    // Montado ya en angosto, arranca plegado: un cajón abierto de inicio tapa.
    if (bandas.some((b) => b.matches)) plegarRef.current(true);
    return () => bandas.forEach((b) => b.removeEventListener('change', alCruzar));
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
                // salir CON MARGEN — ver `GRACIA_SALIDA`. El manejador va en el
                // grupo entero, no en el título: el panel es hijo del grupo, así
                // que entrar al panel no lo cierra.
                onMouseEnter={plegado ? () => abrirGrupo(g.clave) : undefined}
                onMouseLeave={plegado ? () => cerrarGrupoConGracia(g.clave) : undefined}
                // CON TECLADO NO HAY RATÓN. Sin esto, tabulando dentro de un
                // grupo plegado el panel no se abría nunca y sus opciones eran
                // inalcanzables. El catálogo lo hacía con focusin/focusout y la
                // entrega no lo llevaba.
                onFocus={plegado ? () => abrirGrupo(g.clave) : undefined}
                onBlur={plegado ? (e) => {
                  // Solo si el foco SALE del grupo: moverse del título a una
                  // opción de dentro no puede cerrarlo.
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    cerrarGrupoConGracia(g.clave);
                  }
                } : undefined}
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
                    {g.hijos!.map((h) => {
                      // R42a · el TERCER nivel. Una opción con hijos es una
                      // RAMA plegable — el marcado que la hoja estiliza desde
                      // siempre y que el React no emitía.
                      if (h.hijos?.length) {
                        const ramaAbierta = ramas.has(h.clave);
                        const idNietos = `${id}-${h.clave}-nietos`;
                        return (
                          <div key={h.clave} className={['nav-rama', ramaAbierta ? 'abierta' : ''].filter(Boolean).join(' ')}>
                            <button
                              className="nav-hijo nav-rama-tit"
                              aria-expanded={ramaAbierta}
                              aria-controls={idNietos}
                              onClick={() => alternarRama(h.clave)}
                            >
                              {h.icono && <span className="nav-ic">{h.icono}</span>}
                              <span className="nav-txt">{h.texto}</span>
                              <span className="nav-chev" aria-hidden="true"><Icono nombre="chevron" tam="control" /></span>
                            </button>
                            <div className="nav-nietos" id={idNietos}>
                              <div className="nav-nietos-in">
                                {h.hijos.map((nieto) => (
                                  <a
                                    key={nieto.clave}
                                    className={['nav-nieto', activa === nieto.clave ? 'activo' : ''].filter(Boolean).join(' ')}
                                    href={nieto.href}
                                    aria-current={activa === nieto.clave ? 'page' : undefined}
                                    onClick={(e) => navegar(e, nieto.clave, nieto.href)}
                                  >
                                    {nieto.icono && <span className="nav-ic">{nieto.icono}</span>}
                                    <span className="nav-txt">{nieto.texto}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
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
                      );
                    })}
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





