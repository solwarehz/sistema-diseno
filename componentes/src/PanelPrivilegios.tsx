/**
 * PANEL DE PRIVILEGIOS
 *
 * Reparte permisos por módulo: qué puede hacer alguien —un cargo, una persona,
 * una integración— en cada parte de una aplicación.
 *
 * NO SABE DE NEGOCIO, y eso es lo que lo hace del sistema y no de un producto.
 * No conoce cargos, ni sedes, ni trabajadores: recibe módulos con privilegios y
 * devuelve qué está concedido. El mismo panel sirve para los permisos de un
 * puesto, los de un usuario suelto o los de una clave de API.
 *
 * SE COMPONE. El interruptor, el chip y el botón son los del sistema; lo único
 * propio es el andamiaje de la lista. En particular, `cerrado` del Interruptor
 * (R66) ya resolvía el caso difícil —un permiso que NO se va a poder dar, con
 * su motivo— y nació precisamente pensando en esto.
 *
 * LA REGLA QUE LO GOBIERNA: dentro de un módulo hay un privilegio del que
 * dependen los demás. Sin «ver», editar no significa nada. Apagarlo apaga el
 * módulo entero; encender cualquier otro lo enciende solo. Se puede cambiar
 * (`base`) o desactivar (`base={null}`) cuando el dominio no funcione así.
 */

import { useCallback, useMemo, useState } from 'react';
import { Interruptor } from './Interruptor';
import { Chip } from './Chip';
import { Boton } from './Boton';
import { Icono } from './Icono';

export type Privilegio = {
  id: string;
  nombre: React.ReactNode;
  ayuda?: React.ReactNode;
  /**
   * El motivo por el que este privilegio **no se puede** conceder. Es texto, no
   * un booleano, por lo mismo que en el Interruptor: un candado sin explicación
   * se lee como un fallo del sistema.
   */
  cerrado?: string;
};

/** Un bloque con título dentro del módulo. Para lo que no es una acción. */
export type GrupoPrivilegios = { titulo: string; privilegios: Privilegio[] };

export type ModuloPrivilegios = {
  id: string;
  nombre: React.ReactNode;
  /** Solo los privilegios que ese módulo tiene. Lo que no aplica no se pasa. */
  privilegios: Privilegio[];
  grupos?: GrupoPrivilegios[];
};

/** `{ modulo: { privilegio: concedido } }`. Lo que no está, no está concedido. */
export type ValorPrivilegios = Record<string, Record<string, boolean>>;

export type PanelPrivilegiosProps = {
  modulos: ModuloPrivilegios[];
  valor: ValorPrivilegios;
  onCambio: (valor: ValorPrivilegios) => void;
  /**
   * El privilegio del que dependen los demás dentro de cada módulo. `'ver'` por
   * omisión. `null` lo desactiva, para dominios donde los permisos son
   * independientes de verdad.
   */
  base?: string | null;
  /**
   * El estado de fábrica. Con él, cada módulo que difiera se marca como
   * modificado y aparece cómo volver — sin él, nadie sabe qué tocó.
   */
  preset?: ValorPrivilegios;
  onVolverAlPreset?: () => void;
  /** Módulos abiertos. Si no se pasa, el panel los recuerda por su cuenta. */
  abiertos?: string[];
  onAbiertos?: (ids: string[]) => void;
  soloLectura?: boolean;
  /** Encabezado libre: el selector de cargo, un buscador, lo que haga falta. */
  children?: React.ReactNode;
  className?: string;
};

const concedido = (v: ValorPrivilegios, mod: string, priv: string) => Boolean(v[mod]?.[priv]);

/** Todos los privilegios del módulo, con grupos incluidos y en orden. */
function todos(m: ModuloPrivilegios): Privilegio[] {
  return [...m.privilegios, ...(m.grupos ?? []).flatMap((g) => g.privilegios)];
}

/**
 * Lo concedido, dicho en una frase. Se exporta aparte porque el resumen suele
 * querer enseñarse fuera del panel —en una cabecera, en un correo, en un
 * registro— y no tiene por qué depender de que el panel esté montado.
 */
export function resumirPrivilegios(modulos: ModuloPrivilegios[], valor: ValorPrivilegios): string[] {
  return modulos
    .map((m) => {
      const dados = todos(m).filter((p) => !p.cerrado && concedido(valor, m.id, p.id));
      if (!dados.length) return null;
      const nombres = dados.map((p) => (typeof p.nombre === 'string' ? p.nombre.toLowerCase() : p.id));
      const nom = typeof m.nombre === 'string' ? m.nombre.toLowerCase() : m.id;
      return `${nombres.join(', ')} en ${nom}`;
    })
    .filter((x): x is string => x !== null);
}

export function PanelPrivilegios({
  modulos, valor, onCambio, base = 'ver', preset, onVolverAlPreset,
  abiertos, onAbiertos, soloLectura = false, children, className = '',
}: PanelPrivilegiosProps) {
  const [propios, setPropios] = useState<string[]>([]);
  const visibles = abiertos ?? propios;
  const alternar = (id: string) => {
    const nuevo = visibles.includes(id) ? visibles.filter((x) => x !== id) : [...visibles, id];
    if (onAbiertos) onAbiertos(nuevo); else setPropios(nuevo);
  };

  const cambiar = useCallback((m: ModuloPrivilegios, priv: string, activo: boolean) => {
    const delModulo = { ...(valor[m.id] ?? {}), [priv]: activo };
    // El privilegio base gobierna: apagarlo apaga el módulo; encender otro lo
    // enciende. Sin esto se puede guardar «editar sin ver», que el backend
    // tendría que resolver por su cuenta y cada producto de otra manera.
    if (base) {
      if (priv === base && !activo) {
        todos(m).forEach((p) => { delModulo[p.id] = false; });
      } else if (priv !== base && activo && !delModulo[base]) {
        const puedeBase = !todos(m).find((p) => p.id === base)?.cerrado;
        if (puedeBase) delModulo[base] = true;
      }
    }
    onCambio({ ...valor, [m.id]: delModulo });
  }, [valor, onCambio, base]);

  const modificados = useMemo(() => {
    if (!preset) return new Set<string>();
    return new Set(modulos.filter((m) => todos(m).some(
      (p) => concedido(valor, m.id, p.id) !== concedido(preset, m.id, p.id),
    )).map((m) => m.id));
  }, [modulos, valor, preset]);

  const fila = (m: ModuloPrivilegios, p: Privilegio, esBase: boolean) => (
    <div className={`pp-priv${esBase ? ' pp-priv-base' : ''}`} key={p.id}>
      <Interruptor
        etiqueta={p.nombre}
        ayuda={p.ayuda}
        activo={concedido(valor, m.id, p.id)}
        deshabilitado={soloLectura}
        cerrado={p.cerrado}
        onCambio={(a) => cambiar(m, p.id, a)}
      />
    </div>
  );

  return (
    <div className={['pp', className].filter(Boolean).join(' ')}>
      {children && <div className="pp-cab">{children}</div>}

      <div className="pp-lista">
        {modulos.map((m) => {
          const lista = todos(m);
          const abiertoM = visibles.includes(m.id);
          const dados = lista.filter((p) => !p.cerrado && concedido(valor, m.id, p.id));
          const posibles = lista.filter((p) => !p.cerrado).length;
          const sinBase = Boolean(base) && !concedido(valor, m.id, base as string);
          return (
            <section
              className={`pp-mod${abiertoM ? ' pp-abierto' : ''}${sinBase ? ' pp-sin-base' : ''}`}
              key={m.id}
            >
              <button
                type="button"
                className="pp-mod-cab"
                aria-expanded={abiertoM}
                aria-controls={`pp-${m.id}`}
                onClick={() => alternar(m.id)}
              >
                <span className="pp-chev"><Icono nombre="chevron" /></span>
                <span className="pp-mod-nom">
                  {m.nombre}
                  {modificados.has(m.id) && <span className="pp-marca"><Chip tono="identidad-3">modificado</Chip></span>}
                </span>
                {/* Lo concedido se ve SIN abrir: abrir es para cambiar, no para
                    enterarse. Con diez módulos, obligar a abrir uno por uno para
                    saber qué hay concedido es diez veces el mismo gesto. */}
                <span className="pp-tags">
                  {dados.length
                    ? dados.map((p) => <Chip key={p.id} tono="info">{p.nombre}</Chip>)
                    : <Chip tono="pendiente">sin permisos</Chip>}
                </span>
                <span className="pp-conteo">{dados.length} de {posibles}</span>
              </button>

              <div className="pp-mod-cuerpo" id={`pp-${m.id}`} hidden={!abiertoM}>
                {m.privilegios.map((p) => fila(m, p, p.id === base))}

                {sinBase && (
                  <p className="pp-aviso">
                    <Icono nombre="alerta" tam="control" />
                    <span>Sin este permiso, el resto del módulo no se aplica.</span>
                  </p>
                )}

                {(m.grupos ?? []).map((g) => (
                  <div className="pp-grupo" key={g.titulo}>
                    <p className="pp-grupo-tit">{g.titulo}</p>
                    {g.privilegios.map((p) => fila(m, p, false))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {preset && onVolverAlPreset && modificados.size > 0 && (
        <div className="pp-pie">
          <span className="pp-pie-txt">
            {modificados.size === 1 ? '1 módulo modificado' : `${modificados.size} módulos modificados`}
          </span>
          <Boton variante="neutra" mini onClick={onVolverAlPreset}>Volver al preset</Boton>
        </div>
      )}
    </div>
  );
}
