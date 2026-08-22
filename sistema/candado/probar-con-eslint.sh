#!/bin/sh
# PRUEBA DEL CANDADO CON ESLINT DE VERDAD
#
#   docker-compose exec ds sh sistema/candado/probar-con-eslint.sh
#
# `probar-candado.mjs` comprueba los patrones y su incrustación sin ESLint.
# Esto comprueba lo único que aquello no puede: que los selectores de esquery
# sean válidos y que ESLint BLOQUEE de verdad.
#
# Dos afirmaciones, las dos necesarias:
#   1 · sobre el repositorio limpio, ESLint sale 0
#   2 · sobre el archivo de infracciones, ESLint sale 1
#
# La segunda es la que importa. Un candado que no se ha visto bloquear no
# protege nada.
set -e
echo ""
echo "  1 · el repositorio, que solo puede tener la DEUDA DECLARADA"
# Son los dos `style=` de Estados.tsx —esqueleto y progreso—, cuya decisión es
# del responsable y sigue sin tomarse. Estaban ahí y este paso exigía CERO, así
# que fallaba siempre: una prueba que falla siempre nadie la corre, y esta
# llevaba versiones sin correrse por eso. Ahora tolera exactamente esas dos y
# falla con cualquier otra — que es lo que se quería comprobar.
DEUDA=2
N=$(npx eslint . 2>&1 | grep -cE 'no-restricted-syntax' || true)
if [ "$N" -le "$DEUDA" ]; then
  echo "      ✓ $N infracción(es), la deuda declarada"
else
  echo "      ✗ $N infracciones: $((N - DEUDA)) por encima de la deuda declarada"
  npx eslint . 2>&1 | grep -E 'error|\.tsx|\.ts' | head -20
  exit 1
fi

echo "  2 · el archivo de infracciones, que debe BLOQUEAR"
SALIDA=$(npx eslint --config pruebas/candado.config.mjs pruebas/infracciones.tsx 2>&1 || true)
N=$(printf '%s' "$SALIDA" | grep -cE 'no-restricted-syntax' || true)
if [ "$N" -ge 8 ]; then
  echo "      ✓ $N infracciones cazadas"
else
  echo "      ✗ solo $N infracciones — el candado no está bloqueando"; exit 1
fi
# ─────────────────────────────────────────────────────────────────────────────
# 3 · EL CANDADO, A SOLAS, TIENE QUE SABER LEER TYPESCRIPT
#
# Lo reportó Control Administrativos: `import { type X }` —estándar desde
# TypeScript 4.5— hacía fallar el candado. El defecto era más ancho: sin
# analizador no se parseaba NADA de TypeScript, y ESLint moría con «Parsing
# error» ANTES de llegar a ninguna regla. Quien lo adoptaba veía un error que
# parecía de su archivo.
#
# Esto se prueba con el candado A SOLAS —no con la config del repositorio, que
# sí traía el analizador—, porque el hueco estaba justo ahí: el sistema lo tenía
# resuelto para sí y entregaba la versión sin resolver.
# ─────────────────────────────────────────────────────────────────────────────
echo "  3 · el candado a solas, sobre TypeScript de verdad"
TMP=$(mktemp -d)
cat > "$TMP/eslint.config.mjs" <<CONF
import candado from '/trabajo/sistema/candado/candado.eslint.config.mjs';
export default [ ...candado ];
CONF
cat > "$TMP/caso.tsx" <<CASO
import { type ReactNode } from 'react';
type Props = { hijo: ReactNode; n?: number };
export const X = ({ hijo, n = 0 }: Props): ReactNode => (n > 0 ? hijo : null);
CASO
SALIDA=$(cd "$TMP" && npx eslint caso.tsx 2>&1 || true)
if printf '%s' "$SALIDA" | grep -q 'Parsing error'; then
  echo "      ✗ el candado no sabe leer TypeScript:"
  printf '%s\n' "$SALIDA" | head -5
  rm -rf "$TMP"; exit 1
fi
echo "      ✓ lo lee sin morir en el análisis"
rm -rf "$TMP"

echo ""
echo "  El candado bloquea de verdad, y lee lo que se le entrega."
echo ""
