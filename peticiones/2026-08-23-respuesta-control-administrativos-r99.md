# Respuesta a Control Administrativos V2.0 — R99 · tres motivos, y permisos compartidos

**Fecha:** 23 de agosto de 2026 · **Resuelto en:** **v1.74.0**
**Instalar:** `npm install "github:solwarehz/sistema-diseno#v1.74.0"`

**Los dos cambios son aditivos.** Si ya tienen la v1.73.0 integrada, esto no les
obliga a tocar nada: `cerrado: 'texto'` sigue significando lo mismo y `clave` es
opcional. Pueden subir cuando quieran.

---

## 1 · Tres motivos 🔴 — tienen razón, y nos citaron bien

*«Un apagado invita a encenderlo»* está escrito en nuestro `Interruptor` desde
que se hizo, y el panel lo estaba incumpliendo: colapsaba tres cosas distintas
en un solo `cerrado`.

```ts
cerrado: { tipo: 'cerrado',   motivo: 'Un organigrama no se borra: se cierra con fecha.' }
cerrado: { tipo: 'ajeno',     motivo: 'Su cargo no exporta, así que no puede concederlo.' }
cerrado: { tipo: 'pendiente', motivo: 'Llega en la próxima entrega.' }
```

| | Icono | Etiqueta | Qué se hace |
|---|---|---|---|
| `cerrado` | candado | «no se puede conceder» | olvidarlo |
| `ajeno` | usuarios | «no lo tiene usted» | hablar con quien sí |
| `pendiente` | información | «todavía no existe» | esperar |

Cada uno con icono, etiqueta y motivo propios, y **ninguno se pinta como
interruptor apagado**. `cerrado: 'texto'` sigue valiendo y significa `cerrado`.

**Y lo no repartible deja de contar en el «4 de 6»**: contarlo hacía que un
cargo pareciera incompleto por reglas que no dependen de él.

---

## 2 · Privilegios que comparten clave 🔴 — hecho

```ts
{ id: 'editar', nombre: 'Editar', clave: 'escritura' },
{ id: 'crear',  nombre: 'Crear',  clave: 'escritura' },
```

Se encienden y se apagan juntos, y **el aviso va en la etiqueta**: «Editar · va
con Crear».

Adoptamos su decisión tal cual, incluido el descarte: **no se colapsan en un
control**, porque —como ustedes comprobaron— la acción desaparece de la lista y
nadie sabe que existe.

Una consecuencia que no buscábamos y conviene que sepan: como el aviso está en
la etiqueta y no en un texto aparte, **es también el nombre accesible**. Un
lector de pantalla anuncia «Editar, va con Crear, interruptor, desactivado»
*antes* de que se pulse. Lo descubrimos porque una prueba nuestra falló:
`/Editar/` casaba dos interruptores, el de Editar y el de Crear.

---

## 3 · La matriz ⚠️ — fue decisión, y la explicamos

Tienen razón en anotarlo. **Fue una decisión, no un descuido**, y estas son las
razones:

- Sus módulos tienen **acciones distintas**; en una matriz, la mayoría de las
  celdas quedan vacías y hay que inventar un símbolo para «no aplica» — que es
  de donde venían los puntos «·».
- La matriz **no cabe a 390 px** sin desplazamiento lateral, que era su motivo
  principal para dejarla.

**Lo que la matriz sí hace mejor es auditar**: comparar cargos entre sí de un
vistazo. Si eso hace falta, la salida no es volver atrás sino **una vista
alternativa** sobre los mismos datos — ya está dibujada en el mockup que les
pasamos, en la propuesta B.

Dígannos si la quieren y entra como `vista="matriz"`. No la hacemos por
adelantado: un componente que dice que sí a todo deja de ser un componente.

---

## Sobre la integración que tienen en local

No podemos mirar sus pantallas, así que lo decimos como recomendación, no como
verificación: **suban la 1.74.0 antes de revisar**, porque el cambio de los tres
motivos afecta a lo que se ve en la pantalla de privilegios y sería una revisión
perdida.

Y un aviso honesto que nos toca: la v1.72.0 se publicó con **cinco iconos rotos**
en la página del catálogo del panel, y no lo vio ningún candado — lo cazamos
mirando una captura. Ya está corregido y ahora hay una comprobación que lo
impide, pero es la razón por la que su plan de mirar un par de pantallas antes
de subir nos parece el correcto.

## Verificación

- **Trece candados en verde** · **447 pruebas**, 8 nuevas · `tsc --noEmit` limpio.
- Los tres motivos y el permiso compartido están **escritos como prueba**,
  incluida la que comprueba que ninguno de los tres se pinta como interruptor.
