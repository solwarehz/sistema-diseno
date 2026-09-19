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

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef,
  useState } from 'react';
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
   * R152 · La misma llave, en MÓDULOS DISTINTOS.
   *
   * `clave` une privilegios **dentro de un módulo**, que es donde el estado los
   * guarda juntos. Esto los une **entre módulos**: encender uno enciende a
   * todos los que comparten `claveGlobal`, estén donde estén, y el aviso nombra
   * el módulo del compañero — porque quien reparte necesita saber que está
   * abriendo también otra puerta.
   *
   * Lo pidió Control Administrativos y el argumento es de seguridad, no de
   * comodidad: *«dar de alta enciende Contrato → Puesto → Cargo →
   * PrivilegioCargo… ese daño es idéntico se pulse el botón donde se pulse, y
   * un acto irreversible merece una sola llave. Con dos, quitar una da la
   * sensación de haber cerrado sin haber cerrado»*.
   *
   * POR QUÉ NO SE AMPLIÓ `clave` SIN MÁS, que era la otra salida que ofrecían y
   * la que tiene menos conceptos. Porque las claves son cadenas cortas y
   * genéricas —`'editar'`, `'alta'`— y hacerlas cruzar por omisión fundiría en
   * **un** permiso dos que solo coinciden de nombre, en silencio, en productos
   * que ya usan `clave` dentro de un módulo. Eso es el daño del R152 al revés:
   * en vez de dos llaves para una puerta, una llave para dos puertas que no
   * tenían por qué compartirla. El ámbito va en el nombre y se elige a
   * propósito.
   *
   * Se pueden usar las dos: `clave` para el grupo local y `claveGlobal` para el
   * permiso compartido. Y si un módulo declara la misma `claveGlobal` en dos
   * privilegios suyos, el panel avisa en desarrollo: ahí lo que hace falta es
   * `clave`, que es lo que describe ese caso.
   */
  claveGlobal?: string;
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
  /* SE DECIDE POR LA FORMA DEL MODULO, NO POR SI DECLARA `filas`.
   *
   * Esto miraba `m.filas?.length`, y con eso el arreglo solo cerraba la mitad:
   * una matriz SIN `filas` —un modulo de un solo recurso, que es lo que sale al
   * omitirlas— volvia a la busqueda por id literal y SEGUIA devolviendo `{}`
   * para el modulo entero. El mismo borrado silencioso, por la puerta de al
   * lado, y lo cazo la tercera auditoria.
   *
   * Lo que de verdad cambia la semantica es que los privilegios se coloquen por
   * COLUMNA: ahi «ver» deja de ser un id y pasa a ser la columna base. Un
   * modulo sin columnas es la lista de siempre y no cambia nada. */
  /* LA PREGUNTA ES SI EXISTE UNA COLUMNA QUE SE LLAME COMO EL BASE, no si hay
   * privilegios colocados por columna. Preguntar lo segundo era una REGRESION:
   * un modulo con ids `ver`/`editar` y columnas `consultar`/`modificar` dejaba
   * de encontrar su base —ninguna columna se llama `ver`— y se VACIABA ENTERO,
   * tambien presentado como LISTA, donde antes del R151 funcionaba. Basta con
   * declarar `columna` una vez para pintar las dos presentaciones, que es justo
   * lo que las reglas 18 y 21 invitan a hacer. Lo cazo una auditoria.
   *
   * Con columna: manda el de SU fila. Sin ella: el id de siempre. Y si el base
   * no existe de ninguna de las dos formas, no hay base que aplicar —`null`—,
   * que es lo que el modulo sin su base ha significado desde el R97; quien
   * necesite saberlo tiene `baseSinResolver`, y el panel lo grita. */
  if (todos(m).some((x) => x.columna === base)) {
    const suFila = p.fila ?? null;
    return todos(m).find((x) => x.columna === base && (x.fila ?? null) === suFila)?.id ?? null;
  }
  return todos(m).some((x) => x.id === base) ? base : null;
}

/**
 * R152 · LOS QUE SON EL MISMO PERMISO QUE ÉSTE, estén en el módulo que estén.
 *
 * Devuelve pares `[módulo, privilegio]` **sin incluirse a sí mismo**. Une por
 * `clave` dentro del módulo —R99— y por `claveGlobal` entre todos los módulos.
 * Una sola función, porque «quiénes van juntos» se pregunta en cuatro sitios
 * —al encender, al apagar, al subir el base y al escribir el aviso— y tener
 * cuatro respuestas es como se empieza a divergir.
 *
 * **ES TRANSITIVO, y no lo era.** Si A y B son el mismo permiso, y B y C son el
 * mismo permiso, entonces A y C lo son: no hay lectura sensata en la que dos
 * cosas iguales a una tercera sean distintas entre sí. La primera versión sólo
 * devolvía los compañeros **directos**, y con `clave: 'k'` uniendo A-B dentro de
 * un módulo y `claveGlobal: 'g'` uniendo B-C entre módulos, pulsar A encendía B
 * y **dejaba C apagado** — mientras la etiqueta de A anunciaba que iban juntos.
 * Eso es literalmente el defecto que el R152 vino a cerrar —«la pantalla enseña
 * como dos cosas lo que el servidor guarda como una»— reaparecido dentro del
 * mecanismo que lo cerraba. Lo cazó una auditoría adversaria.
 *
 * Se recorre en anchura hasta que no se descubre a nadie nuevo. El tope es el
 * número de privilegios del panel: cada vuelta añade al menos uno o para.
 */
export function mismosPermisos(
  modulos: ModuloPrivilegios[], m: ModuloPrivilegios, p: Privilegio,
): { modulo: ModuloPrivilegios; privilegio: Privilegio }[] {
  const clavePar = (idModulo: string, idPriv: string) => `${idModulo}\u0000${idPriv}`;
  const vistos = new Set<string>([clavePar(m.id, p.id)]);
  const salida: { modulo: ModuloPrivilegios; privilegio: Privilegio }[] = [];
  const cola: { modulo: ModuloPrivilegios; privilegio: Privilegio }[] = [{ modulo: m, privilegio: p }];

  while (cola.length) {
    const { modulo: mod, privilegio: actual } = cola.shift() as
      { modulo: ModuloPrivilegios; privilegio: Privilegio };
    const vecinos: { modulo: ModuloPrivilegios; privilegio: Privilegio }[] = [];
    // `clave` une DENTRO de su módulo, que es donde el estado los guarda juntos.
    if (actual.clave !== undefined) {
      for (const x of todos(mod)) {
        if (x.id !== actual.id && x.clave === actual.clave) vecinos.push({ modulo: mod, privilegio: x });
      }
    }
    // `claveGlobal` cruza TODOS los módulos.
    if (actual.claveGlobal !== undefined) {
      for (const otro of modulos) {
        for (const x of todos(otro)) {
          if (otro.id === mod.id && x.id === actual.id) continue;
          if (x.claveGlobal === actual.claveGlobal) vecinos.push({ modulo: otro, privilegio: x });
        }
      }
    }
    for (const v of vecinos) {
      const k = clavePar(v.modulo.id, v.privilegio.id);
      if (vistos.has(k)) continue;
      vistos.add(k);
      salida.push(v);
      cola.push(v);
    }
  }
  return salida;
}

/**
 * R151 · ¿Hay `base` declarado que NINGÚN privilegio encarna? Con `filas`, por
 * fila. Se usa para avisar en desarrollo, no para decidir nada.
 */
export function baseSinResolver(
  m: ModuloPrivilegios, base: string | null,
): string[] {
  if (!base) return [];
  if (!todos(m).some((x) => x.columna === base)) {
    return todos(m).some((x) => x.id === base) ? [] : [m.id];
  }
  /* Un grupo por cada fila que EXISTE de verdad en los privilegios, incluida la
   * fila implicita de un modulo sin `filas`. Miraba `m.filas` y por eso decia
   * «la fila X no tiene privilegio en la columna base» de un modulo que si lo
   * tenia: el mensaje hablaba de columnas y la comprobacion miraba ids. Un
   * aviso que se equivoca ensena a ignorar los avisos. */
  const grupos = [...new Set(todos(m).map((x) => x.fila ?? m.id))];
  return grupos.filter((g) => !todos(m).some(
    (x) => (x.fila ?? m.id) === g && x.columna === base));
}

/**
 * R152 · QUÉ LLAVES COMPARTIDAS QUEDAN CONCEDIDAS, en todo el panel.
 *
 * **Ésta es la respuesta a la pregunta que hicieron**, y va en código y no en
 * prosa a propósito: *«¿qué debería devolver `privilegiosEfectivos` para una
 * clave compartida cuyo módulo A sobrevive y cuyo módulo B se vacía?»*. Con un
 * PUT de juego completo, «sale en A y no en B» y «no sale» son cosas distintas,
 * y la segunda borra.
 *
 * LA DECISIÓN, y su porqué:
 *
 * `privilegiosEfectivos` **no cambia**. Sigue limpiando módulo a módulo, y una
 * llave compartida saldrá en los módulos donde se aplique y faltará en los que
 * no. Eso es correcto y no se toca: «el módulo B no aplica nada» es una verdad
 * sobre B, y falsearla —dejando colgada una entrada de un módulo vaciado— sería
 * mentir sobre B para acertar sobre la llave.
 *
 * Pero aplanar eso a «¿está concedida la llave?» exige una regla, y si cada
 * producto la deduce por su cuenta, acertarán hoy y divergirán en la próxima
 * versión — lo dijeron ellos mismos. Así que la regla está aquí:
 *
 * > **Una llave compartida está concedida si sobrevive en AL MENOS UN módulo
 * > donde está declarada.**
 *
 * Porque es **una** llave: si en alguna puerta abre de verdad, está dada. La
 * alternativa —exigir que sobreviva en todos— convertiría un módulo sin su
 * `base` en un revocador silencioso de permisos concedidos en otra pantalla, y
 * eso es exactamente el borrado que el R150 cerró.
 *
 * Devuelve el conjunto de `claveGlobal` concedidas. Quien aplane usa esto y no
 * tiene que deducir nada.
 */
export function clavesEfectivas(
  modulos: ModuloPrivilegios[], valor: ValorPrivilegios, base: string | null,
): Set<string> {
  const efectivo = privilegiosEfectivos(modulos, valor, base);
  const dadas = new Set<string>();
  for (const m of modulos) {
    for (const p of todos(m)) {
      if (p.claveGlobal === undefined) continue;
      if (efectivo[m.id]?.[p.id] === true) dadas.add(p.claveGlobal);
    }
  }
  return dadas;
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
    /* LO QUE YA NO ES UN PRIVILEGIO DECLARADO NO SE APLICA.
     *
     * Esto copiaba el mapa guardado TAL CUAL y solo recorria `todos(m)` para
     * limpiar, asi que una clave que ya no corresponde a ningun privilegio
     * —`borrar`, retirado del catalogo hace tres versiones— VIAJABA CONCEDIDA:
     * sin interruptor, sin chip, sin contar en el «4 de 6», y aplicandose. No
     * se puede ver ni revocar desde la pantalla que existe para revisarlo.
     *
     * El R151 lo pone en el camino de toda adopcion: migrar de lista a matriz
     * renombra los ids —`ver` pasa a `trab-ver`— y el mapa viejo se queda lleno
     * de claves huerfanas. Se midio: cuatro permisos al backend, dos en
     * pantalla.
     *
     * El mapa COMPLETO las conserva —eso es R98, y sigue en pie: apagar no
     * borra—; lo que no sobrevive es el EFECTO, que es lo que esta funcion
     * significa. Lo cazo una auditoria adversaria. */
    const declarados = new Set(todos(m).map((x) => x.id));
    const limpio: Record<string, boolean | string> = {};
    for (const [k, v] of Object.entries(del)) {
      // Una clave de nivel es `privilegio:nivel`: vale si su privilegio existe.
      if (declarados.has(k.includes(':') ? k.slice(0, k.indexOf(':')) : k)) limpio[k] = v;
    }
    const quitar = (id: string) => {
      delete limpio[id];
      // Los niveles de un privilegio sin efecto tampoco lo tienen.
      for (const k of Object.keys(limpio)) if (k.startsWith(`${id}:`)) delete limpio[k];
    };
    const parcial: ValorPrivilegios = { [m.id]: limpio };
    /* UN SOLO PUNTO FIJO PARA LAS TRES RAZONES.
     *
     * Habia dos bucles separados —`cerrado`/`depende` primero, el base
     * despues— y NO SE REALIMENTABAN. El comentario del segundo decia, con
     * estas palabras, «va dentro del punto fijo y no despues: quitar un
     * privilegio por no tener su base puede tumbar al que dependia de el»… y
     * estaba despues. El comentario describia lo correcto y el codigo hacia lo
     * otro.
     *
     * Se midio: con `f-ver` cerrado, `f-ed` cae por perder su base —segundo
     * bucle— y `g-ver`, que DEPENDE de `f-ed`, sobrevivia porque su turno ya
     * habia pasado. Dos permisos viajaban al backend sin su dependencia: el 403
     * del R110, por la puerta de al lado. Lo encontro una prueba escrita para
     * otra cosa.
     *
     * Las tres razones se preguntan en la misma vuelta y se repite hasta que
     * deja de encoger. El tope sigue siendo el numero de privilegios: cada
     * vuelta quita al menos uno o para. */
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (const p of todos(m)) {
        if (limpio[p.id] === undefined) continue;
        if (p.cerrado || (p.depende && faltaDepende(m, parcial, p.id))) {
          quitar(p.id); cambio = true; continue;
        }
        if (!base) continue;
        /* EL BASE, SIEMPRE POR `baseDe`. Habia dos formas de responder «quien
           manda sobre este privilegio» —id literal y por fila— y tener dos es
           la misma bifurcacion que este componente lleva cuatro auditorias
           cerrando. Con un modulo plano, `baseDe` devuelve el id de siempre
           para todos, asi que quitarlos uno a uno equivale a vaciar el modulo:
           el comportamiento historico del R97 sale de la regla general en vez
           de ser un caso aparte.
           Y EL BASE SE MIRA A SI MISMO: sin eso, un base guardado como `false`
           sobrevivia —`{ver:false}` en vez de `{}`— y con el, el modulo dejaba
           de estar vacio. Lo cazo la prueba del R97. */
        const b = baseDe(m, p, base);
        if (b === null || limpio[b] !== true) { quitar(p.id); cambio = true; }
      }
    }
    /* Y LOS NIVELES DE LO QUE NO ESTA CONCEDIDO TAMPOCO SE APLICAN. Se limpiaban
       solo los de lo QUITADO, asi que `{editar:false, 'editar:doc':'b'}` viajaba
       entero: una configuracion de campo para un permiso que no se tiene. Es el
       mismo argumento que el resto de esta funcion —lo efectivo es lo que de
       verdad rige— y el mapa completo sigue guardandolo, que es R98.
       VA AL FINAL, cuando ya no queda nada que quitar: antes se ejecutaba entre
       los dos puntos fijos y no veia lo que el segundo tiraba. */
    for (const p of todos(m)) {
      if (limpio[p.id] !== true) {
        for (const k of Object.keys(limpio)) if (k.startsWith(`${p.id}:`)) delete limpio[k];
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

  /* ───────────────────────────────────────────────────────────────────────────
     MÓVIL PRIMERO: LA MATRIZ CAE A LISTA CUANDO NO CABE.

     Política del responsable (CLAUDE.md §4bis, 2026-09-19) y es vinculante. No
     vino con el R151 porque el equipo que pidió la matriz dejó el responsive
     como deseable y no como requisito — y eso no la saca de la política: un
     requisito de producto puede faltar, una política del sistema no.

     Se midió antes de escribir esto, que es lo que la política exige: a 360 px
     la tabla ocupaba **687 px** y seguía siendo tabla, con el nombre de fila
     recortado a 44vw y SIN `title`. El nombre completo no estaba en ninguna
     parte: ni a la vista, ni en un globito, ni para un lector.

     SE MIDE EL CONTENEDOR, NO LA VENTANA. Una matriz puede vivir dentro de un
     panel estrecho en una pantalla ancha, y lo que decide si cabe es el sitio
     que tiene, no el que tiene la pantalla. Fue así como lo midió el equipo
     —«estrechando el contenedor a 380 px»— y es la medida honesta.

     Y SE PARTE DE LA LISTA, no de la matriz. Empezar ancho y encoger al medir
     es «escritorio primero con un parche»: se ve en el primer pintado y es justo
     lo que la política prohíbe. Sin forma de medir —render en servidor, o un
     entorno de pruebas sin `ResizeObserver`— se respeta lo que se pidió, porque
     ahí no hay un ancho que consultar y fingir uno sería inventarlo.
     ─────────────────────────────────────────────────────────────────────────── */
  const caja = useRef<HTMLDivElement>(null);
  const sePuedeMedir = typeof ResizeObserver !== 'undefined';
  const [anchoCaja, setAnchoCaja] = useState<number | null>(null);
  /* SE MIDE A MANO AL MONTAR, ADEMAS DE OBSERVAR.
     `ResizeObserver` entrega sus avisos DENTRO del ciclo de pintado, y hay
     situaciones en que ese ciclo no corre: una pestaña que el navegador no esta
     pintando, por ejemplo. Se comprobo con uno NATIVO puesto a mano —cero
     disparos en 600 ms sobre un elemento visible— y con solo el observador el
     panel se habria quedado en lista PARA SIEMPRE en una pantalla ancha.
     `getBoundingClientRect()` no depende de ese ciclo: da la medida ya. El
     observador se queda para lo que de verdad hace bien, que es enterarse de
     los cambios posteriores.
     Y va en efecto de DISEÑO —antes de que el navegador pinte— para que la
     correccion no se vea como un parpadeo. Movil primero se cumple igual: el
     estado del que se parte es el estrecho; lo que se evita es enseñar el paso
     intermedio. */
  const enEfecto = typeof window === 'undefined' ? useEffect : useLayoutEffect;
  enEfecto(() => {
    const el = caja.current;
    if (!el) return undefined;
    const medir = (w: number) => setAnchoCaja((antes) => (antes === w ? antes : w));
    medir(el.getBoundingClientRect().width);
    if (!sePuedeMedir) return undefined;
    const ro = new ResizeObserver(([entrada]) => medir(entrada.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [sePuedeMedir]);
  /* 640 px es el mismo corte que ya usa la hoja para apilar los campos del
     filtro de fechas (R141): un solo umbral en el sistema, no uno por
     componente.

     SIN PROP, Y ESA ES LA DECISION. El R153 ofrecia `listaBajo={640}` con
     `false` para desactivarlo, y admitia las dos salidas —«nos vale igual si lo
     decidis sin prop, siempre que sea el comportamiento por omision y este
     documentado»—. Va sin prop porque movil primero es POLITICA DEL SISTEMA
     (CLAUDE.md §4bis) y no un requisito de producto: una prop para apagarlo
     seria una prop para incumplirla, y la primera pantalla con prisa la usaria.
     El umbral tampoco se configura: dos productos con cortes distintos son dos
     ideas distintas de lo que es un telefono. */
  /* UN ANCHO DE CERO NO ES UN ANCHO ESTRECHO: es «aqui no hay maquetado» —un
     render en servidor, un entorno de pruebas sin layout—. Ahi no hay nada que
     consultar, y se respeta lo que el producto pidio en vez de inventar una
     medida y cambiarle la pantalla por ella. */
  const hayMedida = anchoCaja !== null && anchoCaja > 0;
  const sinPoderMedir = !sePuedeMedir && !hayMedida;
  const cabeLaMatriz = hayMedida ? anchoCaja >= 640 : sinPoderMedir || anchoCaja === 0;

  const visibles = abiertos ?? propios;
  const alternar = (id: string) => {
    const nuevo = visibles.includes(id) ? visibles.filter((x) => x !== id) : [...visibles, id];
    if (onAbiertos) onAbiertos(nuevo); else setPropios(nuevo);
  };

  const cambiar = useCallback((m: ModuloPrivilegios, priv: string, activo: boolean) => {
    /* ───────────────────────────────────────────────────────────────────────
       TODOS LOS MODULOS SE TRATAN IGUAL, incluido el pulsado.

       La primera version del R152 trataba el modulo pulsado de una forma y los
       demas de otra, y esa asimetria costo tres defectos que encontro una
       auditoria adversaria:

       · El mapa del otro modulo se sembraba con TODO lo que ya tenia guardado y
         luego se le subia el base recorriendolo entero, asi que un clic en
         «Contrato» CONCEDIA un «Editar» de «Historia» que llevaba dormido
         —guardado en `true` y sin efecto por faltarle su base, que es R98—.
         Se midio: lo efectivo pasaba de `historia:{}` a `historia:{editar:true,
         h-alta:true, ver:true}`. Un permiso que nadie toco ni se anuncio.
       · El gemelo de otro modulo no arrastraba su cadena `depende`, asi que
         quedaba guardado en `true` e invisible, y entraba en vigor solo el dia
         que alguien concediera su dependencia — un permiso que se cuela sin que
         nadie lo pulse.
       · Y con `filas`, el gemelo de otra fila no subia el base de SU fila,
         porque el registro de «tocados» filtraba por `clave` y no por la llave
         global.

       Ahora hay un solo camino: se anota QUE se acaba de encender en cada
       modulo, y sobre eso —y solo sobre eso— se sube el base y se arrastra la
       cadena, exactamente igual da que sea el modulo pulsado o cualquier otro.
       ─────────────────────────────────────────────────────────────────────── */
    const mapas = new Map<string, Record<string, boolean | string>>();
    const encendidos = new Map<string, Set<string>>();
    const deModulo = (id: string) => {
      if (!mapas.has(id)) mapas.set(id, { ...(valor[id] ?? {}) });
      return mapas.get(id) as Record<string, boolean | string>;
    };
    const anotar = (mod: ModuloPrivilegios, id: string, v: boolean) => {
      deModulo(mod.id)[id] = v;
      if (!v) return;
      if (!encendidos.has(mod.id)) encendidos.set(mod.id, new Set());
      (encendidos.get(mod.id) as Set<string>).add(id);
    };

    anotar(m, priv, activo);

    /* R99 y R152 · LOS QUE SON EL MISMO PERMISO VAN JUNTOS, esten en el modulo
       que esten. Si no, el panel enseñaria dos interruptores que el backend
       guarda como uno, y al recargar uno de los dos habria cambiado solo. */
    const elPulsado = todos(m).find((p) => p.id === priv);
    if (elPulsado) {
      for (const { modulo, privilegio: x } of mismosPermisos(modulos, m, elPulsado)) {
        /* R148 · Y NO SI ESTA CERRADO O DESHABILITADO. Comparten llave: son el
           MISMO permiso, y si una mitad no es mia, el permiso no es mio —
           encenderla tumbaria el PUT entero con una regla anti-escalada. */
        if (x.cerrado || x.deshabilitado) continue;
        anotar(modulo, x.id, activo);
      }
    }

    // R98 · EL BASE GOBIERNA, PERO NO BORRA. Apagar el base conserva lo
    // repartido y le quita el efecto; `privilegiosEfectivos` lo resuelve para
    // quien tenga que mandarlo al backend.
    if (activo) {
      for (const [idModulo, ids] of encendidos) {
        const mod = modulos.find((x) => x.id === idModulo);
        if (!mod) continue;
        const mapa = deModulo(idModulo);

        /* R110 · ENCENDER ENCIENDE LA CADENA, en cada modulo tocado. Se recorre
           desde TODO lo que acaba de encenderse ahi. APAGAR NO ARRASTRA: apagar
           «crear» deja la carga masiva visible y bloqueada, con lo configurado
           intacto — misma decision que R98 para el base. */
        for (const id of [...ids]) {
          for (const dep of cadenaDepende(mod, id)) {
            // Uno cerrado no se enciende por la puerta de atras: si no se puede
            // conceder a mano, tampoco de rebote. La cadena se para ahi.
            const p = todos(mod).find((x) => x.id === dep);
            if (!p || p.cerrado || p.deshabilitado) break;
            anotar(mod, dep, true);
          }
        }

        /* Y EL BASE DE CADA UNO, que con `filas` es el de SU fila. Solo de lo
           RECIEN encendido: recorrer el mapa entero despertaba permisos
           dormidos del otro modulo. */
        for (const id of [...(encendidos.get(idModulo) as Set<string>)]) {
          const elPriv = todos(mod).find((x) => x.id === id);
          const suBase = elPriv ? baseDe(mod, elPriv, base) : null;
          if (!suBase || suBase === id || mapa[suBase] === true) continue;
          /* R149 · El base tiene que EXISTIR —`baseDe` lo garantiza— y poder
             encenderse: si esta cerrado o deshabilitado, encenderlo de rebote
             es concederlo. */
          const elBase = todos(mod).find((x) => x.id === suBase);
          if (elBase && !elBase.cerrado && !elBase.deshabilitado) anotar(mod, suBase, true);
        }
      }
    }

    const nuevo = { ...valor };
    for (const [id, mapa] of mapas) nuevo[id] = mapa;
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
    /* R152 · Y LOS DE OTROS MODULOS SE NOMBRAN CON SU MODULO. «va con Dar
       alta» no dice lo mismo que «va con Dar alta (Contrato)»: quien reparte
       tiene que ver que esta abriendo tambien otra puerta, y ahi el aviso a
       medias es peor que no decir nada. Lo pidieron con esas palabras. */
    /* SOLO LOS QUE SE VAN A MOVER DE VERDAD. `cambiar()` salta los `cerrado` y
       los `deshabilitado` —R148: si una mitad de la llave no es mia, el permiso
       no es mio— y este aviso no los saltaba, asi que prometia arrastrar a un
       compañero que no se movia. Cruzando modulos es peor que en local: promete
       abrir una puerta de OTRA pantalla que no se va a abrir. Lo cazo una
       auditoria. */
    const juntos = mismosPermisos(modulos, m, p)
      .filter(({ privilegio: x }) => !x.cerrado && !x.deshabilitado);
    const conNombreDeModulo = (x: Privilegio, modulo: ModuloPrivilegios) =>
      modulo.id === m.id ? x.nombre
        : (typeof x.nombre === 'string' && typeof modulo.nombre === 'string'
          ? `${x.nombre} (${modulo.nombre})`
          : <>{x.nombre} ({modulo.nombre})</>);
    const conQuien = juntos.map(({ modulo, privilegio: x }) => conNombreDeModulo(x, modulo));
    /* R151 · EL BASE DE SU FILA, no el del modulo. Con `filas` un modulo tiene
       varios recursos y «ver» manda sobre el suyo: ver `baseDe`. */
    const idBase = baseDe(m, p, base);
    const elBase = idBase ? todos(m).find((x) => x.id === idBase) : undefined;
    const arrastraElBase = Boolean(
      idBase && p.id !== idBase && !dado && elBase && !elBase.cerrado && !elBase.deshabilitado
      && !p.deshabilitado && !soloLectura
      && !concedido(valor, m.id, idBase),
    );
    /* R152 · Y EL BASE DE LOS OTROS MODULOS QUE SE VAN A ENCENDER. La regla 16
       existe para que el arrastre del base no sea un efecto invisible, y
       cruzando modulos lo era: pulsar aqui encendia el «ver» de la otra
       pantalla y no se decia en ninguna parte. El daño escrito en R149 —un 403
       anti-escalada que tumba el guardado entero— aplica igual entre modulos.
       Lo cazo una auditoria. */
    const basesDeOtros = !dado && !p.deshabilitado && !soloLectura
      ? juntos.flatMap(({ modulo, privilegio: x }) => {
        if (modulo.id === m.id) return [];
        const b = baseDe(modulo, x, base);
        if (!b || b === x.id || concedido(valor, modulo.id, b)) return [];
        const elSuyo = todos(modulo).find((y) => y.id === b);
        if (!elSuyo || elSuyo.cerrado || elSuyo.deshabilitado) return [];
        return [conNombreDeModulo(elSuyo, modulo)];
      })
      : [];
    return {
      dado, no, falta, motivoFalta, conQuien, arrastraElBase, idBase, basesDeOtros,
      nombreBase: elBase?.nombre ?? idBase,
      apagado: soloLectura || p.deshabilitado === true,
      ayuda: p.ayuda,
    };
  };

  const fila = (m: ModuloPrivilegios, p: Privilegio, esBase: boolean) => {
    /* R151 (arreglo) · ESTO CONSUME `estado()`, NO LO REPITE.
     *
     * Aqui vivia una SEGUNDA COPIA COMPLETA del calculo —dado, no, falta,
     * motivoFalta, conQuien, arrastraElBase, nombreBase—, y el R151 escribio
     * `estado()` «para que la logica no se bifurque» sin enchufar esta mitad.
     * La afirmacion «el estado se resuelve en un sitio» era falsa el dia que se
     * escribio, y se cobro su precio en la misma version: al pasar `cambiar()`
     * a `baseDe`, la LISTA empezo a encender el base de rebote SIN DECIRLO
     * —porque el aviso lo calculaba esta copia, con el `base` literal de
     * antes—. Una regresion contra la regla 16, que es Obligatorio y cuyo daño
     * escrito es un 403 que tumba el guardado entero.
     *
     * Lo cazo la tercera auditoria adversaria. Dos calculos que TIENEN que
     * coincidir dejan de coincidir: es lo que este repositorio lleva diciendo
     * desde el R25, cometido aqui mismo mientras se escribia la regla que lo
     * prohibe.
     */
    const e = estado(m, p);
    const { dado, no, falta, motivoFalta, conQuien, arrastraElBase, nombreBase,
      basesDeOtros } = e;
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
                {/* R152 · Y el de los OTROS modulos, que tambien se enciende. */}
                {basesDeOtros.length > 0 && (
                  <span className="pp-junto"> · y «{basesDeOtros.map((n, i) => (
                    <Fragment key={i}>{i > 0 ? '», «' : ''}{n}</Fragment>
                  ))}»</span>
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
              /* `m.filas ?? […]` dejaba pasar `filas: []` —un array vacio no es
                 nullish— y el modulo entero desaparecia de la tabla SIN UN SOLO
                 AVISO, con sus permisos intactos en el valor: el peor caso que
                 la regla 24 dice cerrar, vivo. Sale de un `filter` que un dia no
                 devuelve nada. `?.length` en todas partes, y se avisa. */
              const filas = m.filas?.length ? m.filas : [{ id: m.id, nombre: m.nombre }];
              /* CON VARIOS MODULOS, DE QUE MODULO ES CADA FILA. Sin esto las
                 filas de «Personal» y las de «Reportes» salian seguidas y sin
                 distinguir: una pantalla de revision que no dice de que es cada
                 recurso no se puede revisar. Lo cazo una auditoria. Con un solo
                 modulo no hace falta y no se pinta. */
              const cabecera = modulos.length > 1 ? (
                <tr key={`${m.id}-cab`} className="pm-mod">
                  <th scope="colgroup" colSpan={cols.length + 1} className="pm-mod-nom"
                      id={`${idPanel}-mod-${im}`}>
                    {m.nombre}
                  </th>
                </tr>
              ) : null;
              const cuerpo = filas.map((f, iF) => {
                const idFila = `${idPanel}-fila-${im}-${iF}`;
                /* R151 · SIN BASE, POR FILA. Marcar el modulo entero decia que
                   Trabajadores esta sin conceder porque a Contratos le falta su
                   «ver». Son recursos distintos. */
                /* El base de ESTA fila, preguntandoselo a `baseDe` en vez de
                   repetir su criterio aqui: con `x.fila === f.id` el carril
                   NUNCA salia en una matriz sin `filas` —la fila implicita
                   tiene `f.id === m.id` y los privilegios tienen `fila`
                   indefinida—, justo el modulo donde lo efectivo SI viaja
                   vacio. La pantalla no daba ninguna senal. */
                const unoDeLaFila = lista.find((x) => (x.fila ?? m.id) === f.id);
                const idBaseFila = unoDeLaFila ? baseDe(m, unoDeLaFila, base) : null;
                const sinBase = Boolean(base) && Boolean(unoDeLaFila)
                  && (idBaseFila === null || !concedido(valor, m.id, idBaseFila));
                const nombreDelBase = idBaseFila
                  ? lista.find((x) => x.id === idBaseFila)?.nombre : undefined;
                return (
                  <tr key={`${m.id}-${f.id}`} className={sinBase ? 'pm-fila pm-sin-base' : 'pm-fila'}>
                    <th scope="row" className="pm-nom" id={idFila}>
                      {/* CON `title` SIEMPRE. El nombre se recorta con puntos
                          suspensivos —presentacion— y sin esto el nombre
                          completo NO ESTABA EN NINGUNA PARTE: ni a la vista, ni
                          en un globito, ni para quien navega con teclado. Lo
                          midio el equipo en su pantalla: «Fijar sobre que sedes
                          alcanza u…» sin forma de leerlo entero. El recorte es
                          presentacion; la informacion no se recorta. */}
                      <span className="pm-nom-txt"
                            title={typeof f.nombre === 'string' ? f.nombre : undefined}>
                        {f.nombre}
                      </span>
                      {/* R144 · Y SE DICE CON PALABRAS, no solo con el filete.
                          La lista lleva «Sin este permiso, el resto del modulo
                          no se aplica» desde el R144; la matriz solo tenia un
                          filete de color, que ademas quedaba como UNICO
                          portador de la informacion —SC 1.4.1—. Va dentro del
                          encabezado de fila, que es lo que el lector anuncia
                          antes de cada celda, y por tanto ANTES de pulsar. */}
                      {sinBase && (
                        <span className="sr-solo">
                          {' '}— sin «{typeof nombreDelBase === 'string' ? nombreDelBase : 'el permiso base'}»,
                          nada de esta fila se aplica.
                        </span>
                      )}
                    </th>
                    {cols.map((c) => {
                      /* `m.filas?.length`, el MISMO criterio que usa la linea
                         que arma `filas` 33 lineas mas arriba. Con `m.filas` a
                         secas, `filas: []` dibujaba una fila entera de «Sin
                         declarar» con los permisos vivos detras — y el aviso
                         escrito para ese caso decia «no dibuja ninguna fila»,
                         que era mentira. Dos nociones de lo mismo a 33 lineas
                         de distancia es como se paga. */
                      const p = lista.find((x) => x.columna === c.id
                        && (m.filas?.length ? x.fila === f.id : true));
                      const clase = c.aparte ? 'pm-celda pm-celda-aparte' : 'pm-celda';
                      /* Los `headers` atan cada celda a SUS DOS encabezados. Sin
                         ellos, los `id` del `th` no los referenciaba nadie: eran
                         atributos muertos, y un lector en una rejilla de
                         doscientas celdas no sabe en que cruce esta. */
                      /* Y EL MODULO ENTRA EN `headers` CUANDO HAY VARIOS. Como
                         `headers` SUSTITUYE a la asociacion por `scope`, el
                         nombre del modulo no llegaba al lector: dos sedes con
                         una fila «Contratos» cada una daban cuatro interruptores
                         con DOS PARES de nombres accesibles identicos. La regla
                         25 se cumplia mirando la pantalla y no sin verla, que
                         es justo lo que dice cubrir. */
                      const atada = [
                        modulos.length > 1 ? `${idPanel}-mod-${im}` : '',
                        idFila, `${idPanel}-col-${c.id}`,
                      ].filter(Boolean).join(' ');
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
                                  aria-labelledby={`${idFila} ${idPanel}-col-${c.id}`}
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
                      /* LOS NOMBRES SON `ReactNode`, ASI QUE NO SE METEN EN UNA
                         PLANTILLA DE TEXTO. `Va con ${conQuien.join()}` sobre un
                         nombre en JSX imprimia «Va con [object Object].» en el
                         globito, y el arrastre del base se DESCARTABA EN SILENCIO
                         cuando su nombre no era texto: el aviso de R149
                         desaparecia justo en los paneles que dan formato a sus
                         nombres. Se compone con nodos cuando hace falta. */
                      const enTexto = (n: React.ReactNode): string | null =>
                        typeof n === 'string' ? n : typeof n === 'number' ? String(n) : null;
                      const nombres = e.conQuien.map(enTexto);
                      const avisos: React.ReactNode[] = [];
                      if (e.ayuda !== undefined && e.ayuda !== null && e.ayuda !== '') {
                        avisos.push(e.ayuda);
                      }
                      if (e.conQuien.length) {
                        avisos.push(nombres.every((n) => n !== null)
                          ? `Va con ${nombres.join(', ')}.`
                          : <>Va con {e.conQuien.map((n, i) => (
                              <Fragment key={i}>{i > 0 && ', '}{n}</Fragment>))}.</>);
                      }
                      if (e.arrastraElBase) {
                        const nb = enTexto(e.nombreBase);
                        avisos.push(nb !== null
                          ? `Enciende también «${nb}».`
                          : <>Enciende también «{e.nombreBase}».</>);
                      }
                      for (const n of e.basesDeOtros) {
                        const t = enTexto(n);
                        avisos.push(t !== null
                          ? `Enciende también «${t}».`
                          : <>Enciende también «{n}».</>);
                      }
                      const soloTexto = avisos.every((a) => typeof a === 'string');
                      return (
                        <td key={c.id} headers={atada} className={clase}
                            title={avisos.length && soloTexto ? avisos.join(' ') : undefined}>
                          <Interruptor
                            etiqueta={nombre}
                            etiquetaOculta
                            activo={e.dado}
                            deshabilitado={e.apagado}
                            ayuda={avisos.length
                              ? (soloTexto ? avisos.join(' ')
                                : <>{avisos.map((a, i) => (
                                    <Fragment key={i}>{i > 0 && ' '}{a}</Fragment>))}</>)
                              : undefined}
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
    if (process.env.NODE_ENV === 'production') return [];
    const dis: string[] = [];
    /* EL BASE QUE NO RESUELVE SE AVISA EN LAS DOS PRESENTACIONES. Esto salia
       por aqui cuando la presentacion no era matriz, asi que el diagnostico
       EXISTIA y no se consultaba donde hacia falta: un modulo colocado por
       columnas y pintado como LISTA se vaciaba entero sin una sola senal.
       `privilegiosEfectivos` no depende de la presentacion; el aviso tampoco. */
    /* R152 · UNA `claveGlobal` REPETIDA DENTRO DEL MISMO MODULO casi siempre
       quiere decir `clave`. Funciona —son el mismo permiso igual— pero el
       nombre miente sobre el alcance, y el dia que alguien añada ese mismo
       nombre en otro modulo se llevara por delante dos permisos que creia
       locales. Se dice, no se corrige: puede ser deliberado. */
    for (const m of modulos) {
      const vistas = new Map<string, string>();
      for (const p of todos(m)) {
        if (p.claveGlobal === undefined) continue;
        const ya = vistas.get(p.claveGlobal);
        if (ya) {
          dis.push(`«${p.id}» y «${ya}» comparten \`claveGlobal: "${p.claveGlobal}"\` dentro `
            + `del mismo modulo «${m.id}». Para unir dentro de un modulo es \`clave\`; `
            + '`claveGlobal` cruza TODOS los modulos y eso alcanza a los que se añadan luego.');
        } else vistas.set(p.claveGlobal, p.id);
      }
    }
    for (const m of modulos) {
      for (const f of baseSinResolver(m, base)) {
        dis.push(`en «${m.id}»${f === m.id ? '' : `, la fila «${f}»`} no hay ningun privilegio `
          + `que encarne el base «${base}» —ni por id ni por columna—, asi que todo lo suyo sale `
          + 'de lo efectivo. Si su dominio no funciona con un privilegio que manda, pase '
          + '`base={null}`.');
      }
    }
    if (presentacion !== 'matriz') return dis;
    if (!columnas?.length) {
      dis.push('`presentacion="matriz"` sin `columnas`. Una matriz sin columnas no es '
        + 'una matriz: se dibuja la lista.');
      return dis;
    }
    const idsCol = new Set(columnas.map((c) => c.id));
    /* IDS DE COLUMNA REPETIDOS O CON ESPACIOS. Dos columnas con el mismo `id`
       producen dos `th` con el mismo `id` de DOM, y `headers` —que se separa
       por espacios— queda apuntando a algo ambiguo o partido en dos. */
    const vistas = new Set<string>();
    for (const c of columnas) {
      if (vistas.has(c.id)) {
        dis.push(`la columna «${c.id}» esta declarada dos veces: los encabezados comparten `
          + '`id` y `headers` deja de identificar la celda.');
      } else vistas.add(c.id);
      if (/\s/.test(c.id)) {
        dis.push(`el id de columna «${c.id}» lleva un espacio: \`headers\` se separa por `
          + 'espacios y lo leeria como dos encabezados.');
      }
    }
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
        if (!m.filas?.length && p.fila) {
          /* LA QUINTA FORMA, que la regla 24 enumeraba y el codigo no cubria:
             el modulo no declara `filas` pero sus privilegios si, asi que todos
             caen en la fila implicita y solo se dibuja el primero de cada
             columna. El resto sigue concedido y sin pantalla donde verlo. */
          dis.push(`«${p.id}» (${m.id}) declara \`fila\` pero su modulo no declara \`filas\`: `
            + 'todos caen en la misma fila y solo se dibuja uno por columna.');
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
        // La fila que de verdad se usa al dibujar: sin `filas` declaradas, todos
        // van a la implicita, asi que dos con `fila` distinta SI chocan.
        const celda = `${m.filas?.length ? p.fila : m.id}|${p.columna}`;
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
      if (m.filas && !m.filas.length) {
        dis.push(`«${m.id}» declara \`filas: []\`: se trata como si no declarara filas y todo `
          + 'cae en una sola, la del modulo. Si esperaba una fila por recurso, la lista llego '
          + 'vacia.');
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

  /* «UNA SOLA VEZ» LO DECIA EL COMENTARIO Y NO ERA VERDAD: el memo depende de
     `columnas` y `modulos`, y con literales en linea —el caso normal, y el del
     catalogo— la identidad cambia en cada pintada, asi que un padre que se
     repinte con cada tecla llenaba la consola. Se ata al CONTENIDO del aviso:
     el mismo diagnostico no se repite, y uno nuevo si sale. */
  const dichos = avisosDeMatriz.join('\n');
  useEffect(() => {
    if (!dichos) return;
    for (const d of dichos.split('\n')) console.error(`PanelPrivilegios: ${d}`);
  }, [dichos]);

  return (
    <div ref={caja} className={['pp', className].filter(Boolean).join(' ')}>
      {children && <div className="pp-cab">{children}</div>}

      {presentacion === 'matriz' && columnas?.length && cabeLaMatriz ? matriz() : (
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
          /* Tambien por `baseDe`: con un modulo colocado por columnas, `base`
             no es un id y este `concedido(..., base)` decia que falta el base
             CON TODO CONCEDIDO — la pantalla contradiciendo al backend. */
          /* UN BASE DECLARADO QUE NO RESUELVE TAMBIEN ES «SIN BASE» — y es lo
             MAS importante que se puede decir, porque `privilegiosEfectivos`
             vacia el modulo entero. Al pasar a `baseDe` esto quedo en `false`
             y el carril dejo de salir: la regla 12 exige que salga igual
             cuando el modulo no declara su base. Lo caz o su propia prueba. */
          const idBaseMod = lista.length ? baseDe(m, lista[0], base) : null;
          const sinBase = Boolean(base)
            && (idBaseMod === null || !concedido(valor, m.id, idBaseMod));
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
