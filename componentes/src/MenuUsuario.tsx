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

import { useId } from 'react';
import { Avatar } from './Avatar';
import { Icono } from './Icono';
import { usarDesplegable } from './interno/desplegable';

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
   * Sigue siendo opt-in, pero por otra razón. Hasta la v1.18.0 lo era porque el
   * modo oscuro estaba CALCULADO Y NO APROBADO, y ofrecerlo por omisión habría
   * saltado esa decisión desde el componente. **Se aprobó el 2026-08-09**, así
   * que esa razón ya no vale.
   *
   * Lo que queda es una razón mejor: el sistema NO SABE DÓNDE VIVE LA
   * PREFERENCIA. Si el componente guardara el tema por su cuenta, un producto
   * que ya lo guarda en el perfil de la persona tendría dos fuentes de verdad y
   * la pantalla parpadearía al cargar. Quien tiene sesión es el producto.
   */
  tema?: Tema;
  onTema?: (t: Tema) => void;
  /** Opciones propias del proyecto. Van ANTES de «Salir», que siempre cierra. */
  children?: React.ReactNode;
};

export function MenuUsuario({ id: idPersona, nombre, correo, foto, onSalir, tema, onTema, children }: MenuUsuarioProps) {
  const id = useId();
  // El abrir, el cerrar al pulsar fuera, el Escape y la devolución del foco
  // viven en `interno/desplegable`: los comparte con `PanelBarra` y estaban
  // escritos dos veces. Dos copias de un comportamiento divergen.
  const { abierto, setAbierto, alternar, caja, disparador } = usarDesplegable();

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
        onClick={alternar}
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
                <Icono nombre="sol" tam="control" />
              </button>
              <button
                className="us-tema-b"
                aria-pressed={tema === 'oscuro'}
                aria-label="Modo oscuro"
                title="Oscuro"
                onClick={() => onTema('oscuro')}
              >
                <Icono nombre="luna" tam="control" />
              </button>
            </div>
          </div>
        )}

        {children}

        {/* SIEMPRE la última, y siempre separada. La salida no compite con las
            opciones: se busca cuando se busca, y estar arriba solo consigue
            que se pulse sin querer. */}
        <button className="us-op us-salir" role="menuitem" onClick={onSalir}>
          <Icono nombre="salir" tam="control" />
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



