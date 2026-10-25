# Vận hành Frontend dev

Runner `gha-frontend` ở `/opt/actions-runner-frontend`; service
`actions.runner.huutawn-DPRENTAL.FRONTEND.dprental-frontend-deploy.service`.
Đã đăng ký thì không chạy lại `config.sh`. Cài/chạy service bằng `sudo ./svc.sh install gha-frontend`
và `sudo ./svc.sh start` từ đúng thư mục runner. `sudo -iu` chuyển về home;
phải `cd /opt/actions-runner-frontend` sau khi đổi user, mỗi lệnh trên một dòng.

## Quyền và GHCR

Dùng duy nhất entrypoint chung `/usr/local/sbin/dprental-deploy` do root sở hữu.
Bản source `scripts/dprental-deploy` mở rộng entrypoint BE hiện có để nhận `frontend`,
kiểm tra đúng repository FE Private và khóa `gha-frontend` vào service Frontend.
Không tạo deployment path thứ hai. `deploy-common.sh` dùng chung canonical installation
`/usr/local/libexec/dprental`, bổ sung approval strategy `none` cho Frontend.
Khi cập nhật tooling từ các branch BE, phải giữ phần hỗ trợ Frontend trong bản cài chung.
Script root không chạy code từ checkout runner. Không cấp nhóm docker hoặc quyền đọc `.env`.

Sudoers (root:root, 0440; kiểm tra `visudo -cf` trước khi cài):

```sudoers
Defaults:gha-frontend env_reset, !setenv
gha-frontend ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/dprental-deploy frontend *
```

Wrapper kiểm tra đúng hai arguments và SHA 40 hex, từ chối service khác và caller không hợp lệ.
Giữ `/opt/dprental/dev` và `/etc/dprental-deploy` root:root 0700,
`.env`/`release.env` root:root 0600; Compose, scripts và mọi ancestor không cho runner ghi.
Không chép secret vào workspace. Registry dùng `GITHUB_TOKEN` `packages:read`
truyền stdin, kiểm tra manifest trên hosted runner, Docker config tạm bị xóa khi kết thúc.
Package phải cấp Actions access cho repository `huutawn/DPRENTAL.FRONTEND`.

## Approval và deployment

Repository và runner phải Private/Online; workflow xác minh Private trên hosted runner,
wrapper kiểm tra lại live API. Chỉ branch `develop-ci-cd`, event `push` được deploy;
không chạy code PR trên VM. Đặt repository variable `DEV_DEPLOY_ENABLED=true`.
Mỗi SHA cần file approval do admin tạo, root:root 0600, dưới thư mục root 0700:
`/opt/dprental/dev/approvals/frontend/<SHA>`:

```json
{"service":"frontend","sha":"<40-hex-sha>","expires_at":0,"migration_strategy":"none","review":"admin approved"}
```

Thay SHA thật và `expires_at` bằng Unix time tương lai, tối đa 24h.
Approval chỉ dùng một lần. Khi cần deploy thủ công, admin tạo approval rồi truyền
username/token read:packages qua stdin đến `sudo /usr/local/sbin/dprental-deploy frontend <SHA>`;
không ghi token vào command line/history. Có thể rerun đúng deploy job trên Actions;
không cần build lại cùng SHA.

GitHub concurrency chỉ có phạm vi repository; FE và BE **không** serialize nhau bằng
`concurrency.group`. Cả hai dùng cùng host `flock` `.deployment.lock` để bảo vệ release state.
Chỉ pull/recreate `frontend --no-deps --pull never --no-build`, không restart Gateway.
Không migration hoặc backup DB vì FE không thay đổi schema.
Candidate Compose kiểm tra trước mutation; container healthy, internal HTTP và public
`https://dev-app.lazyops.cloud/` thành công mới atomically ghi `FRONTEND_IMAGE`.
Giữ nguyên mọi image BE. DNS/Tunnel failure được phân loại riêng với app health.

## Logs và recovery

Xem runner: `sudo journalctl -u actions.runner.huutawn-DPRENTAL.FRONTEND.dprental-frontend-deploy.service -n 60`.
Xem application qua `sudo docker logs --tail 100 dprental-dev-frontend-1` (xác định tên bằng `docker ps`).
Journal root-only: `/opt/dprental/dev/.deployments/frontend-<SHA>.*`, gồm previous.env,
candidate.env, result, phase, events và approval đã dùng. Preflight fail không đổi runtime/release.
Failure sau recreate giữ previous release state và `.deployment-pending` để chặn deploy tiếp theo;
container thực tế có thể đã dùng image mới. Không xóa marker khi chưa đánh giá trạng thái thực tế.

Rollback image: admin lấy SHA trước từ previous.env, xác nhận image và config tương thích,
điều tra marker, ghi nhận recovery rồi mới dọn marker và cấp approval mới cho SHA cũ,
rerun entrypoint. Không copy đè toàn bộ previous.env vì có release của BE.
Không rollback schema, không xóa volumes. FE không chạy migration nên không có DB restore.
Giữ VPS/SSH secrets cho đến khi quyết định ngừng hạ tầng riêng; workflow FE không phụ thuộc chúng.
