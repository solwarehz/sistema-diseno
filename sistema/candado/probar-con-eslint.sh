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
echo "  1 · el repositorio, que debe salir limpio"
if npx eslint . >/dev/null 2>&1; then
  echo "      ✓ 0 errores"
else
  echo "      ✗ el repositorio tiene infracciones"; exit 1
fi

echo "  2 · el archivo de infracciones, que debe BLOQUEAR"
SALIDA=$(npx eslint --config pruebas/candado.config.mjs pruebas/infracciones.tsx 2>&1 || true)
N=$(printf '%s' "$SALIDA" | grep -cE 'no-restricted-syntax' || true)
if [ "$N" -ge 8 ]; then
  echo "      ✓ $N infracciones cazadas"
else
  echo "      ✗ solo $N infracciones — el candado no está bloqueando"; exit 1
fi
echo ""
echo "  El candado bloquea de verdad."
echo ""
