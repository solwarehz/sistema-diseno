# R128 · Corregir el reloj no arregla lo ya guardado: falta la acción de rescate

**Para:** producto / equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-11
**Prioridad:** alta. Son 172 marcaciones reales que hoy no cuentan, y suben cada día.
**Recibido por el chat el 2026-09-11 y guardado aquí** porque el archivo no llegó a
esta carpeta. Texto íntegro del remitente.

---

## El problema, en una frase

Se pidió a sistemas del colegio que corrigiera el enrolamiento de los DNI mal
tecleados en el reloj. Eso arregla lo que venga desde ahora y no toca ni una de las
que ya están guardadas — que son la mayoría, y las que hacen falta para medir los
meses que ya pasaron.

## Medido en devgestion el 2026-09-11

| Documento tecleado | Marcas | Última | A quién corresponde |
|---|---|---|---|
| 724552996 | 89 | 2026-09-10 13:51 | 72455296 — LEÓN TUYA, Mayori Elizabeth |
| 744935888 | 69 | 2026-09-10 14:00 | 74493588 — MANRIQUE PARIAMACHI, Tony |
| 962167926 | 14 | 2026-08-14 14:27 | sin candidato en el padrón |

**172 marcaciones retenidas**, y 158 de ellas son de dos personas a las que solo les
sobra un dígito.

> **Y siguen llegando:** el 4 de septiembre eran 78 y 60; hoy son 89 y 69. Veinte
> marcas más en seis días. El enrolamiento no se ha tocado todavía.

## Lo que ya existe, y lo que falta

El servidor sabe resolverlo. `POST /marcaciones/por-revisar/identidad` ata un código
del reloj a una persona y rederiva todo su historial de una vez: una sola decisión
devuelve las 89 marcas de esa profesora, no una a una. Está construido, probado y con
su privilegio repartido (`marcaciones.retenidas.escribir`).

La pantalla no lo ofrece. La maqueta aprobada de «Por revisar» dice, con todas las
letras: «Esta pantalla solo lista. Se repara en Trabajadores, en Contratos o en el
reloj». Se construyó así, fielmente. Pero el caso real no encaja con ninguna de esas
tres: no es un trabajador que falte —está en el padrón—, ni un contrato, ni algo que
el reloj pueda arreglar hacia atrás.

## Qué se pide decidir

**¿Se añade a «Por revisar» la acción de atar un documento a una persona?**

Recomendación del remitente: sí, y con esta forma.

1. En una fila con problema «Documento imposible» o «Parecido a otro», una acción por
   fila: **«Es de…»**.
2. Abre un cuadro con el documento tal como llegó, un selector con búsqueda del
   padrón, y **el número de marcaciones que se van a rescatar** — que es la cifra que
   hace entender la decisión: «se atribuirán 89 marcaciones a LEÓN TUYA, Mayori
   Elizabeth».
3. Un **motivo**, corto y obligatorio.
4. Y la opción de declarar **«no es de nadie»**, que también es una respuesta:
   convierte un hueco en una decisión tomada y evita que esa fila reaparezca cada
   semana. Es el caso del tercer documento de la tabla.

Todo con piezas que ya existen: `Dialogo`, `SelectorBusqueda`, `Campo`, `Chip`.

## Por qué no vale esperar

Cada día que pasa son más marcaciones sin dueño de las mismas dos personas, y su
asistencia de agosto y septiembre no se puede medir hasta que alguien las ate. El
DS 004-2006-TR obliga a tener el registro completo; hoy hay dos personas con dos
meses en blanco por un dígito de más.

**Nota sobre el alcance.** Atar una identidad rederiva el historial de esa persona,
así que la acción queda bajo `marcaciones.retenidas.escribir` —que ya existe y hoy
solo tiene el superadministrador— y acotada por sede, como el resto de la pantalla.
