import type {
  AdminUserRow,
  CreateAdminUserRequest,
} from "@/types/admin-users";

export class MockAdminUsersApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockAdminUsersApiError";
    this.status = status;
  }
}

const SEED_USERS: AdminUserRow[] = [
  {
    email: "2311557837@nttu.edu.vn",
    id: "9f2b4c1e-8214",
    name: "Minh Luân",
    phone: "0902 783 737",
    role: "Admin",
    status: "active",
  },
  {
    email: "tran.anh@lazyops.cloud",
    id: "6aa17fd9-440d",
    name: "Trần Anh",
    phone: "0918 228 102",
    role: "Manager",
    status: "active",
  },
  {
    email: "nam.hoang@vinaren.vn",
    id: "e1408e91-0db2",
    name: "Hoàng Nam",
    phone: "0933 789 222",
    role: "Staff",
    status: "locked",
  },
  {
    email: "phuong.le@vinaren.vn",
    id: "a9d20148-12fb",
    name: "Lê Phương",
    phone: "0977 128 889",
    role: "Customer",
    status: "active",
  },
  {
    email: "minh.q@vendor.vn",
    id: "c31e1152-763a",
    name: "Quang Minh",
    phone: "0888 990 101",
    role: "Supplier",
    status: "locked",
  },
  {
    email: "trang.vu@ship.vn",
    id: "bb728033-22ae",
    name: "Vũ Trang",
    phone: "0906 111 453",
    role: "Logistics",
    status: "active",
  },
];

const globalUsersStore = globalThis as typeof globalThis & {
  __dprentalMockUsers?: AdminUserRow[];
};

function getUsersStore() {
  if (!globalUsersStore.__dprentalMockUsers) {
    globalUsersStore.__dprentalMockUsers = Array.from(
      { length: 252 },
      (_, index) => {
        const sourceUser = SEED_USERS[index % SEED_USERS.length];
        const sequence = index + 1;
        const [emailName, emailDomain] = sourceUser.email.split("@");

        return {
          ...sourceUser,
          email: `${emailName}+${sequence}@${emailDomain}`,
          id: `${sourceUser.id}-${String(sequence).padStart(3, "0")}`,
        };
      },
    );
  }

  return globalUsersStore.__dprentalMockUsers;
}

export async function mockCreateUser(request: CreateAdminUserRequest) {
  await simulateNetworkDelay();

  if (!request.name.trim() || !request.email.trim()) {
    throw new MockAdminUsersApiError("Tên và email là bắt buộc.");
  }

  const users = getUsersStore();
  const id = `mock-${Date.now().toString(36)}-${users.length + 1}`;
  const user: AdminUserRow = {
    email: request.email.trim(),
    id,
    name: request.name.trim(),
    phone: request.phone.trim(),
    role: request.role.trim() || "Customer",
    status: "active",
  };

  users.unshift(user);

  return user;
}

export async function mockDeleteUser(id: string) {
  await simulateNetworkDelay();

  const users = getUsersStore();
  const index = users.findIndex((user) => user.id === id);

  if (index === -1) {
    throw new MockAdminUsersApiError("Không tìm thấy người dùng.", 404);
  }

  users.splice(index, 1);
}

function simulateNetworkDelay() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 300);
  });
}
