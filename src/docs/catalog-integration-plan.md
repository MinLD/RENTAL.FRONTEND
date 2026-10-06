# Kế hoạch tích hợp CatalogService

Nguồn đã kiểm tra: Swagger `CatalogService` tại `https://dev-api.lazyops.cloud/swagger/index.html?urls.primaryName=CatalogService`.

Swagger mới hiện có **25 paths** (kiểm tra lại ngày 06/10/2026):

- Brand public/admin: `/api/v1/catalog/brands`, `/api/v1/catalog/admin/brands`, enable/disable.
- Category public/admin mutation: `/api/v1/catalog/categories`.
- Equipment Type public/admin mutation: `/api/v1/catalog/equipment-types`.
- Spec Schema version: `/api/v1/catalog/equipment-types/{id}/spec-schemas`.
- Published schema: `/api/v1/catalog/equipment-types/{equipmentTypeId}/schema`.
- Specification validation: `/api/v1/catalog/equipment-types/{equipmentTypeId}/specifications/validate`.

Ghi chú contract:

- Paging response dùng `{ items, page, pageSize, totalCount, totalPages }`.
- Query params Brand public: `Keyword`, `Page`, `PageSize`, `Sort`.
- Query params Brand admin: `Keyword`, `Page`, `PageSize`, `Sort`, `IsActive`.
- Category admin list/detail dùng `/api/v1/catalog/admin/categories` và `/api/v1/catalog/admin/categories/{id}` để đọc cả active/inactive. List hỗ trợ `Keyword`, `Page`, `PageSize`, `Sort`, `IsActive`.
- Category public list `/api/v1/catalog/categories` trả mảng danh mục active, không có query search/filter/paging.
- Query params Equipment Type public: `Keyword`, `CategoryId`, `Sort`, `Page`, `PageSize`.
- Equipment Type admin list/detail dùng `/api/v1/catalog/admin/equipment-types` và `/api/v1/catalog/admin/equipment-types/{id}` để đọc mọi trạng thái.
- Query params Equipment Type admin thêm `Status`: `Draft`, `Published`, `Disabled`; có thể lặp lại tham số để lọc nhiều trạng thái. Response status vẫn là enum số `0/1/2`.
- Brand fields: `id`, `code`, `name`, `slug`, `logoMediaId`, `logoUrl`, `isActive`, `createdAt`, `updatedAt`.
- Backend trả lỗi theo `ProblemDetails`: `{ type, title, status, detail, instance, ...additionalProps }`.
- Validate specification trả `{ valid, errors }`, error code gồm `REQUIRED`, `TYPE_MISMATCH`, `OUT_OF_RANGE`, `INVALID_ENUM_OPTION`, `UNKNOWN_FIELD`.

## Bước 1 - Cập Nhật Catalog API Layer Theo Swagger Mới

- [x] Cập nhật `src/config/api-endpoints.ts` cho toàn bộ 18 paths mới.
- [x] Bổ sung Brand types trong `src/types/catalog.ts`:
  - `BrandDto`,
  - `BrandDtoPagedResult`,
  - `CreateBrandRequest`,
  - `UpdateBrandRequest`,
  - FE-normalized Brand model nếu cần.
- [x] Cập nhật Catalog server actions trong `src/services/actions/catalog-actions.ts` cho Brand public/admin:
  - `GET /api/v1/catalog/brands`,
  - `GET /api/v1/catalog/brands/{brandId}`,
  - `GET /api/v1/catalog/admin/brands`,
  - `GET /api/v1/catalog/admin/brands/{brandId}`,
  - `POST /api/v1/catalog/brands`,
  - `PATCH /api/v1/catalog/brands/{brandId}`,
  - `POST /api/v1/catalog/brands/{brandId}/disable`,
  - `POST /api/v1/catalog/brands/{brandId}/enable`.
- [x] Giữ Category, Equipment Type, Spec Schema và Validate Specification actions theo Swagger mới.
- [x] Chuẩn hóa query params FE camelCase sang API PascalCase.
- [x] Đảm bảo protected APIs gọi qua server actions / `serverApiJson` để gửi token qua Gateway.
- [x] Public APIs không ép user phải login.
- [x] Dùng parser `ProblemDetails` chung trong `src/services/api-error.ts`.
- [x] Cập nhật mapper/helper cho Brand, paging, status label, media ordering, schema field ordering.

## Bước 2 - Admin Brand Management

- [x] Thêm Brand vào admin Catalog navigation/tab.
- [x] Tạo màn admin Brand list dùng `GET /api/v1/catalog/admin/brands`.
- [x] List hỗ trợ `keyword`, `page`, `pageSize`, `sort`, `isActive`.
- [x] Hiển thị `code`, `name`, `slug`, `logoUrl`, `isActive`, `createdAt`, `updatedAt`.
- [x] Tạo Brand qua `POST /api/v1/catalog/brands` với `code`, `name`, `slug`, `logoMediaId`.
- [x] Cập nhật Brand qua `PATCH /api/v1/catalog/brands/{brandId}`.
- [x] Disable Brand qua `POST /api/v1/catalog/brands/{brandId}/disable`.
- [x] Enable Brand qua `POST /api/v1/catalog/brands/{brandId}/enable`.
- [x] Disable/enable phải có confirm action và xử lý idempotent response.
- [x] Hiển thị active/inactive rõ ràng.
- [x] Handle loading, empty, validation error, `401`, `403`, `404`, `409`.

## Bước 3 - Admin Category Management

- [x] Thêm Category vào admin Catalog navigation/tab.
- [x] Admin xem/search/filter/paging category qua `GET /api/v1/catalog/admin/categories`.
- [x] Admin xem chi tiết cả active/inactive qua `GET /api/v1/catalog/admin/categories/{id}`.
- [x] Tạo category qua `POST /api/v1/catalog/categories` với `name`, `description`, `imageMediaId`.
- [x] Cập nhật category qua `PATCH /api/v1/catalog/categories/{id}` với `name`, `description`, `isActive`, `imageMediaId`.
- [x] Refresh list sau create/update thành công.
- [x] Hiển thị active/inactive rõ ràng.
- [x] Handle loading, empty, validation error, `401`, `403`, `404`.

## Bước 4 - Admin Equipment Type Management

- [x] Thêm Equipment Type vào admin Catalog navigation/tab.
- [x] Admin xem/search equipment type qua `GET /api/v1/catalog/admin/equipment-types`, lọc trạng thái bằng tên enum.
- [x] Admin đọc detail mọi trạng thái qua `GET /api/v1/catalog/admin/equipment-types/{id}`.
- [x] Tạo equipment type trạng thái Draft qua `POST /api/v1/catalog/equipment-types`.
- [x] Cập nhật qua `PATCH /api/v1/catalog/equipment-types/{id}` với `code`, `name`, `description`, `categoryIds`, `media`.
- [x] Media support `mediaId`, `displayOrder`, `isThumbnail`.
- [x] Publish qua `POST /api/v1/catalog/equipment-types/{id}/publish`.
- [x] Disable qua `POST /api/v1/catalog/equipment-types/{id}/disable`.
- [x] Publish/disable có confirm action.
- [x] Hiển thị status Draft/Published/Disabled.
- [x] Handle loading, empty, validation error, `401`, `403`, `404`, `409`.

## Bước 5 - Admin Spec Schema Version Management

- [x] Thêm tab "Thông số kỹ thuật" trong drawer chi tiết equipment type, dùng `FormDrawer` hiện có.
- [x] Xem toàn bộ schema versions qua `GET /api/v1/catalog/equipment-types/{id}/spec-schemas`.
- [x] Tạo draft schema version mới qua `POST /api/v1/catalog/equipment-types/{id}/spec-schemas`; backend cấp số version, có thể lấy fields của version đang xem làm dữ liệu ban đầu.
- [x] Đọc detail version qua `GET /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`.
- [x] Chỉnh sửa draft bằng full replacement qua `PUT /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`.
- [x] Publish draft schema qua `POST /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}/publish`, có xác nhận và refresh bảng equipment type.
- [x] Không cho edit schema đã publish.
- [x] Field builder support:
  - `key`,
  - `label`,
  - `dataType`,
  - `required`,
  - `filterable`,
  - `primary`,
  - `displayOrder`,
  - `min`,
  - `max`,
  - `options`,
  - `unit`,
  - `description`.
- [x] Không hiển thị ô nhập metadata vì chưa có chức năng sử dụng; giữ nguyên metadata có sẵn khi cập nhật schema.
- [x] Validate local field builder:
  - `key` không rỗng và không trùng,
  - enum phải có option hợp lệ,
  - number phải có `min <= max`,
  - không publish khi local validation fail.
- [x] Handle loading, empty, validation error, `401`, `403`, `404`, `409` qua API/error layer hiện có; empty/error dùng `DataTableState` chung.
- [x] Giữ dữ liệu khi chuyển tab; xác nhận bỏ thay đổi khi đổi version, tải lại hoặc đóng drawer.
- [x] Chặn publish khi còn thay đổi chưa lưu; kiểm tra local validation trước khi xác nhận publish.

Kiểm tra riêng Bước 5:

- Test validation/mapping và kết quả pre-deploy: [Báo cáo QA ngày 06/10/2026](qa-before-deploy-2026-10-06.md).
- Kiểm tra Playwright với server actions giả lập: list/detail version, tạo/lưu/publish, khóa bản published, lỗi field, bỏ thay đổi, lỗi API và bố cục desktop/mobile.
- [ ] Smoke test create/update/publish qua Gateway dev bằng tài khoản admin thật (thuộc Bước 11).

## Bước 6 - Dynamic Specification Form Và Validation

- [ ] Tạo reusable component dynamic specification form.
- [ ] Render field theo `dataType`: `text`, `number`, `boolean`, `enum`.
- [ ] Required field có indicator.
- [ ] Number field support min/max.
- [ ] Enum field dùng `options`.
- [ ] Submit validate qua `POST /api/v1/catalog/equipment-types/{equipmentTypeId}/specifications/validate`.
- [ ] Request gồm `schemaVersion`, `specValues`.
- [ ] Map `{ valid, errors }` vào UI.
- [ ] Map error theo field với code:
  - `REQUIRED`,
  - `TYPE_MISMATCH`,
  - `OUT_OF_RANGE`,
  - `INVALID_ENUM_OPTION`,
  - `UNKNOWN_FIELD`.
- [ ] Global/unknown errors hiển thị rõ ràng.
- [ ] Anonymous validate bị xử lý `401` theo login flow hiện tại.

## Bước 7 - Public Brand Listing Và Detail

- [ ] Tạo public Brand list page dùng `GET /api/v1/catalog/brands`.
- [ ] Brand list hỗ trợ `keyword`, `page`, `pageSize`, `sort`.
- [ ] Chỉ hiển thị active brands từ public API.
- [ ] Brand card hiển thị `code`, `name`, `slug`, `logoUrl`, `isActive`.
- [ ] Tạo public Brand detail page dùng `GET /api/v1/catalog/brands/{brandId}`.
- [ ] Brand detail hiển thị `code`, `name`, `slug`, `logoUrl`, `isActive`, metadata thời gian nếu cần.
- [ ] Có loading, empty, error, not found state.
- [ ] Public Brand pages không yêu cầu login.

## Bước 8 - Public Category Và Equipment Type Browsing

- [ ] Chỉ triển khai sau khi admin có thể tạo/publish dữ liệu nền.
- [ ] Tạo public category/equipment browsing.
- [ ] Public category list dùng `GET /api/v1/catalog/categories`.
- [ ] Category detail dùng `GET /api/v1/catalog/categories/{id}`.
- [ ] Equipment list dùng `GET /api/v1/catalog/equipment-types`.
- [ ] Equipment list hỗ trợ `keyword`, `categoryId`, `sort`, `page`, `pageSize`.
- [ ] Equipment card hiển thị `name`, `description`, `categories`, `thumbnail`.
- [ ] Equipment detail dùng `GET /api/v1/catalog/equipment-types/{id}`.
- [ ] Detail hiển thị media gallery, categories, status, current schema version.
- [ ] Detail hiển thị `primarySpecs` nếu API trả về.
- [ ] Có loading, empty, error, `404`.
- [ ] Public pages không yêu cầu login.

## Bước 9 - Public Published Schema Display

- [ ] Current published schema dùng `GET /api/v1/catalog/equipment-types/{equipmentTypeId}/schema`.
- [ ] Schema by version dùng `GET /api/v1/catalog/equipment-types/{equipmentTypeId}/schemas/{version}` khi cần.
- [ ] Render field theo `displayOrder`.
- [ ] Field hiển thị `key`, `label`, `dataType`, `required`, `filterable`, `primary`, `unit`, `min`, `max`, `options`, `description`.
- [ ] Nếu không có schema hoặc equipment không public thì hiển thị `404`/empty state phù hợp.

## Bước 10 - Auth Guard Và Permission States Cho Catalog Admin

- [ ] Public catalog pages không yêu cầu login.
- [ ] Admin pages nằm dưới `src/app/admin/...` để dùng admin shell hiện tại.
- [ ] Admin pages yêu cầu token.
- [ ] `401` xử lý theo login/session flow hiện tại.
- [ ] `403` hiển thị no-permission state.
- [ ] Protected mutation không gọi khi user chưa đủ quyền.
- [ ] `404` hiển thị not-found/detail empty state.
- [ ] `409` hiển thị conflict message từ ProblemDetails.

## Bước 11 - QA Và Regression Test Catalog Flows

- [x] Test API action mapping cho các actions hiện đã triển khai bằng HTTP giả lập.
- [x] Test paging response `{ items, page, pageSize, totalCount, totalPages }`.
- [x] Test ProblemDetails parser.
- [ ] Test Brand public/admin flows.
- [x] Test Brand admin bằng Playwright/action giả lập; public API hiện trả 401 khi anonymous.
- [x] Test Category admin create/update/list bằng Playwright/action giả lập.
- [ ] Test Equipment list/detail/search/filter/paging.
- [x] Test admin Equipment list/detail/search/filter/paging bằng Playwright/action giả lập; public list/detail smoke qua Gateway.
- [x] Test admin equipment create/update/publish/disable bằng Playwright/action giả lập.
- [x] Test schema version create draft/edit draft/publish/block edit published bằng Playwright/action giả lập.
- [ ] Test dynamic spec form render theo `dataType`.
- [ ] Test validate specification error mapping.
- [ ] Nghiệm thu smoke qua Gateway theo Swagger 25 paths: còn Brand public/published schema 401 và chưa test protected mutation bằng tài khoản QA.
- [x] Chạy `npm run lint`.
- [x] Chạy `npx tsc --noEmit`.
- [x] Chạy `npm run build` khi có thêm/sửa route page.

Chi tiết, giới hạn mock/live và các cảnh báo trước deploy: [Báo cáo QA ngày 06/10/2026](qa-before-deploy-2026-10-06.md). Chưa đánh dấu hoàn thành Bước 11 toàn bộ.

## Thứ Tự Triển Khai Đề Xuất

- [x] Bước 1: cập nhật API layer theo Swagger mới, vì hiện tại FE đã có Catalog layer cũ nhưng thiếu Brand.
- [x] Bước 2: admin Brand, vì Brand là canonical data mới.
- [x] Bước 3: admin Category.
- [x] Bước 4: admin Equipment Type và media.
- [x] Bước 5: admin Spec Schema version.
- [ ] Bước 6: dynamic specification validation.
- [ ] Bước 7-9: public Brand/Catalog/Schema sau khi admin đã có đường nhập và publish dữ liệu.
- [ ] Bước 10: auth/permission state kiểm tra xuyên suốt admin/public.
- [ ] Bước 11: QA/test chạy dần sau từng bước.
