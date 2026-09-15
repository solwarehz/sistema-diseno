/**
 * EL MENÚ QUE EL CATÁLOGO ENSEÑA CONTRA EL QUE EL COMPONENTE EMITE.
 *
 * Nace de R135 y de las dos versiones anteriores, que dejaron el mismo rastro
 * tres veces: el catálogo prometía algo que la entrega no hacía —el globito del
 * carril plegado, el hover con el menú desplegado— o **no demostraba** lo que la
 * entrega sí hace —el panel flotante, el tercer nivel—. Ninguno de los catorce
 * candados podía verlo: **ninguno compara atributos de marcado**, y `title` es
 * un atributo.
 *
 * Lo que se mira aquí es lo que ellos no miran.
 */
import { render } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { TextEncoder, TextDecoder } from 'node:util';
import { MarcoApp, type GrupoNav } from '../src/MarcoApp';
import { Icono } from '../src/Icono';

let HTML: string;
beforeAll(() => {
  HTML = readFileSync(resolve(process.cwd(), '..', 'cascaron', 'index.html'), 'utf8');
});

const doc = () => new JSDOM(HTML, { virtualConsole: new VirtualConsole() }).window.document;

/** Toda la navegación del catálogo, esté donde esté. */
const navegacionDelCatalogo = (d: Document) => [
  ...d.querySelectorAll('.nav-item, .nav-hijo, .nav-nieto'),
  ...[...d.querySelectorAll('template')]
    .flatMap((t) => [...(t as HTMLTemplateElement).content.querySelectorAll('.nav-item, .nav-hijo, .nav-nieto')]),
];

describe('[10] el archivo que se ENTREGA ya nace coherente, sin ejecutar nada', () => {
  it('ningún grupo anuncia abierto con su panel oculto, ni al revés', () => {
    /* El catálogo salía con sus nueve grupos diciendo `aria-expanded="true"` y
       ninguno con el atributo de ocultar: era el guión, al cargar, quien los
       cerraba. El daño en pantalla es pequeño —dura un instante—, pero el
       ARCHIVO que se entrega decía «todos abiertos», que es exactamente el
       criterio que la regla 9 deroga, y la regla 10 llama a eso «el atributo
       miente». Quien lea el HTML, lo indexe o lo sirva sin JavaScript ve el
       menú viejo. Lo cazó una auditoría el 2026-09-15: 9 de 19 incoherentes. */
    const d = doc();
    const grupos = [...d.querySelectorAll('.nav-grupo')];
    expect(grupos.length, 'no hay grupos que mirar en el catálogo').toBeGreaterThan(5);
    const mienten = grupos
      .filter((g) => g.querySelector('.nav-grupo-tit') && g.querySelector('.nav-hijos'))
      .filter((g) => {
        const dice = g.querySelector('.nav-grupo-tit')!.getAttribute('aria-expanded') === 'true';
        const seVe = !g.querySelector('.nav-hijos')!.hasAttribute('hidden');
        return dice !== seVe;
      })
      .map((g) => g.querySelector('.nav-txt')?.textContent?.trim());
    expect(mienten, 'grupos que anuncian un estado y enseñan otro').toEqual([]);
  });
});

describe('[8] el catálogo cumple la regla del globito que él mismo exige', () => {
  it('ni un solo elemento de navegación sin `title`', () => {
    /* Iban 16 de 86 sin rótulo para el ratón —los títulos de grupo y de rama de
       la barra propia—, justo donde la entrega debería demostrarlo. Lo midió
       Control Administrativos V2.0, y ese defecto iba al revés de lo habitual:
       su producto los tenía y el catálogo no. */
    const sin = navegacionDelCatalogo(doc())
      .filter((a) => a.getAttribute('title') === null)
      .map((a) => a.textContent?.trim().slice(0, 30));
    expect(sin, 'hay navegación del catálogo sin rótulo para el ratón').toEqual([]);
  });

  it('y el `title` dice lo mismo que el rótulo', () => {
    for (const a of navegacionDelCatalogo(doc())) {
      const txt = a.querySelector('.nav-txt');
      if (txt) expect(a.getAttribute('title')).toBe(txt.textContent);
    }
  });
});

describe('[12] el catálogo DEMUESTRA el tercer nivel, y en el estado que lo enseña', () => {
  /* SIN `#lateral`, que TAMBIEN es un `<aside class="lat">`. Con el selector a
     secas, «la maqueta extendida» resolvía a la barra propia del catálogo y la
     prueba de la rama extendida medía otra cosa creyendo que medía la maqueta.
     Lo cazó una auditoría el 2026-09-15. */
  const maquetas = (d: Document) =>
    [...d.querySelectorAll('aside.lat')].filter((l) => l.id !== 'lateral');

  it('la maqueta plegada trae un grupo abierto con rama de tercer nivel', () => {
    /* Estaba en el marcado y en `display:none`: se veía en el HTML y no en la
       pantalla. Es el mismo defecto que la v1.114.0 vino a cerrar un nivel más
       arriba, repetido más abajo. */
    const plegada = maquetas(doc()).find((l) => l.classList.contains('colapsado'));
    expect(plegada, 'el catálogo no pinta el carril plegado').not.toBeUndefined();
    const abierto = plegada!.querySelector('.nav-grupo.abierto');
    expect(abierto, 'plegada, ningún grupo abierto: el panel flotante no se ve').not.toBeNull();
    expect(abierto!.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(false);
    const rama = abierto!.querySelector('.nav-rama');
    expect(rama, 'el grupo abierto no lleva rama: el tercer nivel no se demuestra').not.toBeNull();
    expect(rama!.classList.contains('abierta'), 'la rama del panel llega cerrada').toBe(true);
    expect(rama!.querySelectorAll('.nav-nieto').length).toBeGreaterThan(0);
  });

  it('y extendida la rama llega CERRADA, como la emite el componente', () => {
    const ext = maquetas(doc()).find((l) => !l.classList.contains('colapsado'));
    expect(ext, 'no encuentro la maqueta extendida').not.toBeUndefined();
    const rama = ext!.querySelector('.nav-rama');
    expect(rama, 'la maqueta extendida no tiene rama que mirar').not.toBeNull();
    expect(rama!.classList.contains('abierta'), 'extendida promete una rama abierta').toBe(false);
    expect(rama!.querySelector('.nav-nietos')!.hasAttribute('hidden')).toBe(true);
  });

  it('el tercer nivel del catálogo lleva icono, que es lo que el sistema admite', () => {
    // `OpcionNav.icono` existe (regla 17). Si el catálogo no lo demuestra, cada
    // producto descubre montándolo si cabe o no — que es justo lo que pasó.
    const plegada = maquetas(doc()).find((l) => l.classList.contains('colapsado'));
    const nieto = plegada!.querySelector('.nav-nieto');
    expect(nieto, 'no hay tercer nivel que mirar').not.toBeNull();
    expect(nieto!.querySelector('.nav-ic'), 'el tercer nivel se demuestra sin icono').not.toBeNull();
  });
});

describe('[8] la anatomía del menú: el catálogo emite lo que el componente', () => {
  const NAV: GrupoNav[] = [
    { clave: 'panel', texto: 'Dashboard', href: '#' },
    {
      clave: 'configuracion', texto: 'Configuración',
      hijos: [
        { clave: 'general', texto: 'General', href: '#' },
        /* CON ICONO en la rama y en los nietos: es lo que el catálogo
           demuestra desde R135, y el sistema lo admite (`OpcionNav.icono`,
           regla 17). Sin icono aquí, la comparación no miraría el caso que el
           equipo reportó — que era justo el del icono. */
        { clave: 'catalogos', texto: 'Catálogos', icono: <Icono nombre="libro" />, hijos: [
          { clave: 'sedes', texto: 'Sedes', href: '#', icono: <Icono nombre="libro" /> },
          { clave: 'cargos', texto: 'Cargos', href: '#', icono: <Icono nombre="libro" /> },
        ] },
      ],
    },
  ];

  /** Etiqueta, clases y los atributos que deciden algo. Sin `id`: es `useId`. */
  const forma = (el: Element): unknown => ({
    tag: el.tagName.toLowerCase(),
    clases: [...el.classList].sort().join(' '),
    ariaHidden: el.getAttribute('aria-hidden') ?? null,
    ariaExpanded: el.getAttribute('aria-expanded') ?? null,
    title: el.getAttribute('title') ?? null,
    hidden: el.hasAttribute('hidden'),
    hijos: [...el.children].filter((h) => h.tagName.toLowerCase() !== 'svg').map(forma),
  });

  it('la rama del catálogo tiene la MISMA anatomía que la del componente', () => {
    const { container } = render(
      <MarcoApp titulo="C" hrefInicio="/" navegacion={NAV} plegado
        usuario={{ id: 'u', nombre: 'Ana', onSalir: () => {} }}>
        <p>x</p>
      </MarcoApp>,
    );
    const delComponente = container.querySelector('.nav-rama')!;
    const plegada = [...doc().querySelectorAll('aside.lat')].find((l) => l.classList.contains('colapsado'))!;
    const delCatalogo = plegada.querySelector('.nav-rama')!;
    expect(forma(delCatalogo)).toEqual(forma(delComponente));
  });
});

describe('[12] la barra del catálogo cumple la regla 12 que el catálogo publica', () => {
  /**
   * EL CATÁLOGO EJECUTÁNDOSE, no su marcado en reposo.
   *
   * La regla 12 entró en la v1.115.0 **solo en el componente**. La barra propia
   * del catálogo —que es la que la gente recorre, y la que el equipo usó para
   * reproducir R135b— siguió con sus cinco ramas cerradas: plegada, el panel
   * abría y pasar el ratón por una rama solo la resaltaba. Reproducido con el
   * ratón el 2026-09-15, con la regla ya publicada.
   *
   * Por eso esto ejecuta los guiones: el defecto no está en el HTML, está en
   * lo que el HTML hace al plegarse.
   */
  /* SE CIERRAN AL TERMINAR. Cada catálogo vivo es un jsdom que EJECUTA la
     página entera —2,5 MB de HTML y el paquete de React de 162 KB—, y con seis
     abiertos a la vez el worker de vitest se quedaba sin memoria y moría:
     «Worker exited unexpectedly», 49 archivos en verde de 50 y el archivo que
     faltaba sin decir ni una palabra. El publicador lo cazó por código de
     salida, que es exactamente para lo que mira el código de salida. */
  const vivos: InstanceType<typeof JSDOM>[] = [];
  afterEach(() => { while (vivos.length) vivos.pop()!.window.close(); });

  const catalogoVivo = () => {
    const consola = new VirtualConsole();
    const fallos: string[] = [];
    consola.on('jsdomError', (e: Error) => {
      if (!String(e.message).includes('Not implemented')) fallos.push(String(e.message));
    });
    const dom = new JSDOM(HTML, {
      virtualConsole: consola, runScripts: 'dangerously', pretendToBeVisual: true,
      url: 'http://127.0.0.1/',
      beforeParse(w: any) {
        w.TextEncoder = TextEncoder;
        w.TextDecoder = TextDecoder;
        w.matchMedia = w.matchMedia ?? ((q: string) => ({
          matches: false, media: q,
          addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
        }));
        w.requestAnimationFrame = (f: FrameRequestCallback) => setTimeout(() => f(Date.now()), 0) as unknown as number;
        w.cancelAnimationFrame = (i: number) => clearTimeout(i);
        w.scrollTo = () => {};
      },
    });
    vivos.push(dom);
    if (fallos.length) throw new Error('el guion del catálogo lanzó: ' + fallos[0].slice(0, 160));
    return dom.window.document;
  };

  it('al plegar, las ramas del panel flotante se abren', () => {
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    /* TODAS las ramas de la barra, no las del primer grupo: abriendo solo uno
       la prueba habría pasado igual. La barra tiene siete, en dos grupos. */
    const ramas = [...lat.querySelectorAll('.nav-rama')];
    expect(ramas.length, 'la barra del catálogo no tiene tercer nivel que mirar').toBeGreaterThan(1);
    // Extendida arrancan cerradas: manda la regla 6.
    expect([...lat.querySelectorAll('.nav-rama.abierta')].length).toBe(0);

    (d.getElementById('plegar-cat') as HTMLElement).click();
    expect(lat.classList.contains('colapsado'), 'el botón no plegó').toBe(true);

    const cerradas = ramas.filter((r) => !r.classList.contains('abierta'))
      .map((r) => r.querySelector('.nav-txt')?.textContent);
    expect(cerradas, 'plegada, hay ramas cerradas en el panel flotante').toEqual([]);
    for (const r of ramas) {
      expect(r.querySelector('.nav-rama-tit')!.getAttribute('aria-expanded')).toBe('true');
      expect(r.querySelector('.nav-nietos')!.hasAttribute('hidden'),
        'la rama abierta deja sus nietos con el atributo de ocultar').toBe(false);
    }
  });

  it('y al volver a desplegar se cierran, que es la regla 6', () => {
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const boton = d.getElementById('plegar-cat') as HTMLElement;
    boton.click();
    boton.click();
    expect(lat.classList.contains('colapsado')).toBe(false);
    const abiertas = [...lat.querySelectorAll('.nav-rama.abierta')]
      .filter((r) => !r.querySelector('.nav-nieto.activo'));
    expect(abiertas.length, 'al desplegar se quedan ramas abiertas que nadie pidió').toBe(0);
  });

  /* ── REGLA 9, POR EL LADO DEL CATÁLOGO ───────────────────────────────────
     Una auditoría lo señaló antes de publicar: estas pruebas cubrían la 8, la
     11 y la 12, y la v1.117.0 se vende por la 9. La mitad nueva del contrato
     no tenía prueba por este lado, que es justo el lado que ha divergido
     cuatro versiones seguidas. */

  it('[9] el menú EXTENDIDO llega corto: un solo grupo abierto, y con `.fijo`', () => {
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    expect(lat.classList.contains('colapsado'), 'arranca plegado y no es lo que se mide').toBe(false);
    const grupos = [...lat.querySelectorAll('.nav-grupo')];
    expect(grupos.length, 'la barra no tiene grupos que comparar').toBeGreaterThan(2);
    expect(
      grupos.filter((g) => g.classList.contains('abierto')).length,
      'el menú extendido llega con más de un grupo abierto: eso es el criterio derogado',
    ).toBe(1);
    expect(
      grupos.filter((g) => g.classList.contains('fijo')).length,
      'el acento no identifica a un solo grupo',
    ).toBe(1);
    // Y lo que se anuncia es lo que se ve, grupo a grupo.
    for (const g of grupos) {
      const ab = g.classList.contains('abierto');
      expect(g.querySelector('.nav-grupo-tit')!.getAttribute('aria-expanded')).toBe(String(ab));
      expect(g.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(!ab);
    }
  });

  it('[9] el cursor REVELA otro grupo sin desbancar al fijado', () => {
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const grupos = [...lat.querySelectorAll('.nav-grupo')];
    const fijado = grupos.find((g) => g.classList.contains('fijo'))!;
    const otro = grupos.find((g) => !g.classList.contains('fijo'))!;
    otro.dispatchEvent(new d.defaultView!.MouseEvent('mouseenter'));
    expect(otro.classList.contains('abierto'), 'el cursor no reveló el grupo').toBe(true);
    expect(fijado.classList.contains('abierto'), 'revelar otro cerró el fijado').toBe(true);
    expect(
      grupos.filter((g) => g.classList.contains('fijo')).length,
      'revelar con el cursor movió el acento',
    ).toBe(1);
  });

  it('[9] SOLTAR a mano cierra el grupo, con el cursor todavía encima', () => {
    /* Aquí divergían: `MarcoApp` apaga el revelado al soltar y esta barra se
       dejaba `data-cursor` puesto, así que el mismo gesto dejaba el grupo
       cerrado en la entrega y abierto en el catálogo. */
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const g = [...lat.querySelectorAll('.nav-grupo')].find((x) => !x.classList.contains('fijo'))!;
    const tit = g.querySelector('.nav-grupo-tit') as HTMLElement;
    g.dispatchEvent(new d.defaultView!.MouseEvent('mouseenter'));
    tit.click();                                   // fija
    expect(g.classList.contains('fijo')).toBe(true);
    tit.click();                                   // suelta, sin mover el ratón
    expect(g.classList.contains('fijo')).toBe(false);
    expect(g.classList.contains('abierto'), 'soltar dejó el grupo abierto: el mando no hace nada').toBe(false);
    expect(tit.getAttribute('aria-expanded')).toBe('false');
  });

  it('[9] el RATÓN no cierra el panel donde está el FOCO — también en la barra', () => {
    /* El componente se corrigió y ESTA BARRA NO: llevaba un solo señalizador,
       puesto y quitado por el ratón Y por el foco, así que pasar el cursor por
       encima cerraba el panel donde vivía el foco de alguien. El mismo gesto,
       dos resultados, sobre el punto exacto que define esta versión. Lo midió
       la tercera auditoría del 2026-09-15 ejecutando las dos hojas. */
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const grupos = [...lat.querySelectorAll('.nav-grupo')];
    const uno = grupos.find((g) => !g.classList.contains('fijo'))!;
    const otro = grupos.find((g) => g !== uno && !g.classList.contains('fijo'))!;

    // El foco entra en el primer grupo.
    (uno.querySelector('.nav-grupo-tit') as HTMLElement).focus();
    expect(uno.classList.contains('abierto'), 'enfocar no reveló el grupo').toBe(true);

    // Y el ratón se pasea por otro. El foco no se ha movido.
    otro.dispatchEvent(new d.defaultView!.MouseEvent('mouseenter'));
    expect(uno.classList.contains('abierto'), 'el ratón cerró el panel donde está el foco').toBe(true);
    expect(uno.querySelector('.nav-grupo-tit')!.getAttribute('aria-expanded'),
      'aria-expanded miente sobre el grupo enfocado').toBe('true');
    expect(uno.querySelector('.nav-hijos')!.hasAttribute('hidden')).toBe(false);
    expect(otro.classList.contains('abierto'), 'el cursor no reveló el suyo').toBe(true);
  });

  it('[9] y al revés: que el foco salga no cierra el grupo que tiene el ratón', () => {
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const g = [...lat.querySelectorAll('.nav-grupo')].find((x) => !x.classList.contains('fijo'))!;
    const tit = g.querySelector('.nav-grupo-tit') as HTMLElement;
    g.dispatchEvent(new d.defaultView!.MouseEvent('mouseenter'));
    tit.focus();
    expect(g.classList.contains('abierto')).toBe(true);
    // El foco se va fuera del grupo; el ratón sigue encima.
    (d.getElementById('plegar-cat') as HTMLElement).focus();
    expect(g.classList.contains('abierto'), 'salir con el foco cerró lo que el ratón tenía abierto').toBe(true);
  });

  it('[9] la barra marca la página en curso con `aria-current`, no solo con color', () => {
    /* El propio catálogo publica en su página de Paginación que «el color solo
       no la marca», y su barra la marcaba solo con la clase. */
    const d = catalogoVivo();
    const lat = d.getElementById('lateral')!;
    const activos = [...lat.querySelectorAll('.nav-hijo.activo, .nav-nieto.activo')];
    expect(activos.length, 'ninguna opción marcada como activa').toBe(1);
    expect(
      lat.querySelectorAll('[aria-current="page"]').length,
      'la opción en curso se pinta pero no se anuncia',
    ).toBe(1);
    expect(activos[0].getAttribute('aria-current')).toBe('page');
  });
});
