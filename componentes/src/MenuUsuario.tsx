/**
 * MENÚ DE USUARIO
 *
 * El avatar de la barra superior y lo que se despliega debajo: quién eres, el
 * tema, tus opciones y la salida.
 *
 * QUÉ ENTRA Y QUÉ NO, y por qué. El menú del catálogo lleva además densidad,
 * vista y descarga del sistema. Ninguna de las tres viaja:
 *
 *   · Densidad y vista son del CATÁLOGO. Sirven para exhibir el sistema en sus
 *     tres presentaciones, no para operar un producto.
 *   · La descarga de la entrega es del catálogo por definición: un producto no
 *     se descarga a sí mismo.
 *   · «Salir del sistema» SÍ entra. Está en todos los productos, siempre en el
 *     mismo sitio y siempre el último. Que cada proyecto decida dónde ponerla
 *     es como se acaba con la salida en un lugar distinto en cada pantalla.
 *
 * Lo demás lo pone el proyecto por `children`, con componentes del sistema.
 */

import { useEffect, useId, useRef, useState } from 'react';
import { Avatar } from './Avatar';

export type Tema = 'claro' | 'oscuro';

export type MenuUsuarioProps = {
  /** Identificador estable de la persona. De aquí sale el color del avatar, y
   *  por eso no vale el nombre: dos personas homónimas deben distinguirse. */
  id: string;
  nombre: string;
  correo?: string;
  /** URL de la foto. Sin ella, el avatar usa las iniciales. */
  foto?: string;
  onSalir: () => void;
  /**
   * Tema en curso. **Si no se pasa, el selector de tema no se pinta.**
   *
   * Es opt-in a propósito: MMI-DS §9 mantiene el modo oscuro como CALCULADO Y
   * NO APROBADO. Los valores existen y están verificados, pero un producto no
   * debería ofrecerlo hasta que se apruebe. Ofrecerlo por omisión sería
   * saltarse esa decisión desde el componente.
   */
  tema?: Tema;
  onTema?: (t: Tema) => void;
  /** Opciones propias del proyecto. Van ANTES de «Salir», que siempre cierra. */
  children?: React.ReactNode;
};

export function MenuUsuario({ id: idPersona, nombre, correo, foto, onSalir, tema, onTema, children }: MenuUsuarioProps) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);

  // Cerrar al pulsar fuera y con Escape. Las dos, no una: sin Escape el menú
  // atrapa a quien navega con teclado, y sin el clic fuera se queda abierto
  // sobre el contenido.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setAbierto(false);
      // El foco VUELVE al avatar. Cerrar y dejar el foco en el limbo obliga a
      // tabular desde el principio de la página.
      disparador.current?.focus();
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const idMenu = `${id}-menu`;

  return (
    <div className="us" ref={caja}>
      {/* El disparador ENVUELVE al avatar en vez de repetir sus clases. Si el
          avatar cambia, este cambia con él. */}
      <button
        ref={disparador}
        className="top-avatar"
        aria-expanded={abierto}
        aria-controls={idMenu}
        aria-haspopup="menu"
        aria-label={`Menú de ${nombre}`}
        onClick={() => setAbierto((v) => !v)}
      >
        <Avatar id={idPersona} nombre={nombre} foto={foto} tamano="m" />
      </button>

      <div className="us-menu" id={idMenu} role="menu" hidden={!abierto}>
        <div className="us-cab">
          <Avatar id={idPersona} nombre={nombre} foto={foto} tamano="m" />
          <div className="us-txt">
            <span className="us-nom">{nombre}</span>
            {correo && <span className="us-mail">{correo}</span>}
          </div>
        </div>

        {tema && onTema && (
          <div className="us-sec">
            <span className="us-et">Tema</span>
            {/* `aria-pressed` y no `role="radio"`: son dos botones que fijan un
                estado, y el lector debe decir cuál está puesto. */}
            <div className="us-tema" role="group" aria-label="Modo de color">
              <button
                className="us-tema-b"
                aria-pressed={tema === 'claro'}
                aria-label="Modo claro"
                title="Claro"
                onClick={() => onTema('claro')}
              >
                <IconoSol />
              </button>
              <button
                className="us-tema-b"
                aria-pressed={tema === 'oscuro'}
                aria-label="Modo oscuro"
                title="Oscuro"
                onClick={() => onTema('oscuro')}
              >
                <IconoLuna />
              </button>
            </div>
          </div>
        )}

        {children}

        {/* SIEMPRE la última, y siempre separada. La salida no compite con las
            opciones: se busca cuando se busca, y estar arriba solo consigue
            que se pulse sin querer. */}
        <button className="us-op us-salir" role="menuitem" onClick={onSalir}>
          <IconoSalir />
          <span>Salir del sistema</span>
        </button>
      </div>
    </div>
  );
}

/* Los tres iconos van dibujados aquí y no importados de `iconos.mjs` porque ese
   módulo devuelve cadenas de SVG pensadas para plantillas, no elementos de
   React. Los trazos son LOS MISMOS —`sol`, `luna` y `salir`—; si cambian allí,
   cambian aquí, y por eso llevan el nombre del icono escrito al lado. */

const IconoSol = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </svg>
);

const IconoLuna = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

const IconoSalir = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
);
