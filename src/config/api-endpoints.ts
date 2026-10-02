type ListAdminUsersParams = {
  keyword?: string;
  page: number;
  pageSize: number;
};

type ListAdminOrganizationsParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: 0 | 1 | 2 | 3;
};

function buildQueryEndpoint(
  pathname: string,
  params: Record<string, string | number | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export const API_ENDPOINTS = {
  backend: {
    organizations: {
      register: "/api/v1/auth/organizations/register",
      mine: "/api/v1/auth/organizations/mine",
      detail: (id: string) => `/api/v1/auth/organizations/${encodeURIComponent(id)}`,
      profile: (id: string) => `/api/v1/auth/organizations/${encodeURIComponent(id)}/profile`,
    },
    adminOrganizations: {
      approve: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}/approve`,
      detail: (id: string) =>
        `/api/v1/auth/admin/organizations/${encodeURIComponent(id)}`,
      list: ({ page, pageSize, search, status }: ListAdminOrganizationsParams) =>
        buildQueryEndpoint("/api/v1/auth/admin/organizations", {
          Page: page,
          PageSize: pageSize,
          Search: search?.trim(),
          status,
        }),
    },
    adminUsers: {
      activate: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/activate`,
      create: "/api/v1/auth/admin/users",
      detail: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
      list: ({ keyword, page, pageSize }: ListAdminUsersParams) =>
        buildQueryEndpoint("/api/v1/auth/admin/users", {
          Page: page,
          PageSize: pageSize,
          Search: keyword?.trim(),
        }),
      roles: "/api/v1/auth/admin/users/roles",
      suspend: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/suspend`,
      update: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
    },
    auth: {
      firebaseLogin: "/api/v1/auth/firebase/login",
      login: "/api/v1/auth/login",
      logout: "/api/v1/auth/logout",
      refresh: "/api/v1/auth/refresh",
      register: "/api/v1/auth/register",
    },
    currentUser: {
      citizenId: "/api/v1/auth/users/me/citizen-id",
      changePassword: "/api/v1/auth/users/change-password",
      deactivate: "/api/v1/auth/users/deactivate",
      externalLogins: "/api/v1/auth/users/external-logins",
      externalLogin: (provider: string) =>
        `/api/v1/auth/users/external-logins/${encodeURIComponent(provider)}`,
      externalLoginLink: (provider: string) =>
        `/api/v1/auth/users/external-logins/${encodeURIComponent(provider)}/link`,
      me: "/api/v1/auth/users/me",
      organizations: "/api/v1/auth/users/organizations",
      profile: "/api/v1/auth/users/profile",
      session: (sessionId: string) =>
        `/api/v1/auth/users/sessions/${encodeURIComponent(sessionId)}`,
      sessions: "/api/v1/auth/users/sessions",
    },
    media: {
      upload: "/api/v1/media/uploads",
    },
  },
  internal: {
    fallbackHost: "localhost:3000",
    auth: {
      firebaseLogin: "/api/auth/firebase/login",
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      refresh: "/api/auth/refresh",
    },
    mock: {
      passwordReset: {
        request: "/api/mock/auth/password-reset/request",
        reset: "/api/mock/auth/password-reset/reset",
        verify: "/api/mock/auth/password-reset/verify",
      },
    },
  },
} as const;

export const API_ENDPOINT_PREFIXES = {
  internalAuth: "/api/auth/",
  internalMock: "/api/mock/",
} as const;
