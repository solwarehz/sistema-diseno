# Respuesta a R153 — la matriz en móvil · para Control Administrativos V2.0

**22 de septiembre de 2026** · entró en MMI-DS **v1.131.0**, y se corrigió dos
veces después

```bash
npm install "github:solwarehz/sistema-diseno#v1.133.0"
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

## 3 · Sobre su alternativa barata: `title` NO la habríamos aceptado

Pidieron, como plan B, *«un `title` en el `th` de la fila con su nombre
completo»*. Lo decimos porque es útil saberlo: **esa alternativa está registrada
en nuestra propia memoria como inservible.** `memoria/06-cobertura.md`, punto
C-08: *«no se ve en móvil ni con teclado»*.

Es más: nuestra política de móvil primero **mandaba `title` como rescate**, y
una auditoría lo cazó el 19/09/2026 — prescribía para el teléfono un remedio
registrado como inútil en el teléfono. La regla se reescribió: **primero no
recortar** —envolver, apilar, o dar una presentación estrecha—, y si hay que
recortar, el texto entero tiene que estar alcanzable **sin puntero**.

Su plan B habría cerrado el ticket y dejado el defecto.

---

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

## 6 · Verificación

- Medido en navegador a 360 px, que es lo que la política exige —«se ve bien» no
  es una medida—.
- Pruebas en `componentes/pruebas/privilegios-movil-primero.test.tsx`.
- Los 22 pasos del publicador en verde.
