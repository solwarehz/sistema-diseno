/**
 * EL MARCO DE VERDAD, DENTRO DEL CATÁLOGO.
 *
 * MMI-DS §9.1 justifica no montar Storybook diciendo que «el catálogo importa
 * los componentes reales y **no puede divergir**». Lo que había era un HTML
 * escrito a mano que **sí puede divergir, y divergía**: en cuatro versiones
 * seguidas se persiguió la misma clase de defecto —el `title` que el catálogo
 * pintaba y el componente no, el hover que el catálogo demostraba y el
 * componente no hacía, la maqueta con enlaces y chevron que el componente no
 * produce nunca, la regla 12 que entró en el componente y no en el catálogo—.
 *
 * Esto es la pieza que faltaba: **el componente, montado y vivo**, servido en
 * la misma página que la maqueta para poder compararlos con el ratón. Lo pidió
 * el responsable el 2026-09-15: *«en el cascarón usa tus componentes, así podré
 * detectar algún cambio no solicitado»*.
 *
 * Se empaqueta con esbuild DENTRO del contenedor —React vive ahí— y el paquete
 * se incrusta en el HTML. Si el empaquetado falla, el generador **para**: un
 * catálogo que se quedara sin el componente vivo y no lo dijera sería
 * exactamente la mentira que esto viene a cerrar.
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MarcoApp, type GrupoNav } from '../../componentes/src/MarcoApp';
import { Icono } from '../../componentes/src/Icono';

/** La misma navegación que enseña la maqueta de al lado, para comparar. */
const NAV: GrupoNav[] = [
  { clave: 'panel', texto: 'Dashboard', href: '#panel', icono: <Icono nombre="panel" /> },
  {
    clave: 'matricula', texto: 'Matrícula', href: '#m', icono: <Icono nombre="matricula" />,
    hijos: [
      { clave: 'fichas', texto: 'Fichas', href: '#fichas' },
      { clave: 'traslados', texto: 'Traslados', href: '#traslados' },
      { clave: 'vacantes', texto: 'Vacantes', href: '#vacantes' },
    ],
  },
  {
    clave: 'asistencia', texto: 'Asistencia', href: '#a', icono: <Icono nombre="asistencia" />,
    hijos: [
      { clave: 'marcas', texto: 'Marcas del día', href: '#marcas' },
      { clave: 'justif', texto: 'Justificaciones', href: '#justif' },
    ],
  },
  { clave: 'usuarios', texto: 'Usuarios', href: '#u', icono: <Icono nombre="usuarios" /> },
  {
    clave: 'configuracion', texto: 'Configuración', href: '#c', icono: <Icono nombre="configuracion" />,
    alPie: true,
    hijos: [
      { clave: 'general', texto: 'General', href: '#general', icono: <Icono nombre="configuracion" /> },
      {
        clave: 'catalogos', texto: 'Catálogos', icono: <Icono nombre="libro" />,
        hijos: [
          { clave: 'sedes', texto: 'Sedes', href: '#sedes', icono: <Icono nombre="libro" /> },
          { clave: 'cargos', texto: 'Cargos', href: '#cargos', icono: <Icono nombre="libro" /> },
        ],
      },
    ],
  },
];

function MarcoVivo() {
  const [activa, setActiva] = useState('fichas');
  const [plegado, setPlegado] = useState(false);
  return (
    <MarcoApp
      titulo="Colegio Albert Einstein"
      hrefInicio="#"
      navegacion={NAV}
      activa={activa}
      onNavegar={(clave) => setActiva(clave)}
      plegado={plegado}
      onPlegar={setPlegado}
      usuario={{
        id: 'u-1',
        nombre: 'PINEDA, José Isidro',
        correo: 'jose.pineda@ae.edu.pe',
        onSalir: () => {},
      }}
    >
      <div className="bloque">
        <p className="seccion-sub">
          Esto <strong>no es una maqueta</strong>: es <code>MarcoApp</code> montado y vivo, con
          la hoja que viaja. Lo que hagas aquí con el ratón es lo que hará en tu producto.
        </p>
        <p className="seccion-sub">Pantalla en curso: <strong>{activa}</strong>.</p>
      </div>
    </MarcoApp>
  );
}

const donde = document.getElementById('marco-vivo');
if (donde) createRoot(donde).render(<MarcoVivo />);
