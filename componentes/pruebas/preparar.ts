import '@testing-library/jest-dom/vitest';

/**
 * SUPLENCIA · `Blob.arrayBuffer()`
 *
 * jsdom no lo trae, y sin él no se puede leer un archivo: `CargaPdf` mira los
 * primeros bytes para saber si de verdad es un PDF, y ahí se quedaba. Se
 * suple con el `FileReader` que jsdom SÍ tiene, así que no se está fingiendo
 * el comportamiento —se está usando el camino largo del mismo navegador.
 *
 * Es una carencia del entorno de prueba, no del componente: en cualquier
 * navegador de los últimos seis años `arrayBuffer()` existe.
 */
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function leer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolver, rechazar) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result as ArrayBuffer);
      lector.onerror = () => rechazar(lector.error);
      lector.readAsArrayBuffer(this);
    });
  };
}
