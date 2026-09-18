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

import { Fragment, useCallback, useEffect, useId, useMemo, useState } from 'react';
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
  | { tipo: 'pendiente'; motivo?: string }
  /**
   * R151 · **NO APLICA** — la acción no existe para este recurso, y eso es un
   * dato, no una ausencia.
   *
   * Los otros tres dicen por qué algo **no se puede conceder**; éste dice que
   * **no hay nada que conceder**. La regla 3 llevaba desde el R97 diciendo «lo
   * que no aplica no se pasa», y en una lista es correcto: una fila entera para
   * decir que algo no existe es ruido. **En una matriz no**, y lo explicó
   * Control Administrativos V2.0 mejor de lo que lo teníamos escrito:
   *
   * > «Omitir no es lo mismo que decir que no aplica. Hoy el dueño ve que
   * > "Contrato" no tiene "Desactivar" —hay un hueco en esa columna, y al pasar
   * > el cursor dice por qué: un contrato no se apaga, se cierra con fecha—. Si
   * > se omite, nunca se entera de que esa acción existe.»
   *
   * El motivo es **obligatorio**, y aquí más que en los otros: un hueco sin
   * explicación se lee como un olvido del que montó la pantalla.
   *
   * No cuenta en el «4 de 6», igual que los otros tres: contar una acción que
   * no existe haría que un cargo pareciera incompleto por algo que no depende
   * de nadie.
   */
  | { tipo: 'noAplica'; motivo: string };

/**
 * R151 · UNA COLUMNA DE LA MATRIZ. Una acción: ver, editar, crear, descargar.
 *
 * Las columnas las declara el PANEL, no los módulos: una matriz con columnas
 * distintas por fila no es una matriz, es una lista con más huecos. Que la
 * rejilla sea la misma en todas las filas es lo que permite leer hacia abajo, y
 * leer hacia abajo —«¿a quién le he dado Crear?»— es la mitad del valor de esta
 * forma. La otra mitad, leer hacia el lado, ya la daba la lista.
 */
export type ColumnaPrivilegios = {
  id: string;
  titulo: React.ReactNode;
  /** Se separa de la anterior con un filete: es otra clase de acción. */
  aparte?: boolean;
};

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
   * qué falta; y encenderlo enciende también aquél.
   *
   * R111 · EL SEGUNDO EFECTO ES UNA RED, NO EL CAMINO NORMAL, y conviene no
   * venderlo de más: como la fila bloqueada deja de ser pulsable, la cascada
   * solo llega a actuar cuando el privilegio se enciende POR OTRA VÍA —al
   * compartir `clave` con otro (R99), o al venir así en el `valor` inicial—.
   * En la pantalla se enciende de uno en uno, de arriba abajo.
   *
   * Y NO desactiva el `base`: ése sigue encendiéndose de rebote al pulsar
   * cualquier privilegio que sí sea pulsable. La primera redacción de esta
   * documentación decía lo contrario y se midió que era falso.
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
  /**
   * R148 · **Apagado, pero SIN dejar de decir cómo está.** Lo pidió Control
   * Administrativos V2.0 con el caso que lo explica: su servidor manda, junto a
   * la matriz, qué permisos puede conceder **quien está mirando**. Que el cargo
   * tenga «Editar» y que tú no puedas tocarlo son **dos hechos distintos y los
   * dos importan**.
   *
   * Lo único que había por privilegio era `cerrado`, y `cerrado` **sustituye el
   * interruptor por un chip**: el on/off desaparece. Un cargo con el permiso
   * concedido se veía como si no lo tuviera, y la pantalla mentía sobre lo
   * único que existe para responder.
   *
   * Es `soloLectura`, pero por fila. Y **sigue contando** en el «4 de 6» y en
   * los chips de la cabecera, porque el permiso está concedido: lo que no se
   * puede es cambiarlo.
   *
   * SE APAGA CON `aria-disabled`, NO CON `disabled` —lo resuelve `Interruptor`,
   * que ya lo hacía— así que **se alcanza con teclado y su estado se lee**. Un
   * apagado que además esconde el dato es el defecto, no el remedio.
   *
   * EL PORQUÉ VA EN `ayuda`. No se inventa un campo de motivo: el que hay sirve,
   * y un motivo obligatorio para algo que a veces no lo tiene acaba en frases
   * de relleno.
   */
  deshabilitado?: boolean;
  /**
   * R151 · En qué **columna** cae, con `presentacion="matriz"`. El `id` de una
   * de las columnas declaradas. Sin matriz se ignora.
   */
  columna?: string;
  /**
   * R151 · En qué **fila** cae. El `id` de una de las `filas` del módulo. Por
   * omisión, el módulo entero es una fila.
   */
  fila?: string;
};

/** Un bloque con título dentro del módulo. Para lo que no es una acción. */
export type GrupoPrivilegios = { titulo: string; privilegios: Privilegio[] };

export type ModuloPrivilegios = {
  id: string;
  nombre: React.ReactNode;
  /**
   * Solo los privilegios que ese módulo tiene. **En lista, lo que no aplica no
   * se pasa**; en matriz se puede declarar con `cerrado: { tipo: 'noAplica' }`
   * para que el hueco hable en vez de callar. Ver la regla 3.
   */
  privilegios: Privilegio[];
  grupos?: GrupoPrivilegios[];
  /**
   * R151 · Las **filas** del módulo dentro de la matriz. Sin esto, el módulo es
   * **una** fila y se llama como él.
   *
   * El nombre vive aquí y no en cada privilegio a propósito: repetirlo en los
   * seis privilegios de una fila es repetir seis veces una decisión, y una
   * decisión escrita seis veces se separa. Es la misma razón por la que las
   * columnas las declara el panel.
   */
  filas?: { id: string; nombre: React.ReactNode }[];
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
  /**
   * R150 · Recibe **dos** cosas: el mapa completo y **lo efectivo**.
   *
   * Lo natural es **guardar el primero** —para no perder lo configurado— y
   * **mandar el segundo** al backend. Se entregan juntos porque calcularlo
   * fuera obliga a repetir el `base`, y un `base` repetido es un `base` que un
   * día no coincide: con `base={null}` en el panel y
   * `privilegiosEfectivos(modulos, valor)` sin tercer argumento se vaciaban
   * todos los módulos sin `ver`, en silencio. Aquí no puede discrepar: lo
   * calcula el panel con el suyo.
   *
   * El segundo argumento es nuevo en la v1.126.0 y **no rompe a nadie**: quien
   * declare un solo parámetro lo ignora.
   *
   * ⚠️ Y lea lo que dice `privilegiosEfectivos` sobre el borrado: un módulo sin
   * su `base` sale como `{}`, y con un PUT de juego completo eso **borra**.
   */
  onCambio: (valor: ValorPrivilegios, efectivo: ValorPrivilegios) => void;
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
  /**
   * R151 · **Lista o matriz.** Por omisión, lista.
   *
   * La lista responde «¿qué puede hacer este cargo con Contratos?» y la matriz
   * responde ADEMÁS «¿a quién le he dado Crear?», que en lista **no se puede
   * responder**: hay que abrir los once acordeones y recorrerlos. Lo trajo
   * Control Administrativos V2.0 con el dato que lo convierte en requisito y no
   * en gusto: revisar periódicamente quién tiene qué es **obligación legal**
   * —D.S. 016-2024-JUS art. 46.1.c— y hoy se hace mirando una columna.
   *
   * **Es la MISMA lógica**, no otro componente: `base`, `depende`, `clave`,
   * `deshabilitado`, los cuatro motivos de `NoRepartible` y lo efectivo se
   * calculan igual y en el mismo sitio. Lo único que cambia es dónde se dibuja
   * cada interruptor. Partirlo en dos componentes habría sido partir la lógica,
   * y dos lógicas que tienen que coincidir dejan de coincidir.
   *
   * Necesita `columnas`. Sin ellas no hay matriz que dibujar y se avisa.
   */
  presentacion?: 'lista' | 'matriz';
  /** R151 · Las columnas de la matriz. Obligatorias con `presentacion="matriz"`. */
  columnas?: ColumnaPrivilegios[];
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
/**
 * R151 · QUÉ BASE GOBIERNA A ESTE PRIVILEGIO.
 *
 * LA REGLA 1 DABA POR HECHO QUE UN MÓDULO ES UN RECURSO, y hasta el R151 lo
 * era: `base` se buscaba por `id` literal —`concedido(valor, m.id, base)`— y
 * «ver» mandaba sobre el módulo entero.
 *
 * **Con `filas`, un módulo tiene varios recursos.** Los `id` de sus privilegios
 * son únicos dentro del módulo (`trab-ver`, `cont-ver`), así que **nunca existe
 * uno llamado `ver`**, que es el valor por omisión de `base`. El resultado
 * medido era el peor posible y en silencio: `privilegiosEfectivos` devolvía
 * `{}` para el módulo **pase lo que pase con los interruptores**, y con un
 * backend de juego completo eso **borra permisos que nadie retiró** — el daño
 * exacto que el R150 vino a cerrar, reabierto por la puerta de al lado.
 *
 * Lo cazó una auditoría adversaria antes de publicar. Las cuatro invocaciones
 * de matriz que existían —tres pruebas y el catálogo— pasaban `base={null}`,
 * así que **el camino por omisión no lo ejercía nadie**.
 *
 * Así que con `filas`, `base` nombra **la columna** base, y el que gobierna a
 * cada privilegio es el de **su propia fila** en esa columna. Es lo que una
 * pantalla de permisos significa: sin «ver Contratos» no hay nada de Contratos,
 * y eso no dice nada sobre Trabajadores.
 *
 * Devuelve `null` cuando no hay base que aplicar. Quien necesite saber que el
 * base **no resuelve** —declarado y sin privilegio que lo encarne— tiene
 * `baseSinResolver`: callarlo es lo que produjo el borrado.
 */
export function baseDe(
  m: ModuloPrivilegios, p: Privilegio, base: string | null,
): string | null {
  if (!base) return null;
  if (!m.filas?.length) return base;
  return todos(m).find((x) => x.fila === p.fila && x.columna === base)?.id ?? null;
}

/**
 * R151 · ¿Hay `base` declarado que NINGÚN privilegio encarna? Con `filas`, por
 * fila. Se usa para avisar en desarrollo, no para decidir nada.
 */
export function baseSinResolver(
  m: ModuloPrivilegios, base: string | null,
): string[] {
  if (!base) return [];
  if (!m.filas?.length) {
    return todos(m).some((x) => x.id === base) ? [] : [m.id];
  }
  return m.filas
    .filter((f) => !todos(m).some((x) => x.fila === f.id && x.columna === base))
    .map((f) => f.id);
}

/**
 * R150 · **EL `base` ES OBLIGATORIO, SIN VALOR POR OMISIÓN.** Feo, y a propósito.
 *
 * Este tercer parámetro era `= 'ver'` y era **independiente del `base` del
 * componente**. Un producto que montara el panel con `base={null}` —el modo que
 * esta misma documentación ofrece— y llamara `privilegiosEfectivos(modulos,
 * valor)` sin tercer argumento **vaciaba todos los módulos sin `ver`**. Las dos
 * llamadas eran válidas, ni los tipos ni el contrato avisaban, y la combinación
 * **destruía datos**. Lo encontró Control Administrativos V2.0 leyendo, antes de
 * adoptar el panel.
 *
 * Quitar el valor por omisión convierte esa combinación en **un error de
 * compilación**, que es la única forma de equivocarse que este componente puede
 * permitirse. Es un cambio que rompe a quien llamaba con dos argumentos: rompe
 * en voz alta, que es lo contrario de como rompía antes.
 *
 * Y LO MEJOR ES NO LLAMARLA: el panel entrega lo efectivo como **segundo
 * argumento de `onCambio`**, calculado con el `base` que de verdad tiene. Así no
 * hay dos fuentes que puedan discrepar.
 *
 * ⚠️ **LO EFECTIVO PUEDE SER UN BORRADO.** Un módulo sin su `base` devuelve
 * `{}`. Si su backend recibe **juegos completos** —un PUT de todo o nada—, ese
 * `{}` no significa «esto no se aplica»: significa **borrar las filas de ese
 * módulo**. Un cargo con `memorandums.emitir` pero sin `marcaciones.leer` lo
 * pierde al siguiente guardado sin que nadie lo haya retirado. No es un defecto
 * de esta función —lo efectivo es lo efectivo— pero es la clase de cosa que se
 * descubre con los permisos ya perdidos, así que va dicho aquí y en el contrato.
 */
export function privilegiosEfectivos(
  modulos: ModuloPrivilegios[], valor: ValorPrivilegios, base: string | null,
): ValorPrivilegios {
  const salida: ValorPrivilegios = {};
  for (const m of modulos) {
    const del = valor[m.id] ?? {};
    // R110 · Lo mismo que hace el base, y por lo mismo. Apagar aquel del que
    // uno depende NO borra lo guardado —eso es R98, y sigue en pie—, pero sí le
    // quita el efecto. Sin esta línea el backend recibiría `carga-masiva: true`
    // sin `crear`, que es exactamente el botón que responde 403 y el motivo por
    // el que se pidió la prop.
    //
    // R111 · Y lo CERRADO tampoco se aplica. Salió midiendo esto: un mapa
    // guardado ANTES de que una regla cerrara ese permiso seguía viajando al
    // backend concediendo justo lo que el panel dice que no se puede conceder.
    // Es el mismo argumento del 403, al revés. `resumirPrivilegios` ya lo
    // filtraba (:222) y esta función no, aunque se documenta como «lo que de
    // verdad se aplica».
    /*
     * SE QUITA HASTA QUE NO QUEDA NADA QUE QUITAR, y luego se mira el base.
     *
     * DOS DEFECTOS DE DATOS, los dos cazados por una auditoria adversaria antes
     * de publicar, y los dos del mismo origen: mirar el mapa CRUDO en vez del
     * ya limpiado.
     *
     * UNO · la guarda del base leia `del[base]`, pero el propio base puede
     * caerse despues —por `cerrado`, o por un `depende` sin resolver—. El
     * modulo no se vaciaba y VIAJABA SIN SU BASE: con `ver` cerrado y un mapa
     * viejo `{ver:true, editar:true}`, esta funcion devolvia `{editar:true}`.
     * Es el 403 de R111 al reves: se manda al backend justo lo que el panel
     * dice que no se puede conceder.
     *
     * DOS · `faltaDepende` consultaba `valor`, no lo limpiado, asi que el
     * dependiente de un CERRADO sobrevivia sin su dependencia: `carga` viajaba
     * sin `crear`. Quitar una cosa puede tumbar a la siguiente, y eso es un
     * PUNTO FIJO, no una pasada.
     *
     * Se itera sobre el mapa que se va limpiando hasta que deja de encogerse.
     * El tope es el numero de privilegios: cada vuelta quita al menos uno o
     * para.
     */
    const limpio: Record<string, boolean | string> = { ...del };
    const quitar = (id: string) => {
      delete limpio[id];
      // Los niveles de un privilegio sin efecto tampoco lo tienen.
      for (const k of Object.keys(limpio)) if (k.startsWith(`${id}:`)) delete limpio[k];
    };
    const parcial: ValorPrivilegios = { [m.id]: limpio };
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const p of todos(m)) {
        if (limpio[p.id] === undefined) continue;
        if (p.cerrado || (p.depende && faltaDepende(m, parcial, p.id))) { quitar(p.id); cambio = true; }
      }
    }
    /* Y LOS NIVELES DE LO QUE NO ESTA CONCEDIDO TAMPOCO SE APLICAN. Se limpiaban
       solo los de lo QUITADO, asi que `{editar:false, 'editar:doc':'b'}` viajaba
       entero: una configuracion de campo para un permiso que no se tiene. Es el
       mismo argumento que el resto de esta funcion —lo efectivo es lo que de
       verdad rige— y el mapa completo sigue guardandolo, que es R98. */
    for (const p of todos(m)) {
      if (limpio[p.id] !== true) {
        for (const k of Object.keys(limpio)) if (k.startsWith(`${p.id}:`)) delete limpio[k];
      }
    }
    /* Y AHORA EL BASE, SOBRE LO QUE HA QUEDADO.
     *
     * SIN `filas` es lo de siempre: si el base no sobrevivio, el modulo entero
     * deja de aplicarse, que es lo que `base` significa.
     *
     * R151 · CON `filas`, EL BASE GOBIERNA SU RECURSO Y NO EL MODULO. Vaciar
     * el modulo entero porque un recurso perdio su `ver` se llevaria por
     * delante los otros recursos, que no tienen nada que ver. Y el base que se
     * busca es el de LA FILA DE CADA PRIVILEGIO —`baseDe`—, no un id literal
     * que con filas no existe. Antes de esto, un modulo con `filas` y el
     * `base` por omision devolvia `{}` SIEMPRE.
     *
     * Va dentro del punto fijo y no despues: quitar un privilegio por no tener
     * su base puede tumbar al que dependia de el. */
    if (base) {
      if (!m.filas?.length) {
        if (limpio[base] !== true) { salida[m.id] = {}; continue; }
      } else {
        let masCambio = true;
        while (masCambio) {
          masCambio = false;
          for (const p of todos(m)) {
            if (limpio[p.id] === undefined) continue;
            const b = baseDe(m, p, base);
            // Sin base que lo encarne, ese recurso no se aplica: es lo mismo
            // que decir que su `ver` no esta concedido.
            if (b === p.id) continue;
            if (b === null || limpio[b] !== true) { quitar(p.id); masCambio = true; }
          }
        }
      }
    }
    salida[m.id] = limpio;
  }
  return salida;
}

export function PanelPrivilegios({
  modulos, valor, onCambio, base = 'ver', preset, onVolverAlPreset,
  abiertos, onAbiertos, soloLectura = false, children, className = '',
  presentacion = 'lista', columnas,
}: PanelPrivilegiosProps) {
  const [propios, setPropios] = useState<string[]>([]);
  /* R146 · Para nombrar y describir la fila bloqueada por `depende`. Se llama
     `idPanel` y no `id` a propósito: `alternar(id)` ya usa ese nombre para otra
     cosa, y una variable sombreada dentro de un componente de 700 líneas es
     una trampa esperando. */
  const idPanel = useId();
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
        /* R148 · Y NO SI ESTA DESHABILITADO. Esta linea miraba solo `cerrado`,
           asi que pulsar el compañero libre encendia el que quien mira NO puede
           repartir — y con una regla anti-escalada eso tumba el PUT entero. Es
           el defecto que R148 vino a cerrar, colandose por la puerta de al
           lado. Comparten clave: son el MISMO permiso, y si una mitad no es
           mia, el permiso no es mio. Lo cazo una auditoria. */
        if (p.clave === clave && !p.cerrado && !p.deshabilitado) delModulo[p.id] = activo;
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
    /* R151 · `baseDe` y no `base`: con `filas`, encender «editar Contratos»
       tiene que encender «ver CONTRATOS», no un `ver` de modulo que no existe.
       Mirandolo por id literal, con filas no encendia nada. */
    const elPulsado = todos(m).find((p) => p.id === priv);
    const baseDelPulsado = elPulsado ? baseDe(m, elPulsado, base) : null;
    if (baseDelPulsado) {
      const base = baseDelPulsado;   // el de SU fila, para lo que sigue
      if (priv !== base && activo && !delModulo[base]) {
        /* R149 · EL BASE TIENE QUE EXISTIR EN EL MODULO. Aqui se hacia
           `find(...)?.cerrado`, y sobre un privilegio INEXISTENTE eso da
           `undefined`: el panel INVENTABA el permiso y lo mandaba al backend.
           Un modulo que no declara `ver` —«lo que no aplica no se pasa», dice
           este mismo componente— recibia `ver: true` al pulsar cualquier otra
           cosa, y encima R149 no lo anunciaba porque su calculo si exigia que
           existiera. Lo cazo una auditoria: el panel decia una cosa y hacia
           otra.
           R148 · Y tampoco si el base esta deshabilitado: encenderlo de rebote
           es concederlo. */
        const elBase = todos(m).find((p) => p.id === base);
        if (elBase && !elBase.cerrado && !elBase.deshabilitado) delModulo[base] = true;
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
          /* R148 · `deshabilitado` corta la cadena igual que `cerrado`: encender
         de rebote lo que quien mira no puede repartir es concederlo. */
      if (!p || p.cerrado || p.deshabilitado) break;
          delModulo[dep] = true;
        }
      }
    }

    const nuevo = { ...valor, [m.id]: delModulo };
    onCambio(nuevo, privilegiosEfectivos(modulos, nuevo, base));
  }, [valor, onCambio, base, modulos]);

  const modificados = useMemo(() => {
    if (!preset) return new Set<string>();
    return new Set(modulos.filter((m) => todos(m).some(
      (p) => concedido(valor, m.id, p.id) !== concedido(preset, m.id, p.id),
    )).map((m) => m.id));
  }, [modulos, valor, preset]);

  const cambiarNivel = (m: ModuloPrivilegios, priv: string, nivel: string, v: string) => {
    const nuevo = { ...valor, [m.id]: { ...(valor[m.id] ?? {}), [claveNivel(priv, nivel)]: v } };
    onCambio(nuevo, privilegiosEfectivos(modulos, nuevo, base));
  };

  /**
   * R151 · EL ESTADO DE UN PRIVILEGIO, EN UN SOLO SITIO.
   *
   * Esto vivía dentro de `fila()`, que dibuja la lista. Al entrar la matriz
   * habría habido que repetirlo —o, peor, aproximarlo— y este repositorio ya
   * sabe cómo acaba eso: dos cálculos que tienen que coincidir dejan de
   * coincidir, y el segundo se descubre cuando alguien reparte mal un permiso.
   *
   * Así que la lógica se calcula aquí y **las dos presentaciones la consumen**.
   * Lo único que cambia entre lista y matriz es dónde se pinta.
   */
  /** El icono y el rótulo de cada motivo. Uno solo, y lo usan las dos formas. */
  const iconoNo = (t: NoRepartible['tipo']) =>
    t === 'pendiente' ? 'informacion' : t === 'ajeno' ? 'usuarios' : t === 'noAplica' ? 'cerrar' : 'candado';
  const tonoNo = (t: NoRepartible['tipo']) =>
    t === 'pendiente' ? 'pendiente' as const : t === 'ajeno' ? 'info' as const : 'inactivo' as const;
  const rotuloNo = (t: NoRepartible['tipo']) =>
    t === 'cerrado' ? 'no se puede conceder'
      : t === 'ajeno' ? 'no lo tiene usted'
      : t === 'noAplica' ? 'no aplica aquí'
      : 'todavía no existe';

  const estado = (m: ModuloPrivilegios, p: Privilegio) => {
    const dado = concedido(valor, m.id, p.id);
    const no = comoNoRepartible(p.cerrado);
    const falta = no ? undefined : faltaDepende(m, valor, p.id);
    const nombreFalta = falta ? todos(m).find((x) => x.id === falta)?.nombre : undefined;
    const motivoFalta = falta === undefined ? null
      : typeof nombreFalta === 'string' || nombreFalta === undefined
        ? `Antes hay que conceder «${nombreFalta ?? falta}».`
        : <>Antes hay que conceder «{nombreFalta}».</>;
    const conQuien = p.clave
      ? todos(m).filter((x) => x.clave === p.clave && x.id !== p.id).map((x) => x.nombre)
      : [];
    /* R151 · EL BASE DE SU FILA, no el del modulo. Con `filas` un modulo tiene
       varios recursos y «ver» manda sobre el suyo: ver `baseDe`. */
    const idBase = baseDe(m, p, base);
    const elBase = idBase ? todos(m).find((x) => x.id === idBase) : undefined;
    const arrastraElBase = Boolean(
      idBase && p.id !== idBase && !dado && elBase && !elBase.cerrado && !elBase.deshabilitado
      && !p.deshabilitado && !soloLectura
      && !concedido(valor, m.id, idBase),
    );
    return {
      dado, no, falta, motivoFalta, conQuien, arrastraElBase, idBase,
      nombreBase: elBase?.nombre ?? idBase,
      apagado: soloLectura || p.deshabilitado === true,
      ayuda: p.ayuda,
    };
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
    /* R149 · ¿encender ESTE encendería además el base? Solo se dice cuando de
       verdad va a pasar: si el base ya está concedido, o éste es el base, o ya
       está encendido, la frase sobraría y el ruido acabaría con que nadie la
       lea. Y solo si el base se puede encender: si está cerrado, no arrastra. */
    const elBase = base ? todos(m).find((x) => x.id === base) : undefined;
    /* NI SOBRE UNA FILA QUE NO SE PUEDE PULSAR: prometer un arrastre en un
       control apagado es ruido, y el ruido acaba con que nadie lea la frase
       donde si importa. */
    const arrastraElBase = Boolean(
      base && p.id !== base && !dado && elBase && !elBase.cerrado && !elBase.deshabilitado
      && !p.deshabilitado && !soloLectura
      && !concedido(valor, m.id, base),
    );
    const nombreBase = elBase?.nombre ?? base;
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
              <Icono nombre={iconoNo(no.tipo)} />
            </span>
            <span className="pp-cerrado-txt">
              <span className="pp-cerrado-nom">{p.nombre}</span>
              <span className="pp-cerrado-eti">
                <Chip tono={tonoNo(no.tipo)}>{rotuloNo(no.tipo)}</Chip>
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
          /* R146 · ESTE SÍ SE ALCANZA CON TECLADO, y los otros tres no.
             La v1.91.0 dejó escrito que los cuatro bloqueados salían del orden
             de tabulación y que era «defendible en tres, DISCUTIBLE EN EL
             CUARTO». Control Administrativos V2.0 trajo el dato que lo decide:
             éste es el único TRANSITORIO. `carga-masiva` está bloqueado hasta
             que se enciende `crear`, y se desbloquea SIN RECARGAR — así que
             quien reparte con teclado veía aparecer en el recorrido una fila
             que un segundo antes no podía alcanzar, sin nada que lo anunciara,
             y no tenía forma de llegar a ella para enterarse de qué le falta.
             Los otros tres —cerrado, ajeno, pendiente— son estables y son
             texto: quedarse fuera del recorrido es correcto ahí.

             `aria-disabled` y NO `disabled`, que es la misma decisión que el
             calendario tomó en el R139: apagado de verdad sale del recorrido, y
             volveríamos al defecto. Se anuncia como interruptor sin marcar y
             deshabilitado, y su motivo va en `aria-describedby` — porque el
             motivo es lo único que hace falta para desbloquearlo. */
          <div
            className="pp-cerrado"
            role="switch"
            aria-checked={false}
            aria-disabled
            tabIndex={0}
            /* EL CHIP ENTRA EN EL NOMBRE. Con `aria-labelledby` presente, el
               contenido del control deja de componerlo, y «necesita otro
               permiso» —la etiqueta VISIBLE, y la unica que distingue este
               bloqueo de los otros tres de un vistazo— no se anunciaba. Es la
               expectativa de SC 2.5.3: lo que se ve tiene que estar en lo que
               se oye. Lo cazo una auditoria. */
            aria-labelledby={`${idPanel}-${m.id}-${p.id}-nom ${idPanel}-${m.id}-${p.id}-eti`}
            aria-describedby={`${idPanel}-${m.id}-${p.id}-mot`}
          >
            <span className="pp-cerrado-ic"><Icono nombre="capas" /></span>
            <span className="pp-cerrado-txt">
              <span className="pp-cerrado-nom" id={`${idPanel}-${m.id}-${p.id}-nom`}>{p.nombre}</span>
              <span className="pp-cerrado-eti" id={`${idPanel}-${m.id}-${p.id}-eti`}>
                <Chip tono="aviso">necesita otro permiso</Chip>
              </span>
              <span className="pp-cerrado-motivo" id={`${idPanel}-${m.id}-${p.id}-mot`}>{motivoFalta}</span>
            </span>
          </div>
        ) : (
        <Interruptor
          etiqueta={
            conQuien.length || arrastraElBase ? (
              <>
                {p.nombre}
                {conQuien.length > 0 && (
                  <span className="pp-junto"> · va con {conQuien.map((n, i) => (
                    <span key={i}>{i > 0 ? ' y ' : ''}{n}</span>
                  ))}</span>
                )}
                {/* R149 · EL BASE DEJA DE SER UN EFECTO INVISIBLE.
                    Encender cualquier privilegio encendía también el base del
                    módulo, y eso no se decía en ninguna parte. Lo reportó
                    Control Administrativos V2.0, y su daño no es «conceder de
                    más»: su PUT es de juego completo y tienen una regla
                    anti-escalada, así que un `ver` añadido de rebote que el
                    repartidor no posee hace que el servidor RECHACE EL GUARDADO
                    ENTERO con 403 — se pierde también el interruptor que la
                    persona sí quería cambiar. Un efecto invisible convertía una
                    acción legítima en un error.
                    Se dice ANTES de pulsar, que es exactamente lo que `clave`
                    ya hacía con su «va con X y Y»: el patrón existía y a esto
                    no se le había aplicado. */}
                {arrastraElBase && (
                  <span className="pp-junto"> · enciende también «{nombreBase}»</span>
                )}
              </>
            ) : p.nombre
          }
          ayuda={p.ayuda}
          activo={dado}
          deshabilitado={soloLectura || p.deshabilitado === true}
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
                /* R148 · Y los NIVELES de una fila deshabilitada tampoco se
                   tocan. Esta linea miraba solo `soloLectura`, asi que la
                   configuracion de un privilegio declarado intocable se podia
                   cambiar igual — «es soloLectura pero por fila» decia la regla
                   15, y no lo era—. Lo cazo una auditoria. */
                deshabilitado={soloLectura || p.deshabilitado === true}
                cerrado={n.cerrado}
                onCambio={(v) => cambiarNivel(m, p.id, n.id, v)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────────────
     R151 · LA MATRIZ

     Lo pidió Control Administrativos V2.0 al ir a adoptar el panel, y con una
     honestidad que conviene citar: «nunca os lo pedimos… habéis hecho siete
     cosas sobre una premisa que no os aclaramos». La forma es del producto y no
     estaba escrita en ninguna parte.

     Entra porque NO es de su proyecto: filas = recursos, columnas = acciones es
     el patrón estándar de una pantalla de permisos, y lo que la lista no puede
     hacer —leer hacia ABAJO, «¿a quién le he dado Crear?»— no es comodidad: es
     la revisión periódica que les exige el D.S. 016-2024-JUS.

     Es un `<table>` de verdad, con `<th scope="col">` y `<th scope="row">`: una
     rejilla de doscientos interruptores sin encabezados asociados es una
     pantalla que solo se puede usar mirándola.

     Y LA PRIMERA COLUMNA VA ANCLADA, que es el R142 otra vez: con siete
     columnas en un teléfono, una fila desplazada no dice de quién es. La
     solución ya estaba escrita para `TablaDatos` y aquí se repite el patrón,
     no el código: son dos hojas distintas porque son dos componentes distintos.
     ───────────────────────────────────────────────────────────────────────── */
  const matriz = () => {
    const cols = columnas ?? [];
    return (
      <div className="pm-envoltura">
        <table className="pm">
          <thead>
            <tr>
              {/* La esquina no es un encabezado de nada: va vacía y se dice. */}
              <th className="pm-esquina" scope="col"><span className="sr-solo">Opción</span></th>
              {cols.map((c) => (
                <th key={c.id} scope="col" id={`${idPanel}-col-${c.id}`}
                    className={c.aparte ? 'pm-col pm-col-aparte' : 'pm-col'}>
                  <span className="pm-col-txt">{c.titulo}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modulos.flatMap((m, im) => {
              const lista = todos(m);
              const filas = m.filas ?? [{ id: m.id, nombre: m.nombre }];
              /* CON VARIOS MODULOS, DE QUE MODULO ES CADA FILA. Sin esto las
                 filas de «Personal» y las de «Reportes» salian seguidas y sin
                 distinguir: una pantalla de revision que no dice de que es cada
                 recurso no se puede revisar. Lo cazo una auditoria. Con un solo
                 modulo no hace falta y no se pinta. */
              const cabecera = modulos.length > 1 ? (
                <tr key={`${m.id}-cab`} className="pm-mod">
                  <th scope="colgroup" colSpan={cols.length + 1} className="pm-mod-nom">
                    {m.nombre}
                  </th>
                </tr>
              ) : null;
              const cuerpo = filas.map((f, iF) => {
                const idFila = `${idPanel}-fila-${im}-${iF}`;
                /* R151 · SIN BASE, POR FILA. Marcar el modulo entero decia que
                   Trabajadores esta sin conceder porque a Contratos le falta su
                   «ver». Son recursos distintos. */
                const suBase = lista.find((x) => baseDe(m, x, base) && x.fila === f.id
                  && x.id === baseDe(m, x, base));
                const sinBase = Boolean(base) && Boolean(suBase) && !concedido(valor, m.id, suBase!.id);
                return (
                  <tr key={`${m.id}-${f.id}`} className={sinBase ? 'pm-fila pm-sin-base' : 'pm-fila'}>
                    <th scope="row" className="pm-nom" id={idFila}>
                      <span className="pm-nom-txt">{f.nombre}</span>
                    </th>
                    {cols.map((c) => {
                      const p = lista.find((x) => x.columna === c.id
                        && (m.filas ? x.fila === f.id : true));
                      const clase = c.aparte ? 'pm-celda pm-celda-aparte' : 'pm-celda';
                      /* Los `headers` atan cada celda a SUS DOS encabezados. Sin
                         ellos, los `id` del `th` no los referenciaba nadie: eran
                         atributos muertos, y un lector en una rejilla de
                         doscientas celdas no sabe en que cruce esta. */
                      const atada = `${idFila} ${idPanel}-col-${c.id}`;
                      /* SIN PRIVILEGIO NO HAY NADA QUE DECIR, y eso es distinto
                         de decir que no aplica: la celda se queda vacia y se
                         marca como tal para el lector. Quien quiera que el hueco
                         HABLE declara `cerrado: { tipo: 'noAplica' }`. */
                      if (!p) {
                        return (
                          <td key={c.id} headers={atada} className={`${clase} pm-vacia`}>
                            <span className="sr-solo">Sin declarar</span>
                          </td>
                        );
                      }
                      const e = estado(m, p);
                      const nombre = <><span className="sr-solo">{f.nombre} · </span>{c.titulo}</>;
                      if (e.no) {
                        return (
                          <td key={c.id} headers={atada} className={`${clase} pm-no pm-no-${e.no.tipo}`}
                              title={e.no.motivo}>
                            <span className="pm-no-ic"><Icono nombre={iconoNo(e.no.tipo)} tam="control" /></span>
                            <span className="sr-solo">
                              {f.nombre} · {c.titulo}: {rotuloNo(e.no.tipo)}.{e.no.motivo ? ` ${e.no.motivo}` : ''}
                            </span>
                          </td>
                        );
                      }
                      if (e.falta) {
                        /* R146 · ESTE SI ENTRA EN EL TABULADOR, y por lo mismo
                           que en la lista: es el unico de los cuatro que es
                           TRANSITORIO. Se desbloquea sin recargar, y quien
                           reparte con teclado veria aparecer un control que un
                           segundo antes no podia alcanzar. Era un `<td>` pelado
                           y su `title` no lo alcanzaba nadie sin raton. */
                        const dice = typeof e.motivoFalta === 'string' ? e.motivoFalta : undefined;
                        return (
                          <td key={c.id} headers={atada} className={`${clase} pm-no pm-no-depende`}
                              title={dice}>
                            <span className="pm-no-ic" role="switch" aria-checked={false}
                                  aria-disabled tabIndex={0}
                                  aria-label={`${f.nombre} · ${c.titulo}`}
                                  aria-describedby={`${idFila}-${c.id}-falta`}>
                              <Icono nombre="capas" tam="control" />
                            </span>
                            <span className="sr-solo" id={`${idFila}-${c.id}-falta`}>
                              {f.nombre} · {c.titulo}: necesita otro permiso. {e.motivoFalta}
                            </span>
                          </td>
                        );
                      }
                      /* LO QUE `estado()` CALCULA, LA MATRIZ LO PINTA.
                         `conQuien` (R99), `arrastraElBase` (R149) y `ayuda`
                         (R148) se calculaban y se TIRABAN: tres reglas ya
                         escritas que la lista cumplia y la matriz no. En una
                         celda no cabe una linea de texto, pero si cabe en el
                         globito y en lo que lee el lector — que es donde el
                         aviso tiene que estar ANTES de pulsar. */
                      const avisos = [
                        e.ayuda,
                        e.conQuien.length ? `Va con ${e.conQuien.join(', ')}.` : '',
                        e.arrastraElBase && typeof e.nombreBase === 'string'
                          ? `Enciende también «${e.nombreBase}».` : '',
                      ].filter((x): x is string => typeof x === 'string' && x !== '');
                      return (
                        <td key={c.id} headers={atada} className={clase}
                            title={avisos.length ? avisos.join(' ') : undefined}>
                          <Interruptor
                            etiqueta={nombre}
                            etiquetaOculta
                            activo={e.dado}
                            deshabilitado={e.apagado}
                            ayuda={avisos.length ? avisos.join(' ') : undefined}
                            onCambio={(a) => cambiar(m, p.id, a)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              });
              return cabecera ? [cabecera, ...cuerpo] : cuerpo;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /* ─────────────────────────────────────────────────────────────────────────
     R151 · LO QUE NO SE DIBUJA, SE DICE. En desarrollo y una sola vez.

     El componente GRITABA cuando faltaban `columnas` y CALLABA cuando se
     evaporaba un permiso. Una auditoria adversaria encontro cinco formas de
     perder un privilegio sin un solo aviso —sin `columna`, con una `columna`
     que no existe, con una `fila` que no existe, dos en la misma celda, y
     privilegios con `fila` en un modulo sin `filas`— y en dos de ellas el
     permiso SEGUIA CONCEDIDO y viajando al backend: activo, y ausente de la
     pantalla donde se revisa. Para una matriz que existe PARA la revision
     periodica, esa es la peor salida posible.

     Es de desarrollo y no de produccion a proposito: quien monta la pantalla lo
     ve al montarla, y a quien la usa no se le interrumpe el trabajo.
     ───────────────────────────────────────────────────────────────────────── */
  const avisosDeMatriz = useMemo(() => {
    if (process.env.NODE_ENV === 'production' || presentacion !== 'matriz') return [];
    const dis: string[] = [];
    if (!columnas?.length) {
      dis.push('`presentacion="matriz"` sin `columnas`. Una matriz sin columnas no es '
        + 'una matriz: se dibuja la lista.');
      return dis;
    }
    const idsCol = new Set(columnas.map((c) => c.id));
    for (const m of modulos) {
      const lista = todos(m);
      const idsFila = new Set((m.filas ?? []).map((f) => f.id));
      const ocupadas = new Map<string, string>();
      for (const p of lista) {
        if (!p.columna) {
          dis.push(`«${p.id}» (${m.id}) no declara \`columna\`: no se dibuja en la matriz.`);
          continue;
        }
        if (!idsCol.has(p.columna)) {
          dis.push(`«${p.id}» (${m.id}) cae en la columna «${p.columna}», que no esta `
            + 'declarada en `columnas`: no se dibuja.');
          continue;
        }
        if (m.filas?.length) {
          if (!p.fila) {
            dis.push(`«${p.id}» (${m.id}) no declara \`fila\` y su modulo tiene \`filas\`: `
              + 'no se dibuja.');
            continue;
          }
          if (!idsFila.has(p.fila)) {
            dis.push(`«${p.id}» (${m.id}) cae en la fila «${p.fila}», que no esta declarada `
              + 'en `filas`: no se dibuja.');
            continue;
          }
        }
        const celda = `${p.fila ?? m.id}|${p.columna}`;
        const ya = ocupadas.get(celda);
        if (ya) {
          dis.push(`«${p.id}» y «${ya}» (${m.id}) caen en la MISMA celda: solo se dibuja `
            + 'uno y el otro sigue concediendose sin verse.');
        } else ocupadas.set(celda, p.id);
        /* LO QUE NO CABE EN UNA CELDA TAMPOCO SE CALLA. Un `Segmentado` de
           niveles no entra en un cruce, pero quien migre de lista a matriz
           perderia configuracion que `privilegiosEfectivos` sigue guardando. */
        if (p.niveles?.length) {
          dis.push(`«${p.id}» (${m.id}) tiene \`niveles\`, que la matriz no puede repartir. `
            + 'Se conservan en el valor y no hay forma de cambiarlos aqui.');
        }
      }
      for (const f of baseSinResolver(m, base)) {
        dis.push(`en «${m.id}», la fila «${f}» no tiene ningun privilegio en la columna base `
          + `«${base}»: todo lo suyo sale de lo efectivo. Si su dominio no funciona con un `
          + 'privilegio que manda, pase `base={null}`.');
      }
    }
    if (modulos.some((m) => (m.grupos ?? []).some((g) => g.titulo))) {
      dis.push('los `grupos` con titulo no se dibujan en la matriz: sus privilegios se '
        + 'colocan por columna y fila, y el titulo del grupo no tiene donde ir.');
    }
    if (abiertos || onAbiertos) {
      dis.push('`abiertos`/`onAbiertos` no hacen nada en la matriz: no hay modulos que '
        + 'plegar, todas las filas se ven a la vez.');
    }
    return dis;
  }, [presentacion, columnas, modulos, base, abiertos, onAbiertos]);

  useEffect(() => {
    for (const d of avisosDeMatriz) console.error(`PanelPrivilegios: ${d}`);
  }, [avisosDeMatriz]);

  return (
    <div className={['pp', className].filter(Boolean).join(' ')}>
      {children && <div className="pp-cab">{children}</div>}

      {presentacion === 'matriz' && columnas?.length ? matriz() : (
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
          const avisoSinBase = (
            <p className="pp-aviso">
              <Icono nombre="alerta" tam="control" />
              <span>Sin este permiso, el resto del módulo no se aplica.</span>
            </p>
          );
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
                  {/* R145 · El resumen del móvil. Se emite SIEMPRE y la hoja lo
                      enseña solo bajo 900 px: un componente no puede preguntar
                      cuánto mide la pantalla sin medir, y medir para decidir
                      marcado es lo que hace que el servidor y el navegador
                      pinten cosas distintas. Aquí decide la hoja, que es quien
                      sabe. */}
                  {dados.length > 2 && (
                    <Chip tono="info" className="pp-tags-mas">+{dados.length - 2}</Chip>
                  )}
                </span>
                <span className="pp-conteo">{dados.length} de {posibles}</span>
              </button>

              <div className="pp-mod-cuerpo" id={`pp-${m.id}`} hidden={!abiertoM}>
                {/* R144 · EL AVISO VA JUSTO DEBAJO DEL BASE, no al final.
                    Estaba después de las seis filas que describe, así que se
                    leían seis permisos antes de enterarse de que ninguno se
                    aplica. Ahora cae pegado al interruptor que lo resuelve y
                    encabeza el carril que marca las filas afectadas.
                    Se conserva el ORDEN de la lista: se intercala en su sitio
                    en vez de reordenar, porque cuál va primero lo decide quien
                    declara los privilegios, no nosotros. */}
                {m.privilegios.map((p) => (
                  <Fragment key={p.id}>
                    {fila(m, p, p.id === base)}
                    {sinBase && p.id === base && avisoSinBase}
                  </Fragment>
                ))}

                {(m.grupos ?? []).map((g) => (
                  <div className="pp-grupo" key={g.titulo}>
                    <p className="pp-grupo-tit">{g.titulo}</p>
                    {/* `p.id === base` TAMBIEN AQUI. Iba `false` fijo, asi que un
                        `base` declarado dentro de un grupo recibia el carril de
                        «esto no se aplica» sobre SI MISMO. Lo cazo una
                        auditoria; `todos(m)` ya miraba los grupos para todo lo
                        demas, y esta linea se habia quedado atras. */}
                    {g.privilegios.map((p) => (
                      <Fragment key={p.id}>
                        {fila(m, p, p.id === base)}
                        {sinBase && p.id === base && avisoSinBase}
                      </Fragment>
                    ))}
                  </div>
                ))}
                {/* R144 · Y SI EL BASE NO ESTA EN NINGUNA LISTA, el aviso sale
                    igual, al final. Al subirlo bajo la fila del base se colgo de
                    que esa fila exista, y un modulo que NO declara el privilegio
                    base —«lo que no aplica no se pasa», dice esta misma
                    documentacion— se quedaba ENTERO acarrilado en naranja SIN
                    UNA LINEA que dijera por que. Era una regresion contra la
                    v1.124.0, donde el aviso colgaba solo de `sinBase`. */}
                {sinBase && !todos(m).some((p) => p.id === base) && avisoSinBase}
              </div>
            </section>
          );
        })}
      </div>
      )}

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
