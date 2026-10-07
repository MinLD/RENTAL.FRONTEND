import assert from "node:assert/strict";
import { test } from "node:test";
import createLoader from "./helpers/load-typescript.mjs";

const controlFlow = new Error("NEXT_REDIRECT");
const load = createLoader({
  "next/headers": { headers: async () => new Headers() },
  "next/navigation": {
    unstable_rethrow(error) {
      if (error === controlFlow) throw error;
    },
  },
});
const { runServerAction } = load("src/services/server-action.ts");
const { ServerApiError } = load("src/services/server-api.ts");
const { ApiInputError, getApiFieldErrors } = load("src/services/api-error.ts");
const { unwrapActionResult, ActionResultError } = load(
  "src/services/action-result.ts",
);

test("ProblemDetails survives JSON serialization with status, message and field errors", async () => {
  for (const status of [400, 401, 403, 404, 409]) {
    const body = {
      status,
      detail: `Backend ${status}`,
      traceId: "private-trace",
    };
    const result = await runServerAction(async () => {
      throw new ServerApiError(
        new Response(null, { status }),
        body,
        "fallback",
      );
    });
    const serialized = JSON.parse(JSON.stringify(result));
    assert.deepEqual(serialized, {
      success: false,
      error: { status, message: `Backend ${status}`, fieldErrors: {} },
    });
    assert.throws(
      () => unwrapActionResult(serialized),
      (error) => {
        assert.ok(error instanceof ActionResultError);
        assert.equal(error.status, status);
        assert.equal(error.message, `Backend ${status}`);
        return true;
      },
    );
  }

  const errors = { Slug: ["Invalid slug"], "fields[0].key": ["Duplicate key"] };
  const result = await runServerAction(async () => {
    throw new ServerApiError(
      new Response(null, { status: 400 }),
      { errors },
      "fallback",
    );
  });
  assert.deepEqual(result.error.fieldErrors, errors);
  assert.equal(result.error.message, "Invalid slug\nDuplicate key");
  assert.deepEqual(getApiFieldErrors({ errors: ["global"] }), {});
});

test("Success keeps DTOs, arrays, null and void; no Error crosses the server boundary", async () => {
  for (const data of [{ id: "test" }, [1, 2], null, undefined]) {
    const result = await runServerAction(async () => data);
    assert.equal(result.success, true);
    assert.deepEqual(unwrapActionResult(result), data);
  }
});

test("Input errors are returned, Next.js redirect control flow is rethrown", async () => {
  const result = await runServerAction(async () => {
    throw new ApiInputError("Invalid ID", { id: ["Invalid ID"] });
  });
  assert.deepEqual(result.error, {
    status: 400,
    message: "Invalid ID",
    fieldErrors: { id: ["Invalid ID"] },
  });
  await assert.rejects(
    runServerAction(async () => {
      throw controlFlow;
    }),
    (error) => error === controlFlow,
  );
});

test("Unexpected/network/5xx errors are logged but never expose internal details to the client", async () => {
  const original = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  try {
    for (const error of [
      new TypeError("fetch failed: private-host"),
      new Error("secret database credentials"),
      new ServerApiError(
        new Response(null, { status: 503 }),
        { detail: "private stack" },
        "fallback",
      ),
    ]) {
      const result = await runServerAction(async () => {
        throw error;
      });
      assert.equal(result.success, false);
      assert.equal(
        result.error.message,
        "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.",
      );
      assert.ok(!JSON.stringify(result).includes(error.message));
    }
    assert.equal(logged.length, 3);
  } finally {
    console.error = original;
  }
});

test("Catalog/User/Organization actions all wrap the same API failures", async () => {
  const id = "30482189-532a-4115-a6fb-231bff007799";
  const apiError = new ServerApiError(
    new Response(null, { status: 409 }),
    { detail: "Duplicate" },
    "fallback",
  );
  const actionsLoader = createLoader({
    "@/services/server-api": {
      ServerApiError,
      serverApiJson: async () => {
        throw apiError;
      },
      serverApiOk: async () => {
        throw apiError;
      },
    },
    "next/navigation": { unstable_rethrow() {} },
  });
  const catalog = actionsLoader("src/services/actions/catalog-actions.ts");
  const users = actionsLoader("src/services/actions/admin-users-actions.ts");
  const orgs = actionsLoader(
    "src/services/actions/admin-organizations-actions.ts",
  );
  for (const callback of [
    () =>
      catalog.createCatalogBrandAction({ code: "QA", name: "QA", slug: "qa" }),
    () => catalog.updateCatalogBrandAction(id, { name: "QA" }),
    () => catalog.createCatalogCategoryAction({ name: "QA" }),
    () => catalog.publishCatalogEquipmentTypeAction(id),
    () => catalog.createCatalogSpecSchemaDraftAction(id, { fields: [] }),
    () => catalog.getAdminCatalogBrandsAction({ page: 1, pageSize: 20 }),
    () =>
      users.createUserAction({
        email: "qa@example.com",
        fullName: "QA",
        password: "secret",
      }),
    () => users.lockUserAction(id),
    () => orgs.suspendAdminOrganizationAction(id, "QA reason"),
  ]) {
    const result = await callback();
    assert.deepEqual(result.error, {
      status: 409,
      message: "Duplicate",
      fieldErrors: {},
    });
  }
  assert.equal(
    (await catalog.getAdminCatalogBrandAction("invalid")).error.status,
    400,
  );
  assert.equal(
    (
      await users.createUserAction({
        email: "invalid",
        fullName: "",
        password: "",
      })
    ).error.status,
    400,
  );
});

test("Brand validates supplied slug locally without inventing a required-slug rule", () => {
  const { catalogBrandFormSchema } = load(
    "src/lib/validations/catalog-brand.ts",
  );
  for (const slug of ["qa-brand", "brand1", "", undefined]) {
    assert.ok(
      catalogBrandFormSchema.safeParse({ code: "QA", name: "QA", slug })
        .success,
    );
  }
  for (const slug of [
    "QA Brand",
    "đèn",
    "-brand",
    "brand-",
    "brand--name",
    "a".repeat(151),
  ]) {
    const parsed = catalogBrandFormSchema.safeParse({
      code: "QA",
      name: "QA",
      slug,
    });
    assert.equal(parsed.success, false);
    assert.equal(parsed.error.issues[0].path[0], "slug");
  }
});

test("Account keeps its existing action-state format even when the Gateway is unreachable", async () => {
  const original = console.error;
  console.error = () => {};
  try {
    const accountLoader = createLoader({
      "@/services/server-api": {
        ServerApiError,
        serverApi: async () => {
          throw new TypeError("private gateway unreachable");
        },
      },
      "next/cache": { refresh() {} },
      "next/navigation": { unstable_rethrow() {} },
    });
    const { changePasswordAction } = accountLoader(
      "src/services/actions/account-actions.ts",
    );
    const form = new FormData();
    form.set("currentPassword", "OldPassword123!");
    form.set("newPassword", "NewPassword123!");
    form.set("confirmPassword", "NewPassword123!");
    const result = await changePasswordAction({ success: false }, form);
    assert.deepEqual(result, {
      success: false,
      message: "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.",
    });
  } finally {
    console.error = original;
  }
});
