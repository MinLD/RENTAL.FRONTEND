# Kế hoạch tích hợp Catalog

Nguồn đã kiểm tra: Swagger `CatalogService` tại `https://dev-api.lazyops.cloud/swagger/index.html?urls.primaryName=CatalogService`.

Ghi chú contract từ Swagger:

- Swagger JSON: `/catalog/swagger/v1/swagger.json`.
- Query params cho danh sách public dùng PascalCase ở API: `Keyword`, `CategoryId`, `Sort`, `Page`, `PageSize`.
- Endpoint schema đã publish cho public là `/api/v1/catalog/equipment-types/{equipmentTypeId}/schema` và `/api/v1/catalog/equipment-types/{equipmentTypeId}/schemas/{version}`.
- Endpoint quản lý version schema cho admin là `/api/v1/catalog/equipment-types/{id}/spec-schemas`.
- Enum trạng thái equipment type là số: `0`, `1`, `2`; UI cần map sang `Draft`, `Published`, `Disabled` sau khi xác nhận ý nghĩa chính xác với backend.
- Request validate specification có dạng `{ schemaVersion: number, specValues: unknown }`.
- Response validate specification có dạng `{ valid: boolean, errors?: { field?: string, code?: string, message?: string }[] }`.

## Bước 1 - API Client, Types Và Xử Lý Lỗi Cho Catalog

- [x] Thêm endpoint builders cho Catalog trong `src/config/api-endpoints.ts`.
- [x] Thêm type dùng chung cho Catalog trong `src/types/catalog.ts`.
- [x] Thêm Catalog server actions trong `src/services/actions/catalog-actions.ts` dùng `serverApiJson` / `serverApiOk` cho cả public read, validation và admin APIs.
- [x] Tạo typed functions cho các endpoint public read và validation:
  - `GET /api/v1/catalog/categories`
  - `GET /api/v1/catalog/categories/{id}`
  - `GET /api/v1/catalog/equipment-types`
  - `GET /api/v1/catalog/equipment-types/{id}`
  - `GET /api/v1/catalog/equipment-types/{equipmentTypeId}/schema`
  - `GET /api/v1/catalog/equipment-types/{equipmentTypeId}/schemas/{version}`
  - `POST /api/v1/catalog/equipment-types/{equipmentTypeId}/specifications/validate`
- [x] Tạo typed functions cho các endpoint admin:
  - `POST /api/v1/catalog/categories`
  - `PATCH /api/v1/catalog/categories/{id}`
  - `POST /api/v1/catalog/equipment-types`
  - `PATCH /api/v1/catalog/equipment-types/{id}`
  - `POST /api/v1/catalog/equipment-types/{id}/publish`
  - `POST /api/v1/catalog/equipment-types/{id}/disable`
  - `GET /api/v1/catalog/equipment-types/{id}/spec-schemas`
  - `POST /api/v1/catalog/equipment-types/{id}/spec-schemas`
  - `GET /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`
  - `PUT /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}`
  - `POST /api/v1/catalog/equipment-types/{id}/spec-schemas/{version}/publish`
- [x] Chuẩn hóa query params từ FE shape `{ keyword, categoryId, sort, page, pageSize }` sang API shape `{ Keyword, CategoryId, Sort, Page, PageSize }`.
- [x] Xử lý thống nhất `400`, `401`, `403`, `404`, `409` bằng parser ProblemDetails chung trong `src/services/api-error.ts`.
- [x] Thêm mapper/helper cho DTO nullable, sắp xếp media, chọn thumbnail, label trạng thái và sắp xếp field theo `displayOrder`.

## Bước 2 - Public Catalog Browsing

- [ ] Thêm route public để browse category/equipment, dự kiến `src/app/(public)/catalog/page.tsx`.
- [ ] Thêm route public cho chi tiết equipment type, dự kiến `src/app/(public)/catalog/[id]/page.tsx`.
- [ ] Thêm item vào public header nếu hướng product/catalog được duyệt.
- [ ] Xây dựng UI filter category, hiển thị category active từ `GET /categories`.
- [ ] Xây dựng danh sách equipment type từ `GET /equipment-types`, có keyword search, filter category, sort, paging, loading state, empty state và error state.
- [ ] Render card/list item với name, description, categories và thumbnail.
- [ ] Xây dựng màn chi tiết equipment type với code, name, description, categories, media gallery, current schema version và primary specs nếu có.
- [ ] Fetch current published schema qua `GET /equipment-types/{equipmentTypeId}/schema`.
- [ ] Render schema fields đã publish theo `displayOrder`, gồm label, `dataType`, required marker, unit, min/max, options và description.
- [ ] Hiển thị trạng thái chưa có schema rõ ràng khi `GET /schema` trả `404`.
- [ ] Giữ public routes không yêu cầu login; chỉ gửi auth cho validation nếu backend yêu cầu.

## Bước 3 - Dynamic Specification Form Và Validate Values

- [ ] Tạo component render schema dùng lại được, ví dụ `src/components/catalog/specification-form.tsx`.
- [ ] Hỗ trợ render theo `dataType`:
  - `text`: text input.
  - `number`: numeric input có min/max hint và attributes.
  - `boolean`: checkbox/toggle.
  - `enum`: select hoặc radio tùy số lượng option/UX.
- [ ] Render indicator cho required field và validate required trước khi submit.
- [ ] Chuyển form values về canonical `specValues` theo key của schema field.
- [ ] Submit tới `POST /equipment-types/{equipmentTypeId}/specifications/validate` với `schemaVersion` đang chọn/đang publish.
- [ ] Map validation errors theo `errors[].field` vào đúng input field.
- [ ] Hiển thị các lỗi trong `errors[]` nhưng không map được field thành global form errors.
- [ ] Hiển thị lỗi API không xác định bằng message ngoài field rõ ràng.
- [ ] Reuse component này ở public detail trước, sau đó dùng lại cho flow tạo/nhập thiết bị ở inventory/equipment.

## Bước 4 - Admin Quản Lý Category Và Equipment Type

- [ ] Thêm admin navigation item cho Catalog, dự kiến `/admin/catalog`, theo convention permission filtering hiện tại.
- [ ] Thêm màn quản lý category:
  - xem danh sách category,
  - tạo category với `name`, `description`, `imageMediaId`,
  - cập nhật `name`, `description`, `isActive`, `imageMediaId`,
  - refresh list sau create/update thành công,
  - hiển thị trạng thái unauthorized/forbidden.
- [ ] Thêm màn quản lý equipment type:
  - xem/search equipment type theo khả năng endpoint hiện có,
  - tạo equipment type ở trạng thái Draft,
  - cập nhật `code`, `name`, `description`, `categoryIds`, `media`,
  - hỗ trợ media `displayOrder` và `isThumbnail`,
  - publish equipment type,
  - disable equipment type,
  - hiển thị status Draft/Published/Disabled,
  - handle `409` khi duplicate code hoặc lifecycle không hợp lệ.
- [ ] Reuse pattern hiện tại của `DataTable`, drawer/dialog, toast và server actions từ admin users/organizations.
- [ ] Quyết định category và equipment type nằm chung một màn `/admin/catalog` dạng tabs hay tách thành `/admin/catalog/categories` và `/admin/catalog/equipment-types`.

## Bước 5 - Admin Quản Lý Version Spec Schema

- [ ] Thêm schema versions panel trong màn detail/admin editor của equipment type.
- [ ] Xem danh sách schema versions qua `GET /equipment-types/{id}/spec-schemas`.
- [ ] Tạo draft schema version tiếp theo qua `POST /equipment-types/{id}/spec-schemas`.
- [ ] Edit draft schema bằng full replacement `PUT /equipment-types/{id}/spec-schemas/{version}`.
- [ ] Publish draft schema qua `POST /equipment-types/{id}/spec-schemas/{version}/publish`.
- [ ] Không cho sửa schema version đã publish.
- [ ] Xây dựng schema field editor có validate:
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
- [ ] Guard rules cho field editor:
  - `key` không rỗng và không trùng,
  - enum field phải có option value hợp lệ,
  - number field phải có `min <= max`,
  - `displayOrder` ổn định,
  - không cho publish draft khi local validation fail.

## Bước 6 - Auth, Route Guard Và State Handling

- [ ] Giữ public catalog pages truy cập được khi chưa login.
- [ ] Đặt admin Catalog pages dưới `src/app/admin/...` để dùng admin layout/session shell hiện tại.
- [ ] Thêm permission entries vào admin navigation khi biết tên permission từ backend.
- [ ] Với `401`, làm theo convention hiện tại: redirect/login prompt hoặc clear-session behavior qua API/proxy flow.
- [ ] Với `403`, render no-permission state trong admin page.
- [ ] Với `404`, render not-found hoặc empty-detail state tùy route.
- [ ] Với `400` validation errors, map field-level messages khi có thể.
- [ ] Với `409`, hiển thị conflict message cụ thể cho duplicate code, publish lifecycle hoặc schema version conflict.
- [ ] Xác nhận protected Catalog calls đi qua `/api/backend/...` hoặc server actions để cookie/token được gửi đúng qua Gateway.

## Bước 7 - Test Và QA Checklist

- [ ] Thêm test cho API client/action mapping và serialize query params.
- [ ] Thêm test cho DTO mappers: nullable fields, status labels, media ordering, thumbnail selection, schema field ordering.
- [ ] Thêm test render dynamic specification form theo `dataType`.
- [ ] Thêm test client validation cho required/min/max/enum.
- [ ] Thêm test map backend validation error theo `field`.
- [ ] Thêm test public list/detail states: loading, empty, error, success.
- [ ] Thêm test/check admin happy path: create/update category, create/update equipment type, publish/disable equipment type.
- [ ] Thêm test/check schema version happy path: create draft, edit draft, publish draft, block edit trên published version.
- [ ] QA qua Gateway dev API sau khi backend deploy xác nhận endpoint/schema mới nhất.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build` nếu có implement route/page.

## Thứ Tự Triển Khai Đề Xuất

- [x] Làm Bước 1 trước, vì mọi màn sau đều phụ thuộc vào Catalog types và endpoint functions ổn định.
- [ ] Làm Bước 2 tiếp theo, vì public browsing/detail xác nhận read side và published schema contract.
- [ ] Làm Bước 3 tiếp theo, vì dynamic specification form sẽ dùng chung cho public preview và flow nhập thông số thiết bị sau này.
- [ ] Làm Bước 4 tiếp theo, vì admin canonical data/media phụ thuộc service layer và components đã có.
- [ ] Làm Bước 5 tiếp theo, vì schema version management là workflow admin rủi ro cao nhất và tận dụng renderer từ Bước 3.
- [ ] Bước 6 cần kiểm tra xuyên suốt từng bước admin, sau đó chốt khi biết permission names.
- [ ] Bước 7 nên chạy dần sau từng bước implementation.
