import { defineConfig } from 'vitest/config';

/**
 * LOS ARCHIVOS NO CORREN A LA VEZ, y no es una preferencia: es que si corren,
 * la suite falla a veces y no dice por qué.
 *
 * Dos archivos de prueba montan el catálogo ENTERO en jsdom y lo EJECUTAN
 * —`marco-catalogo` y `selector-desplegado-catalogo`—, porque la única forma de
 * comprobar que el catálogo no diverge de los componentes es correrlo. Cada
 * catálogo vivo cuesta **unos 150 MB** medidos (32 MB → 187 → 314 → 476 con
 * tres). Con los seis workers que levanta esta máquina y los dos archivos
 * coincidiendo, el contenedor se queda sin memoria y vitest responde:
 *
 *     Error: Worker exited unexpectedly
 *     Test Files  49 passed (50)
 *     Tests  857 passed (870)
 *
 * Es el peor resultado posible: **ningún fallo, ninguna prueba en rojo, y trece
 * pruebas que no se corrieron**. El archivo que falta no aparece por ninguna
 * parte del resumen. Quien lea «857 passed» da la entrega por verificada.
 *
 * Lo cazó `publicar.mjs`, que juzga por CÓDIGO DE SALIDA y no por el texto — la
 * corrección que le hizo una auditoría el 2026-09-11, y que aquí demostró para
 * qué servía. Serializado: 50 de 50 y **todas** las pruebas, en unos 80 s en
 * vez de 24. Se midió también `maxWorkers: 3` —cuatro corridas verdes en 32 s—
 * y con **4 muere**: el margen es de un obrero, y eso no se escribe en un
 * archivo que viaja a máquinas con otra memoria.
 *
 * Se paga el minuto. Una suite que a veces no corre no protege nada.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./pruebas/preparar.ts'],
    fileParallelism: false,
  },
});
