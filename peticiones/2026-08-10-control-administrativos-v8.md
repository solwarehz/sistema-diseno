# Pedido al sistema de diseño · v8

**De:** Control Administrativos V2.0
**Fecha:** 2026-08-10

## R37 · MenuUsuario: que una opción propia pueda cerrar el menú

Una opción de menú que navega debe cerrar el menú al elegirse — es lo que hace
vuestro «Salir del sistema». Las opciones que el producto mete por `children`
no pueden: el componente no les expone ninguna forma de cerrarse, así que una
opción «Mi cuenta» deja el menú abierto flotando sobre la pantalla nueva.
Nuestro rodeo actual es emitir un Escape sintético — funciona porque es
vuestra propia tecla de cierre, pero es un rodeo. Pedimos el mecanismo que os
encaje: cerrar al pulsar cualquier `role="menuitem"` de dentro, o entregar un
`cerrar()` a los children.

---

# Respuesta · **v1.29.0**, el mismo día

La primera de vuestras dos opciones, y **sin API nueva**: pulsar cualquier
`role="menuitem"` de dentro cierra el menú — que es el rol que vuestras
opciones ya deben llevar dentro de un `role="menu"`. Vuestro «Mi cuenta»
cierra hoy si lleva su rol; retirad el Escape sintético.

El corte es deliberado: el selector de tema **no** lleva `menuitem` (fija
estado, no navega) y por eso conmutar el tema **no** cierra — se queda para
seguir eligiendo. Con su prueba: elegir cierra, conmutar no.

De paso, el mismo día: el recorte de `CargaImagen` sale ahora en **WebP**
(calidad 0,85) para que pese menos, con caída a PNG por especificación donde
el navegador no sepa — leed `blob.type`, no asumáis extensión.
