/**
 * HORARIO
 *
 * Rejilla de día por hora. Es una TABLA de verdad, no una rejilla dibujada: con
 * `th scope` declarado, cada bloque se anuncia con su día y su franja. Una
 * rejilla de divs con posiciones absolutas se ve igual y no dice nada.
 *
 * Rotar NO reordena datos: intercambia los ejes de la misma tabla.
 */

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

  type Encaje = { b: BloqueHorario; largo: number; arr: number; dur: number; aba: number };
  const empieza: Record<number, Record<number, Encaje>> = {};
  const tapada: Record<number, Record<number, boolean>> = {};
  dias.forEach((_, d) => { empieza[d] = {}; tapada[d] = {}; });

  const avisos: AjusteHorario[] = [];
  const rotular = (b: BloqueHorario) => `«${b.titulo}» (${b.de}–${b.a})`;

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
    const largo = ff - f;
    for (let k = 0; k < largo; k++) {
      if (empieza[b.dia][f + k] || tapada[b.dia][f + k]) {
        avisos.push({ bloque: b, motivo: 'sin-sitio',
          detalle: `${rotular(b)} se solapa con otro bloque ya colocado y no se dibuja.` });
        return;
      }
    }
    let arr = qDe - f * 4;
    let dur = qA - qDe;
    let aba = ff * 4 - qA;
    // Pasado el tope, celda entera — y se dice.
    if (largo * 4 > TOPE_CUARTOS) {
      avisos.push({ bloque: b, motivo: 'span-largo',
        detalle: `${rotular(b)} abarca ${largo} franjas y se pinta a celda entera: el sombreado fraccionado llega hasta ${TOPE_CUARTOS / 4}.` });
      arr = 0; dur = largo * 4; aba = 0;
    }
    empieza[b.dia][f] = { b, largo, arr, dur, aba };
    for (let k = 1; k < largo; k++) tapada[b.dia][f + k] = true;
  });

  // Se avisa DESPUÉS de colocarlo todo y en una sola llamada: un aviso por
  // bloque durante el reparto llegaría a medias y en orden de entrada.
  if (onAjuste && avisos.length) onAjuste(avisos);

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
                const rango = `${escribirHora(aMin(e.b.de), formato)} – ${escribirHora(aMin(e.b.a), formato)}`;
                return (
                  <td
                    key={g}
                    className="hor-c"
                    {...(vertical ? { rowSpan: e.largo } : { colSpan: e.largo })}
                  >
                    {/* La pila reparte la celda en proporciones. Sin fracción
                        —arr y aba a cero— sale el mismo marcado de siempre más
                        un div, y el bloque ocupa la celda entera. */}
                    <div className="hor-pila">
                      {e.arr > 0 && <i className={`hor-hueco hor-fr-${e.arr}`} aria-hidden="true" />}
                      <span
                        className={`hor-b hor-${e.b.tono ?? 'neutro'} hor-fr-${e.dur}`}
                        title={`${dias[dia]}, ${rango}`}
                      >
                        <b>{e.b.titulo}</b>
                        {e.b.detalle && <span>{e.b.detalle}</span>}
                        {/* El bloque SIEMPRE dice su franja en texto: deducirla de
                            la altura de la celda no es leerla. Y con el sombreado
                            fraccionado importa MÁS: el relleno redondea a cuartos,
                            el rótulo no redondea nada. */}
                        <span className="hor-rango">{rango}</span>
                      </span>
                      {e.aba > 0 && <i className={`hor-hueco hor-fr-${e.aba}`} aria-hidden="true" />}
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
