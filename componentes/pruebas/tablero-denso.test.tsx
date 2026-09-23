/**
 * R157 · LAS PIEZAS DE UNA REJILLA DENSA DE PERSONAS.
 *
 * Lo pidió el grupo «Tableros» para una pantalla que **no se consulta, se
 * vigila**: se deja abierta en un teléfono a las 7 de la mañana y dice quién
 * marcó y quién no.
 *
 * Entra porque **ninguna de las piezas es de su pantalla**: una cuadrícula
 * densa sirve a cualquier selector de iconos o paleta; un anillo de estado, a
 * «en línea», «pagado» o «activo»; una burbuja con tono, a cualquier contador;
 * y una superficie tonal, a cualquier bloque que pertenezca entero a un estado.
 *
 * Lo que NO entra con su vocabulario: pidieron `estado: 'presente' | 'ausente'`
 * y entra con los tonos del sistema. Un tipo que dijera `presente` obligaría al
 * siguiente producto a llamar «presente» a una factura cobrada.
 */
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { Avatar } from '../src/Avatar';

const css = readFileSync(
  join(__dirname, '..', '..', 'sistema', 'componentes', 'componentes.css'), 'utf8');

const regla = (sel: string) => {
  const re = new RegExp('(?:^|[}\\n;])\\s*'
    + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}', 'g');
  return (css.match(re) ?? []).join('\n');
};

describe('R157 · el anillo de estado del avatar', () => {
  it('[2] se pide con los tonos del SISTEMA, no con los del dominio', () => {
    const { container } = render(<Avatar id="a" nombre="QUISPE, Rosa" estado="exito" />);
    const av = container.querySelector('.avatar')!;
    expect(av.classList.contains('avatar-estado')).toBe(true);
    expect(av.classList.contains('avatar-exito')).toBe(true);
  });

  it('[2] los cuatro tonos existen y NO son el mismo color', () => {
    /* Un anillo que no distingue no es un anillo. */
    const tonos = ['exito', 'aviso', 'error', 'info'];
    const valores = tonos.map((t) => /--anillo:\s*var\((--[a-z-]+)\)/.exec(regla(`.avatar-${t}`))?.[1]);
    expect(valores.every(Boolean), 'algún tono no está declarado').toBe(true);
    expect(new Set(valores).size, 'dos tonos pintan el mismo color').toBe(4);
  });

  it('[2] el anillo NO come del tamaño de la foto', () => {
    /* Con `border` el avatar encogería, y en 48 px eso se nota. Va por fuera. */
    expect(regla('.avatar-estado'), 'el anillo se dibuja con borde y encoge la foto')
      .toMatch(/box-shadow/);
    expect(regla('.avatar-estado')).not.toMatch(/border:/);
  });

  it('[2] sin `estado` no se emite nada: el avatar de siempre', () => {
    const { container } = render(<Avatar id="a" nombre="QUISPE, Rosa" />);
    const av = container.querySelector('.avatar')!;
    expect(av.classList.contains('avatar-estado')).toBe(false);
    expect([...av.classList].some((c) => /^avatar-(exito|aviso|error|info)$/.test(c)))
      .toBe(false);
  });
});

describe('R157 · tamaño fluido y relieve', () => {
  it('[3] `fluido` deja mandar a la celda, CON tope', () => {
    /* Sin tope, en una pantalla ancha el avatar crecería hasta ser un retrato. */
    const { container } = render(<Avatar id="a" nombre="QUISPE, Rosa" tamano="fluido" />);
    expect(container.querySelector('.avatar-fluido')).not.toBeNull();
    const r = regla('.avatar-fluido');
    expect(r).toMatch(/width:\s*100%/);
    /* Comprobaba sólo que `max-width` EXISTIERA: una auditoría lo puso en 400 px
       —el retrato que la regla dice evitar— y las 23 siguieron en verde. El
       contrato no dice «que tenga tope», dice que el tope es EL MAYOR DE LA
       ESCALA, así que se compara contra `.avatar-xl`. */
    const tope = /max-width:\s*(\d+)px/.exec(r)?.[1];
    expect(tope, 'sin tope, el avatar crece sin límite').toBeTruthy();
    const xl = /width:\s*(\d+)px/.exec(regla('.avatar-xl'))?.[1];
    expect(xl, 'no encuentro el mayor de la escala').toBeTruthy();
    expect(tope, `el tope tiene que ser el mayor de la escala (${xl}px), no un valor suelto: `
      + 'en una pantalla ancha, cualquier cosa por encima es un retrato').toBe(xl);
    expect(r, 'sin proporción fija, el círculo se deforma').toMatch(/aspect-ratio:\s*1/);
  });

  it('[4] el relieve sale de la ESCALA del sistema, no de un valor suelto', () => {
    /* Si cada producto inventa su sombra, la misma rejilla acaba con tres
       profundidades distintas. */
    const { container } = render(
      <Avatar id="a" nombre="QUISPE, Rosa" elevacion="relieve" />);
    expect(container.querySelector('.avatar-relieve')).not.toBeNull();
    expect(regla('.avatar-relieve'), 'la sombra está escrita a mano en vez de venir del token')
      .toMatch(/var\(--sombra-relieve\)/);
    expect(css, 'la escala de relieve no está publicada').toMatch(/--sombra-relieve:/);
  });

  it('[4] anillo y relieve CONVIVEN: uno no borra al otro', () => {
    /* En reglas separadas ganaría la última y el anillo desaparecería justo en
       la rejilla que lo necesita. */
    const { container } = render(
      <Avatar id="a" nombre="QUISPE, Rosa" estado="error" elevacion="relieve" />);
    const av = container.querySelector('.avatar')!;
    expect(av.classList.contains('avatar-estado')).toBe(true);
    expect(av.classList.contains('avatar-relieve')).toBe(true);
    const juntas = regla('.avatar-estado.avatar-relieve');
    expect(juntas, 'no hay regla para los dos juntos: el anillo se pierde').not.toBe('');
    expect(juntas).toMatch(/--anillo/);
    expect(juntas).toMatch(/--sombra-relieve/);
  });
});

describe('R157 · la cuadrícula densa', () => {
  it('[1] el suelo lo fija LO QUE HAY QUE LEER, no el número de columnas', () => {
    /* Iban seis columnas fijas y se vio en el propio cascarón: en un contenedor
       de 260 px daban celdas de 21 px, donde «Rosa» no cabe — y un nombre que
       no cabe o se recorta o se parte, y las dos cosas las prohíbe la política
       de móvil primero. Se fija el SUELO; el número de columnas es la
       consecuencia. */
    const r = regla('.tn-densa');
    expect(r, 'la rejilla densa no existe').toMatch(/repeat\(auto-fill,\s*minmax\(84px/);
    const gap = Number(/gap:\s*(\d+)px/.exec(r)?.[1]);
    /* La cuenta que sostiene el «seis»: 375 px menos el aire de la superficie,
       repartido en celdas de 48 con su hueco. */
    /* Una celda de tablero lleva nombre, apellido y hora: tres líneas. El suelo
       es lo que mide un apellido corriente a 11 px, y el número de columnas es
       la consecuencia. «Las veo muy apretadas que no se leen los datos» fue lo
       que corrigió las seis columnas fijas. */
    const util = 375 - 24;
    const columnas = Math.floor((util + gap) / (84 + gap));
    expect(columnas, 'en un teléfono no cabe ni una fila legible').toBeGreaterThanOrEqual(3);
    expect((util - gap * (columnas - 1)) / columnas,
      'la celda baja del suelo: los datos dejan de leerse').toBeGreaterThanOrEqual(84);
  });

  it('[1] y en un contenedor estrecho BAJA de columnas en vez de apretar', () => {
    /* Apretar hasta lo ilegible es lo que hacía antes. Bajar a cuatro deja la
       celda por encima del suelo, que es donde el nombre cabe. */
    const gap = Number(/gap:\s*(\d+)px/.exec(regla('.tn-densa'))?.[1]);
    const columnas = Math.floor((260 + gap) / (84 + gap));
    expect(columnas, 'en 260 px sigue apretando').toBeLessThan(4);
    expect((260 - gap * (columnas - 1)) / columnas,
      'la celda baja del suelo de 84 px').toBeGreaterThanOrEqual(84);
  });

  it('[1] la rejilla NO hereda la sangría de la lista', () => {
    /* Se pone sobre una «ul» —es una lista de personas— y el navegador le mete
       40 px de «padding-inline-start» y un puntito por fila. Se midió en el
       cascarón a 333 px: la rejilla salía de 234 px con la sangría dentro y
       daba DOS columnas de 93 px donde caben tres de 113. No se ve como un
       fallo, se ve como un tablero apretado y descentrado, que es exactamente
       lo que reportó el responsable. */
    const r = regla('.tn-densa');
    expect(r, 'la rejilla hereda los 40 px de sangría de la «ul»').toMatch(/padding:\s*0/);
    expect(r, 'la rejilla hereda el margen vertical de la «ul»').toMatch(/margin:\s*0/);
    expect(r, 'cada persona sale con su puntito de lista').toMatch(/list-style:\s*none/);
  });

  it('[1] el ritmo NO es uniforme: la foto se separa y los datos se juntan', () => {
    /* La foto es una cosa y el bloque de datos es otra. Con el mismo hueco entre
       las cuatro, el ojo lee cuatro elementos sueltos en vez de una persona.
       Medido en el catálogo tras el cambio: 8 px de la foto al nombre, 2 px
       entre las tres líneas. Lo pidió el responsable mirando el tablero. */
    const celda = regla('.tbl-persona');
    const hueco = Number(/gap:\s*(\d+)(?:px)?/.exec(celda)?.[1]);
    expect(Number.isFinite(hueco), 'la celda no declara su hueco').toBe(true);
    expect(hueco, 'las tres líneas de datos tienen que ir SIN hueco: su interlineado '
      + 'ya las respira, y un hueco las separa igual que separa la foto').toBe(0);
    const separa = Number(/margin-top:\s*(\d+)px/.exec(regla('.tbl-nom'))?.[1]);
    expect(separa, 'el bloque de datos no se despega de la foto').toBeTruthy();
    expect(separa, 'la foto tiene que quedar MÁS lejos de los datos que las líneas '
      + 'de datos entre sí, o la celda se lee como cuatro cosas sueltas')
      .toBeGreaterThan(hueco + 4);
  });

  it('[1] y envolver tiene TOPE: dos líneas, o un apellido estira su fila', () => {
    /* «Que no rompa el diseño» era la otra mitad de lo pedido. Sin tope, un
       apellido compuesto estira su fila y descuadra la rejilla entera. Medido
       en el catálogo con el peor caso real: «Villanueva-Bustamante» envuelve en
       dos líneas SIN recortarse y la celda crece 13,8 px; tres apellidos
       encadenados sí se recortan, y la celda se queda igual — 115,2 px, el
       techo, en los tres casos. */
    for (const c of ['.tbl-nom', '.tbl-ape']) {
      const r = regla(c);
      expect(r, `${c} no tiene tope de líneas: un nombre largo estira su fila`)
        .toMatch(/-webkit-line-clamp:\s*2/);
      expect(r, `${c} declara el tope sin la caja que lo aplica`)
        .toMatch(/display:\s*-webkit-box/);
      expect(r, `${c} recorta sin ocultar el desbordamiento`).toMatch(/overflow:\s*hidden/);
    }
  });

  it('[1] y si se recorta, el nombre completo SIGUE en la celda', () => {
    /* La política no prohíbe recortar: prohíbe recortar sin forma de leer el
       resto, y `title` no basta en un teléfono. Por eso la celda lleva el nombre
       completo en un `sr-solo` —que además es lo que dice un lector de pantalla
       en vez de deletrear «Rosa Quispe 06:48»—. Si esto desaparece, el recorte
       pasa a ser el defecto que la política nombra. */
    /* Se mira DONDE VIVE la celda, no el paquete compilado: ahí `sr-solo` sale
       también de otros componentes y la comprobación pasaba con el rescate
       quitado — se vio al mutarlo. */
    const demo = readFileSync(
      join(process.cwd(), '..', 'sistema', 'cascaron', 'vivo.tsx'), 'utf8');
    const celda = /<li[^>]*className="tbl-persona"[\s\S]*?<\/li>/.exec(demo)?.[0] ?? '';
    expect(celda, 'no encuentro la celda en la demo').not.toBe('');
    expect(celda, 'la celda no lleva el nombre completo: si el apellido se recorta, '
      + 'no queda forma de leerlo').toMatch(/className="sr-solo"/);
    /* Y el contrato tiene que EXIGIRLO, no solo la demo enseñarlo. */
    const contrato = readFileSync(
      join(process.cwd(), '..', 'sistema', 'componentes', 'comportamiento.md'), 'utf8');
    const tabla = contrato.slice(contrato.indexOf('El marcado, que aquí ES el contrato'));
    expect(tabla.slice(0, 2500), 'el contrato de marcado no exige el nombre completo')
      .toMatch(/sr-solo/);
    expect(regla('.sr-solo'), 'la clase que esconde el texto para el ojo no viaja')
      .not.toBe('');
  });

  it('[5] la burbuja es REDONDA con cualquier número, no una pastilla', () => {
    /* Llevaba `border-radius: 6px` sobre 15 px de alto y relleno lateral, así que
       con dos caracteres —«+5»— salía un rectángulo redondeado de 21×15. Medido
       tras el cambio: 19,2 × 19,2. Lo que lo sostiene con cualquier contenido es
       `aspect-ratio: 1`: el ancho lo manda el número y el alto lo copia, así que
       «9», «+15» y «99+» siguen siendo círculos en vez de alargarse. */
    const b = regla('.badge');
    expect(b, 'la burbuja no es redonda: con dos cifras sale una pastilla')
      .toMatch(/border-radius:\s*(50%|999px|9999px)/);
    expect(b, 'sin `aspect-ratio`, el número la alarga y deja de ser un círculo')
      .toMatch(/aspect-ratio:\s*1/);
    expect(b, 'con alto fijo, `aspect-ratio` no puede crecer con el número')
      .not.toMatch(/height:\s*\d+px/);
  });

  it('[1] la foto se centra igual que el texto', () => {
    /* El avatar es `display: grid` —una caja de bloque—, así que el
       `text-align: center` de la celda NO lo alcanza. Llevaba `display: block`
       y se midió en el catálogo: 0 px a la izquierda y 60,3 a la derecha en una
       celda de 108,3. Las tres líneas centradas y la foto no. */
    const foto = regla('.tbl-foto');
    expect(foto, 'la foto no centra su contenido: el avatar se va a la izquierda')
      .toMatch(/justify-content:\s*center/);
    expect(foto, 'sin flex, `justify-content` no hace nada').toMatch(/display:\s*flex/);
    expect(regla('.tbl-persona'), 'la celda no centra su texto')
      .toMatch(/text-align:\s*center/);
  });

  it('[1] la celda enseña las TRES líneas, y ninguna se recorta EN UNA SOLA', () => {
    /* Nombre, apellido y hora. Medido a 11 px: de catorce apellidos de la zona,
       trece entran en una sola línea dentro del suelo de 84 px. El que se sale
       es el compuesto —«Villanueva-Bustamante», 115,2 px— y ése ENVUELVE, que es
       lo que la política de móvil primero manda hacer primero.
       Lo que está prohibido es `text-overflow: ellipsis` en una línea: corta sin
       envolver, y entonces no hay nada que leer. */
    for (const c of ['.tbl-nom', '.tbl-ape', '.tbl-hora']) {
      expect(regla(c), `falta la línea ${c}`).not.toBe('');
      expect(regla(c), `${c} corta en una línea en vez de envolver`)
        .not.toMatch(/text-overflow:\s*ellipsis/);
    }
    for (const c of ['.tbl-nom', '.tbl-ape']) {
      expect(regla(c), `${c} no envuelve: un apellido sin espacios ensancharía su columna`)
        .toMatch(/overflow-wrap:\s*break-word/);
    }
    /* Y el apellido no compite con el nombre: en treinta personas, leer treinta
       apellidos en negro es no leer ninguno. */
    expect(regla('.tbl-ape')).toMatch(/color:\s*var\(--texto-secundario\)/);
  });

  it('[1] el nombre NO se recorta ni se parte por cualquier sitio', () => {
    /* `ellipsis` deja el texto sin forma de leerse —y en un teléfono no hay
       puntero que descubra un globito—; `anywhere` partía «Rosa» en «Ros/a». */
    const r = regla('.tbl-nom');
    expect(r, 'el nombre se recorta').not.toMatch(/text-overflow:\s*ellipsis/);
    expect(r, 'el nombre no puede envolver').not.toMatch(/white-space:\s*nowrap/);
    expect(r).toMatch(/overflow-wrap:\s*break-word/);
  });

  it('[1] y un nombre largo no descuadra la rejilla entera', () => {
    expect(regla('.tn-densa > *'), 'sin `min-width: 0` una celda ensancha su columna')
      .toMatch(/min-width:\s*0/);
  });
});

describe('R157 · la burbuja sale del marco, y gana tono', () => {
  it('[5] tiene los tonos que faltaban, y no son el mismo', () => {
    /* Iba fija a rojo porque una notificación sin leer siempre lo era. Un
       número no es malo por ser número: lo dice su tono. */
    const fondo = (sel: string) => /background:\s*var\((--[a-z-]+)\)/.exec(regla(sel))?.[1];
    const tonos = ['.badge', '.badge-exito', '.badge-aviso', '.badge-info'].map(fondo);
    expect(tonos.every(Boolean), 'algún tono de burbuja no existe').toBe(true);
    expect(new Set(tonos).size, 'dos tonos de burbuja pintan igual').toBe(4);
  });

  it('[5] el aviso lleva texto oscuro: el ámbar no admite blanco', () => {
    /* Es el mismo motivo por el que el sistema no deja escribir en amarillo. */
    expect(regla('.badge-aviso')).toMatch(/color:\s*var\(--texto-principal\)/);
  });
});

describe('R157 · la superficie tonal', () => {
  it('[6] tiñe un CONTENEDOR, que es lo que no existía', () => {
    /* El sistema publicaba el tono para el Chip y para el filete de
       TarjetaPersona, pero no había forma de teñir un contenedor entero. */
    expect(regla('.sup'), 'la superficie tonal no existe').not.toBe('');
    for (const t of ['exito', 'aviso', 'error', 'info']) {
      expect(regla(`.sup-${t}`), `falta el tono ${t}`).toMatch(/--sup-fondo:/);
    }
  });

  it('[6] lleva BORDE además del fondo: en oscuro un fondo tenue se pierde', () => {
    expect(regla('.sup')).toMatch(/border:\s*1px solid var\(--sup-borde\)/);
    expect(regla('.sup-error'), 'el borde no cambia con el tono').toMatch(/--sup-borde:/);
  });
});

describe('R157 · el carril con anclaje', () => {
  it('[7] cada parada es una PANTALLA COMPLETA, no un trozo', () => {
    /* Es lo que distingue deslizar-como-forma de desbordamiento: si la parada
       es media pantalla, el gesto deja a la gente a medio camino entre dos
       personas. */
    expect(regla('.car'), 'el carril no existe').toMatch(/scroll-snap-type:\s*x mandatory/);
    expect(regla('.car > *')).toMatch(/flex:\s*0 0 100%/);
    expect(regla('.car > *')).toMatch(/scroll-snap-align:\s*start/);
  });

  it('[7] dice DÓNDE estás y CUÁNTAS paradas hay', () => {
    /* Sin esto el gesto es a ciegas: se desliza sin saber si queda algo detrás,
       que es la mitad de lo que hace útil un carril. Es la condición (b) de la
       política. */
    expect(regla('.car-cuenta'), 'no hay forma de saber cuántas paradas hay').not.toBe('');
    expect(regla('.car-punto-aqui'), 'no se distingue la parada actual').not.toBe('');
    const aqui = /background:\s*var\((--[a-z-]+)\)/.exec(regla('.car-punto-aqui'))?.[1];
    const otro = /background:\s*var\((--[a-z-]+)\)/.exec(regla('.car-punto'))?.[1];
    expect(aqui, 'la parada actual se pinta igual que las demás').not.toBe(otro);
  });

  it('[7] se puede alcanzar con teclado', () => {
    /* Condición (a). Un área que sólo se mueve con el ratón deja fuera a quien
       no lo usa — el sistema ya lo tenía escrito para `Horario`. */
    expect(regla('.car:focus-visible'), 'el carril no marca el foco').toMatch(/outline/);
  });

  it('[7] y el desplazamiento suave se apaga con reduced-motion', () => {
    /* El bloque entero de `@media`, no una coincidencia suelta: hay que ver que
       la regla esté DENTRO de la consulta, no en cualquier parte de la hoja. */
    const bloques = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1]);
    expect(bloques.some((b) => /\.car\s*\{[^}]*scroll-behavior:\s*auto/.test(b)),
      'el desplazamiento suave no se apaga con reduced-motion').toBe(true);
  });
});

describe('R157 · el indicador de «en vivo»', () => {
  it('[8] NO gasta un tono de estado: usa el acento de acción', () => {
    /* Verde y rojo ya están ocupados por las personas, y esto no habla del dato
       sino de la conexión. */
    /* La lista de exclusión eran DOS tonos y los tonos de estado son CUATRO: una
       auditoría puso el punto en `--aviso-acento` —un tono de estado, justo lo
       que esta regla prohíbe— y las 23 pruebas siguieron en verde. Una lista de
       lo prohibido que no está completa no prohíbe nada; se comprueba contra lo
       EXIGIDO, que es una sola cosa. */
    const c = /background:\s*var\((--[a-z-]+)\)/.exec(regla('.vivo-punto'))?.[1];
    expect(c, 'el punto de «en vivo» no tiene color').toBeTruthy();
    expect(c, 'el punto de «en vivo» tiene que usar el acento de ACCIÓN: cualquier tono de '
      + 'estado está ocupado por lo que el tablero vigila').toBe('--accion');
  });

  it('[8] late, y el latido SE APAGA con reduced-motion', () => {
    expect(regla('.vivo-punto')).toMatch(/animation:\s*latido/);
    expect(css, 'la animación no viaja en la hoja entregada').toMatch(/@keyframes latido/);
    const bloques = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1]);
    expect(bloques.some((b) => /\.vivo-punto\s*\{[^}]*animation:\s*none/.test(b)),
      'el latido no se apaga con reduced-motion').toBe(true);
  });
});
