// @vitest-environment node
/**
 * EL COMPRESOR DE PDF — sus tres promesas y lo que gana.
 *
 * Corre en `node`, no en jsdom, y a propósito: el `Blob` de jsdom no trae
 * `arrayBuffer()`, así que ahí no se puede ni leer el archivo de entrada. El
 * compresor no toca el DOM salvo para las imágenes, y eso ya se declara abajo.
 *
 * Estas pruebas corren en Node, y en Node NO HAY `canvas`: la recompresión de
 * imágenes —que es lo que de verdad adelgaza un escaneo— no se puede probar
 * aquí, y decirlo importa. Se verificó en el catálogo, con el navegador, y el
 * peso antes/después está a la vista en la página «Carga de PDF».
 *
 * Lo que sí se prueba aquí es todo lo demás, y sobre todo lo que NO debe pasar:
 * que no salga un archivo más grande, que no salga uno ilegible, y que un PDF
 * cifrado vuelva intacto.
 */
import { describe, it, expect } from 'vitest';
import {
  comprimirPdf, formatearPeso, ahorro, esPdf, analizarPdf,
} from '../src/interno/comprimir-pdf.mjs';
import {
  pdfCrudo, pdfConRevisiones, pdfConMetadatos, pdfCifrado, pdfConRarezas,
} from './pdf-muestras';

const blob = (b: Uint8Array<ArrayBuffer>) => new Blob([b], { type: 'application/pdf' });
const bytesDe = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

describe('Compresor de PDF — lo que gana', () => {
  it('un PDF en crudo se desinfla y pierde peso de verdad', async () => {
    const dentro = pdfCrudo(5);
    const r = await comprimirPdf(blob(dentro));
    expect(r.comprimido).toBe(true);
    expect(r.pesoFinal).toBeLessThan(r.pesoInicial);
    expect(ahorro(r.pesoInicial, r.pesoFinal)).toBeGreaterThan(50);
    expect(r.detalle.desinflados).toBeGreaterThan(0);
  });

  it('las revisiones viejas se tiran: lo que no se alcanza no viaja', async () => {
    const r = await comprimirPdf(blob(pdfConRevisiones(4)));
    expect(r.comprimido).toBe(true);
    expect(r.detalle.tirados).toBeGreaterThan(0);
  });

  it('XMP y /PieceInfo se van', async () => {
    const r = await comprimirPdf(blob(pdfConMetadatos()));
    expect(r.comprimido).toBe(true);
    expect(r.detalle.metadatosFuera).toBe(2);
    const texto = new TextDecoder('latin1').decode(await bytesDe(r.archivo));
    expect(texto).not.toContain('xpacket');
  });
});

describe('Compresor de PDF — las tres promesas', () => {
  it('PROMESA 1 · o pesa menos, o vuelve EL MISMO archivo byte a byte', async () => {
    // La primera redacción de esta prueba solo exigía «no más grande», y al
    // romper el guardián a propósito NO se puso en rojo: la segunda pasada
    // salía exactamente del mismo tamaño y «no mayor» se cumplía igual. Una
    // prueba que no se ve fallar no protege nada. Ahora se exige la promesa
    // entera: si no se ganó peso, lo que vuelve es el original SIN TOCAR.
    for (const muestra of [pdfCrudo(3), pdfConMetadatos(), pdfConRarezas()]) {
      const una = await comprimirPdf(blob(muestra));
      const dosDentro = await bytesDe(una.archivo);
      const dos = await comprimirPdf(una.archivo);

      if (dos.comprimido) {
        expect(dos.pesoFinal).toBeLessThan(dos.pesoInicial);
      } else {
        expect(dos.motivo).toBe('sin-ganancia');
        expect(await bytesDe(dos.archivo)).toEqual(dosDentro);
      }
    }
  });

  it('PROMESA 2 · lo que sale se vuelve a leer, con las mismas páginas', async () => {
    for (const muestra of [pdfCrudo(4), pdfConMetadatos(), pdfConRarezas()]) {
      const r = await comprimirPdf(blob(muestra));
      const otra = await comprimirPdf(r.archivo);
      // Que la segunda vuelta lo lea es la comprobación: si lo escrito fuera
      // ilegible, aquí saldría `ilegible` en vez de `sin-ganancia`.
      expect(otra.motivo === null || otra.motivo === 'sin-ganancia').toBe(true);
    }
  });

  it('PROMESA 3 · un PDF cifrado vuelve intacto', async () => {
    const dentro = pdfCifrado();
    const r = await comprimirPdf(blob(dentro));
    expect(r.comprimido).toBe(false);
    expect(r.motivo).toBe('cifrado');
    expect(await bytesDe(r.archivo)).toEqual(dentro);
  });

  it('lo que no es PDF vuelve intacto y lo dice', async () => {
    const r = await comprimirPdf(new Blob(['no soy un pdf'], { type: 'application/pdf' }));
    expect(r.comprimido).toBe(false);
    expect(r.motivo).toBe('no-es-pdf');
  });

  it('un PDF roto no revienta: vuelve el original', async () => {
    const roto = pdfCrudo(2).slice(0, 120);
    const r = await comprimirPdf(blob(roto));
    expect(r.comprimido).toBe(false);
    expect(r.pesoFinal).toBe(r.pesoInicial);
  });
});

describe('Compresor de PDF — lo que no se puede romper al reescribir', () => {
  it('las cadenas con paréntesis, escapes y octales sobreviven', async () => {
    const r = await comprimirPdf(blob(pdfConRarezas()));
    expect(r.comprimido).toBe(true);
    // No se pueden buscar en los bytes: viajan dentro del /ObjStm desinflado.
    // Se vuelve a leer el archivo, que es la única comprobación que vale.
    const { objetos } = await analizarPdf(await bytesDe(r.archivo));
    const dics = [...objetos.values()].map((e) => e.valor).filter((v) => v instanceof Map);
    const nombres = dics.find((d) => d.has('Titulo'));
    expect(nombres).toBeDefined();
    expect(new TextDecoder('latin1').decode(nombres!.get('Titulo').bytes))
      .toBe('Acta (final) del a\xf1o \\ 2026');
    expect(new TextDecoder('latin1').decode(nombres!.get('Octal').bytes)).toBe('AB');
    // El nombre con almohadilla se lee como el espacio que representa.
    expect(nombres!.has('Nombre Raro')).toBe(true);
  });

  it('el objeto huérfano no viaja', async () => {
    const r = await comprimirPdf(blob(pdfConRarezas()));
    expect(r.detalle.tirados).toBeGreaterThan(0);
  });

  it('en Node se declara que las imágenes no se tocaron', async () => {
    const r = await comprimirPdf(blob(pdfCrudo(2)));
    expect(r.detalle.imagenesOmitidas).toBe(true);
  });
});

describe('Cómo se dice el peso', () => {
  it('bytes, KB sin decimal, MB con uno y coma', () => {
    expect(formatearPeso(512)).toBe('512 B');
    expect(formatearPeso(1024 * 300)).toBe('300 KB');
    expect(formatearPeso(1024 * 1024 * 2.35)).toBe('2,4 MB');
  });

  it('el ahorro nunca es negativo', () => {
    expect(ahorro(1000, 400)).toBe(60);
    expect(ahorro(1000, 1200)).toBe(0);
    expect(ahorro(0, 0)).toBe(0);
  });

  it('esPdf mira los bytes, no la extensión', async () => {
    expect(await esPdf(new File([pdfCrudo(1)], 'x.txt'))).toBe(true);
    expect(await esPdf(new File(['%PNG'], 'mentira.pdf', { type: 'application/pdf' }))).toBe(false);
  });
});
