#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
deployer="$project_root/scripts/deploy-frontend.sh"
test_root="$(mktemp -d)"

cleanup() {
  rm -rf "$test_root"
}
trap cleanup EXIT

fail() {
  printf 'deploy-frontend test failure: %s\n' "$*" >&2
  exit 1
}

assert_contains() {
  local expected="$1"
  local target_file="$2"
  grep -F -- "$expected" "$target_file" >/dev/null 2>&1 || fail "file $target_file không chứa '$expected'"
}

assert_not_contains() {
  local unexpected="$1"
  local target_file="$2"
  if grep -F -- "$unexpected" "$target_file" >/dev/null 2>&1; then
    fail "file $target_file chứa giá trị không mong muốn: '$unexpected'"
  fi
}

deploy_directory="$test_root/deploy"
fake_bin="$test_root/bin"
docker_log="$test_root/docker.log"
docker_config_log="$test_root/docker-config-path"
curl_log="$test_root/curl.log"
deploy_log="$test_root/deploy.log"
output_log="$test_root/output.log"
release_sha='0123456789abcdef0123456789abcdef01234567'

mkdir -p "$deploy_directory" "$fake_bin"

cat > "$fake_bin/docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >> "$DOCKER_LOG"

if [ "${1:-}" = login ]; then
  printf '%s\n' "$DOCKER_CONFIG" > "$DOCKER_CONFIG_LOG"
  if [ "${FAIL_DOCKER_LOGIN:-0}" -eq 1 ]; then
    exit 1
  fi
  IFS= read -r token
  [ "$token" = "$EXPECTED_GHCR_TOKEN" ]
  exit 0
fi

if [ "${1:-}" = inspect ]; then
  if [ "${FAKE_HEALTH_FAIL:-0}" -eq 1 ]; then
    printf 'unhealthy\n'
  else
    printf 'healthy\n'
  fi
  exit 0
fi

case "$*" in
  *ps*-q*frontend*)
    printf 'frontend-container\n'
    exit 0
    ;;
  *compose*pull*frontend*)
    if [ "${FAKE_PULL_FAIL:-0}" -eq 1 ]; then
      exit 1
    fi
    exit 0
    ;;
  *compose*pull*)
    exit 80
    ;;
  *compose*up*frontend*)
    if [ "${FAKE_UP_FAIL:-0}" -eq 1 ]; then
      exit 1
    fi
    exit 0
    ;;
  *compose*up*)
    exit 81
    ;;
  *compose*config*)
    exit 0
    ;;
esac

exit 0
EOF
chmod +x "$fake_bin/docker"

cat > "$fake_bin/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$CURL_LOG"
if [ "${FAKE_PUBLIC_FAIL:-0}" -eq 1 ]; then
  exit 1
fi
exit 0
EOF
chmod +x "$fake_bin/curl"

export PATH="$fake_bin:$PATH"
export DPR_DEPLOY_DIRECTORY="$deploy_directory"
export DOCKER_LOG="$docker_log"
export DOCKER_CONFIG_LOG="$docker_config_log"
export CURL_LOG="$curl_log"
export FRONTEND_DEPLOY_HEALTH_ATTEMPTS=1
export FRONTEND_DEPLOY_HEALTH_INTERVAL_SECONDS=0
export FRONTEND_DEPLOY_HTTP_TIMEOUT_SECONDS=5
export GHCR_USERNAME='example'
export GHCR_TOKEN='test-token'
export EXPECTED_GHCR_TOKEN='test-token'

reset_fixture() {
  local frontend_img="${1:-ghcr.io/huutawn/dprental-frontend:previous}"
  mkdir -p "$deploy_directory"
  printf 'DEV_APP_DOMAIN=dev.example.test\n' > "$deploy_directory/.env"
  cat > "$deploy_directory/release.env" <<EOF
BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable
AUTH_SERVICE_IMAGE=ghcr.io/example/dprental-auth:stable
FRONTEND_IMAGE=$frontend_img
EOF
  touch "$deploy_directory/compose.yaml"
  : > "$docker_log"
  : > "$curl_log"
  : > "$deploy_log"
  : > "$output_log"
  rm -f "$docker_config_log"
}

# 1. Happy path: đối số SHA hợp lệ, chỉ pull/recreate frontend, xóa config tạm, smoke test pass
reset_fixture "ghcr.io/huutawn/dprental-frontend:previous"
bash "$deployer" "$release_sha" > "$deploy_log" 2>&1

assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_contains "BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable" "$deploy_directory/release.env"
assert_contains "AUTH_SERVICE_IMAGE=ghcr.io/example/dprental-auth:stable" "$deploy_directory/release.env"

assert_contains 'login ghcr.io --username example --password-stdin' "$docker_log"
assert_not_contains 'test-token' "$docker_log"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm vẫn tồn tại sau deploy thành công.'

assert_contains 'pull frontend' "$docker_log"
assert_contains 'up -d --no-deps --force-recreate frontend' "$docker_log"
assert_not_contains 'pull backend' "$docker_log"
assert_not_contains 'recreate backend' "$docker_log"
assert_not_contains 'auth' "$docker_log"

assert_contains 'https://dev.example.test/' "$curl_log"
assert_contains "Frontend revision $release_sha đã healthy" "$deploy_log"

# 2. Happy path: truyền qua stdin với GITHUB_SHA
reset_fixture "ghcr.io/huutawn/dprental-frontend:previous"
GITHUB_SHA="$release_sha" bash -s -- < "$deployer" > "$deploy_log" 2>&1

assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm vẫn tồn tại sau deploy qua stdin.'

# 3. Lần deploy đầu tiên: thay thế FRONTEND_IMAGE đang dùng digest sha256
initial_digest="ghcr.io/huutawn/dprental-frontend@sha256:$(printf 'a%.0s' {1..64})"
reset_fixture "$initial_digest"
bash "$deployer" "$release_sha" > "$deploy_log" 2>&1

assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_not_contains "$initial_digest" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm vẫn tồn tại sau deploy từ digest.'

# 4. SHA không hợp lệ
reset_fixture "ghcr.io/huutawn/dprental-frontend:previous"
if bash "$deployer" "not-a-valid-sha" > "$output_log" 2>&1; then
  fail 'SHA không hợp lệ lại được chấp nhận.'
fi
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:previous" "$deploy_directory/release.env"
[ ! -s "$docker_log" ] || fail 'Lệnh docker được gọi dù SHA không hợp lệ.'

if bash "$deployer" '0123456789ABCDEF0123456789ABCDEF01234567' > "$output_log" 2>&1; then
  fail 'SHA chữ hoa lại được chấp nhận.'
fi

if GITHUB_SHA="invalid" bash "$deployer" > "$output_log" 2>&1; then
  fail 'GITHUB_SHA không hợp lệ lại được chấp nhận.'
fi

if bash "$deployer" "$release_sha" "extra-argument" > "$output_log" 2>&1; then
  fail 'Thừa đối số lại được chấp nhận.'
fi

# 5. Thiếu file bắt buộc hoặc cấu hình
reset_fixture
rm -f "$deploy_directory/.env"
if bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Thiếu .env lại được chấp nhận.'
fi

reset_fixture
rm -f "$deploy_directory/release.env"
if bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Thiếu release.env lại được chấp nhận.'
fi

reset_fixture
rm -f "$deploy_directory/compose.yaml"
if bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Thiếu compose.yaml lại được chấp nhận.'
fi

reset_fixture
printf 'BACKEND_IMAGE=backend:stable\n' > "$deploy_directory/release.env"
if bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'release.env thiếu FRONTEND_IMAGE lại được chấp nhận.'
fi

reset_fixture
printf 'OTHER_VAR=value\n' > "$deploy_directory/.env"
if bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail '.env thiếu DEV_APP_DOMAIN lại được chấp nhận.'
fi

# 6. Thiếu credentials
reset_fixture
if GHCR_USERNAME='' bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Thiếu GHCR_USERNAME lại được chấp nhận.'
fi

if GHCR_TOKEN='' bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Thiếu GHCR_TOKEN lại được chấp nhận.'
fi

# 7. Lỗi login: dừng deploy, xóa Docker config tạm
reset_fixture
if FAIL_DOCKER_LOGIN=1 bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Docker login lỗi nhưng deploy vẫn thành công.'
fi
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại khi login thất bại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm không được xóa khi login thất bại.'
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:previous" "$deploy_directory/release.env"
assert_not_contains "up " "$docker_log"

# 8. Lỗi pull: giữ tag mới trong release.env, không up, không rollback, xóa Docker config tạm
reset_fixture
if FAKE_PULL_FAIL=1 bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Pull image lỗi nhưng deploy vẫn thành công.'
fi
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_contains "BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable" "$deploy_directory/release.env"
assert_contains "AUTH_SERVICE_IMAGE=ghcr.io/example/dprental-auth:stable" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại khi pull thất bại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm không được xóa khi pull thất bại.'
assert_not_contains "up " "$docker_log"

# 9. Lỗi start (up): giữ tag mới trong release.env, không rollback recreate, xóa Docker config tạm
reset_fixture
if FAKE_UP_FAIL=1 bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Khởi động container lỗi nhưng deploy vẫn thành công.'
fi
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_contains "BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại khi up thất bại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm không được xóa khi up thất bại.'
[ "$(grep -c ' up ' "$docker_log")" -eq 1 ] || fail 'Có lần up/recreate khôi phục ngoài ý muốn khi up thất bại.'

# 10. Lỗi health timeout: giữ tag mới, không rollback recreate, xóa Docker config tạm
reset_fixture
if FAKE_HEALTH_FAIL=1 bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Health check timeout nhưng deploy vẫn thành công.'
fi
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_contains "BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại khi health check thất bại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm không được xóa khi health check thất bại.'
[ "$(grep -c ' up ' "$docker_log")" -eq 1 ] || fail 'Có lần up/recreate khôi phục ngoài ý muốn khi health thất bại.'

# 11. Lỗi smoke test: giữ tag mới, không rollback recreate, xóa Docker config tạm
reset_fixture
if FAKE_PUBLIC_FAIL=1 bash "$deployer" "$release_sha" > "$output_log" 2>&1; then
  fail 'Smoke test thất bại nhưng deploy vẫn thành công.'
fi
assert_contains "FRONTEND_IMAGE=ghcr.io/huutawn/dprental-frontend:$release_sha" "$deploy_directory/release.env"
assert_contains "BACKEND_IMAGE=ghcr.io/example/dprental-backend:stable" "$deploy_directory/release.env"
[ -f "$docker_config_log" ] || fail 'DOCKER_CONFIG_LOG không được ghi lại khi smoke test thất bại.'
[ ! -e "$(< "$docker_config_log")" ] || fail 'Docker config tạm không được xóa khi smoke test thất bại.'
[ "$(grep -c ' up ' "$docker_log")" -eq 1 ] || fail 'Có lần up/recreate khôi phục ngoài ý muốn khi smoke test thất bại.'
assert_contains 'https://dev.example.test/' "$curl_log"

printf 'Đã đạt toàn bộ regression test cho script triển khai Frontend.\n'
