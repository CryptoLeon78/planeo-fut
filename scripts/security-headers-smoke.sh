#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
EXPECTED_ENV="${APP_ENV:-development}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsS -D "$TMP_DIR/ssr" -o /dev/null "$BASE_URL/"
curl -fsS -D "$TMP_DIR/api" -o /dev/null "$BASE_URL/api/public/health"
curl -fsS -X POST -D "$TMP_DIR/rpc" -o /dev/null "$BASE_URL/api/rpc/security-probe"

header() { tr -d '\r' < "$1" | awk -F': ' -v key="$2" 'tolower($1)==tolower(key) { print substr($0, index($0, ":") + 2) }' | tail -1; }

for name in x-content-type-options strict-transport-security referrer-policy permissions-policy cross-origin-opener-policy; do
  ssr="$(header "$TMP_DIR/ssr" "$name")"
  test -n "$ssr"
  test "$ssr" = "$(header "$TMP_DIR/api" "$name")"
  test "$ssr" = "$(header "$TMP_DIR/rpc" "$name")"
done

test "$(header "$TMP_DIR/api" content-security-policy)" = "$(header "$TMP_DIR/rpc" content-security-policy)"
test "$(header "$TMP_DIR/api" x-frame-options)" = "DENY"
test "$(header "$TMP_DIR/rpc" cache-control)" = "no-store"
ssr_csp="$(header "$TMP_DIR/ssr" content-security-policy)"
if [[ "$EXPECTED_ENV" == "production" ]]; then [[ "$ssr_csp" == *"upgrade-insecure-requests"* ]]; fi
if [[ "$EXPECTED_ENV" != "development" ]]; then [[ "$ssr_csp" != *"localhost"* ]]; fi
printf 'Security header smoke passed for %s\n' "$EXPECTED_ENV"