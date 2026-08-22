# Respuesta a Control Administrativos V2.0 — R93 · la v1.67.0 habría apagado el candado en silencio

**Fecha:** 21 de agosto de 2026 · **Resuelto en:** **v1.68.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.68.0"`

---

## Tienen razón, y este es el peor de los tres

Y no por el daño —lo evitaron ustedes— sino por **cómo se habría descubierto**:
no se habría descubierto. Un candado apagado no falla: pasa.

Confirmado midiendo la exportación de la v1.67.0:

```
[0] mmi-ds/candado-ts    rules: undefined
[1] mmi-ds/candado       rules: no-restricted-syntax
```

`candado[0].rules` en `undefined`. Su proyecto copiaba los cuatro campos de
`candado[0]` **por una razón razonable en su momento**, y la actualización le
habría dejado sin ninguna regla activa, en verde. ESLint no protesta ante un
bloque sin reglas: sencillamente no comprueba nada.

> *«Lo vi porque fui a mirar la forma de la exportación antes de confiar en
> ella, no porque nada fallara.»*

Esa frase es el reporte entero. Lo demás es consecuencia.

---

## Dos arreglos, y el segundo es el que importa

### 1 · El bloque de reglas vuelve a ser `candado[0]`

El analizador pasa detrás. Para ESLint el orden da igual —los bloques se
fusionan por archivo y solo uno declara `parser`—, y delante le quitaba el sitio
al que lleva las reglas.

```
[0] mmi-ds/candado       rules: no-restricted-syntax
[1] mmi-ds/candado-ts    rules: undefined
```

**Lo recomendado sigue siendo esparcir** —`...candado`— y así lo dice la
documentación. Pero un paquete **no puede repartir la culpa**: si se puede
desarmar, alguien lo desarmará, y romperle el suelo en una versión menor es
fallo nuestro, no suyo.

### 2 · Nace el candado de la forma

Su frase es la que lo define, y va escrita en su cabecera:

> *«Cambiar la forma de lo exportado rompe a quien lo desarma, y el
> `verificar-entrega` nuevo comprueba que todo salga, no que la forma se
> mantenga.»*

`verificar-forma.mjs` —el decimotercero— fija en un lock lo que un consumidor
puede desarmar: cuántos bloques tiene el candado de ESLint, **cuál lleva las
reglas**, y las rutas publicadas en `exports`. Cambiar cualquiera de esas cosas
exige sellar el lock a propósito, y entonces el cambio **aparece en el diff** y
toca decidir si va en `rompe` del registro.

Una decisión de diseño que puede interesarles: **el bloque del analizador no
cuenta como forma**, porque es condicional a que ustedes tengan
`typescript-eslint`. Si contara, el lock diría una cosa dentro de nuestro
contenedor y otra fuera — y un candado que depende de dónde se ejecute no vale.
Se comprueba aparte que, cuando exista, vaya **detrás**.

---

## Cómo se comprobó

- **Visto en rojo reintroduciendo el defecto exacto de la v1.67.0**, no uno
  parecido: el analizador delante, y el candado lo cazó.
- Su primera salida **mentía**: decía «presente, y detrás» con el analizador
  delante, porque el rótulo se calculaba antes de la comprobación. Corregido —
  un candado no puede mentir en su propio informe.
- Mismo veredicto **dentro y fuera** del contenedor, que era el punto de la
  decisión anterior.
- Trece candados en verde · 415 pruebas · los tres pasos de ESLint en verde.

---

## Su corrección, registrada

Tomamos nota de que **su proyecto no tenía el candado apagado**: su
`eslint.config.mjs` ya componía el analizador de TypeScript, y su cabecera
documentaba nuestro defecto con detalle —«no declara parser… 1410 falsos en este
proyecto»—. Lo que fallaba era **la invocación suelta**, que es justo la que
manda nuestro `ACTUALIZAR.md`.

Queda escrito así en nuestra memoria: **el defecto era de lo que documentamos**,
no de lo que ustedes habían montado. Y `app/contratos/page.tsx` fallaba por eso
mismo, no por su lint real.

---

## Y una observación nuestra sobre los tres reportes de hoy

Los tres son el mismo patrón, y ustedes lo nombraron antes que nosotros: **lo
que el sistema usa y no entrega, lo sufre quien lo instala**.

| | Qué usábamos y no entregábamos |
|---|---|
| v1.41.0 | El reset `box-sizing` |
| v1.67.0 | El analizador de TypeScript |
| **v1.68.0** | La forma estable de lo exportado |

Las tres las encontraron ustedes. Las dos primeras fallando; **esta, mirando
antes de confiar** — que es más difícil y más útil.
