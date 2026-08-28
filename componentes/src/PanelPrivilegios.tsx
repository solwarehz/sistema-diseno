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
import { Segmentado, type OpcionSegmento } from './Segmentado';
import { Chip } from './Chip';
import { Boton } from './Boton';
import { Icono } from './Icono';

/**
 * R98 · CUÁNTO se ve de un campo, dentro de un privilegio que ya está concedido.
 *
 * No es un permiso más: «Ver trabajadores» puede estar concedido y el documento
 * verse en parcial. Son dos o tres estados excluyentes, así que es un
 * Segmentado — el componente que nació (R69) para este caso exacto, con el
 * ejemplo del documento: completo `71602303`, parcial `*****303`.
 *
 * Vive DENTRO del privilegio y no en el módulo porque de eso depende: sin «ver»
 * concedido, el nivel no significa nada.
 */
export type NivelPrivilegio = {
  id: string;
  /** El nombre del campo: «Documento», «Dirección», «Correo». */
  nombre: React.ReactNode;
  /** Dos o tres. Un nivel que no aplica no se pasa; uno que no se puede
   *  conceder se pasa `cerrado`, que es otra cosa. */
  opciones: OpcionSegmento[];
  /** El control entero cerrado por regla, con su motivo. */
  cerrado?: string;
};

/**
 * R99 · POR QUÉ UN PRIVILEGIO NO SE PUEDE REPARTIR. Son tres motivos, y leerlos
 * igual deja a quien reparte sin saber si insistir sirve de algo:
 *
 *   · `cerrado`   — no se podrá conceder nunca. La regla no va a cambiar.
 *   · `ajeno`     — existe y se concede, pero **quien reparte no lo tiene**, y
 *                   nadie puede dar lo que no tiene. Otro cargo sí puede.
 *   · `pendiente` — el permiso todavía no existe en el sistema. Va a existir.
 *
 * Lo trajo Control Administrativos con el argumento correcto, y citando este
 * mismo código: «un apagado invita a encenderlo». Con un solo estado, las tres
 * se leen igual y las tres invitan a lo mismo — a insistir.
 *
 * `cerrado: 'motivo'` a secas sigue valiendo y significa `cerrado`: lo que ya
 * estaba escrito no cambia de significado.
 */
export type NoRepartible =
  | { tipo: 'cerrado'; motivo: string }
  | { tipo: 'ajeno'; motivo: string }
  | { tipo: 'pendiente'; motivo?: string };

export type Privilegio = {
  id: string;
  nombre: React.ReactNode;
  ayuda?: React.ReactNode;
  /**
   * R99 · Varios privilegios con la MISMA clave son **el mismo permiso**: se
   * encienden y se apagan juntos.
   *
   * Lo pidió Control Administrativos y su ejemplo lo explica mejor que una
   * definición: «organigrama no tiene opción de interruptor de crear» — crear y
   * editar son ahí una sola cosa. Colapsarlos en un control se probó y se
   * descartó: la acción desaparecía de la lista y nadie sabía que existía. Se
   * quedan los dos interruptores, se mueven a la vez, y el panel lo dice antes
   * de pulsar.
   */
  clave?: string;
  /**
   * R110 · De qué OTRO privilegio del mismo módulo depende éste. Su `id`.
   *
   * Dos efectos, y son los dos que hasta ahora había que recomponer fuera:
   * mientras aquél esté apagado, éste se ve pero no se puede encender y dice
   * qué falta; y encenderlo enciende también aquél, igual que el `base`.
   *
   * POR QUÉ NO BASTABA `base`. El `base` es **uno solo por panel** y se aplica
   * en un salto: cualquier privilegio encendido enciende el base y ya. Una
   * cadena de tres —`leer` → `crear` → `carga-masiva`— no cabe ahí: poner
   * `base: 'crear'` deja a `leer` sin base, y dejarlo en `'leer'` permite
   * encender la carga masiva sin poder crear, que es un botón que responde 403.
   *
   * POR QUÉ NO SE RESOLVIÓ CON `cerrado`. Se podía, recalculándolo en cada
   * pintada, y por eso Control Administrativos no lo pidió como bloqueo.
   * `NoRepartible` describe por qué un privilegio **no se puede repartir**
   * —cerrado, ajeno, pendiente—, no un estado que cambia con lo que acaban de
   * pulsar; usarlo para esto desdibuja los tres motivos de R99. Y la otra mitad
   * —el encendido en cascada— cada producto la habría escrito por su cuenta, y
   * cada uno habría acertado distinto.
   *
   * SE ENCADENA. Si aquél depende a su vez de otro, se recorre la cadena
   * entera. Un ciclo se corta solo: se deja de andar donde ya se estuvo.
   *
   * FALLA CERRADO. Si el `id` no existe en el módulo, el privilegio queda
   * bloqueado y lo dice nombrando el id que falta. En un panel de permisos, una
   * errata tiene que quitar acceso, nunca darlo.
   */
  depende?: string;
  /** Niveles por campo. Solo se reparten si el privilegio está concedido. */
  niveles?: NivelPrivilegio[];
  /**
   * Por qué no se puede repartir. Texto —que significa `cerrado`— o los tres
   * tipos de `NoRepartible`. Nunca un booleano: un candado sin explicación se
   * lee como un fallo del sistema.
   */
  cerrado?: string | NoRepartible;
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

/**
 * `{ modulo: { privilegio: concedido } }`. Lo que no está, no está concedido.
 *
 * Los niveles guardan una CADENA bajo la clave `privilegio:nivel`, así que un
 * mismo mapa lleva las dos cosas y el producto persiste un solo objeto.
 */
export type ValorPrivilegios = Record<string, Record<string, boolean | string>>;

/** La clave con la que se guarda un nivel. Se exporta para poder leerlo fuera. */
export const claveNivel = (privilegio: string, nivel: string) => `${privilegio}:${nivel}`;

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

const concedido = (v: ValorPrivilegios, mod: string, priv: string) => v[mod]?.[priv] === true;

/** `cerrado: 'texto'` es azúcar de `{ tipo: 'cerrado', motivo: texto }`. */
export function comoNoRepartible(c: Privilegio['cerrado']): NoRepartible | undefined {
  if (!c) return undefined;
  return typeof c === 'string' ? { tipo: 'cerrado', motivo: c } : c;
}

/** Todos los privilegios del módulo, con grupos incluidos y en orden. */
function todos(m: ModuloPrivilegios): Privilegio[] {
  return [...m.privilegios, ...(m.grupos ?? []).flatMap((g) => g.privilegios)];
}

/**
 * R110 · La cadena de `depende` desde un privilegio, de dentro hacia fuera y
 * sin incluirlo a él: `carga-masiva` → `['crear']`, y si `crear` dependiera de
 * otro, también ese.
 *
 * Se corta sola en un ciclo —`a` depende de `b` y `b` de `a`— porque no vuelve
 * a entrar donde ya estuvo. Sin eso, una configuración mal escrita colgaría el
 * navegador en vez de enseñar un panel raro, y de las dos cosas la segunda se
 * arregla y la primera no se diagnostica.
 *
 * Un `depende` que apunta a un id inexistente devuelve ese id igual. Quien
 * llama lo verá como no concedido —no existe, no puede estarlo— y el
 * privilegio quedará bloqueado. Es a propósito: en permisos, una errata quita
 * acceso, nunca lo da.
 */
function cadenaDepende(m: ModuloPrivilegios, id: string): string[] {
  const lista = todos(m);
  const cadena: string[] = [];
  const visto = new Set<string>([id]);
  let actual = lista.find((p) => p.id === id)?.depende;
  while (actual && !visto.has(actual)) {
    visto.add(actual);
    cadena.push(actual);
    actual = lista.find((p) => p.id === actual)?.depende;
  }
  return cadena;
}

/**
 * R110 · Qué privilegio de la cadena falta, o `undefined` si están todos. Se
 * devuelve el PRIMERO que falta, no la lista: decirle a alguien que le faltan
 * tres cosas cuando solo puede resolver una es darle trabajo, no información.
 */
function faltaDepende(
  m: ModuloPrivilegios, v: ValorPrivilegios, id: string,
): string | undefined {
  return cadenaDepende(m, id).find((x) => !concedido(v, m.id, x));
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

/**
 * Lo que de verdad se aplica: sin el privilegio base, un módulo no concede nada
 * aunque su mapa lo diga.
 *
 * Existe porque el panel CONSERVA lo configurado al apagar el base (R98), y
 * entonces el mapa guardado y el mapa efectivo dejan de ser el mismo. Guardar
 * el primero es lo correcto —no se pierde el trabajo—; mandar el primero al
 * backend sería conceder lo que no se concedió.
 */
export function privilegiosEfectivos(
  modulos: ModuloPrivilegios[], valor: ValorPrivilegios, base: string | null = 'ver',
): ValorPrivilegios {
  const salida: ValorPrivilegios = {};
  for (const m of modulos) {
    const del = valor[m.id] ?? {};
    if (base && del[base] !== true) { salida[m.id] = {}; continue; }
    // R110 · Lo mismo que hace el base, y por lo mismo. Apagar aquel del que
    // uno depende NO borra lo guardado —eso es R98, y sigue en pie—, pero sí le
    // quita el efecto. Sin esta línea el backend recibiría `carga-masiva: true`
    // sin `crear`, que es exactamente el botón que responde 403 y el motivo por
    // el que se pidió la prop.
    const quitados = todos(m)
      .filter((p) => p.depende && faltaDepende(m, valor, p.id))
      .map((p) => p.id);
    const limpio = { ...del };
    for (const id of quitados) {
      delete limpio[id];
      // Los niveles de un privilegio sin efecto tampoco lo tienen.
      for (const k of Object.keys(limpio)) if (k.startsWith(`${id}:`)) delete limpio[k];
    }
    salida[m.id] = limpio;
  }
  return salida;
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
    // R99 · Los que comparten clave son el MISMO permiso: van juntos. Si no,
    // el panel enseñaría dos interruptores que el backend guarda como uno, y
    // al recargar uno de los dos habría cambiado solo.
    const clave = todos(m).find((p) => p.id === priv)?.clave;
    if (clave) {
      todos(m).forEach((p) => {
        if (p.clave === clave && !p.cerrado) delModulo[p.id] = activo;
      });
    }
    // R98 · EL BASE GOBIERNA, PERO NO BORRA.
    //
    // Hasta la v1.72.0, apagar el base ponía a `false` todo el módulo. Con
    // niveles por campo eso destruye configuración que costó definir —y en un
    // panel que guarda en cada pulsación, sin botón de Guardar, se pierde en el
    // acto y sin vuelta atrás—.
    //
    // Ahora se conserva. Es la misma decisión que ya tomó la tabla con sus
    // filtros: «al plegar la fila, los valores se conservan; plegar es dejar de
    // ver el control, no dejar de filtrar». Aquí, apagar «ver» es dejar de
    // conceder el módulo, no olvidar cómo estaba repartido.
    //
    // Lo que NO se conserva es el efecto: sin el base, nada se aplica. Eso lo
    // dice el panel en pantalla, y `privilegiosEfectivos` lo resuelve para
    // quien tenga que mandarlo al backend.
    if (base) {
      if (priv !== base && activo && !delModulo[base]) {
        const puedeBase = !todos(m).find((p) => p.id === base)?.cerrado;
        if (puedeBase) delModulo[base] = true;
      }
    }

    // R110 · ENCENDER ENCIENDE LA CADENA. Es la mitad que `cerrado` no podía
    // cubrir: recalcular un bloqueo se puede hacer fuera, pero el encendido en
    // cascada lo habría escrito cada producto por su cuenta y cada uno habría
    // acertado distinto.
    //
    // Se recorre desde TODO lo que acaba de encenderse —el privilegio pulsado y
    // los que comparten su clave—, porque un compañero de clave puede tener su
    // propia dependencia.
    //
    // APAGAR NO ARRASTRA. Apagar «crear» no apaga la carga masiva: la deja
    // visible y bloqueada, con lo configurado intacto. Es la misma decisión que
    // R98 tomó para el base —gobierna, pero no borra— y `privilegiosEfectivos`
    // se encarga de que tampoco surta efecto mientras tanto.
    if (activo) {
      const encendidos = Object.keys(delModulo).filter((k) => delModulo[k] === true);
      for (const id of encendidos) {
        for (const dep of cadenaDepende(m, id)) {
          // Uno cerrado no se enciende por la puerta de atrás: si no se puede
          // conceder a mano, tampoco de rebote. La cadena se para ahí, y el
          // privilegio de abajo se quedará bloqueado diciendo qué falta.
          const p = todos(m).find((x) => x.id === dep);
          if (!p || p.cerrado) break;
          delModulo[dep] = true;
        }
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

  const cambiarNivel = (m: ModuloPrivilegios, priv: string, nivel: string, v: string) => {
    onCambio({ ...valor, [m.id]: { ...(valor[m.id] ?? {}), [claveNivel(priv, nivel)]: v } });
  };

  const fila = (m: ModuloPrivilegios, p: Privilegio, esBase: boolean) => {
    const dado = concedido(valor, m.id, p.id);
    const no = comoNoRepartible(p.cerrado);
    // R110 · `cerrado` manda: si un privilegio no se puede repartir nunca, da
    // igual de qué dependa. Se mira la dependencia solo cuando no hay cerrado.
    const falta = no ? undefined : faltaDepende(m, valor, p.id);
    const nombreFalta = falta ? todos(m).find((x) => x.id === falta)?.nombre : undefined;
    // Una sola frase en UN solo nodo de texto siempre que se pueda. Partirla en
    // tres —«Antes hay que conceder «», el nombre, y «».»— la deja ilegible para
    // un lector de pantalla, que la anuncia a trozos, y para cualquiera que la
    // busque por su texto. Solo se compone con nodos si el nombre no es texto.
    const motivoFalta = falta === undefined ? null
      : typeof nombreFalta === 'string' || nombreFalta === undefined
        ? `Antes hay que conceder «${nombreFalta ?? falta}».`
        : <>Antes hay que conceder «{nombreFalta}».</>;
    // Con quién va enlazado, para decirlo ANTES de pulsar.
    const conQuien = p.clave
      ? todos(m).filter((x) => x.clave === p.clave && x.id !== p.id).map((x) => x.nombre)
      : [];
    return (
      <div className={[
        'pp-priv',
        esBase && 'pp-priv-base',
        // El motivo se arma FUERA del JSX: un ternario anidado dentro de
        // `className` deja al candado de huérfanas leyendo trozos sueltos, y
        // pasó a inventarse dos clases —`.no` y `.falta`— que no existen.
        //
        // R110 · Y al ordenarlo salió `.pp-no`, que se emitía desde R99 y que
        // NINGUNA regla define. Vivía escondida detrás del mismo desorden que
        // confundía al candado. Se quita en vez de inventarle un estilo: lo que
        // distingue a los cuatro motivos es `pp-no-*`, y una clase que no pinta
        // nada solo sirve para que alguien la use creyendo que sí.
        no ? `pp-no-${no.tipo}` : falta ? 'pp-no-depende' : '',
      ].filter(Boolean).join(' ')} key={p.id}>
        {/* R99 · Cada motivo se dibuja distinto, porque cada uno pide una cosa
            distinta de quien reparte: el cerrado que se olvide, el ajeno que
            hable con quien sí lo tiene, y el pendiente que espere. */}
        {no ? (
          <div className="pp-cerrado">
            <span className="pp-cerrado-ic">
              <Icono nombre={no.tipo === 'pendiente' ? 'informacion' : no.tipo === 'ajeno' ? 'usuarios' : 'candado'} />
            </span>
            <span className="pp-cerrado-txt">
              <span className="pp-cerrado-nom">{p.nombre}</span>
              <span className="pp-cerrado-eti">
                <Chip tono={no.tipo === 'pendiente' ? 'pendiente' : no.tipo === 'ajeno' ? 'info' : 'inactivo'}>
                  {no.tipo === 'cerrado' ? 'no se puede conceder'
                    : no.tipo === 'ajeno' ? 'no lo tiene usted'
                    : 'todavía no existe'}
                </Chip>
              </span>
              {no.motivo && <span className="pp-cerrado-motivo">{no.motivo}</span>}
            </span>
          </div>
        ) : falta ? (
          /* R110 · Mismo tratamiento que un no repartible —se ve, no se puede
             encender, y dice por qué— pero con su propio motivo y su propio
             icono. No se reutiliza ninguno de los tres de R99 a propósito:
             aquéllos explican por qué algo NO SE PUEDE repartir, y esto es un
             estado que se resuelve encendiendo el interruptor de arriba. */
          <div className="pp-cerrado">
            <span className="pp-cerrado-ic"><Icono nombre="capas" /></span>
            <span className="pp-cerrado-txt">
              <span className="pp-cerrado-nom">{p.nombre}</span>
              <span className="pp-cerrado-eti">
                <Chip tono="aviso">necesita otro permiso</Chip>
              </span>
              <span className="pp-cerrado-motivo">{motivoFalta}</span>
            </span>
          </div>
        ) : (
        <Interruptor
          etiqueta={
            conQuien.length ? (
              <>
                {p.nombre}
                <span className="pp-junto"> · va con {conQuien.map((n, i) => (
                  <span key={i}>{i > 0 ? ' y ' : ''}{n}</span>
                ))}</span>
              </>
            ) : p.nombre
          }
          ayuda={p.ayuda}
          activo={dado}
          deshabilitado={soloLectura}
          onCambio={(a) => cambiar(m, p.id, a)}
        />
        )}
        {/* Los niveles solo se reparten si el privilegio está concedido: sin
            «ver», elegir cuánto se ve no significa nada. No se ocultan al
            apagarlo —lo configurado se conserva— pero dejan de pedir atención. */}
        {p.niveles?.length && dado ? (
          <div className="pp-niveles">
            {p.niveles.map((n) => (
              <Segmentado
                key={n.id}
                etiqueta={n.nombre}
                contexto={typeof m.nombre === 'string' ? m.nombre : undefined}
                opciones={n.opciones}
                valor={String(valor[m.id]?.[claveNivel(p.id, n.id)] ?? n.opciones[0]?.valor ?? '')}
                deshabilitado={soloLectura}
                cerrado={n.cerrado}
                onCambio={(v) => cambiarNivel(m, p.id, n.id, v)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className={['pp', className].filter(Boolean).join(' ')}>
      {children && <div className="pp-cab">{children}</div>}

      <div className="pp-lista">
        {modulos.map((m) => {
          const lista = todos(m);
          const abiertoM = visibles.includes(m.id);
          // R110 · Uno bloqueado por su dependencia NO cuenta como concedido,
          // aunque lo guardado diga `true`: es justo lo que `privilegiosEfectivos`
          // le quita al backend, y un «4 de 6» que cuenta un permiso sin efecto
          // dice que se repartió algo que no se repartió.
          const dados = lista.filter((p) => !p.cerrado
            && concedido(valor, m.id, p.id) && !faltaDepende(m, valor, p.id));
          // Lo que no se puede repartir no cuenta en el «4 de 6»: contarlo haría
          // que un cargo pareciera incompleto por reglas que no dependen de él.
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
