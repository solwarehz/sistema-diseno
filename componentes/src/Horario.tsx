/**
 * HORARIO
 *
 * Rejilla de día por hora. Es una TABLA de verdad, no una rejilla dibujada: con
 * `th scope` declarado, cada bloque se anuncia con su día y su franja. Una
 * rejilla de divs con posiciones absolutas se ve igual y no dice nada.
 *
 * Rotar NO reordena datos: intercambia los ejes de la misma tabla.
 */

import { useEffect, useRef } from 'react';

export type BloqueHorario = {
  /** Índice del día dentro de `dias`. */
  dia: number;
  /** «07:30» */
  de: string;
  /** «08:15» */
  a: string;
  titulo: string;
  detalle?: string;
  /**
   * Los seis primeros SIGNIFICAN algo y el color es la señal. Los cuatro de
   * identidad no significan nada: son los del avatar y agrupan —una sede, un
   * turno—, nunca informan. Por eso llevan el color en un filete de 6px y no
   * en el fondo: dentro de una rejilla donde conviven, el adorno no puede
   * pesar más que la alarma. Regla 3 del contrato del horario.
   */
  tono?: 'info' | 'exito' | 'aviso' | 'error' | 'oro' | 'neutro'
       | 'identidad-1' | 'identidad-2' | 'identidad-3' | 'identidad-4';
};

export type HorarioProps = {
  titulo: string;
  dias: string[];
  /** «07:30» */
  inicio: string;
  /** «13:30» */
  fin: string;
  /** Minutos por franja. 30 para clases, 60 para turnos. */
  paso: number;
  bloques: BloqueHorario[];
  /** vertical = día en columna. horizontal = día en fila. */
  eje?: 'vertical' | 'horizontal';
  formato?: '24' | '12';
  /**
   * R89 · **El descarte deja de ser silencioso.** Se llama con TODO lo que el
   * horario no pudo dibujar tal cual: lo que se salió del rango, lo que se
   * quedó sin sitio porque otro bloque ya lo ocupaba, y lo que se pintó a
   * celda entera por pasarse del tope de span.
   *
   * Nace porque no avisar es peor que fallar: un bloque que desaparece de una
   * rejilla no deja hueco visible —la celda vacía es un estado normal— así que
   * nadie lo echa en falta hasta que alguien pregunta por qué no aparece su
   * clase.
   */
  onAjuste?: (avisos: AjusteHorario[]) => void;
};

/** Qué le pasó a un bloque que no se pudo dibujar tal cual. */
export type AjusteHorario = {
  bloque: BloqueHorario;
  motivo: 'fuera-de-rango' | 'dia-inexistente' | 'duracion-nula' | 'sin-sitio' | 'span-largo';
  /** Frase lista para un registro o un aviso. */
  detalle: string;
};

const aMin = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** El formato es SOLO cómo se escribe: el dato es un minuto del día. */
export function escribirHora(min: number, formato: '24' | '12'): string {
  const h = Math.floor(min / 60);
  const mm = String(min % 60).padStart(2, '0');
  if (formato === '24') return `${String(h).padStart(2, '0')}:${mm}`;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  // Con espacio y con puntos: es la forma correcta en español.
  return `${h12}:${mm} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}

/** Tope de proporciones: seis celdas de span. Se dice, no se descubre. */
const TOPE_CUARTOS = 24;

export function Horario({
  titulo, dias, inicio, fin, paso, bloques, eje = 'vertical', formato = '24',
  onAjuste,
}: HorarioProps) {
  const ini = aMin(inicio);
  const n = Math.round((aMin(fin) - ini) / paso);

  /**
   * UNA CELDA LLEVA UNA PILA DE PIEZAS, NO UN BLOQUE.
   *
   * R138, de Control Administrativos V2.0, con el caso de un profesor real:
   * **S3 de 09:00 a 12:20 y S1 de 12:20 a 13:55 no comparten un minuto**, y el
   * segundo se descartaba con «se solapa con otro bloque ya colocado».
   *
   * No se solapaban: **compartían FILA**. Con franjas de dos horas, S3 acaba
   * dentro de la fila 12:00–14:00 y S1 empieza en esa misma fila. El bucle
   * reservaba **filas enteras** —`tapada[dia][fila] = true`— así que cualquiera
   * que empezara ahí se caía. Reproducido: a paso 120, 60 y 30 se descarta; a
   * 20 **no**, porque ahí el borde de fila cae exacto en 12:20 y dejan de
   * compartirla. No era cuestión de resolución: era que **un bloque que acaba a
   * media fila se queda la fila entera**.
   *
   * Ahora el choque se mide **en cuartos**, que es donde de verdad ocurre, y
   * los bloques que comparten filas sin compartir minutos van **en la misma
   * celda**, apilados con sus huecos. Es lo que el propio equipo anticipó al
   * mandarlo: *«si dejan que una celda lleve dos bloques, el hueco en cuartos
   * tendrá que contar todos los bloques de la pila, no uno»*.
   */
  type Pieza = { cuartos: number; b?: BloqueHorario };
  type Encaje = { largo: number; piezas: Pieza[] };
  type Puesto = { b: BloqueHorario; qDe: number; qA: number; f: number; ff: number };

  const empieza: Record<number, Record<number, Encaje>> = {};
  const tapada: Record<number, Record<number, boolean>> = {};
  dias.forEach((_, d) => { empieza[d] = {}; tapada[d] = {}; });

  const avisos: AjusteHorario[] = [];
  const rotular = (b: BloqueHorario) => `«${b.titulo}» (${b.de}–${b.a})`;

  /* Primero se ACEPTAN, y solo después se reparten en celdas: agrupar exige
     conocerlos todos, y el orden de llegada no puede decidir quién entra. */
  const puestos: Record<number, Puesto[]> = {};
  dias.forEach((_, d) => { puestos[d] = []; });

  bloques.forEach((b) => {
    if (!empieza[b.dia]) {
      avisos.push({ bloque: b, motivo: 'dia-inexistente',
        detalle: `${rotular(b)} apunta al día ${b.dia} y solo hay ${dias.length}.` });
      return;
    }
    // R89 · TODO SE CUENTA EN CUARTOS DE PASO. Es la resolución que ellos
    // mismos pidieron —25 %, 50 %, 75 %— y la que hace que la rejilla se quede
    // en 24 filas aunque alguien entre a las 07:45. El minuto exacto no se
    // pierde: viaja en el rótulo del bloque, que es donde se lee.
    const q = paso / 4;
    const qDe = Math.round((aMin(b.de) - ini) / q);
    const qA = Math.round((aMin(b.a) - ini) / q);

    if (qA <= qDe) {
      avisos.push({ bloque: b, motivo: 'duracion-nula',
        detalle: `${rotular(b)} dura menos de ${Math.round(q)} min, que es el cuarto de franja más pequeño que se puede pintar.` });
      return;
    }
    // La fila donde CAE el inicio, no la más cercana. Antes se redondeaba, y
    // por eso un bloque de las 07:45 se dibujaba en la fila de las 08:00: se
    // veía una hora que no era, con el rótulo correcto al lado.
    const f = Math.floor(qDe / 4);
    const ff = Math.ceil(qA / 4);
    if (f < 0 || ff > n) {
      avisos.push({ bloque: b, motivo: 'fuera-de-rango',
        detalle: `${rotular(b)} cae fuera de ${inicio}–${fin}.` });
      return;
    }
    /* EL CHOQUE SE MIDE EN CUARTOS, no en filas. Dos bloques que comparten fila
       y no comparten minuto caben los dos; dos que comparten minuto, no. */
    const choca = puestos[b.dia].find((p) => qDe < p.qA && p.qDe < qA);
    if (choca) {
      avisos.push({ bloque: b, motivo: 'sin-sitio',
        detalle: `${rotular(b)} se solapa en el tiempo con ${rotular(choca.b)} y no se dibuja.` });
      return;
    }
    puestos[b.dia].push({ b, qDe, qA, f, ff });
  });

  /* Se agrupan los que COMPARTEN FILA —transitivamente: si A toca a B y B toca
     a C, los tres van a la misma celda— y cada grupo es una celda con su pila. */
  dias.forEach((_, d) => {
    const orden = [...puestos[d]].sort((x, y) => x.qDe - y.qDe);
    let i = 0;
    while (i < orden.length) {
      let fin0 = orden[i].ff;
      let j = i + 1;
      /* `Math.max` y no `orden[j].ff` a secas: dentro de un grupo ordenado y sin
         solapes el último tiene siempre el `ff` mayor, así que hoy da igual —una
         auditoría lo midió: quitarlo no rompe nada—. Se queda porque la invariante
         que lo hace innecesario es del BUCLE DE ARRIBA, no de éste, y el día que
         alguien toque el orden esto seguiría siendo correcto. */
      while (j < orden.length && orden[j].f < fin0) { fin0 = Math.max(fin0, orden[j].ff); j++; }
      const grupo = orden.slice(i, j);
      const f0 = grupo[0].f;
      const largo = fin0 - f0;
      const base = f0 * 4;

      /* PASADO EL TOPE NO SE DESCARTA A NADIE: se pierde la PROPORCIÓN, que es
         mucho menos. La primera versión de este arreglo dejaba fuera a todos
         menos el primero, y con eso el caso del R138 —el que lo trajo— seguía
         roto a paso 30: el grupo abarca diez franjas, pasa el tope, y S1 volvía
         a caerse mientras las cuatro superficies decían que estaba arreglado.
         Lo cazó una auditoría antes de publicar.

         Ahora la pieza que no cabe en el juego de clases sale SIN clase de
         tamaño y hereda `flex: 1 0 auto` —«lo que sobre»—, que es exactamente
         lo que significaba «a celda entera». Los bloques se pintan todos, en su
         orden y en su celda; lo que se pierde es que la altura sea proporcional
         al tiempo, y eso SE AVISA. Un bloque que desaparece no deja hueco
         visible y nadie lo echa en falta; uno mal proporcionado se ve. */
      const piezas: Pieza[] = [];
      let cursor = base;
      for (const p of grupo) {
        if (p.qDe > cursor) piezas.push({ cuartos: p.qDe - cursor });
        piezas.push({ cuartos: p.qA - p.qDe, b: p.b });
        cursor = p.qA;
      }
      const sobra = base + largo * 4 - cursor;
      if (sobra > 0) piezas.push({ cuartos: sobra });

      for (const pz of piezas) {
        if (pz.cuartos > TOPE_CUARTOS && pz.b) {
          avisos.push({ bloque: pz.b, motivo: 'span-largo',
            detalle: `${rotular(pz.b)} dura ${pz.cuartos / 4} franjas y el sombreado proporcional llega hasta ${TOPE_CUARTOS / 4}: se pinta ocupando lo que quede de la celda.` });
        }
      }
      empieza[d][f0] = { largo, piezas };
      for (let k = 1; k < largo; k++) tapada[d][f0 + k] = true;
      i = j;
    }
  });

  // R94 · SE AVISA EN UN EFECTO, NO DURANTE EL RENDER.
  //
  // Estaba llamado en el cuerpo del componente, y eso es un BUCLE INFINITO en
  // cuanto el consumidor hace lo natural: guardar los avisos en un estado para
  // enseñarlos. `setState` durante el render de otro componente provoca otro
  // render, que vuelve a llamar, que vuelve a renderizar. Lo reportó Control
  // Administrativos, que además tuvo que blindarse por su cuenta; aquí la
  // prueba que lo reprodujo se colgó diez minutos antes de que la matáramos.
  //
  // La comparación es por CONTENIDO y no por identidad de array: `avisos` es
  // un array nuevo en cada render, así que un efecto con `[avisos]` volvería a
  // dispararse siempre y el bucle seguiría, solo que un paso más allá.
  const huella = JSON.stringify(avisos.map((a) => [a.motivo, a.detalle]));
  const ultima = useRef<string | null>(null);
  useEffect(() => {
    if (!onAjuste || !avisos.length) return;
    if (ultima.current === huella) return;
    ultima.current = huella;
    onAjuste(avisos);
    /* `avisos` queda fuera a propósito: su identidad cambia en cada render y
       lo que decide si hay algo nuevo que decir es la huella.
       SIN `eslint-disable`: el proyecto no carga `eslint-plugin-react-hooks` y
       el comentario era un error de ESLint, no un silenciador. */
  }, [huella, onAjuste]);

  const vertical = eje === 'vertical';
  const filas = vertical ? n : dias.length;
  const cols = vertical ? dias.length : n;

  return (
    // tabindex para que el desplazamiento horizontal también se alcance con
    // teclado: un área que solo se mueve con el ratón deja fuera a quien no lo usa.
    <div className="hor-env" tabIndex={0} role="region" aria-label={titulo}>
      <table className="hor">
        <thead>
          <tr>
            <th className="hor-esq" scope="col">{vertical ? 'Hora' : 'Día'}</th>
            {vertical
              ? dias.map((d) => <th key={d} scope="col">{d}</th>)
              : Array.from({ length: n }, (_, c) => (
                  <th key={c} scope="col">{escribirHora(ini + c * paso, formato)}</th>
                ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: filas }, (_, f) => (
            <tr key={f}>
              <th scope="row" className={`hor-eje ${vertical ? 'hor-eje-v' : 'hor-eje-h'}`}>
                {vertical ? escribirHora(ini + f * paso, formato) : dias[f]}
              </th>
              {Array.from({ length: cols }, (_, g) => {
                const dia = vertical ? g : f;
                const ranura = vertical ? f : g;
                if (tapada[dia]?.[ranura]) return null;
                const e = empieza[dia]?.[ranura];
                if (!e) return <td key={g} className="hor-c hor-vacia" />;
                return (
                  <td
                    key={g}
                    className="hor-c"
                    {...(vertical ? { rowSpan: e.largo } : { colSpan: e.largo })}
                  >
                    {/* LA PILA REPARTE LA CELDA EN CUARTOS, y puede llevar VARIOS
                        bloques: dos que comparten fila sin compartir minuto caben
                        los dos (R138). Cada pieza dice cuántos cuartos ocupa, y
                        esa cuenta es la misma para huecos y para bloques — sin
                        eso, un segundo bloque no tendría con qué colocarse. */}
                    <div className="hor-pila">
                      {e.piezas.map((pz, k) => {
                        if (!pz.b) {
                          /* SIN CLASE DE TAMAÑO pasado el tope: la hoja solo
                             declara hasta ahí, y emitir `hor-h40` sería emitir
                             una clase que nadie atiende — el bloque se colocaría
                             donde cayera y el horario mentiría sobre su hora. */
                          return (
                            <i
                              key={k}
                              className={['hor-hueco', pz.cuartos <= TOPE_CUARTOS ? `hor-h${pz.cuartos}` : '']
                                .filter(Boolean).join(' ')}
                              aria-hidden="true"
                            />
                          );
                        }
                        const rango = `${escribirHora(aMin(pz.b.de), formato)} – ${escribirHora(aMin(pz.b.a), formato)}`;
                        return (
                          <span
                            key={k}
                            className={['hor-b', `hor-${pz.b.tono ?? 'neutro'}`,
                              pz.cuartos <= TOPE_CUARTOS ? `hor-d${pz.cuartos}` : ''].filter(Boolean).join(' ')}
                            title={`${dias[dia]}, ${rango}`}
                          >
                            <b>{pz.b.titulo}</b>
                            {pz.b.detalle && <span>{pz.b.detalle}</span>}
                            {/* El bloque SIEMPRE dice su franja en texto: deducirla de
                                la altura de la celda no es leerla. Y con el sombreado
                                fraccionado importa MÁS: el relleno redondea a cuartos,
                                el rótulo no redondea nada. */}
                            <span className="hor-rango">{rango}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
