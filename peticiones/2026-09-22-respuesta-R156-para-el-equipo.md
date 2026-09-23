# Respuesta a R156 — la fila de totales · para Control Administrativos V2.0

**22 de septiembre de 2026** · entró en MMI-DS **v1.132.0**

```bash
npm install "github:solwarehz/sistema-diseno#v1.133.0"
```

**Entra, y entra donde ustedes dijeron.** La frase de su dueño vale como regla y
queda escrita como tal en el contrato del componente:

> *«colocarlo dentro de la tabla pero no como una fila de la tabla es romper el
> componente tabla»*

Lo que más peso le dio no fue la pantalla: fue la tabla que añadieron después —
historial de contratos, los tres reportes de asistencia y pagos la necesitan
igual. Una pieza que sirve a cinco pantallas de tres módulos no es un caso
particular; es un hueco del sistema.

---

## 1 · Qué entra

Una prop en `TablaDatos`:

```ts
totales?: Partial<Record<string, React.ReactNode>>;
```

La clave es la **clave de la columna**. Se pinta un `<tfoot className="tb-totales">`.

```tsx
import { TablaDatos } from 'sistema-diseno-ae/componentes';
import 'sistema-diseno-ae/tokens.css';        // SIEMPRE primero
import 'sistema-diseno-ae/componentes.css';

<TablaDatos<Contrato>
  titulo="Contratos"
  claveFila={(f) => f.id}
  columnas={COLUMNAS}
  filas={filas}
  totales={{ horas: '186:20', tardanzas: 12, laborado: '1 a 6 m 12 d' }}
/>
```

`titulo` y `claveFila` no son del R156 —`TablaDatos` ya las exigía—, pero aquí
iban sin ellas y el bloque **no compilaba**: `TS2741, Property 'claveFila' is
missing`. Lo cazó una auditoría antes de mandarles esto.

---

## 2 · Las cinco decisiones, y por qué cada una

**`tfoot`, no una fila más.** Es la decisión de la que sale todo lo demás. El
navegador ya sabe qué es un pie de tabla; los lectores de pantalla también.

**No entra en el orden, ni en los filtros, ni en la paginación.** Y no como
excepción escrita a mano, sino porque **`tfoot` no está donde esas tres se
aplican**. Con tres páginas de diez filas, la fila del pie es la misma en las
tres. Eso es lo correcto: un total de 186 horas no se parte en tres tercios
porque la tabla esté paginada.

**Lo que no se declare se pinta vacío**, y si ninguna columna visible tiene
total, **la fila no se pinta**. Una tabla con un pie en blanco es peor que una
sin pie.

**Se alinea con todas las columnas, incluida la del índice.** Si el pie empieza
en la segunda columna, la fila entera sale desplazada medio cuadro y lo que
parece un total de una columna es el de la de al lado.

**Si una columna está congelada (`anclarColumnas`), su celda del pie se congela
con ella** — y con **el fondo del pie**, no con el de `.tb-ancla`. Heredar el de
la columna anclada pintaba una celda blanca en mitad de una fila gris, y solo se
veía al desplazar.

---

## 3 · Lo que no hace, a propósito

**No suma.** El total lo aporta la pantalla, porque **quien sabe qué suma es
quien tiene los datos**. Su propio ejemplo lo demuestra mejor que cualquier
argumento nuestro: un «1 a 6 m 12 d» de tiempo laborado **no es la suma de una
columna** — es una cuenta de calendario. Un componente que sumara tendría que
saber de meses de 28 días, de horas en base 60 y de monedas, y se equivocaría en
las tres.

---

## 4 · Cómo se quita el bloque de abajo

Ustedes lo dejaron previsto: *«El total vive en un bloque debajo de la tabla…
En cuanto exista `totales`, se mete ahí y ese bloque desaparece»*. Eso es
exactamente lo que hay que hacer. Nada más cambia: ni las columnas, ni el orden,
ni la paginación.

(Aquí decía «es un cambio de tres líneas». Era una cifra que nos inventamos
sobre código que no hemos visto, y la quitamos.)

---

## 5 · Verificación

- Reglas en `sistema/componentes/comportamiento.md` → **TablaDatos, regla 37**.
- Pruebas en `componentes/pruebas/tabla-totales.test.tsx` — diez, todas
  etiquetadas `[37]`, y verificadas por mutación: se rompió la regla a propósito
  y se vieron en rojo antes de darlas por buenas.
- Los 22 pasos del publicador en verde.
