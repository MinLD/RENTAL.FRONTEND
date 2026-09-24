#!/usr/bin/env bash

set -euo pipefail

readonly DEPLOY_DIRECTORY="${DPR_DEPLOY_DIRECTORY:-/opt/dprental/dev}"
readonly ENVIRONMENT_FILE="$DEPLOY_DIRECTORY/.env"
readonly RELEASE_FILE="$DEPLOY_DIRECTORY/release.env"
readonly COMPOSE_FILE="$DEPLOY_DIRECTORY/compose.yaml"
readonly HEALTH_ATTEMPTS="${FRONTEND_DEPLOY_HEALTH_ATTEMPTS:-18}"
readonly HEALTH_INTERVAL_SECONDS="${FRONTEND_DEPLOY_HEALTH_INTERVAL_SECONDS:-5}"
readonly HTTP_TIMEOUT_SECONDS="${FRONTEND_DEPLOY_HTTP_TIMEOUT_SECONDS:-15}"

fail() {
  printf 'Triển khai Frontend: %s\n' "$*" >&2
  exit 1
}

usage() {
  printf 'Cách dùng: %s <ghcr.io/huutawn/dprental-frontend@sha256:digest>\n' "${0##*/}" >&2
  exit 2
}

require_file() {
  [ -f "$1" ] || fail "không tìm thấy file bắt buộc: $1"
}

read_release_value() {
  local variable_name="$1"
  local line

  line="$(grep -E "^${variable_name}=" "$RELEASE_FILE" | tail -n 1)" || \
    fail "release.env chưa có ${variable_name}."
  printf '%s\n' "${line#*=}"
}

read_environment_value() {
  local variable_name="$1"
  local line

  line="$(grep -E "^${variable_name}=" "$ENVIRONMENT_FILE" | tail -n 1)" || \
    fail ".env chưa có ${variable_name}."
  printf '%s\n' "${line#*=}"
}

update_release_image() {
  local frontend_image="$1"
  local temporary_file

  temporary_file="$(mktemp "$DEPLOY_DIRECTORY/.release.env.XXXXXX")" || \
    fail 'không thể tạo file release tạm thời.'
  if ! awk \
    -v frontend_image="$frontend_image" \
    '
      /^FRONTEND_IMAGE=/ {
        print "FRONTEND_IMAGE=" frontend_image
        frontend_found = 1
        next
      }
      { print }
      END {
        if (!frontend_found) {
          exit 42
        }
      }
    ' "$RELEASE_FILE" > "$temporary_file"; then
    rm -f "$temporary_file"
    fail 'release.env thiếu image Frontend.'
  fi

  chmod 0600 "$temporary_file"
  mv "$temporary_file" "$RELEASE_FILE"
}

restore_previous_release() {
  local exit_status="$1"

  trap - EXIT
  if [ "$release_updated" -eq 1 ]; then
    printf 'Triển khai thất bại; khôi phục Frontend trước đó...\n' >&2
    mv "$previous_release" "$RELEASE_FILE" || \
      fail 'không thể khôi phục release.env.'
    "${compose_command[@]}" up -d --no-deps --force-recreate frontend || \
      fail 'không thể khởi động lại Frontend trước đó.'
  else
    rm -f "$previous_release"
  fi
  exit "$exit_status"
}

wait_for_frontend_health() {
  local container_id
  local health_status
  local attempt

  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
    container_id="$(${compose_command[@]} ps -q frontend)"
    if [ -n "$container_id" ]; then
      health_status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
      if [ "$health_status" = healthy ]; then
        return 0
      fi
      printf 'Đang chờ Frontend healthy (%s/%s, trạng thái: %s)...\n' \
        "$attempt" "$HEALTH_ATTEMPTS" "$health_status"
    else
      printf 'Đang chờ container Frontend được tạo (%s/%s)...\n' \
        "$attempt" "$HEALTH_ATTEMPTS"
    fi
    sleep "$HEALTH_INTERVAL_SECONDS"
  done

  fail 'Frontend không đạt trạng thái healthy.'
}

wait_for_public_frontend() {
  local domain="$1"
  local attempt

  for ((attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++)); do
    if curl --fail --silent --show-error --max-time "$HTTP_TIMEOUT_SECONDS" \
      "https://${domain}/" >/dev/null; then
      return 0
    fi
    printf 'Đang chờ Frontend public qua Caddy/Cloudflare (%s/%s)...\n' \
      "$attempt" "$HEALTH_ATTEMPTS"
    sleep "$HEALTH_INTERVAL_SECONDS"
  done

  fail 'frontend công khai qua Caddy/Cloudflare thất bại.'
}

[ "$#" -eq 1 ] || usage
frontend_image="$1"
[[ "$frontend_image" =~ ^ghcr\.io/huutawn/dprental-frontend@sha256:[0-9a-f]{64}$ ]] || \
  fail 'image phải là digest sha256 của ghcr.io/huutawn/dprental-frontend.'

require_file "$ENVIRONMENT_FILE"
require_file "$RELEASE_FILE"
require_file "$COMPOSE_FILE"

readonly -a compose_command=(docker compose --project-directory "$DEPLOY_DIRECTORY" --file "$COMPOSE_FILE" --env-file "$ENVIRONMENT_FILE" --env-file "$RELEASE_FILE")

read_release_value FRONTEND_IMAGE >/dev/null
frontend_domain="$(read_environment_value DEV_APP_DOMAIN)"

printf 'Đang phát hành Frontend image %s...\n' "$frontend_image"
"${compose_command[@]}" config --quiet
docker pull "$frontend_image"

previous_release="$(mktemp "$DEPLOY_DIRECTORY/.release.env.previous.XXXXXX")" || \
  fail 'không thể tạo bản sao release.env.'
release_updated=0
trap 'restore_previous_release "$?"' EXIT
cp -p "$RELEASE_FILE" "$previous_release"

release_updated=1
update_release_image "$frontend_image"
"${compose_command[@]}" config --quiet
"${compose_command[@]}" up -d --no-deps --force-recreate frontend

wait_for_frontend_health
wait_for_public_frontend "$frontend_domain"

trap - EXIT
rm -f "$previous_release"
printf 'Frontend image %s đã healthy; smoke test công khai đã pass.\n' "$frontend_image"
