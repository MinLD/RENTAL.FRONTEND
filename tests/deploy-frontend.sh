#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/bin" "$test_root/deploy"
cat > "$test_root/bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
case "$1" in
  pull)
    [ "${FAKE_PULL_FAIL:-0}" -eq 0 ]
    ;;
  inspect)
    if [ "${FAKE_HEALTH_FAIL:-0}" -eq 1 ]; then
      printf 'unhealthy\n'
    else
      printf 'healthy\n'
    fi
    ;;
  compose)
    for arg in "$@"; do
      case "$arg" in
        config|up)
          exit 0
          ;;
        ps)
          printf 'frontend-container\n'
          exit 0
          ;;
        pull|exec)
          exit 80
          ;;
      esac
    done
    exit 81
    ;;
  *)
    exit 82
    ;;
esac
EOF
cat > "$test_root/bin/curl" <<'EOF'
#!/usr/bin/env bash
exit "${FAKE_PUBLIC_FAIL:-0}"
EOF
chmod +x "$test_root/bin/docker" "$test_root/bin/curl"

export PATH="$test_root/bin:$PATH"
export DPR_DEPLOY_DIRECTORY="$test_root/deploy"
export FAKE_DOCKER_LOG="$test_root/docker.log"
export FRONTEND_DEPLOY_HEALTH_ATTEMPTS=1
export FRONTEND_DEPLOY_HEALTH_INTERVAL_SECONDS=0
printf 'DEV_APP_DOMAIN=dev.example.test\n' > "$DPR_DEPLOY_DIRECTORY/.env"
printf 'services: {}\n' > "$DPR_DEPLOY_DIRECTORY/compose.yaml"

old_image='ghcr.io/huutawn/dprental-frontend:previous'
new_image="ghcr.io/huutawn/dprental-frontend@sha256:$(printf 'a%.0s' {1..64})"
reset_release() {
  printf 'BACKEND_IMAGE=backend:stable\nFRONTEND_IMAGE=%s\n' "$old_image" > "$DPR_DEPLOY_DIRECTORY/release.env"
  : > "$FAKE_DOCKER_LOG"
}
assert_release() {
  rg -q "^FRONTEND_IMAGE=$1$" "$DPR_DEPLOY_DIRECTORY/release.env"
  rg -q '^BACKEND_IMAGE=backend:stable$' "$DPR_DEPLOY_DIRECTORY/release.env"
}

reset_release
if bash "$project_root/scripts/deploy-frontend.sh" 'ghcr.io/other/image@sha256:bad' > "$test_root/output" 2>&1; then
  echo 'invalid digest was accepted' >&2
  exit 1
fi
assert_release "$old_image"
[ ! -s "$FAKE_DOCKER_LOG" ]

reset_release
if FAKE_PULL_FAIL=1 bash "$project_root/scripts/deploy-frontend.sh" "$new_image" > "$test_root/output" 2>&1; then
  echo 'failed pull was accepted' >&2
  exit 1
fi
assert_release "$old_image"
! rg -q ' up | exec ' "$FAKE_DOCKER_LOG"

reset_release
bash "$project_root/scripts/deploy-frontend.sh" "$new_image" > "$test_root/output" 2>&1
assert_release "$new_image"
[ "$(rg -c ' up ' "$FAKE_DOCKER_LOG")" -eq 1 ]
! rg -q ' exec | compose .* pull ' "$FAKE_DOCKER_LOG"

reset_release
if FAKE_HEALTH_FAIL=1 bash "$project_root/scripts/deploy-frontend.sh" "$new_image" > "$test_root/output" 2>&1; then
  echo 'unhealthy deployment was accepted' >&2
  exit 1
fi
assert_release "$old_image"
[ "$(rg -c ' up ' "$FAKE_DOCKER_LOG")" -eq 2 ]

reset_release
if FAKE_PUBLIC_FAIL=1 bash "$project_root/scripts/deploy-frontend.sh" "$new_image" > "$test_root/output" 2>&1; then
  echo 'failed public smoke test was accepted' >&2
  exit 1
fi
assert_release "$old_image"
[ "$(rg -c ' up ' "$FAKE_DOCKER_LOG")" -eq 2 ]

echo 'deploy-frontend tests passed'
