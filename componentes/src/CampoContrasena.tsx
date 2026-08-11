/**
 * CAMPO DE CONTRASEÑA
 *
 * El campo que JAMÁS se normaliza — la regla estaba escrita antes de que el
 * campo existiera (manual §6bis): ni trim, ni caja, ni colapso de espacios.
 * Un espacio en una contraseña puede ser deliberado, y «limpiarlo» es cambiar
 * la llave sin avisar. Por eso NO usa el input propio de `Campo` (que recorta
 * al salir): se COMPONE con su render-prop y pone su propio input, exento por
 * construcción.
 *
 * Lo que trae, además del tipo:
 *   · El conmutador ver/no ver — botón de verdad con `aria-pressed`, dentro
 *     del campo. Mostrar es SOLO pantalla: el valor no cambia.
 *   · `autoComplete` correcto por defecto: `current-password`, y con
 *     `nueva` pasa a `new-password` — es lo que deja a los gestores de
 *     contraseñas hacer su trabajo.
 *   · Nada de bloquear pegado: quien pega desde su gestor está haciendo lo
 *     correcto, y estorbarlo empuja a contraseñas más cortas.
 */

import { useState } from 'react';
import { Campo } from './Campo';
import { Icono } from './Icono';

export type CampoContrasenaProps = {
  /** «Contraseña», «Contraseña actual», «Nueva contraseña»… Obligatoria. */
  etiqueta: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** `true` cuando se está CREANDO una contraseña: cambia el autoComplete a
   *  `new-password` para que el gestor ofrezca generar una. */
  nueva?: boolean;
  ayuda?: string;
  error?: string;
  placeholder?: string;
  deshabilitado?: boolean;
};

export function CampoContrasena({
  etiqueta,
  value,
  onChange,
  nueva = false,
  ayuda,
  error,
  placeholder,
  deshabilitado,
}: CampoContrasenaProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error}>
      {(a11y) => (
        <div className="cp">
          <input
            {...a11y}
            className={['campo', 'cp-in', error ? 'campo-mal' : ''].filter(Boolean).join(' ')}
            type={visible ? 'text' : 'password'}
            autoComplete={nueva ? 'new-password' : 'current-password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={deshabilitado}
            // Sin trim, sin nada: exacto lo que se teclea. La regla del §6bis.
          />
          <button
            type="button"
            className="cp-ver"
            aria-pressed={visible}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onClick={() => setVisible((v) => !v)}
            disabled={deshabilitado}
          >
            <Icono nombre={visible ? 'ojoTachado' : 'ojo'} tam="control" />
          </button>
        </div>
      )}
    </Campo>
  );
}
