# Kế hoạch tích hợp CatalogService

Nguồn đã kiểm tra: Swagger `CatalogService` tại `https://dev-api.lazyops.cloud/swagger/index.html?urls.primaryName=CatalogService`.

Swagger mới hiện có **18 paths**:

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
- Query params Equipment Type public: `Keyword`, `CategoryId`, `Sort`, `Page`, `PageSize`.
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

- [ ] Thêm Brand vào admin Catalog navigation/tab.
- [ ] Tạo màn admin Brand list dùng `GET /api/v1/catalog/admin/brands`.
- [ ] List hỗ trợ `keyword`, `page`, `pageSize`, `sort`, `isActive`.
- [ ] Hiển thị `code`, `name`, `slug`, `logoUrl`, `isActive`, `createdAt`, `updatedAt`.
- [ ] Tạo Brand qua `POST /api/v1/catalog/brands` với `code`, `name`, `slug`, `logoMediaId`.
- [ ] Cập nhật Brand qua `PATCH /api/v1/catalog/brands/{brandId}`.
- [ ] Disable Brand qua `POST /api/v1/catalog/brands/{brandId}/disable`.
- [ ] Enable Brand qua `POST /api/v1/catalog/brands/{brandId}/enable`.
- [ ] Disable/enable phải có confirm action và xử lý idempotent response.
- [ ] Hiển thị active/inactive rõ ràng.
- [ ] Handle loading, empty, validation error, `401`, `403`, `404`, `409`.

## Bước 3 - Admin Category Management

- [ ] Thêm Category vào admin Catalog navigation/tab.
- [ ] Admin xem danh sách category từ `GET /api/v1/catalog/categories`.
- [ ] Tạo category qua `POST /api/v1/catalog/categories` với `name`, `description`, `imageMediaId`.
- [ ] Cập nhật category qua `PATCH /api/v1/catalog/categories/{id}` với `name`, `description`, `isActive`, `imageMediaId`.
- [ ] Refresh list sau create/update thành công.
- [ ] Hiển thị active/inactive rõ ràng.
- [ ] Handle loading, empty, validation error, `401`, `403`, `404`.

## Bước 4 - Admin Equipment Type Management

- [ ] Thêm Equipment Type vào admin Catalog navigation/tab.
- [ ] Admin xem/search equipment type theo endpoint hiện có.
- [ ] Tạo equipment type trạng thái Draft qua `POST /api/v1/catalog/equipment-types`.
- [ ] Cập nhật qua `PATCH /api/v1/catalog/equipment-types/{id}` với `code`, `name`, `description`, `categoryIds`, `media`.
- [ ] Media support `mediaId`, `displayOrder`, `isThumbnail`.
- [ ] Publish qua `POST /api/v1/catalog/equipment-types/{id}/publish`.
- [ ] Disable qua `POST /api/v1/catalog/equipment-types/{id}/disable`.
- [ ] Publish/disable có confirm action.
- [ ] Hiển thị status Draft/Published/Disabled.
- [ ] Handle loading, empty, validation error, `401`, `403`, `404`, `409`.

## Bước 5 - Admin Spec Schema Version Management

- [ ] Thêm schema versions panel trong equipment type detail/admin editor.
- [ ] Xem toàn bộ schema versions qua `GET /api/v1/catalog/equipment-types/{id}/spec-schemas`.
- [ ] Tạo draft schema version mới qua `POST /api/v1/catalog/equipment-types/{id}/spec-schemas`.
- [ ] Đọc detail version qua `GET /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`.
- [ ] Chỉnh sửa draft bằng full replacement qua `PUT /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`.
- [ ] Publish draft schema qua `POST /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}/publish`.
- [ ] Không cho edit schema đã publish.
- [ ] Field builder support:
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
  - `description`,
  - `metadata`.
- [ ] Validate local field builder:
  - `key` không rỗng và không trùng,
  - enum phải có option hợp lệ,
  - number phải có `min <= max`,
  - không publish khi local validation fail.
- [ ] Handle loading, empty, validation error, `401`, `403`, `404`, `409`.

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

- [ ] Test API action mapping cho đủ 18 paths.
- [ ] Test paging response `{ items, page, pageSize, totalCount, totalPages }`.
- [ ] Test ProblemDetails parser.
- [ ] Test Brand public/admin flows.
- [ ] Test Category admin create/update/list.
- [ ] Test Equipment list/detail/search/filter/paging.
- [ ] Test admin equipment create/update/publish/disable.
- [ ] Test schema version create draft/edit draft/publish/block edit published.
- [ ] Test dynamic spec form render theo `dataType`.
- [ ] Test validate specification error mapping.
- [ ] Smoke test trực tiếp với Swagger dev hiện tại có 18 paths.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npx tsc --noEmit`.
- [ ] Chạy `npm run build` khi có thêm/sửa route page.

## Thứ Tự Triển Khai Đề Xuất

- [x] Bước 1: cập nhật API layer theo Swagger mới, vì hiện tại FE đã có Catalog layer cũ nhưng thiếu Brand.
- [ ] Bước 2: admin Brand, vì Brand là canonical data mới.
- [ ] Bước 3: admin Category.
- [ ] Bước 4: admin Equipment Type và media.
- [ ] Bước 5: admin Spec Schema version.
- [ ] Bước 6: dynamic specification validation.
- [ ] Bước 7-9: public Brand/Catalog/Schema sau khi admin đã có đường nhập và publish dữ liệu.
- [ ] Bước 10: auth/permission state kiểm tra xuyên suốt admin/public.
- [ ] Bước 11: QA/test chạy dần sau từng bước.
