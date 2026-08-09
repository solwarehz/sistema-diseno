# Política de creación de componentes

**Ámbito:** todo componente nuevo que se cree a petición de un proyecto.
**Naturaleza:** vinculante. Un componente que no la cumpla no entra en la entrega.

---

## Las cuatro reglas

1. **Se usan los componentes ya creados.**
2. **Se usan los colores autorizados.**
3. **Si falta un componente, se crea.**
4. **Con el conjunto se crean componentes nuevos.**

El orden importa: es el orden en que se aplican.

---

## 1 · Se usan los componentes ya creados

Antes de escribir una línea, se mira qué existe. Un componente nuevo se arma
**importando** los que ya hay, no reproduciendo su interior.

```tsx
// NO
<button className="btn btn-1" onClick={confirmar}>Guardar</button>

// SÍ
<Boton variante="principal" onClick={confirmar}>Guardar</Boton>
```

**Por qué.** Un elemento reconstruido a ojo pierde justo lo que no se ve: el
anillo de foco, el filete que acompaña al color, la altura de fila que es blanco
táctil, el `aria-*` que lo hace anunciable. Y el día que el botón cambie, el
botón de dentro de la tabla no cambiará con él: pasa a ser otro botón que se le
parece.

Esto ya ocurrió y está medido: Control Administrativos V2.0 escribió **3.983
líneas para consumir 1.464**. La diferencia no era trabajo, era reconstrucción.

**Cómo se comprueba.** Un componente que no importa ninguno de los existentes
teniendo botones, campos o chips dentro es sospechoso por definición. Se revisa
antes de aceptarlo.

---

## 2 · Se usan los colores autorizados

Ningún color se escribe a mano. Nunca. Ni hexadecimal, ni `rgb()`, ni `hsl()`,
ni valor arbitrario de Tailwind.

| Para pintar | Se usa |
|---|---|
| Cualquier cosa dentro de un componente | el **token semántico**: `var(--accion)`, `var(--texto-principal)` |
| Una muestra de color en el catálogo | la **clase del escalón**: `.color-azul_600` |
| Una sombra | `var(--sombra-capa)` · `var(--sombra-aviso)` |

Las **primitivas están prohibidas dentro de un componente** (§2.5.1). Existen
para que los semánticos elijan: una primitiva no sabe sobre qué fondo la vas a
poner, así que nadie puede garantizar que se lea. El token semántico sí está
medido contra un fondo concreto y el candado de contraste lo protege.

**Autorizado ≠ conocido.** El sistema *nombra* colores que **no** puedes usar
—los seis de `marca`— precisamente para poder bloquearlos: lo que no tiene
nombre no se puede vigilar. Estar en el inventario no es permiso.

**Ampliar la lista de autorizados es decisión del usuario, no del agente.**
`autorizados.lock.json` la congela y `generar.mjs` detiene la generación si
aparece un escalón nuevo. Si el color hace falta pero no se usa, va a
`categoricas.marca`, que sí puede crecer sin permiso porque no otorga ninguno.

**Cómo se comprueba.** `node sistema/candado/verificar-color.mjs` recorre el
repositorio entero. Falla el build.

---

## 3 · Si falta un componente, se crea

Cuando el requerimiento no puede expresarse con lo existente, se crea. No se
fuerza un componente a hacer algo que no es suyo, y **no se resuelve con CSS
suelto en el proyecto que lo pidió**: eso deja el sistema sin enterarse y al
siguiente proyecto reconstruyéndolo.

Un componente nuevo no está terminado hasta que:

- **Vive en el catálogo**, en `sistema/cascaron/generar-cascaron.mjs`. El
  catálogo importa lo real, así que no puede divergir.
- **Está registrado en `extraer.mjs`**, en `ELEMENTOS`. Lo que no esté ahí no
  viaja en la entrega, y el extractor grita si aparece un prefijo sin clasificar.
- **Tiene contrato de comportamiento** en `comportamiento.md`, con cada regla
  marcada como «obligatorio del sistema» o «del proyecto».
- **Tiene pruebas** en `componentes/pruebas/`.
- **Sube versión** y deja entrada en `CAMBIOS` (§2.5 regla 8).

**Antes de crear, se decide si es del sistema o del proyecto.** No todo
requerimiento entra: si algo solo tiene sentido en una aplicación, es de esa
aplicación. Un sistema que dice que sí a todo deja de ser un sistema.

---

## 4 · Con el conjunto se crean componentes nuevos

La consecuencia de las tres anteriores: cada componente que entra **amplía el
vocabulario** con el que se arma el siguiente.

```
Boton + Campo + Chip        →  fila de filtros
fila de filtros + Tabla     →  TablaDatos
TablaDatos + Paginacion     →  listado completo
```

Un componente nuevo casi nunca es un dibujo nuevo: es una **composición** de lo
que ya hay más la pieza pequeña que faltaba. Si al crear algo estás escribiendo
mucho estilo, casi seguro estás reconstruyendo en vez de componer — vuelve a la
regla 1.

---

## Definición de terminado

Un componente nuevo está hecho cuando:

- [ ] Importa los componentes existentes en vez de reproducirlos
- [ ] No escribe ni un color a mano · `verificar-color.mjs` en verde
- [ ] Está en el catálogo y en `ELEMENTOS` de `extraer.mjs`
- [ ] Tiene contrato de comportamiento y pruebas
- [ ] Sube versión y deja entrada en `CAMBIOS`
- [ ] Los cinco candados pasan

Y lo que no se pudo verificar **se declara**. Cero invención.
