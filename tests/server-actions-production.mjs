import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Run after npm run build. PLAYWRIGHT_MODULE can point to an existing installation.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const root = path.resolve(import.meta.dirname, "..");
const frontendPort = Number(process.env.QA_FRONTEND_PORT ?? 3107);
const gatewayPort = Number(process.env.QA_GATEWAY_PORT ?? 3207);
const origin = `http://127.0.0.1:${frontendPort}`;
const id = "30482189-532a-4115-a6fb-231bff007799";
const safeMessage = "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.";
const brand = {
  id,
  code: "QA",
  name: "QA Brand",
  slug: "qa-brand",
  isActive: true,
};
const category = {
  id,
  name: "QA Category",
  slug: "qa-category",
  isActive: true,
};
const equipment = {
  id,
  code: "QA-EQUIPMENT",
  name: "QA Equipment",
  status: 0,
  categories: [category],
  media: [],
};
const organization = {
  id,
  name: "QA Organization",
  slug: "qa-organization",
  status: 1,
  type: 1,
};
const user = {
  id,
  email: "qa@example.com",
  fullName: "QA User",
  isActive: true,
  roles: ["adm"],
};
const requests = [];
let fault = null;
let draftSchema = null;
let serverOutput = "";

const gateway = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  let rawBody = "";
  for await (const chunk of request) rawBody += chunk;
  requests.push({
    pathname,
    method: request.method,
    body: rawBody ? JSON.parse(rawBody) : undefined,
    cookie: request.headers.cookie,
  });
  function send(data, status = 200) {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  }
  if (pathname === "/api/v1/auth/users/me")
    return send({ ...user, organizations: [], permissions: [] });
  if (pathname === "/api/v1/auth/refresh")
    return send({ detail: "QA refresh rejected" }, 401);
  if (fault && pathname === fault.path && request.method === fault.method) {
    return send(
      {
        type: "urn:qa",
        title: "QA.Invalid",
        status: fault.status,
        detail: fault.message,
        ...(fault.errors ? { errors: fault.errors } : {}),
        traceId: "private-qa-trace",
      },
      fault.status,
    );
  }
  if (pathname.includes("/spec-schemas")) {
    if (request.method === "POST" && !pathname.endsWith("/publish")) {
      draftSchema = {
        id,
        equipmentTypeId: id,
        version: 1,
        status: "Draft",
        definition: JSON.parse(rawBody),
      };
    }
    if (request.method === "PUT") draftSchema.definition = JSON.parse(rawBody);
    if (pathname.endsWith("/publish"))
      draftSchema = {
        ...draftSchema,
        status: "Published",
        publishedAt: "2026-10-06T00:00:00Z",
      };
    return send(
      pathname.endsWith("/spec-schemas") && request.method === "GET"
        ? draftSchema
          ? [draftSchema]
          : []
        : draftSchema,
    );
  }
  if (pathname.endsWith("/history")) return send(paged([]));
  if (pathname.endsWith("/roles")) return send([]);
  if (pathname === "/api/v1/catalog/categories") return send([category]);
  if (pathname.includes("/brands"))
    return send(
      pathname.endsWith("/brands") && request.method === "GET"
        ? paged([brand])
        : brand,
    );
  if (pathname.includes("/categories"))
    return send(
      pathname.endsWith("/categories") ? paged([category]) : category,
    );
  if (pathname.includes("/equipment-types"))
    return send(
      pathname.endsWith("/equipment-types") ? paged([equipment]) : equipment,
    );
  if (pathname.includes("/organizations"))
    return send(
      pathname.endsWith("/organizations")
        ? paged([organization])
        : organization,
    );
  if (pathname.includes("/users")) {
    if (request.method === "POST" && pathname.endsWith("/users"))
      return send(id);
    return send(pathname.endsWith("/users") ? paged([user]) : user);
  }
  send({ detail: `Unmocked route: ${pathname}` }, 404);
});

function paged(items) {
  return {
    items,
    page: 1,
    pageSize: 20,
    totalCount: items.length,
    totalPages: 1,
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let frontend;
let browser;
let page;
try {
  gateway.listen(gatewayPort, "127.0.0.1");
  await once(gateway, "listening");
  // Use a separate production process without modifying the existing dev server.
  fs.cpSync(
    path.join(root, ".next/static"),
    path.join(root, ".next/standalone/.next/static"),
    { recursive: true },
  );
  fs.cpSync(
    path.join(root, "public"),
    path.join(root, ".next/standalone/public"),
    { recursive: true },
  );
  frontend = spawn(process.execPath, [".next/standalone/server.js"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(frontendPort),
      HOSTNAME: "127.0.0.1",
      BACKEND_API_URL: `http://127.0.0.1:${gatewayPort}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  frontend.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  frontend.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (frontend.exitCode !== null) throw new Error(serverOutput);
    try {
      ready = (await fetch(`${origin}/login`)).ok;
    } catch {
      /* Server startup. */
    }
    if (ready) break;
    await wait(200);
  }
  assert.ok(ready, "Production server failed to start");
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const token = `qa.${Buffer.from(JSON.stringify({ r: ["adm"], exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.qa`;
  await context.addCookies([
    { name: "accessToken", value: token, url: origin, httpOnly: true },
  ]);
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto(`${origin}/admin/catalog/brands`);
  await page.getByText("QA Brand", { exact: true }).first().waitFor();
  await page
    .getByRole("button", { name: "Thêm thương hiệu", exact: true })
    .click();
  await page.getByPlaceholder("VD: CAT", { exact: true }).fill("QA");
  await page
    .getByPlaceholder("VD: Caterpillar", { exact: true })
    .fill("QA Brand");
  // Reproduce the original missing-slug error through a REAL production Server Action.
  fault = {
    path: "/api/v1/catalog/brands",
    method: "POST",
    status: 400,
    message: "Slug thương hiệu không hợp lệ.",
  };
  await page
    .getByRole("button", { name: "Tạo thương hiệu", exact: true })
    .click();
  if (process.env.EXPECT_SANITIZED === "1") {
    await page
      .locator("[data-sonner-toast]")
      .filter({
        hasText: /#441|specific message is omitted|Server Components render/i,
      })
      .waitFor();
    console.log(
      "PASS reproduced the original sanitized React error in the old production build",
    );
  } else {
    await page.getByText(fault.message, { exact: true }).waitFor();
    assert.equal(
      await page.getByPlaceholder("VD: CAT", { exact: true }).inputValue(),
      "QA",
    );
    console.log(
      "PASS production Brand missing slug: backend message visible, entered values retained",
    );
    await page
      .getByPlaceholder("VD: caterpillar", { exact: true })
      .fill("QA Bad Slug");
    const before = requests.filter(
      (item) => item.method === "POST" && item.pathname === fault.path,
    ).length;
    await page
      .getByRole("button", { name: "Tạo thương hiệu", exact: true })
      .click();
    await page
      .getByText(
        "Slug chỉ nhận chữ thường, số và dấu gạch ngang giữa các từ.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      requests.filter(
        (item) => item.method === "POST" && item.pathname === fault.path,
      ).length,
      before,
    );
    await page
      .getByPlaceholder("VD: caterpillar", { exact: true })
      .fill("qa-brand");
    console.log(
      "PASS invalid slug is blocked at the field without a backend request",
    );
    for (const status of [400, 401, 403, 404, 409, 500]) {
      fault = {
        path: "/api/v1/catalog/brands",
        method: "POST",
        status,
        message: `QA backend ${status}`,
      };
      await page
        .getByRole("button", { name: "Tạo thương hiệu", exact: true })
        .click();
      await page
        .getByText(status === 500 ? safeMessage : fault.message, {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page
          .getByPlaceholder("VD: caterpillar", { exact: true })
          .inputValue(),
        "qa-brand",
      );
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: status === 500 ? safeMessage : fault.message })
        .waitFor({ state: "hidden", timeout: 15000 });
    }
    fault = {
      path: "/api/v1/catalog/brands",
      method: "POST",
      status: 400,
      message: "Invalid",
      errors: { Slug: ["QA field Slug invalid"] },
    };
    await page
      .getByRole("button", { name: "Tạo thương hiệu", exact: true })
      .click();
    await page.getByText("QA field Slug invalid", { exact: true }).waitFor();
    fault = null;
    await page
      .getByRole("button", { name: "Tạo thương hiệu", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Tạo thương hiệu", exact: true })
      .waitFor({ state: "hidden" });
    console.log(
      "PASS production Brand create: 400/401/403/404/409/500, validation errors and successful retry",
    );

    await page
      .getByRole("button", { name: "Xem chi tiết thương hiệu", exact: true })
      .first()
      .click();
    await page.getByPlaceholder("VD: Caterpillar", { exact: true }).waitFor();
    fault = {
      path: `/api/v1/catalog/brands/${id}`,
      method: "PATCH",
      status: 409,
      message: "QA update conflict",
    };
    await page
      .getByRole("button", { name: "Lưu thay đổi", exact: true })
      .click();
    await page.getByText(fault.message, { exact: true }).waitFor();
    fault = null;
    await page
      .getByRole("button", { name: "Lưu thay đổi", exact: true })
      .click();
    await page.getByText("Đã cập nhật thương hiệu.", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    console.log(
      "PASS production Brand detail/update conflict and successful retry",
    );

    for (const [route, apiPath, text] of [
      ["/admin/catalog/brands", "/api/v1/catalog/admin/brands", "QA Brand"],
      [
        "/admin/catalog/categories",
        "/api/v1/catalog/admin/categories",
        "QA Category",
      ],
      [
        "/admin/catalog/equipment-types",
        "/api/v1/catalog/admin/equipment-types",
        "QA Equipment",
      ],
      ["/admin/users", "/api/v1/auth/admin/users", "QA User"],
      [
        "/admin/organizations",
        "/api/v1/auth/admin/organizations",
        "QA Organization",
      ],
    ]) {
      fault = {
        path: apiPath,
        method: "GET",
        status: 403,
        message: `QA no permission ${text}`,
      };
      await page.goto(`${origin}${route}`);
      await page
        .getByRole("alert")
        .filter({ hasText: fault.message })
        .waitFor();
      await page.getByText("Không tìm thấy kết quả", { exact: true }).waitFor();
      fault = null;
      await page.getByRole("button", { name: "Làm mới", exact: true }).click();
      await page.getByText(text, { exact: true }).first().waitFor();
      console.log(
        `PASS production ${route}: shared error state/message/refresh success`,
      );
    }

    fault = {
      path: `/api/v1/auth/admin/organizations/${id}/suspend`,
      method: "POST",
      status: 409,
      message: "QA organization conflict",
    };
    await page
      .getByRole("button", { name: "Tạm khóa tổ chức", exact: true })
      .first()
      .click();
    await page
      .locator("#organization-action-reason")
      .fill("QA regression reason");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Tạm khóa tổ chức", exact: true })
      .click();
    await page.getByText(fault.message, { exact: true }).waitFor();
    fault = null;
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Tạm khóa tổ chức", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    console.log(
      "PASS production Organization protected mutation: conflict and successful retry",
    );

    await page.goto(`${origin}/admin/users`);
    await page.getByText("QA User", { exact: true }).first().waitFor();
    fault = {
      path: `/api/v1/auth/admin/users/${id}/suspend`,
      method: "POST",
      status: 403,
      message: "QA user forbidden",
    };
    await page
      .getByRole("button", { name: "Tạm khóa", exact: true })
      .first()
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Tạm khóa", exact: true })
      .click();
    await page.getByText(fault.message, { exact: true }).waitFor();
    fault = null;
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Tạm khóa", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    console.log(
      "PASS production User protected mutation: forbidden and successful void-result retry",
    );

    await page.goto(`${origin}/admin/catalog/equipment-types`);
    await page.getByText("QA Equipment", { exact: true }).first().waitFor();
    await page
      .getByRole("button", { name: "Xem chi tiết loại thiết bị", exact: true })
      .first()
      .click();
    await page
      .getByRole("tab", { name: "Thông số kỹ thuật", exact: true })
      .click();
    await page
      .getByText("Chưa có schema thông số kỹ thuật.", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Tạo bản nháp", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Thêm thông số", exact: true })
      .click();
    await page.locator('[name="fields.0.key"]').fill("weight");
    await page.locator('[name="fields.0.label"]').fill("Trọng lượng");
    const schemaPath = `/api/v1/catalog/equipment-types/${id}/spec-schemas`;
    fault = {
      path: schemaPath,
      method: "POST",
      status: 400,
      message: "QA schema invalid",
    };
    await page
      .getByRole("button", { name: "Tạo bản nháp", exact: true })
      .last()
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: fault.message })
      .first()
      .waitFor();
    assert.equal(
      await page.locator('[name="fields.0.key"]').inputValue(),
      "weight",
    );
    fault = null;
    await page
      .getByRole("button", { name: "Tạo bản nháp", exact: true })
      .last()
      .click();
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .waitFor();
    assert.equal(draftSchema.definition.fields[0].key, "weight");
    assert.equal(
      Object.hasOwn(draftSchema.definition.fields[0], "options"),
      false,
    );
    await page.locator('[name="fields.0.label"]').fill("Trọng lượng mới");
    fault = {
      path: `${schemaPath}/1`,
      method: "PUT",
      status: 409,
      message: "QA schema conflict",
    };
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: fault.message })
      .first()
      .waitFor();
    fault = null;
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Lưu bản nháp", exact: true })
      .waitFor({ state: "visible" });
    await page.waitForFunction(
      () =>
        document.querySelector('[name="fields.0.label"]')?.value ===
        "Trọng lượng mới",
    );
    fault = {
      path: `${schemaPath}/1/publish`,
      method: "POST",
      status: 409,
      message: "QA schema publish conflict",
    };
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Xuất bản", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: fault.message })
      .first()
      .waitFor();
    fault = null;
    await page.getByRole("button", { name: "Xuất bản", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Xuất bản", exact: true })
      .click();
    await page.getByText("Đã xuất bản", { exact: true }).waitFor();
    assert.equal(
      await page.locator('[name="fields.0.key"]').isDisabled(),
      true,
    );
    console.log(
      "PASS production Schema create/replace/publish errors, retries, payload and published read-only",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    console.log("PASS production mobile schema drawer at 390px");
    assert.deepEqual(browserErrors, []);
    assert.ok(
      requests
        .filter((item) => item.pathname.startsWith("/api/v1/catalog/"))
        .every((item) => item.cookie?.includes("accessToken=")),
    );
    assert.equal(await page.getByText(/#441|Minified React error/).count(), 0);
    await page.mouse.move(2, 600);
    await page.waitForFunction(() => !document.querySelector("[data-sonner-toast]"), null, { timeout: 15000 });
    await page.screenshot({
      path: "/tmp/dprental-action-result-production.png",
      fullPage: true,
    });
    console.log(
      "PASS actual production Server Action transport, auth cookie forwarding, no React/page errors",
    );
  }
} catch (error) {
  console.error(error);
  console.error(
    "Last mock requests:",
    requests.slice(-8).map(({ method, pathname }) => `${method} ${pathname}`),
  );
  if (page)
    await page.screenshot({
      path: "/tmp/dprental-action-result-failure.png",
      fullPage: true,
    });
  console.error(serverOutput.slice(-4000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (frontend && frontend.exitCode === null) {
    const exited = once(frontend, "exit");
    frontend.kill("SIGTERM");
    await exited;
  }
  if (gateway.listening) await new Promise((resolve) => gateway.close(resolve));
}
