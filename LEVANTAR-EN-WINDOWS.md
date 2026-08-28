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

## Los candados — DIECISEIS comandos

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
docker compose exec ds node sistema/candado/verificar-promesa.mjs
docker compose exec ds node sistema/candado/verificar-elemento.mjs
docker compose exec ds node sistema/candado/verificar-empate.mjs
docker compose exec ds node sistema/candado/verificar-forma.mjs
docker compose exec ds node sistema/candado/verificar-omision.mjs
docker compose exec ds node sistema/candado/verificar-iconos.mjs
docker compose exec ds node sistema/candado/verificar-promesa-muerta.mjs
```

**Esta lista ya se quedo corta TRES veces**, y las tres costaron caro: el
2026-08-10 faltaban dos y no se corrieron en todo el dia — al correrlos, los dos
en rojo. Cuatro mas faltaban aqui hasta la v1.81.0. Y el 2026-08-28 seguia
diciendo CATORCE con dieciseis en el repositorio: faltaban `verificar-iconos` y
el recien nacido `verificar-promesa-muerta`. Una lista incompleta de candados es
un candado abierto: si se añade uno, se añade en los DOS sitios, aqui y en
`CLAUDE.md` §8.

Comprobados el 2026-08-28 sobre `main`, en la v1.95.0: **los dieciseis en
verde** — 186 pares recalculados con 0 fallos, 62 casos del candado de lint sin
fallos, 692 clases declaradas y 0 huerfanas, la cascada limpia a los once
anchos, y 573 pruebas en 38 archivos con `tsc --noEmit` limpio.

## Publicar desde esta maquina — lo que falta en el contenedor

`node` NO esta en la maquina y `git` y `gh` NO estan en el contenedor, asi que
el publicador —que es node y llama a los dos— no corre en ninguno de los dos
sitios tal cual. Se resuelve dandole al contenedor lo que le falta:

```powershell
docker compose exec ds sh -c "apk add --no-cache git github-cli"
docker compose exec ds sh -c "git config --global --add safe.directory /trabajo"

$t = (gh auth token).Trim()
docker compose exec -e GH_TOKEN=$t ds gh auth setup-git
docker compose exec -e GH_TOKEN=$t ds node sistema/paquete/publicar.mjs
docker compose exec -e GH_TOKEN=$t ds node sistema/paquete/publicar.mjs --publicar
```

`gh auth setup-git` deja un ayudante de credenciales que **lee el token del
entorno**: no se escribe ningun token en disco dentro del contenedor —
comprobado, `~/.config/gh/hosts.yml` no existe—. Los `apk add` se pierden al
recrear el contenedor, y hay que repetirlos.

El 2026-08-28 esto costo dos intentos fallidos: sin `git` el publicador ni
arranca, y con `git` pero sin credencial **crea la etiqueta local y falla al
empujarla**, que deja el trabajo a medias. Y hay una trampa peor: sin `gh`, la
poda de los ZIP viejos se salta **en silencio**, porque la lista de
publicaciones sale vacia y el publicador cree que no hay nada que borrar.

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
