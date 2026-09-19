# R152 · Una llave que abre dos puertas, hoy se guarda dos veces

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Privilegios
**Fecha:** 2026-09-18
**Comprobado contra:** `sistema-diseno-ae` **v1.129.0 instalada** — subida hoy
desde la v1.124.0 y leída en el paquete, host y contenedor.

**Es lo único que tenemos abierto.** R144 a R151 están cerradas.

---

## Primero: R151 llegó entero, y con la salida que preferíamos

| Lo que pedimos | Cómo llegó |
|---|---|
| Una presentación en matriz | `presentacion?: 'lista' \| 'matriz'` — **el mismo componente**, no uno hermano |
| Columnas declaradas | `columnas?: ColumnaPrivilegios[]`, con el `aparte?: boolean` que pedimos para «Descargar» |
| `columna?` y `fila?` en `Privilegio` | Los dos |
| El hueco `·` | `{ tipo: 'noAplica' }`, cuarto miembro de `NoRepartible` — **la opción 2**, la que reutiliza un mecanismo que ya sabía explicarse |
| — | Y de propina `ModuloPrivilegios.filas`, que es justo lo que nos hacía falta para los grupos con fila propia **y** filas hijas |

Hicimos el mapeo de las **62 casillas** de nuestra matriz contra el modelo nuevo
y no queda ninguna sin sitio. Una sale incluso mejor que hoy: nuestra fila de
categoría —«Reportes»— la pintamos con seis candados fingiendo acciones que no
existen, y en el panel es una **cabecera de grupo**, que es lo que de verdad es.

Dos cosas que agradecemos aparte, porque no teníamos por qué enterarnos:

- Que al arreglar R151 **la presentación en lista dejó de ser idéntica** a la
  v1.127.0 y lo corrigierais **antes** de publicar en vez de dejarlo pasar.
- Lo que salió de ahí: `Interruptor` ahora ata su `ayuda` al control con
  `aria-describedby`. Hasta ahora un lector de pantalla decía «Editar,
  interruptor, desactivado» y **se comía el porqué** — justo desde que R148 puso
  el porqué ahí.

---

## R152 · El único abierto

**Prioridad: media. No bloquea hoy; bloquea en cuanto construyamos la pantalla
que lo estrena.**

### Qué pasa

`ValorPrivilegios` es `Record<modulo, Record<privilegio, …>>`: el estado se
indexa **por módulo**. Y `clave` —el mecanismo que hace que dos interruptores
sean el mismo permiso— **no cruza módulos**: `cambiar()` lo resuelve con
`todos(m)` (`PanelPrivilegios.tsx:649-651`), un solo módulo. Verificado en la
v1.129.0: no hay `claveGlobal` ni nada equivalente.

Así que el mismo permiso declarado en dos categorías son **dos entradas
distintas del mapa**. Encender una no enciende la otra. La pantalla enseñaría
como dos cosas lo que el servidor guarda como una, y al aplanar para nuestro PUT
de juego completo ganaría la última que se leyera.

### Por qué nos va a pasar

Hoy no nos pasa, y lo medimos: la matriz entera son **62 casillas con 62
permisos distintos**, ninguno repetido.

Pasa con la pantalla siguiente. «Historia de contratos» lleva las mismas cinco
columnas que «Contrato», y el dueño decidió el 18/09 que **«Dar alta» sea el
MISMO permiso en las dos**, con este argumento:

> Dar de alta enciende `Contrato → Puesto → Cargo → PrivilegioCargo`: quien
> puede hacerlo puede sentar a alguien en un cargo de RRHH y concederle sus
> facultades. Ese daño es idéntico se pulse el botón donde se pulse, y un acto
> irreversible merece **una sola llave**. Con dos, quitar una da la sensación de
> haber cerrado sin haber cerrado.

No es que se nos repita por descuido. **Es una decisión de seguridad**, y la
pantalla tiene que reflejar que es una llave y no dos.

### Por qué `fila` no lo resuelve

Lo miramos antes de escribir esto. `filas` coloca varios recursos **dentro de un
módulo**, y ahí `clave` sí los une. Pero «Contrato» e «Historia de contratos»
son **dos opciones distintas del menú**, y nuestra matriz espeja el menú —es
regla del dueño, y es lo que acaba de fijar otra vez al pedir los reportes—.
Meterlas en un módulo para que `clave` las alcance sería torcer la pantalla para
acomodar el estado, que es justo al revés.

### Qué pedimos

Que `clave` pueda cruzar módulos. Nos vale cualquiera de las dos:

1. Que `clave` se resuelva sobre **todos los módulos** y no sobre el suyo. Es el
   cambio menor, y la semántica que ya documentáis lo admite: *«varios
   privilegios con la misma clave son el mismo permiso»* — no dice «del mismo
   módulo».
2. O un ámbito explícito: `claveGlobal?: string`, para no cambiar lo que `clave`
   significa hoy en productos que la usen dentro de un módulo.

Preferimos la **2** si os preocupa la compatibilidad, y la **1** si no: cuantos
menos conceptos, mejor.

Y en cualquiera de las dos, que el «va con X y Y» que ya dibujáis **nombre
también la otra categoría**. Aquí importa más que dentro de un módulo: quien
reparte tiene que ver que al encender «Dar alta» en Historia lo está encendiendo
también en Contrato, porque es la misma llave. Sin eso, el aviso diría la verdad
a medias, que en una pantalla de permisos es peor que no decir nada.

### Una pregunta, no una petición

¿Qué debería devolver `privilegiosEfectivos` para una clave compartida cuyo
módulo A sobrevive y cuyo módulo B se vacía —por `base`, `cerrado` o un
`depende` sin resolver—? Con un PUT de juego completo como el nuestro, «sale en
A y no en B» y «no sale» son **cosas distintas**, y la segunda borra.

No os pedimos una respuesta concreta: os pedimos que la decidáis vosotros y la
escribáis, porque si la decidimos nosotros por nuestra cuenta acertaremos hoy y
divergeremos en la próxima versión.

### La salida que tenemos si decís que no

Sincronizar las dos entradas nosotros, en `onCambio`. Funciona. Pero es
reimplementar `clave` por fuera —de lo que veníamos huyendo— y el aviso «va con»
habría que componerlo aparte: dos sitios explicando lo mismo, y uno de los dos
envejeciendo.

---

## Lo que NO os pedimos, para que la lista siga podada

- **Nada de la matriz.** R151 llegó completo; las 62 casillas tienen sitio.
- **Que la matriz sea responsive sola.** Caer al acordeón bajo cierto ancho nos
  parece correcto, y de paso resuelve que nuestra pantalla no sea móvil primero,
  que es deuda **nuestra**.
- **Niveles por campo en la matriz.** No los usamos.
- **`preset`.** Aquí el cargo se compone privilegio a privilegio y no hay
  paquetes por rol, así que no llegamos a dibujarlo.
