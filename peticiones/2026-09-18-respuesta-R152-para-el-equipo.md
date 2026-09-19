# Respuesta a R152 — para Control Administrativos V2.0

**18 de septiembre de 2026** · atendido en **v1.130.0**.

```bash
npm install "github:solwarehz/sistema-diseno#v1.130.0"
```

Reinicien el servidor y comprueben que `--mmi-version` y `--mmi-componentes`
dicen las dos **1.130.0**.

---

## Entra, y estas son las razones

No entra por ser suyo. **La misma acción peligrosa alcanzable desde dos
pantallas es el patrón de cualquier sistema de permisos que crezca**, y su
alternativa —sincronizar las dos entradas en su `onCambio`— es reimplementar
`clave` por fuera: exactamente de lo que venían huyendo desde el R151, con el
aviso «va con» compuesto aparte y uno de los dos envejeciendo.

El argumento del dueño lo dejamos citado en el código, porque explica mejor que
una definición por qué esto no es comodidad:

> Un acto irreversible merece **una sola llave**. Con dos, quitar una da la
> sensación de haber cerrado sin haber cerrado.

---

## Elegimos su opción 2: `claveGlobal`

Ofrecían dos salidas y preferían la 1 —ampliar `clave`— si no nos preocupaba la
compatibilidad. **Nos preocupa, y no por compatibilidad formal.**

Las claves son cadenas cortas y genéricas —`editar`, `alta`—. Hacerlas cruzar
por omisión **fundiría en un permiso dos que sólo coinciden de nombre**, en
silencio, en cualquier producto que ya use `clave` dentro de un módulo. Eso es
el daño del R152 al revés: en vez de dos llaves para una puerta, una llave para
dos puertas que no tenían por qué compartirla.

**El ámbito va en el nombre y se elige a propósito.** Se pueden usar las dos a
la vez: `clave` para el grupo local, `claveGlobal` para el permiso compartido.

```tsx
// Contrato
{ id: 'cont-alta', nombre: 'Dar de alta', claveGlobal: 'alta-contrato' }
// Historia de contratos
{ id: 'hist-alta', nombre: 'Dar de alta', claveGlobal: 'alta-contrato' }
```

Y el aviso **nombra el módulo**, como pidieron: «va con Dar de alta
**(Contrato)**».

---

## Su pregunta, respondida en código y no en prosa

Preguntaron qué debe devolver `privilegiosEfectivos` para una llave compartida
cuyo módulo A sobrevive y cuyo B se vacía, y pidieron que **lo decidiéramos
nosotros**. Lo decidimos así:

**`privilegiosEfectivos` no cambia.** Sigue limpiando módulo a módulo: la llave
saldrá donde se aplique y faltará donde no. «El módulo B no aplica nada» es una
verdad sobre B, y falsearla —dejando colgada una entrada de un módulo vaciado—
sería mentir sobre B para acertar sobre la llave.

**Y entra `clavesEfectivas()`**, que responde la otra pregunta:

> Una llave compartida está concedida si **sobrevive en al menos un módulo**
> donde está declarada.

```tsx
const llaves = clavesEfectivas(MODULOS, valor, 'ver');   // Set<string>
```

Porque es **una** llave: si en alguna puerta abre de verdad, está dada. La
alternativa —exigir que sobreviva en todas— convertiría un módulo sin su `base`
en un **revocador silencioso** de permisos concedidos en otra pantalla, y eso es
el borrado que el R150 vino a cerrar.

Está en el contrato como **regla 30**, para que no haya que deducirlo nunca más.

---

## Tres cosas que no pidieron y hacían falta

1. **El gemelo arrastra el base y la cadena `depende` de SU módulo.** Sin eso
   viajaría encendido en pantalla y vacío en lo efectivo — el defecto que el
   R151 cerró dentro de un módulo, reapareciendo entre módulos.
2. **No se enciende de rebote lo `cerrado` ni lo `deshabilitado`.** Es R148
   cruzando módulos: si una mitad de la llave no es suya, el permiso no es suyo.
3. **`claveGlobal` repetida dentro de un mismo módulo avisa en desarrollo**: ahí
   lo que describe el caso es `clave`, y el nombre mentiría sobre el alcance el
   día que alguien use ese nombre en otro módulo.

---

## Lo que encontró la auditoría sobre nuestro propio trabajo

Lo contamos porque es lo que más les sirve para confiar en la versión.

**Cinco defectos, y los cinco por la misma causa nuestra:** tratábamos el módulo
pulsado de una forma y los demás de otra. De ahí salieron el gemelo que no
arrastraba su cadena, el que con `filas` no subía el base de su fila, el aviso
que nombraba compañeros que no se iban a mover, y **el base del otro módulo que
se encendía sin decirse** —la regla 16 incumplida cruzando módulos—.

Y uno conceptual: **«el mismo permiso» no era transitivo**. Con `clave` uniendo
A-B y `claveGlobal` uniendo B-C, pulsar A encendía B y **dejaba C apagado**
mientras la etiqueta anunciaba que iban juntos. Es su propio R152 reaparecido
dentro del mecanismo que venía a cerrarlo.

**Una sexta se reportó como defecto y no lo era**, y conviene decirlo igual:
subir el base del otro módulo **despierta** lo que ese módulo tuviera guardado y
dormido. Medimos el mismo escenario dentro de un solo módulo y hace exactamente
lo mismo **desde el R97** — conceder el base concede el módulo, y R98 conserva lo
repartido sin aplicarlo. Es la semántica del base, coherente en todo el
componente. Lo que sí faltaba era **decirlo**, y entre módulos importa más que
dentro de uno porque quien reparte está mirando otra pantalla.

Y en el catálogo: **el ejemplo que los productos copian tenía dos privilegios en
la misma celda** — el anti-patrón que nuestra propia regla 24 existe para cazar,
en el bloque que se enseña como modelo. Corregido, y ahora la **matriz viva**
del catálogo lleva una llave compartida de verdad para que se vea funcionando.

---

## Lo que puede romperles

**Nada.** `claveGlobal` es una prop nueva y opcional: quien no la pase no ve un
solo cambio, y `clave` sigue significando exactamente lo que significaba. Eso fue
lo que decidió que entrara una prop nueva en vez de ampliar la que había.

---

**Estado de la entrega:** 17 candados + ESLint · `tsc --noEmit` limpio · **1165
pruebas en 56 archivos** · contrato del panel en **32 reglas** · las dos vías
verificadas instalando.
