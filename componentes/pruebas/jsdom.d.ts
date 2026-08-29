/**
 * `jsdom` no publica tipos y `@types/jsdom` sería una dependencia nueva para
 * dos importaciones de una sola prueba. Se declara aquí, que es lo que el
 * proyecto ya hace con todo lo que no vale la pena instalar.
 *
 * Queda como `any` a propósito y solo dentro de `pruebas/`: nada de lo que se
 * entrega lo toca.
 */
declare module 'jsdom';
