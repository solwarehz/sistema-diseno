# Levantar este repo en la PC Windows

Notas de esta maquina. No sustituye a `CLAUDE.md` ni al `README.md`: los
complementa con lo que cambia en Windows y con lo que se comprobo al clonar.

Rama `main`, un commit por delante de `v1.19.0` (solo `memoria:`, sin codigo).
`v1.19.0` es la version que consume `ae-asistencia-frontend`.

## Arrancar

```powershell
$env:Path += ";C:\Program Files\Docker\Docker\resources\bin"

docker compose up -d                        # contenedor de trabajo (node 20)
docker compose exec ds npm install          # deps de raiz, en volumen
docker compose exec ds sh -c "cd componentes && npm install"
```

`node_modules` vive en volumenes con nombre, no en la carpeta. Se deshace entero
con `docker compose down -v`.

## Ver el catalogo

```powershell
docker run --rm -d --name mmi-cascaron -p 127.0.0.1:8080:80 `
  -v "${PWD}\cascaron:/usr/share/nginx/html:ro" nginx:alpine
```

<http://127.0.0.1:8080> · solo en loopback y montado de solo lectura.
Para pararlo: `docker rm -f mmi-cascaron`.

## Los candados — nueve comandos, no siete

```powershell
docker compose exec ds node sistema/tokens/generar.mjs
docker compose exec ds node sistema/candado/verificar-contraste.mjs
docker compose exec ds node sistema/candado/verificar-color.mjs
docker compose exec ds node sistema/candado/auditar-cascaron.mjs
docker compose exec ds node sistema/candado/probar-candado.mjs
docker compose exec ds node sistema/componentes/extraer.mjs
docker compose exec ds node sistema/candado/verificar-cascada.mjs
docker compose exec ds node sistema/candado/verificar-contrato.mjs
docker compose exec ds node sistema/candado/verificar-entrega.mjs
```

Los dos últimos faltaban aquí y en CLAUDE.md §8 (la memoria sí los contaba):
el 2026-08-10 no se corrieron en todo el día por eso, y al correrlos estaban
en rojo los dos.

Comprobados el 2026-08-10 sobre `main`: **los siete en verde** — 178 pares
recalculados con 0 fallos, 62 casos del candado de lint sin fallos, 485 clases
declaradas y 0 huerfanas, y la cascada limpia a los once anchos.

Pruebas de componentes: **180 en verde** (13 archivos) y `tsc --noEmit` limpio.

## Cuatro cosas que hay que saber

**1 · `npm run componentes-probar` no funciona desde la raiz.** El script hace
`cd componentes && vitest run`, pero npm fija el `PATH` antes del `cd`, asi que
busca `vitest` en `node_modules/.bin` de la raiz, donde no esta. Sale
`sh: vitest: not found`. La forma que si corre:

```powershell
docker compose exec ds sh -c "cd componentes && npm run probar"
```

**2 · ESLint sale con 2 errores en `main`**, y son infracciones del propio
candado del sistema — atributo `style` en linea en
`componentes/src/Estados.tsx:45` y `:144`, prohibido por §2.5.6. No lo he
tocado: `zonas-protegidas` y la politica del repo mandan sobre esto, y la
decision de arreglarlo es del responsable.

```powershell
docker compose exec ds npm run lint
```

**3 · El ruido de CRLF ya esta arreglado** (2026-08-10, autorizado por el
responsable). Este repo tiene `git config core.autocrlf false`: git compara
bytes y no convierte nada. Los generados viven en LF (los escribe el
contenedor) y asi se quedan. Si `git status` volviera a marcar generados sin
diff de contenido, normalizar a LF con `sed -i 's/\r$//'` — no con checkout.

**4 · Docker esta autorizado de forma permanente en este proyecto** (2026-08-10).
Levantar y apagar contenedores del proyecto no requiere permiso por vez; el
limite es el ambiente del proyecto, nada fuera. Detalle en `CLAUDE.md` §3.

## Lo que no viene en el clon

`marca/02_identidad/` llega con solo un `LEEME.md`: los binarios de diseno son
propiedad del cliente y `.gitignore` los excluye. **Es lo correcto, no un
error.** Faltan los PNG del nombre y de tipografia (se piden al usuario), y no
existen ni el escudo suelto ni el isotipo simplificado — eso es trabajo de
disenador, no de codigo.

**`imagenes/` (escudo y lockup del catalogo) ya esta en esta maquina** — el
2026-08-10 se recupero del historial de git: los PNG viajan embebidos en
base64 dentro de cualquier `cascaron/index.html` anterior, asi que se
extrajeron byte a byte de la version v1.19.0. Si se pierde, misma receta. El
generador ademas avisa si genera sin ellos: un catalogo sin logos NO se
commitea.
