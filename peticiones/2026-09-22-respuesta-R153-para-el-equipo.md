# Respuesta a R153 — la matriz en móvil · para Control Administrativos V2.0

**22 de septiembre de 2026** · entró en MMI-DS **v1.131.0**, con dos
correcciones en la v1.132.0

```bash
npm install "github:solwarehz/sistema-diseno#v1.141.0"
```

**Entra lo que pidieron primero, no la alternativa.** La matriz cae sola a lista
bajo cierto ancho. Y entra **sin prop**: es el comportamiento por omisión, que
es la puerta que ustedes mismos dejaron abierta —*«nos vale igual si lo decidís
sin prop, por la hoja, siempre que sea el comportamiento por omisión y esté
documentado»*—.

---

## 1 · Por qué sin prop

Una prop `listaBajo={640}` obliga a cada producto a acertar un número. El que
acierte será el mismo en todos, porque el ancho al que una matriz de siete
columnas deja de caber no depende del producto: depende de la matriz. Un valor
que va a ser idéntico en todas partes no es una decisión del producto — es una
decisión del sistema, y repartirla solo garantiza que algún día tres pantallas
tengan tres umbrales.

**El componente mide su propia caja**, no la ventana. Es lo que hace que también
funcione dentro de un panel estrecho en una pantalla ancha, que es donde una
consulta a la ventana se equivoca.

---

## 2 · Y arranca en lista, no en matriz

Esto es política del sistema desde el 19/09/2026 —**móvil primero**, escrita en
`POLITICA-DE-CREACION.md` §5— y aquí es donde se nota:

> *Cuando la forma se decide en ejecución, se parte de la forma de móvil.*

El estado inicial es la **lista**; la matriz entra al comprobar que cabe.
Empezar en matriz y encoger es «escritorio primero con un parche», y se ve en el
primer pintado: un salto de rejilla a acordeón en cuanto la página carga.

Cuando el navegador no puede medir —renderizado en servidor, sin
`ResizeObserver`— se entrega la matriz, porque ahí no hay salto que ver y una
lista servida a un escritorio sí sería un error visible.

---

## 3 · Sobre su plan B: la mitad que proponían era la correcta

Su alternativa decía, con su énfasis original:

> *«la alternativa mínima que nos desbloquea es mucho más barata: **un `title` en
> el `th` de la fila con su nombre completo**, más `white-space: normal` bajo
> 640 px para que el nombre envuelva en dos líneas en vez de cortarse. Resuelve
> lo de leer; no resuelve lo de móvil primero.»*

**La segunda mitad —envolver en dos líneas— es exactamente el primer escalón de
nuestra política**, y ustedes ya habían escrito el límite de su propia propuesta.
Aquí decía «su plan B habría cerrado el ticket dejando el defecto», y era
injusto: estaba citado a medias.

Lo que sí añadimos es sobre la primera mitad, porque conviene saberlo: **el
`title` está registrado en nuestra propia memoria como inservible ahí.**
`memoria/06-cobertura.md`, ficha C-08: *«Hoy solo hay `title`, que no se ve en
móvil ni con teclado»*.

Y no es un reproche: nuestra política de móvil primero **mandaba `title` como
rescate** y una auditoría lo cazó el 19/09/2026 — prescribía para el teléfono un
remedio que este mismo repositorio tenía registrado como inútil en el teléfono.
La regla se reescribió: **primero no recortar** —envolver, apilar o dar una
presentación estrecha—, y si hay que recortar, el texto entero tiene que estar
**alcanzable sin puntero**.

## 4 · Sobre la parte de «esto es culpa nuestra»

No hace falta. Ustedes describieron la solución correcta y la pusieron en la
lista de lo que no pedían; nosotros entregamos lo pedido sin preguntar por qué
la respuesta correcta estaba en esa lista. **El que no preguntó fue el sistema.**

Y el criterio con el que esto entró no es que lo pidieran: es que **la matriz
que no colapsa es un defecto del componente**, lo use quien lo use. Si fuera una
particularidad de su pantalla, no habría entrado.

---

## 5 · Lo que no cambia, como pidieron

- **`--pm-nom` se queda.** Estrechar la columna es lo correcto en un teléfono.
- **El desplazamiento horizontal se queda** cuando la matriz se queda.
- **La lista y la matriz siguen sin parecerse.** Son dos lecturas distintas.

---

## 6 · Verificación — y lo que NO está verificado

- Pruebas en `componentes/pruebas/privilegios-movil-primero.test.tsx`: los dos
  lados del corte de 640 px, el ancho cero y la ausencia de `ResizeObserver`.
- Los 22 pasos del publicador en verde.
- **La medición en navegador a 360 px que nuestra propia política exige está
  PENDIENTE.** La caída a lista está verificada con anchos de contenedor
  simulados, no midiendo en pantalla. Quedó declarado así en el registro de la
  v1.131.0 el día que entró, y lo repetimos aquí porque este informe decía
  «medido en navegador a 360 px» y eso era falso. Los 687 px que sí se midieron
  son el **diagnóstico del defecto**, no la comprobación del arreglo.

---

## 7 · Dos cosas que una auditoría encontró al revisar esto, y les afectan

**Si usan render en servidor, hay discrepancia de hidratación.** `sePuedeMedir`
se evalúa en el render: el HTML del servidor trae la **matriz** y el primer
render de cliente da **lista**. Si no usan SSR en esa pantalla, no les afecta;
si lo usan, dígannoslo y lo resolvemos por nuestro lado.

**Y cuando la caja mide 0 —acordeón cerrado, pestaña oculta, `display:none`—
el valor por omisión es la MATRIZ**, la forma ancha. Es una decisión deliberada
y está razonada en el código: *«un ancho de cero no es un ancho estrecho, es
‹aquí no hay maquetado›»*. Lo normal es que se corrija sola en cuanto la caja
aparece, porque ahí el `ResizeObserver` entrega su medida — **pero eso no hemos
podido medirlo**: el navegador de nuestra sesión no ejecuta el ciclo de pintado
y el observador no se dispara ni una vez. Así que lo decimos en vez de
afirmarlo: si montan la matriz dentro de algo que arranca cerrado y al abrirlo
la ven en rejilla en un teléfono, **ese es el caso** y queremos saberlo.
