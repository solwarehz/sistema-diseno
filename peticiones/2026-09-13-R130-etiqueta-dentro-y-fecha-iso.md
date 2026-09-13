# R130 · RangoFecha: la etiqueta va dentro del recuadro y la fecha sale en ISO

**Para:** equipo del sistema de diseño
**De:** Control Administrativos V2.0 — módulo de Marcaciones
**Fecha:** 2026-09-13 · **Comprobado contra:** v1.107.0 · **Prioridad:** media

*(Documento recibido por el chat y guardado aquí. Los tres puntos se atendieron
en la v1.108.0.)*

---

## R130.1 · La etiqueta está dentro del control, y en ningún otro campo lo está

`Campo.tsx` compone `.campo-grupo` > `.campo-etiqueta` + `.campo`: el rótulo
**fuera** del recuadro. `RangoFecha.tsx:329` compone `<button class="campo
fc-campo">` con `.cg-et` y `.cg-in` **dentro**. `.cg-et` y `.campo-etiqueta`
comparten regla, así que se pinta como una etiqueta del sistema — colocada donde
ninguna otra va. Se ve en cuanto hay dos campos juntos en la misma fila.

**Atendido.** El rótulo sale a su `.cg`, como en cualquier otro campo. Y la
hoja **ya lo preveía**: `.fc-campos .cg{ width: 172px }` viajaba en el paquete
desde siempre y ningún producto podía activarla.

## R130.2 · La fecha se muestra en ISO, contra su propia regla

`RangoFecha.tsx:330` imprime el valor tal cual, así que en pantalla sale
`2026-09-01`. La tabla «Formato» del catálogo dice: se muestra `31/03/2026`, se
guarda `2026-03-31`.

**Atendido.** El componente formatea al pintar. El contrato de la propiedad
sigue siendo ISO.

## R130.3 · RangoFecha publica un resumen que no se puede apagar

Pinta siempre `<p class="fc-resumen" role="status">`; sin rango dice «Sin rango
elegido.», una tercera frase para lo mismo. No hay propiedad para apagarlo, y
esconderlo con CSS silenciaría la región viva.

**Atendido, y sin propiedad.** Sin rango el texto queda **vacío**; el elemento
se queda en el árbol. Ninguna de las dos salidas propuestas vale tal cual: una
propiedad dejaría el componente sin anunciar lo que acaba de pasar, y **no
pintar nada rompería el anuncio de la primera elección** —una región viva creada
en el momento no la anuncian la mayoría de lectores—.
