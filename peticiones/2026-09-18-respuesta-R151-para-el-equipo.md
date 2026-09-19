# Respuesta a R151 — para Control Administrativos V2.0

**18 de septiembre de 2026** · atendido en **v1.128.0**.

```bash
npm install "github:solwarehz/sistema-diseno#v1.128.0"
```

Reinicien el servidor y comprueben `--mmi-version` y `--mmi-componentes`: las
dos tienen que decir `1.128.0`.

---

## Primero: la culpa no es suya

Lo escribieron ustedes —*«habéis hecho siete cosas sobre una premisa que no os
aclaramos»*— y hay que responder a eso antes que al componente, porque **no es
verdad**.

La premisa era **nuestra**. Que el panel fuera una lista fue una decisión de
producto que **no está escrita en ninguna parte**: ni en el contrato, ni en el
catálogo, ni en las diecisiete reglas que construimos encima de ella. Ustedes no
podían aclarar algo que nosotros no habíamos declarado.

Y es la lección que nos llevamos, más que el código: **un requerimiento no
declarado no sale en ningún candado.** Las **diecisiete reglas** de contrato del
panel —a lo largo de **cincuenta y seis versiones**— se escribieron encima de esa
premisa, con todos los pasos en verde, sobre un componente que su pantalla no
podía usar.

*(Aquí decía «diecisiete versiones», confundiendo reglas con versiones. Es una
cifra que no medimos, que es justo lo que nuestras propias normas prohíben, y la
corregimos al releer.)*

---

## Entra, y estas son las razones

No entra por ser suyo. Entra por dos cosas:

- **Filas = recursos, columnas = acciones es el patrón estándar** de una
  pantalla de permisos. Cualquier producto que reparta permisos por recurso se
  va a encontrar con lo mismo.
- **Lo que la lista no puede hacer no es comodidad.** La lista responde «¿qué
  puede hacer este cargo con Contratos?». Solo la matriz responde «**¿quién**
  puede editar?», que se lee hacia abajo — y eso, en su caso, es la revisión
  periódica que les exige la norma.

---

## Es el mismo componente. Esa era su condición y es la nuestra

`presentacion="matriz"` con `columnas`. **No** un `MatrizPrivilegios` al lado.

Lo pidieron así: *«lo que no queremos es reimplementar `depende` y los cuatro
estados por nuestra cuenta otra vez: eso es exactamente de lo que veníamos
huyendo»*. Coincidimos, y por un motivo que va más allá de su proyecto: **dos
componentes habrían sido dos verdades sobre quién puede qué**, y la primera vez
que cambiaran las reglas 1-17 solo cambiaría una.

Para garantizarlo no bastaba con la intención. El estado de cada privilegio
—concedido, no repartible, le falta un `depende`, arrastra el base, apagado—
vivía **dentro** de la función que dibuja la fila de la lista. Se sacó a un sitio
único. **Lo único que cambia entre lista y matriz es dónde se pinta.**

Es la **regla 21** del contrato, con prueba.

```tsx
<PanelPrivilegios
  presentacion="matriz"
  columnas={[
    { id: 'ver',       titulo: 'Ver' },
    { id: 'editar',    titulo: 'Editar' },
    { id: 'crear',     titulo: 'Crear' },
    { id: 'descargar', titulo: 'Descargar', aparte: true },
  ]}
  modulos={[{
    id: 'personal',
    nombre: 'Personal',
    filas: [
      { id: 'trab', nombre: 'Trabajadores' },
      { id: 'cont', nombre: 'Contratos' },
    ],
    privilegios: [
      { id: 't-ver',    nombre: 'Ver trabajadores',   columna: 'ver',    fila: 'trab' },
      { id: 't-editar', nombre: 'Editar trabajador',  columna: 'editar', fila: 'trab' },
      { id: 't-crear',  nombre: 'Crear trabajador',   columna: 'crear',  fila: 'trab',
        depende: 't-editar' },
      { id: 'c-crear',  nombre: 'Crear contrato',     columna: 'crear',  fila: 'cont',
        cerrado: { tipo: 'noAplica', motivo: 'Un contrato no se crea aquí.' } },
    ],
  }]}
  base="ver"
  valor={valor}
  onCambio={(completo, efectivo) => { … }}
/>
```

---

## Cuatro decisiones que tomamos y no consultamos

**1 · `noAplica` es el cuarto motivo, y lleva motivo obligatorio.**

Lo pidieron y coincidimos, con un matiz: **omitir la casilla no es lo mismo que
decir que no aplica**. Omitiendo, quien reparte nunca se entera de que esa acción
existe para otros recursos, y pregunta por qué le falta. Un «no aplica» **sin
explicación** sería otra vez la casilla vacía, así que el motivo no es opcional.

Una celda **sin privilegio declarado** se distingue de los cuatro estados y no
dice nada. Y `noAplica` **no se concede**: `privilegiosEfectivos` lo limpia como
a los otros tres, porque contar una acción que no existe haría que un cargo
pareciera incompleto por algo que no depende de nadie.

**2 · Las filas las nombra el módulo, con `filas`.**

Su propuesta repartía los privilegios entre filas sin decir de dónde salía el
nombre de cada fila. Sin eso, el encabezado de fila no tiene casa.

**3 · Es una `<table>` de verdad, y cada interruptor se llama por su cruce.**

Con `<th scope="col">` y `<th scope="row">`. Doscientos interruptores en una
rejilla de `<div>` son una pantalla que solo se puede usar mirándola. Y
`Interruptor` gana **`etiquetaOculta`**: el lector dice «Contratos · Editar» en
vez de anunciar doscientas veces «Editar».

**4 · La primera columna se ancla.**

Una matriz es más ancha que su contenedor casi siempre, y sin eso se marca la
casilla de la fila equivocada. Es el patrón del R142 —el **patrón**, no el
código—: fondo propio, suelo **y techo**, y el hover después del rayado.

---

## Lo que NO hicimos, porque no lo pidieron

Lo dijeron expresamente y lo respetamos: **no** hay matriz adaptada a móvil más
allá del anclado, **no** hay niveles dentro de la matriz, y **no** hay `preset`
en matriz. Si alguna de las tres les hace falta, es un requerimiento nuevo.

---

## Lo que puede romperles

- **`NoRepartible` gana un cuarto miembro.** Si hacen un `switch` exhaustivo
  sobre `cerrado.tipo` con una rama `never`, deja de compilar hasta que
  contemplen `noAplica`. No afecta a quien solo pase los valores.
- **Las clases `.pm-*` son nuevas en la hoja.** Si ya usaban ese prefijo, ahora
  compiten con reglas del sistema.
- **La presentación en lista no cambia.** Sin `presentacion="matriz"` no cambia
  absolutamente nada.

---

## Cómo lo verificamos

Los **veinte pasos en verde**, `tsc --noEmit` limpio y la batería completa
pasando. Pero lo que conviene que sepan no es eso: es lo que **no** estaba en
verde y ningún paso podía ver.

---

## Tres auditorías, y lo que encontraron

Publicamos esto después de tres pasadas adversarias sobre nuestro propio
trabajo. Las tres encontraron defectos **con los veinte pasos en verde**, y los
contamos porque el patrón les sirve a ustedes más que el arreglo.

**1 · Con `filas` y el `base` por omisión, el módulo entero viajaba vacío.**

`base` se buscaba por `id` literal. Con varios recursos por módulo los `id` son
únicos —`trab-ver`, `cont-ver`—, así que **nunca existía uno llamado `ver`**:
`privilegiosEfectivos` devolvía `{}` pasara lo que pasara con los interruptores.
Con un backend de juego completo, **eso borra permisos que nadie retiró** — el
daño exacto que el R150 vino a cerrar.

Nadie lo veía porque **las cuatro invocaciones de matriz que existían pasaban
`base={null}`**: el camino por omisión no lo ejercía nadie. Es la lección que nos
llevamos: *una prueba que nunca recorre el valor por omisión no prueba el valor
por omisión.*

**2 · «Es el mismo código» era cierto al pie de la letra y falso en su
propósito.**

Les prometimos una sola lógica. La había — y la matriz consumía **cuatro de los
seis campos** que ese cálculo devuelve: tiraba el aviso de que encender arrastra
el base (R149) y el de que dos privilegios van juntos (R99), y no llevaba a la
celda el porqué de un `deshabilitado` (R148). No eran dos lógicas: era una
lógica y **dos pantallas diciendo cosas distintas sobre quién puede qué**, que es
literalmente lo que ustedes pidieron evitar.

Y al arreglarlo apareció la versión peor de lo mismo: la función que dibuja la
**lista** nunca consumió ese cálculo — era una segunda copia completa — y nuestro
primer arreglo hizo que la lista **empezara a encender el base de rebote sin
decirlo**. Lo cazó la tercera auditoría. Ahora las dos consumen el mismo cálculo,
de verdad.

**3 · Un defecto que les toca aunque no adopten la matriz.**

`Interruptor` **nunca ató su `ayuda` al control**. El texto se pintaba al lado y
ningún atributo lo unía al interruptor, así que un lector de pantalla decía
«Editar, interruptor, desactivado» y **se dejaba el porqué** — en la lista
también, desde que el R148 puso ese porqué ahí. Ya va con `aria-describedby`.

**4 · «Quince mutaciones vistas en rojo» no era cobertura.**

Lo escribimos en la primera versión de este informe y era cierto. También era
engañoso: sobrevivían **23 mutaciones**, y la peor dejaba la matriz **sin poder
retirar un permiso** — ninguna de las trece pruebas pulsaba un interruptor
encendido. Un panel que concede y no retira pasaba el contrato entero. Se pasó de
13 pruebas a 71.

---

## Lo que sigue abierto, dicho por nosotros

1. **La matriz a ancho de móvil no está medida en un navegador.** El CSS está
   escrito y tiene prueba sobre la hoja; la medición en Chrome no se pudo
   completar y no la damos por hecha.
2. **Ningún candado compila los bloques de «copia esto».** El de la matriz lo
   compilamos a mano con `tsc` al escribirlo, pero el día que alguien lo edite
   nada lo comprobará. Ya nos pasó con dos bloques que no compilaban.
3. **`verificar-contrato` comprueba que cada regla tenga una prueba con su
   número, no que la prueba pruebe lo que la regla dice.** Las 23 mutaciones
   supervivientes vivían justo ahí.
