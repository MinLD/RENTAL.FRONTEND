/* RentalService DTOs span many evolving workflow shapes; keep the local fixture flexible. */
/* eslint @typescript-eslint/no-explicit-any: off */
import type { NextRequest } from "next/server";

type MockCartLine = {
  cartItemId: string;
  equipmentListingId: string;
  quantity: number;
  expectedStartDate: string;
  expectedEndDate: string;
  currentDailyRate: number;
  currentDeposit: number;
  estimatedRentalAmount: number;
  currentPriceVersion: string;
  status: string;
  interactionStatus?: string;
  message: string | null;
};
type MockOrder = Record<string, any>;
type MockAccount = {
  cartId: string;
  cart: MockCartLine[];
  orders: MockOrder[];
  operations: Map<string, Record<string, unknown>>;
  idempotency: Map<string, Record<string, unknown>>;
  cartAddIdempotency: Map<string, string>;
  disputes: Map<string, Record<string, unknown>>;
};
type MockState = { accounts: Map<string, MockAccount>; orders: MockOrder[] };

const globalMock = globalThis as typeof globalThis & { __dprentalMockState?: MockState };
const state: MockState = (globalMock.__dprentalMockState ??= { accounts: new Map<string, MockAccount>(), orders: [] });
state.orders ??= [];
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const daysBetween = (start: string, end: string) => Math.max(1, Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1);

function accountKey(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  if (!token) return "mock-renter";
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString("utf8"));
    return String(payload.sub || payload.userId || payload.user_id || token);
  } catch { return token; }
}

function getAccount(request: NextRequest) {
  const key = accountKey(request);
  let account = state.accounts.get(key);
  if (!account) {
    account = { cartId: uuid(), cart: [], orders: [], operations: new Map(), idempotency: new Map(), cartAddIdempotency: new Map(), disputes: new Map() };
    state.accounts.set(key, account);
  }
  return account;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" } });
}

function empty(status = 204) {
  return new Response(null, { status, headers: { "Cache-Control": "no-store", "X-DPRental-Mock": "true" } });
}

function problem(status: number, code: string, detail: string) {
  return json({ type: "about:blank", title: code, status, detail, code }, status);
}

function pageOf<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("Page") || url.searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("PageSize") || url.searchParams.get("pageSize") || 20)));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, totalCount: items.length, totalPages: Math.ceil(items.length / pageSize) };
}

function renterSummary(order: MockOrder) {
  const summary = { ...order };
  delete summary.detail;
  delete summary.adminDetail;
  delete summary.subOrder;
  return summary;
}

function recalc(line: MockCartLine) {
  line.estimatedRentalAmount = line.currentDailyRate * line.quantity * daysBetween(line.expectedStartDate, line.expectedEndDate);
  return line;
}

function makeOrder(account: MockAccount, requestBody: any, renterId: string) {
  const selectedIds: string[] = Array.isArray(requestBody.cartItemIds) ? requestBody.cartItemIds : [];
  let lines = account.cart.filter((line) => selectedIds.includes(line.cartItemId));
  if (!lines.length && requestBody.buyNow) {
    const buy = requestBody.buyNow;
    lines = [{
      cartItemId: uuid(),
      equipmentListingId: buy.equipmentListingId,
      quantity: Number(buy.quantity) || 1,
      expectedStartDate: buy.expectedStartDate,
      expectedEndDate: buy.expectedEndDate,
      currentDailyRate: 180_000,
      currentDeposit: 0,
      estimatedRentalAmount: 180_000 * (Number(buy.quantity) || 1) * daysBetween(buy.expectedStartDate, buy.expectedEndDate),
      currentPriceVersion: "mock-v1",
      status: "AVAILABLE",
      interactionStatus: "ENABLED",
      message: null,
    }];
  }
  if (selectedIds.length > 0) {
    account.cart = account.cart.filter((line) => !selectedIds.includes(line.cartItemId));
  }
  const created = now();
  const orderId = uuid();
  const subOrderId = uuid();
  const code = `DH-${new Date().getFullYear()}-${String(account.orders.length + 1).padStart(6, "0")}`;
  const rentalAmount = lines.reduce((sum, line) => sum + line.estimatedRentalAmount, 0);
  const depositAmount = lines.reduce((sum, line) => sum + line.currentDeposit * line.quantity, 0);
  const deadline = new Date(Date.now() + 30 * 60_000).toISOString();
  const items = lines.map((line) => ({
    name: `Thiết bị ${line.equipmentListingId.slice(0, 8)}`,
    quantity: line.quantity,
    startDate: line.expectedStartDate,
    endDate: line.expectedEndDate,
    rentalItemId: uuid(),
    equipmentListingId: line.equipmentListingId,
    status: "PENDING_PAYMENT",
    listing: { equipmentListingId: line.equipmentListingId, name: `Thiết bị ${line.equipmentListingId.slice(0, 8)}` },
    rentalDays: daysBetween(line.expectedStartDate, line.expectedEndDate),
    dailyRate: line.currentDailyRate,
    depositPerUnit: line.currentDeposit,
    rentalAmount: line.estimatedRentalAmount,
    depositAmount: line.currentDeposit * line.quantity,
    supplierConfirmationDeadline: null,
    supplierDecisionAt: null,
    rejectReason: null,
    refund: null,
    handover: null,
    returns: [],
    settlement: null,
    units: [],
    pickupLocation: null,
  }));
  const subOrder = {
    subOrderId, subOrderCode: `${code}-01`, orderCode: code, supplierId: "mock-supplier",
    status: "PENDING_PAYMENT", currency: "VND", paidAt: null, createdAt: created,
    delivery: requestBody.delivery || null, totalRentalAmount: rentalAmount,
    totalDepositAmount: depositAmount, totalAmount: rentalAmount + depositAmount,
    items, orderVersion: 1,
  };
  const summary = {
    orderId, orderCode: code, status: "PENDING_PAYMENT", currency: "VND",
    totalRentalAmount: rentalAmount, totalDepositAmount: depositAmount,
    totalAmount: rentalAmount + depositAmount, itemCount: lines.length, subOrderCount: 1,
    paymentDeadline: deadline, createdAt: created,
  };
  const detail = {
    ...summary, invoiceRef: `INV-${code}`, paidAt: null, paymentState: "PENDING",
    delivery: requestBody.delivery || null, refundAccount: requestBody.refundAccount || null,
    subOrders: [subOrder], version: 1,
  };
  const adminDetail = {
    ...detail, renterId, paymentRef: null,
    refundAccount: requestBody.refundAccount || null,
    history: [{ fromStatus: null, toStatus: "PENDING_PAYMENT", changedAt: created, actorRole: "RENTER" }],
  };
  const order = { ...summary, detail, adminDetail, subOrder };
  account.orders.unshift(order);
  state.orders.unshift(order);
  account.cart = account.cart.filter((line) => !selectedIds.includes(line.cartItemId));
  return { order, lines };
}

function findItem(orders: MockOrder[], itemId: string) {
  for (const order of orders) {
    for (const subOrder of order.detail.subOrders || []) {
      const item = subOrder.items?.find((candidate: any) => candidate.rentalItemId === itemId);
      if (item) return { order, subOrder, item };
    }
  }
  return null;
}

export async function handleMockRental(request: NextRequest, backendPath: string) {
  const account = getAccount(request);
  const method = request.method.toUpperCase();
  const url = new URL(request.url);
  const body = ["POST", "PUT", "PATCH"].includes(method) ? await request.json().catch(() => ({})) : {};
  const base = "/api/v1/rental";

  if (backendPath === `${base}/cart`) {
    if (method === "GET") return json({ cartId: account.cartId, items: account.cart });
    if (method === "DELETE") { account.cart = []; return empty(); }
  }
  if (backendPath === `${base}/cart/items` && method === "POST") {
    const idempotencyKey = request.headers.get("Idempotency-Key");
    const priorCartItemId = idempotencyKey ? account.cartAddIdempotency.get(idempotencyKey) : undefined;
    if (priorCartItemId) return json({ cartItemId: priorCartItemId });
    const input = body as { equipmentListingId?: string; quantity?: number; expectedStartDate?: string; expectedEndDate?: string };
    if (!input.equipmentListingId || !input.expectedStartDate || !input.expectedEndDate || !Number.isInteger(input.quantity) || Number(input.quantity) < 1 || input.expectedEndDate < input.expectedStartDate)
      return problem(400, "Cart.InvalidRequest", "Thông tin thiết bị, số lượng hoặc ngày thuê không hợp lệ.");
    const existing = account.cart.find((line) => line.equipmentListingId === input.equipmentListingId && line.expectedStartDate === input.expectedStartDate && line.expectedEndDate === input.expectedEndDate);
    if (existing) existing.quantity += Number(input.quantity);
    else account.cart.push({ cartItemId: uuid(), equipmentListingId: input.equipmentListingId, quantity: Number(input.quantity), expectedStartDate: input.expectedStartDate, expectedEndDate: input.expectedEndDate, currentDailyRate: 180_000, currentDeposit: 0, estimatedRentalAmount: 0, currentPriceVersion: "mock-v1", status: "AVAILABLE", interactionStatus: "ENABLED", message: null });
    const saved = recalc(existing || account.cart.at(-1)!);
    if (idempotencyKey) account.cartAddIdempotency.set(idempotencyKey, saved.cartItemId);
    return json({ cartItemId: saved.cartItemId });
  }
  const cartItemMatch = backendPath.match(/^\/api\/v1\/rental\/cart\/items\/([^/]+)$/);
  if (cartItemMatch) {
    const index = account.cart.findIndex((line) => line.cartItemId === decodeURIComponent(cartItemMatch[1]));
    if (index < 0) return problem(404, "Cart.ItemNotFound", "Không tìm thấy mục trong giỏ hàng.");
    if (method === "DELETE") { account.cart.splice(index, 1); return empty(); }
    if (method === "PATCH") {
      const line = account.cart[index];
      const update = body as { quantity?: number; expectedStartDate?: string; expectedEndDate?: string };
      if (update.quantity !== undefined && (update.expectedStartDate !== undefined || update.expectedEndDate !== undefined)) return problem(400, "Cart.InvalidUpdate", "Mỗi lần chỉ cập nhật số lượng hoặc khoảng ngày thuê.");
      if (update.quantity !== undefined && (!Number.isInteger(update.quantity) || update.quantity < 1)) return problem(400, "Cart.InvalidQuantity", "Số lượng phải lớn hơn 0.");
      if ((update.expectedStartDate === undefined) !== (update.expectedEndDate === undefined)) return problem(400, "Cart.InvalidDateRange", "Ngày bắt đầu và kết thúc phải được gửi cùng nhau.");
      if (update.quantity !== undefined) line.quantity = update.quantity;
      if (update.expectedStartDate && update.expectedEndDate) { line.expectedStartDate = update.expectedStartDate; line.expectedEndDate = update.expectedEndDate; }
      recalc(line); return empty();
    }
  }

  if (backendPath === `${base}/checkout` && method === "POST") {
    const key = request.headers.get("Idempotency-Key");
    if (!key || key.length > 64) return problem(400, "Checkout.InvalidIdempotencyKey", "Cần Idempotency-Key tối đa 64 ký tự.");
    const previous = account.idempotency.get(key);
    if (previous) return json(previous, 202);
    const selected: string[] = Array.isArray(body.cartItemIds) ? body.cartItemIds : [];
    if (!selected.length && !body.buyNow) return problem(400, "Checkout.InvalidRequest", "Cần chọn ít nhất một mục đang có trong giỏ hoặc mua ngay.");
    if (selected.length && selected.some((id) => !account.cart.some((line) => line.cartItemId === id))) return problem(400, "Checkout.InvalidRequest", "Mục trong giỏ không hợp lệ.");
    if (body.termsAccepted !== true) return problem(400, "Checkout.TermsRequired", "Cần xác nhận điều khoản thuê.");
    const { order } = makeOrder(account, body, accountKey(request));
    const operationId = uuid();
    const result = { operationId, statusUrl: `${base}/checkout/operations/${operationId}` };
    account.operations.set(operationId, { operationId, status: "SUCCEEDED", orderId: order.orderId, orderCode: order.orderCode, order: { orderId: order.orderId, orderCode: order.orderCode, status: order.status, paymentDeadline: order.paymentDeadline, invoiceRef: `INV-${order.orderCode}`, currency: "VND", totalRentalAmount: order.totalRentalAmount, totalDepositAmount: order.totalDepositAmount, totalAmount: order.totalAmount, isReplay: false }, errorCode: null, errorMessage: null, invoiceStatus: "PENDING" });
    account.idempotency.set(key, result);
    return json(result, 202);
  }
  const operationMatch = backendPath.match(/^\/api\/v1\/rental\/checkout\/operations\/([^/]+)$/);
  if (operationMatch && method === "GET") {
    const operation = account.operations.get(decodeURIComponent(operationMatch[1]));
    return operation ? json(operation) : problem(404, "Checkout.OperationNotFound", "Không tìm thấy lần gửi đơn.");
  }

  if (backendPath === `${base}/orders` && method === "GET") {
    const status = url.searchParams.get("status");
    const orders = account.orders.map(renterSummary).filter((order) => !status || order.status === status);
    return json(pageOf(orders, url));
  }
  const orderMatch = backendPath.match(/^\/api\/v1\/rental\/orders\/([^/]+)$/);
  if (orderMatch && method === "GET") {
    const order = account.orders.find((item) => item.orderId === decodeURIComponent(orderMatch[1]));
    return order ? json(order.detail) : problem(404, "Order.NotFound", "Không tìm thấy đơn thuê.");
  }
  if (backendPath === `${base}/admin/orders` && method === "GET") {
    const status = url.searchParams.get("Status");
    const code = url.searchParams.get("OrderCode")?.toLowerCase();
    const renter = url.searchParams.get("RenterId");
    const orders = state.orders.map((order) => order.adminDetail).filter((order) =>
      (!status || order.status === status) &&
      (!code || order.orderCode.toLowerCase().includes(code)) &&
      (!renter || order.renterId === renter));
    return json(pageOf(orders, url));
  }
  const adminOrderMatch = backendPath.match(/^\/api\/v1\/rental\/admin\/orders\/([^/]+)$/);
  if (adminOrderMatch && method === "GET") {
    const order = state.orders.find((item) => item.orderId === decodeURIComponent(adminOrderMatch[1]));
    return order ? json(order.adminDetail) : problem(404, "Order.NotFound", "Không tìm thấy đơn thuê.");
  }

  if (backendPath === `${base}/supplier/sub-orders` && method === "GET") {
    const status = url.searchParams.get("status");
    return json(pageOf(state.orders.map((order) => order.subOrder).filter((order) => !status || order.status === status), url));
  }
  const subOrderMatch = backendPath.match(/^\/api\/v1\/rental\/supplier\/sub-orders\/([^/]+)(?:\/(accept|reject))?$/);
  if (subOrderMatch) {
    const order = state.orders.find((item) => item.subOrder.subOrderId === decodeURIComponent(subOrderMatch[1]));
    if (!order) return problem(404, "Order.SubOrderNotFound", "Không tìm thấy đơn con.");
    const action = subOrderMatch[2];
    if (method === "GET" && !action) return json(order.subOrder);
    if (method === "POST" && action) {
      const status = action === "accept" ? "AWAITING_HANDOVER" : "REJECTED";
      order.subOrder.status = status;
      for (const item of order.subOrder.items) item.status = status;
      order.status = status; order.detail.status = status; order.adminDetail.status = status;
      return json({ subOrderId: order.subOrder.subOrderId, subOrderCode: order.subOrder.subOrderCode, rentalOrderId: order.orderId, status, items: order.subOrder.items.map((item: any) => ({ rentalItemId: item.rentalItemId, rentalOrderId: order.orderId, orderCode: order.orderCode, status, decisionAt: now(), decisionBy: "mock-supplier", decisionReason: action === "reject" ? body.rejectReason || "Không thể cung cấp thiết bị." : null, decisionNote: body.optionalNote || null })) });
    }
  }

  const itemRoute = backendPath.match(/^\/api\/v1\/rental\/items\/([^/]+)\/(.*)$/);
  if (itemRoute) {
    const itemId = decodeURIComponent(itemRoute[1]);
    const action = itemRoute[2];
    const found = findItem(state.orders, itemId);
    if (!found) return problem(404, "RentalItem.NotFound", "Không tìm thấy mục thuê.");
    const { order, item } = found;
    if (action === "handover" && method === "POST") {
      item.handover = { handoverRecordId: uuid(), handoverAt: body.actualHandoverAt || now(), status: "HANDED_OVER", units: body.units || [] }; item.status = "IN_RENTAL";
      return json(item.handover);
    }
    if (action === "acknowledge-receipt" && method === "POST") return json({ itemId, handoverRecordId: item.handover?.handoverRecordId || uuid(), receivedAt: now(), receivedBy: accountKey(request), note: body.note || null });
    if (action === "cancel-not-delivered" && method === "POST") { item.status = "CANCELLED"; return json({ itemId, status: item.status, cancelledAt: now(), refundAmount: item.rentalAmount + item.depositAmount }); }
    if (action === "returns" && method === "POST") {
      item.returns ||= []; item.returns.push({ returnRecordId: uuid(), submittedAt: body.actualReturnAt || now(), units: body.units || [], note: body.note || null });
      const remainingUnits = Math.max(0, item.quantity - item.returns.reduce((sum: number, entry: any) => sum + (entry.units?.length || 1), 0));
      item.status = remainingUnits === 0 ? "PENDING_SETTLEMENT" : "IN_RENTAL";
      return json({ returnRecordId: item.returns.at(-1).returnRecordId, submittedAt: item.returns.at(-1).submittedAt, remainingUnits, status: item.status, deductionDeadline: new Date(Date.now() + 48 * 3600_000).toISOString() });
    }
    if (action === "deductions" && method === "POST") {
      const proposalId = uuid(); const submittedAt = now();
      const proposal = { proposalId, rentalItemId: itemId, deductionAmount: Number(body.deductionAmount || 0), damageDescription: body.damageDescription || null, evidenceMediaIds: body.evidenceMediaIds || [], affectedAssetIds: body.affectedAssetIds || [], submittedAt, renterResponseDeadline: new Date(Date.now() + 72 * 3600_000).toISOString(), status: "SUBMITTED" };
      item.deduction = proposal; item.status = "PENDING_SETTLEMENT";
      return json({ proposalId, deductionAmount: proposal.deductionAmount, submittedAt, renterResponseDeadline: proposal.renterResponseDeadline, rentalItemId: itemId, itemStatus: item.status });
    }
    if (action === "deductions/response" && method === "POST") {
      const proposal = item.deduction || { proposalId: uuid(), deductionAmount: 0 };
      const disputed = body.decision === "DISPUTE"; proposal.status = disputed ? "DISPUTED" : "ACCEPTED"; proposal.disputeReason = body.disputeReason || null; proposal.evidenceMediaIds = body.evidenceMediaIds || []; proposal.respondedAt = now(); item.deduction = proposal;
      return json({ deductionProposalId: proposal.proposalId, rentalItemId: itemId, proposalStatus: proposal.status, finalDeductionAmount: disputed ? null : proposal.deductionAmount, respondedAt: proposal.respondedAt, itemStatus: item.status });
    }
    if (action === "deductions/dispute" && method === "GET") {
      if (!item.deduction) return problem(404, "Dispute.NotFound", "Không có đề nghị khấu trừ cho mục thuê này.");
      return json({ rentalItemId: itemId, rentalOrderId: order.orderId, orderCode: order.orderCode, supplierId: "mock-supplier", renterId: accountKey(request), depositAmount: item.depositAmount, totalProposedAmount: item.deduction.deductionAmount, damageDescription: item.deduction.damageDescription, proposalSubmittedAt: item.deduction.submittedAt, proposalStatus: item.deduction.status, disputeReason: item.deduction.disputeReason || null, disputeMediaIds: item.deduction.evidenceMediaIds || [], disputedAt: item.deduction.respondedAt || null, units: [] });
    }
    if (action === "deductions/dispute/resolution" && method === "POST") {
      const proposal = item.deduction || { proposalId: uuid() }; proposal.status = "RESOLVED"; proposal.finalDeductionAmount = Number(body.finalDeductionAmount || 0); proposal.resolvedAt = now(); proposal.decisionNote = body.decisionNote || null; item.deduction = proposal;
      return json({ deductionProposalId: proposal.proposalId, rentalItemId: itemId, finalDeductionAmount: proposal.finalDeductionAmount, decision: "RESOLVED", resolvedAt: proposal.resolvedAt, itemStatus: item.status });
    }
  }
  if (backendPath === `${base}/admin/disputes` && method === "GET") {
    const disputes = state.orders.flatMap((order) => order.detail.subOrders.flatMap((sub: any) => sub.items.filter((item: any) => item.deduction?.status === "DISPUTED").map((item: any) => ({ rentalItemId: item.rentalItemId, orderCode: order.orderCode, disputeReason: item.deduction.disputeReason, disputedAt: item.deduction.respondedAt }))));
    const skip = Math.max(0, Number(url.searchParams.get("skip") || 0));
    const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") || 50)));
    return json(disputes.slice(skip, skip + take));
  }
  if (backendPath === `${base}/me/calendar` && method === "GET") {
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const entries = account.orders.flatMap((order) => order.detail.subOrders.flatMap((sub: any) => sub.items.map((item: any) => ({ rentalItemId: item.rentalItemId, orderId: order.orderId, orderCode: order.orderCode, name: item.name, equipmentListingId: item.equipmentListingId, startDate: item.startDate, endDate: item.endDate, quantity: item.quantity, status: item.status })))).filter((entry: any) => entry.startDate.startsWith(month) || entry.endDate.startsWith(month));
    const page = pageOf(entries, url);
    return json({ month, days: [], entries: page.items, page: page.page, pageSize: page.pageSize, totalCount: page.totalCount, totalPages: page.totalPages });
  }
  return problem(404, "MockRental.EndpointNotFound", `Chưa có mock cho ${method} ${backendPath}.`);
}
