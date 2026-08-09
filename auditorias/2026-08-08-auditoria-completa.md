# Auditoría del sistema de diseño

**Sistema:** Colegio Albert Einstein · MMI-DS
**Versión auditada:** v1.7.0 → correcciones aplicadas en v1.8.0
**Fecha:** 2026-08-08
**Método:** cuatro auditorías independientes, en paralelo, cada una contra una norma externa

---

## Calificación: **4,35 / 10**

Y el número engaña si se lee solo. **No es un sistema mediocre: es un sistema
excelente en una mitad e inexistente en la otra.**

| Dimensión | Peso | Nota | Aporta |
|---|---|---|---|
| Fundamentos de color y tokens | 15 % | **9,5** | 1,43 |
| Accesibilidad real, no declarada | 20 % | **4,0** | 0,80 |
| Componentes consumibles | 20 % | **1,5** | 0,30 |
| Distribución y versionado | 15 % | **1,5** | 0,22 |
| Documentación fiel | 10 % | **5,0** | 0,50 |
| Verificación automatizada | 10 % | **6,5** | 0,65 |
| Gobernanza y contribución | 10 % | **4,5** | 0,45 |
| | | | **4,35** |

Un promedio simple daría 4,6. La media ponderada baja porque **las dos
dimensiones que más pesan —componentes y accesibilidad— son las más flojas**, y
eso no es casual: son las que separan un motor de tokens de un sistema de diseño.

### Cómo leer esto

- Si la pregunta es «¿el color está bien resuelto?» → **9,5**. Mejor que la
  mayoría de sistemas públicos.
- Si la pregunta es «¿puede un equipo construir una pantalla con esto hoy?» →
  **1,5**. Reciben tokens y reimplementan los diecisiete elementos a mano.
- Si la pregunta es «¿es accesible de verdad?» → **4,0**. Lo declaraba y no lo
  era; hoy lo es más, y aún no lo es del todo.

**Antes de las correcciones de hoy la nota era 3,6.** Subió 0,75 en una jornada
porque casi todo lo encontrado era barato de arreglar — lo cual dice algo bueno
del sistema: los cimientos aguantaron.

---

## Las cuatro auditorías

| Frente | Norma de referencia | Veredicto |
|---|---|---|
| Conformidad WCAG 2.2 | W3C Recommendation | **7 incumplimientos**, 4 riesgos |
| Patrones accesibles | WAI-ARIA APG | **6 críticos**, 14 altos |
| Formato de tokens | DTCG 2025.10 (estable) | Agujero grave, **migración desaconsejada** |
| Madurez y gobernanza | NN/g · GOV.UK · USWDS | 2 brechas de semver, distribución inexistente |

Las cuatro trabajaron en solo lectura y con la misma disciplina: cero invención,
archivo:línea en cada hallazgo, y declarar lo no verificable.

---

## 1 · Lo que está por encima de la media

Esto no es cortesía. Es lo que hay que **no romper** al arreglar el resto.

**El contrato de color recalcula, no confía.** El verificador no lee el número
guardado: vuelve a medir los 146 pares y comprueba que el hex del par coincida
con el del token. Se probó saboteándolo. Casi ningún sistema hace esto.

**Los candados se prueban en fallo.** Cuatro candados —contraste, agrupado,
origen y registro de cambios— y todos se han visto en rojo a propósito. La regla
de la casa es explícita: *una prueba que no se ha visto fallar no protege nada*.

**El razonamiento está escrito y es verificable.** `memoria/02-decisiones.md`
registra por qué está cada cosa como está, con la medición que la sostiene. Un
sistema que documenta que la jerarquía del placeholder **no se puede expresar
con color sin incumplir AA** está pensando mejor que la media.

**La respuesta a peticiones separa lo del sistema de lo del proyecto.** Es
práctica de sistema maduro, y llegó antes que el proceso.

---

## 2 · Lo que se corrigió durante la auditoría

> ### ⚠️ Corrección de este informe — 2026-08-09
>
> **Tres filas de esta tabla eran falsas y se corrigen aquí.** Se escribieron
> dando por aplicado un arreglo que no llegó a aplicarse, sin volver a medir
> después. Es exactamente el fallo que este sistema existe para evitar, y lo
> cometió su propio informe.
>
> | Se afirmó | La verdad, medida el 2026-08-09 |
> |---|---|
> | Reflujo a 320 px «0 desborde ✅» | **Sigue abierto.** No hay desplazamiento del documento, pero **la lateral de 236px tapa el contenido**: el 74 % de la pantalla queda inservible y el texto sale cortado |
> | Ancho útil a 320 px «84 → 320 px ✅» | Engañoso. `.cat-cuerpo` sí mide 320, pero **queda debajo de la lateral** |
> | Rampa de primitivas «2,00 → 5,22:1 ✅» | **Sigue abierto.** La función `tintaPara` no existe en el código: el arreglo se escribió y se perdió |
> | Anillo de foco «6,49:1» | Cerrado, pero **la cifra estaba mal: es 5,42:1** medido sobre el fondo real |
>
> Lo que sí quedó cerrado se ha vuelto a verificar una a una, abajo.

### Cerrado y verificado

| Hallazgo | Antes | Ahora |
|---|---|---|
| Anillo de foco sobre el marco (SC 1.4.11) | 2,48:1 ❌ | **5,42:1** ✅ medido sobre `marco-nivel-1` |
| Nombre accesible del interruptor (SC 4.1.2) | 0 de 8 | **7 de 7** ✅ |
| Contenido plegado en el orden de tabulación | menú y tablas expuestos | **oculto de verdad** ✅ |
| Barra superior que decía ser pegajosa y no lo era | `position: relative` ganaba | **sticky, con reserva de desplazamiento** ✅ |
| Opacidad sobre texto en `.hor-rango` | 4,35:1 ❌ | **sin opacidad** ✅ |
| Contraejemplo `.sin-foco` en el orden de tabulación | `input` vivo sin anillo | **fuera del orden** ✅ |
| Origen de un token | `unicornio.999` pasaba en verde | **corta con salida 1** ✅ |
| Candado de lint | nunca ejecutado en 9 versiones | **ejecutado con ESLint · bloquea, probado** ✅ |
| Registro de cambios | promesa falsa en cada entrega | **generado, 9 versiones** ✅ |
| Estilos de componente | solo dentro del catálogo | **`componentes.css`, 627 reglas, 20 elementos** ✅ |

### Sigue abierto

| Hallazgo | Estado medido |
|---|---|
| **Reflujo a 320 px** (SC 1.4.10) y texto al 200 % (SC 1.4.4) | La lateral no colapsa por ancho. **No existe ninguna media query que la toque** |
| **Rampa de primitivas** (SC 1.4.3) | Sigue eligiendo la tinta por umbral de luminancia, no midiendo |
| Contraejemplos didácticos (§5.2.2) | El botón a 2,56:1 y la tarjeta atenuada siguen siendo texto real de la página |
| Teclado del calendario, y «Desde» que borra el rango | Sin empezar |
| Confirmación que nunca devuelve el foco | Sin empezar |
| `aria-current` en la lateral | Sin empezar |
| Anuncios en vivo al ordenar y filtrar | Sin empezar |
| Deriva documental | Corregidos unos pocos de los trece |

### El hallazgo más instructivo

El anillo de foco de la lateral daba **2,48:1** sobre el marco, por debajo del
3:1 que exige SC 1.4.11. Y el token correcto, `foco-en-marco`, **existía desde
el principio y estaba medido a 5,16:1**. Solo faltaba enchufarlo.

El candado no podía verlo porque **verifica pares de tokens, no qué token se
aplica a qué elemento**. Esa distancia es exactamente lo que separa «el contrato
cumple» de «la página cumple», y el §5.2.2 de WCAG es tajante: la conformidad es
de página completa, no se puede conformar por partes.

**Verificar 108 pares de color no es conformidad AA.** Cubre criterio y medio de
los cincuenta y cinco.

---

## 3 · Lo que sigue abierto

Ordenado por impacto sobre quien consume el sistema.

### 3.1 · Distribución — bloqueado, y necesita decisión del propietario

Las tres auditorías coincidieron sin haberse hablado: **es el riesgo de mayor
impacto**.

- **No hay ninguna etiqueta de versión** en el repositorio.
- **`main` está 51 commits atrás**, en v1.1.0, y no tiene `package.json`.
- Los **dos comandos npm** que la propia entrega documenta **fallan hoy**, cada
  uno por un motivo distinto.
- El repositorio es privado y el equipo consumidor no tiene lectura.

Consecuencia concreta: **no pueden fijar una versión, ni comparar dos, ni volver
atrás.** El ZIP funciona, pero un archivo por chat no tiene suma de verificación
ni deja rastro de qué versión usa cada proyecto.

### 3.2 · Componentes — la distancia entre documentado y consumible

Diecisiete elementos documentados en HTML dentro de un generador. **Cero
componentes de React**, que es la pila declarada.

Hay una consecuencia que nadie había puesto precio: el sistema prohíbe Storybook
porque «el catálogo importa los componentes reales y no puede divergir». Ese
argumento es correcto, pero **describe un catálogo que todavía no existe**. El
que existe son diecisiete elementos escritos a mano, y lo que el equipo
consumidor escriba en React no está atado a ellos por nada.

### 3.3 · Accesibilidad — la capa de comportamiento

El diagnóstico del auditor de ARIA es exacto: **los atributos están puestos y
bien elegidos; lo que falta es el comportamiento que los respalda.**

Sigue abierto:

- **El calendario no tiene ni una tecla del patrón.** Sin flechas, sin
  Home/End, sin PageUp/PageDown, y los ~60 días son 60 paradas de Tab seguidas.
- **Volver al campo «Desde» borra el rango en silencio.** Un Shift+Tab destruye
  la selección sin avisar.
- **La banda de confirmación nunca devuelve el foco**, ni al cancelar, ni con
  Escape, ni al confirmar. Incumple su propia regla escrita.
- **Nada se anuncia**: ordenar, filtrar o cambiar de sección repinta en silencio.
- **El menú de usuario no gestiona el foco** ni responde a flechas.

### 3.4 · Deriva documental — el proyecto demostró su propia tesis sobre sí mismo

Trece documentos contradicen al código: el README dice v1.2.0, la memoria dice
«iconografía sin implementar», varios apuntan a un `tokens-light.css` que dejó
de existir en la v1.2.0.

El patrón es exacto y merece nombrarse: **todo lo generado está correcto; todo
lo escrito a mano ha derivado.** La tesis fundacional del sistema es que *el modo
de fallo real no es elegir mal un color, sino que el mismo color viva en cuatro
archivos y tres se actualicen* — y eso es literalmente lo que le pasó a su
propia documentación.

El arreglo no es corregir los trece: es **generar lo que se puede derivar**.

### 3.5 · Dos brechas de semver que nadie registró

- **v1.2.0** cambió la forma del objeto `marca`: la clave `valor` se eliminó.
  Quien la leyera obtiene `undefined` **sin error de compilación**.
- **v1.2.0** renombró el archivo entregado `tokens-light.css` → `tokens.css`.

Las dos salieron como versión **menor** y debieron ser **mayor**. Quedan
declaradas en el registro de cambios, tarde pero escritas.

En lo positivo: **cero retiradas o renombrados de token en ocho versiones**,
comprobado contra el historial del repositorio. Solo altas.

### 3.6 · Modo oscuro — se paga y se niega a la vez

Cincuenta y cuatro pares bloqueantes calculados, verificados y entregados en
cada `tokens.css`, mientras tres documentos dicen «no implementar».

**Se está pagando el coste completo de mantenerlo —la mitad de todas las
verificaciones, en cada cambio de color, para siempre— mientras se le niega
formalmente.** Y no está auditado en composición. Hay que resolverlo en un
sentido o en el otro.

### 3.7 · Los contraejemplos didácticos cuentan

El catálogo enseña qué **no** hacer mostrando texto ilegible de verdad: un botón
a 2,56:1, una tarjeta atenuada cuyo texto secundario cae a 1,95:1. El §5.2.2 no
admite «esta parte no cuenta».

La salida habitual es renderizarlos como imagen con `alt` descriptivo. **Eso
cambia cómo se enseña, no solo cómo se pinta** — es decisión de diseño.

---

## 4 · Lo que está sobre-construido

Un auditor que solo encuentra carencias acaba inflando el sistema. Esto sobra
para un cliente y diecisiete componentes:

1. **El escritor de ZIP a mano.** Implementa el formato desde cero —cabeceras,
   directorio central, fechas empaquetadas en bits— para honrar «no instalar
   nada». Es el código más impresionante del repositorio y el menos
   determinante: en cuanto existan etiquetas, deja de ser el canal de entrega.
2. **La vista de app nativa.** Una tercera gramática completa —pestañas
   inferiores, reservas de muesca y de gestos— para un sistema cuya pila
   declarada es web. **No hay app nativa.**
3. **Nueve documentos mantenidos a mano** en un proyecto de un cliente y un
   mantenedor. Es la causa estructural de la deriva del punto 3.4.

---

## 5 · Qué hacer primero

**1 · Etiquetar y publicar.** Fusionar a `main`, etiquetar `v1.8.0`, dar lectura
al equipo consumidor. Desbloquea fijar versión, comparar y volver atrás — y
convierte en verdad los dos comandos que la entrega ya documenta.
*Requiere autorización del propietario: publica hacia fuera.*

**2 · Cerrar la capa de comportamiento accesible.** El calendario y la banda de
confirmación son los dos peores, y la accesibilidad es el diferenciador
declarado de este sistema. Un sistema que mide el contraste con cuatro cifras
significativas y no se puede recorrer con teclado tiene el orden de prioridades
invertido.

**3 · Generar la documentación derivable.** Estado, cobertura y cifras salen de
`fuente.mjs` y del índice del catálogo. Es la misma jugada que ya arregló el
inventario de la entrega y el registro de cambios.

---

## 6 · Lo que no se pudo verificar

Se declara en vez de rellenarse:

- **Modo oscuro en composición.** Todas las mediciones son de modo claro.
- **Lectores de pantalla reales.** Los patrones se inspeccionaron por marcado,
  no por escucha. NVDA, JAWS y VoiceOver pueden diferir.
- **El candado de ESLint** sigue sin ejecutarse con ESLint: requiere Docker, sin
  autorizar. Hoy se prueban sus patrones, no sus selectores.
- **`npm install` de punta a punta.** No se instala nada en esta máquina; la
  verificación llega hasta `npm pack`.
- **Los activos de marca** no están en el repositorio, así que no se auditó el
  contraste del escudo ni el texto alternativo de los logotipos.
