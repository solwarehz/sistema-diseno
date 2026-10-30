# Plan de implementacion de mejoras de diseno e interfaz

**Fecha de planificacion:** 06 de octubre de 2026  
**Estado:** Planificado, pendiente de ejecucion  
**Alcance:** catalogo, documentacion visual, componentes publicados y cumplimiento de Web Interface Guidelines

Este plan junta dos lecturas hechas sobre el proyecto:

- La revision de direccion visual del sistema: como hacer que el catalogo y las demos se lean como un instrumento institucional propio, no como una plantilla.
- La revision contra Web Interface Guidelines: hallazgos tecnicos accionables sobre metadatos, tema, dialogo, imagenes, formularios y estado navegable.

No autoriza por si solo cambios de color, tipografia ni activos. Cualquier ejecucion debe respetar las reglas vigentes del repositorio: tokens autorizados, movil primero, composicion antes que reconstruccion, catalogo vivo y verificacion con herramienta.

---

## 1. Objetivo

Elevar la direccion visual y la calidad de interfaz del sistema sin romper sus principios existentes:

- Movil primero.
- Tokens autorizados como unica fuente de color.
- Catalogo vivo, no maqueta divergente.
- Componentes compuestos antes que reconstruidos.
- Accesibilidad y contraste verificados por herramienta.
- Sin incorporacion de colores, tipografias ni activos no autorizados.

El trabajo debe hacer que el sistema se perciba menos como un catalogo tecnico generico y mas como un instrumento institucional propio: sobrio, medido, operativo y especifico del Colegio Albert Einstein.

---

## 2. Hallazgos de partida

### 2.1 Direccion visual

El sistema ya tiene una identidad tecnica fuerte: contraste medido, candados, catalogo vivo, memoria de decisiones y componentes usados en producto real. La oportunidad principal no esta en redisenar componentes desde cero, sino en mejorar la presentacion, jerarquia y narrativa visual del catalogo.

Hallazgos principales:

- La portada del catalogo no expresa con suficiente fuerza la tesis del sistema: **lo que ves es lo que viaja**.
- Algunas demos, especialmente la landing, se acercan a patrones genericos de hero con navegacion, frase principal y metricas.
- La politica movil primero esta bien documentada, pero puede hacerse mas visible en cada componente.
- La separacion entre identidad institucional, interfaz administrativa y landing publica puede ser mas clara.
- La voz del catalogo puede compactarse: la memoria conserva el relato completo; el catalogo debe mostrar decision breve y evidencia.

### 2.2 Web Interface Guidelines

Se reviso el proyecto contra las reglas vigentes de Web Interface Guidelines. Hallazgos accionables:

- Falta `theme-color` en el catalogo.
- Falta `color-scheme` para acompanar modo claro y oscuro.
- Google Fonts se carga sin `preconnect`.
- Las fuentes criticas no estan precargadas.
- El estado de algunas demos se guarda en `localStorage`, pero no siempre es direccionable por URL.
- El dialogo no declara `overscroll-behavior: contain`.
- Algunas imagenes no declaran dimensiones explicitas.
- Campos base no fuerzan ni advierten sobre `name` y `autocomplete`.

---

## 3. Principios de implementacion

1. No cambiar colores sin autorizacion.
2. No cambiar tipografias.
3. No editar archivos generados a mano.
4. Mantener compatibilidad del paquete publicado salvo decision explicita.
5. Priorizar cambios de catalogo antes que cambios en componentes publicados.
6. Todo cambio visual debe verificarse a 360 px.
7. Las demos deben mostrar comportamiento real antes que explicacion.
8. La marca debe usarse como autoridad institucional, no como decoracion.

---

## 4. Fases de trabajo

### Fase 1. Correcciones tecnicas de interfaz

**Objetivo:** cerrar hallazgos de Web Interface Guidelines de bajo riesgo.

Acciones:

- Anadir `theme-color` al catalogo.
- Anadir `color-scheme` para modo claro y oscuro.
- Anadir `preconnect` para Google Fonts.
- Evaluar `preload` de fuentes criticas sin romper el caracter autocontenido del catalogo.
- Anadir `overscroll-behavior: contain` al dialogo.
- Revisar `outline: none` en el titulo enfocable del dialogo.
- Anadir dimensiones explicitas a imagenes donde el tamano sea conocido.
- Revisar estrategia de `name` y `autocomplete` en campos base.

Criterio recomendado:

- Para `name`: anadir advertencia en desarrollo cuando un campo de formulario se use sin `name`, antes que volverlo obligatorio de inmediato.
- Para `autocomplete`: usar `off` en busqueda y filtros, y valores especificos solo donde la intencion sea clara.

### Fase 2. Nueva portada del catalogo

**Objetivo:** convertir la portada en manifiesto operativo del sistema.

Nueva estructura propuesta:

```text
[Demo viva principal]
[Frase de tesis: lo que ves es lo que viaja]
[3 evidencias: se mide / se entrega / cabe en movil]
[Accesos principales: Componentes, Tokens, Manual, Cambios]
```

Recomendacion visual:

- Usar como escena inicial un caso operativo real, por ejemplo tablero o asistencia de 7:00 a. m.
- Evitar estadisticas decorativas.
- Mostrar la identidad del sistema mediante evidencia, no mediante ornamento.

### Fase 3. Reordenamiento de paginas de componente

**Objetivo:** hacer que cada pagina ayude a decidir y usar, no solo a leer documentacion.

Estructura estandar:

```text
[Titulo]
[Decision en una frase]
[Demo viva principal]
[Cuando usarlo]
[Cuando no usarlo]
[Estados]
[Accesibilidad]
[Codigo minimo]
[Reglas verificadas]
```

Componentes piloto:

1. `Boton`.
2. `Campo`.
3. `SelectorBusqueda`.
4. `TablaDatos`.
5. `Dialogo`.

Despues de validar el patron, extender al resto.

### Fase 4. Movil primero visible

**Objetivo:** convertir la politica movil en evidencia visual constante.

Acciones:

- Anadir en componentes criticos una comparacion de comportamiento estrecho y amplio.
- Mostrar primero el caso de 360 px.
- Explicar que gana el componente cuando hay mas espacio.
- Evitar rescates basados solo en `title`.

Patron:

```text
360 px
[demo estrecha real]

Con mas espacio
[demo ampliada]
```

### Fase 5. Separacion de mundos visuales

**Objetivo:** evitar que identidad, sistema administrativo y landing publica se mezclen visualmente.

Tres ambitos:

- **Identidad institucional:** escudo, marca, rojo y oro.
- **Interfaz administrativa:** marco, accion, estados, tablas, formularios.
- **Landing publica:** escala tipografica propia, composicion institucional, mensaje de admision.

Regla de uso:

- Rojo y oro deben aparecer poco.
- La interfaz no debe apoyarse en color de marca para comunicar estado.
- La landing puede usar marca; el sistema operativo debe usar tokens semanticos.

### Fase 6. Rediseno de demo landing

**Objetivo:** alejar la demo de landing del patron generico.

Direccion propuesta:

- Anclarla en Huaraz, ciencia escolar, disciplina y comunidad.
- Sustituir copy amplio por contenido concreto.
- Evitar hero con metricas si las cifras no son necesarias o verificables.
- Mantener IBM Plex Sans y tokens existentes.
- Usar rojo y oro con restriccion.

Wireframe:

```text
[Marca / navegacion minima]

[Mensaje institucional concreto]
[Admision / niveles / ubicacion]

[Composicion con escudo y contenido escolar]
[Acciones claras]
```

### Fase 7. Voz y microcopy

**Objetivo:** separar relato tecnico de guia de uso.

Criterios:

- La memoria conserva narrativa completa.
- El catalogo muestra decision breve y evidencia.
- El manual explica uso.
- El bloque de codigo muestra solo lo necesario para copiar.

Ejemplo:

```text
Memoria:
Media correccion se lee en verde igual que una entera.

Catalogo:
Medir una vez no basta: el nodo debe quedar observado.
```

### Fase 8. Estado navegable

**Objetivo:** mejorar URL y estado segun las guias sin convertir todo en parametros innecesarios.

Prioridades:

1. Pagina activa.
2. Modo claro u oscuro.
3. Vista movil o escritorio.
4. Estado de tabla demo cuando sea util compartirlo.

Criterio:

- Sincronizar solo estados que una persona necesite compartir, recargar o revisar despues.
- Mantener `localStorage` para preferencias personales no compartibles.

---

## 5. Orden recomendado de ejecucion

1. Corregir hallazgos tecnicos de bajo riesgo.
2. Regenerar y verificar catalogo.
3. Redisenar portada.
4. Aplicar nuevo patron a `Boton` y `Campo`.
5. Anadir patron movil primero a esos pilotos.
6. Redisenar demo landing.
7. Extender patron al resto de componentes.
8. Revisar estado navegable.
9. Ejecutar verificacion completa.

---

## 6. Verificacion

Antes de cerrar cualquier entrega:

- Regenerar cascaron.
- Verificar contraste.
- Verificar que no se agregaron colores no autorizados.
- Verificar que no se editaron archivos generados a mano.
- Medir a 360 px en navegador.
- Ejecutar pruebas si se tocaron componentes publicados.
- Confirmar que las imagenes no introducen CLS evitable.
- Confirmar que foco, teclado y lectura asistida siguen funcionando.
- Confirmar que el catalogo sigue mostrando componentes reales.

---

## 7. Riesgos y controles

| Riesgo | Control |
|---|---|
| Cambiar el caracter del sistema por exceso visual | Intervenir primero catalogo, no componentes |
| Introducir colores no autorizados | Usar solo tokens existentes |
| Romper CSS generado | Modificar fuentes y regenerar |
| Volver generica la landing | Anclar copy y layout en colegio, Huaraz y ciencia escolar |
| Hacer obligatorio `name` y romper consumidores | Empezar con advertencias en desarrollo |
| Sobresincronizar estado en URL | Solo sincronizar estados compartibles |
| Afectar movil | Medir a 360 px como criterio de cierre |

---

## 8. Decisiones pendientes

1. Confirmar si el primer ciclo toca solo catalogo o tambien componentes publicados.
2. Confirmar si la demo de landing puede reemplazar el lema actual.
3. Definir si `name` y `autocomplete` se resuelven con advertencias o con props obligatorias.
4. Definir si el estado de tabla demo debe ir a URL o permanecer como preferencia local.

---

## 9. Nota para el siguiente inicio de sesion

Antes de retomar trabajo de diseno o interfaz, leer este archivo junto con:

- [`00-INDICE.md`](00-INDICE.md)
- [`01-estado.md`](01-estado.md)
- [`02-decisiones.md`](02-decisiones.md)
- [`04-pendientes.md`](04-pendientes.md)

Este plan esta **planificado**, no ejecutado. Si se implementa, cada cambio debe pasar por el flujo normal del repositorio: modificar fuente, regenerar artefactos, verificar con herramientas y actualizar memoria si cambia el estado.
