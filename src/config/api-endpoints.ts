type ListAdminUsersParams = {
  keyword?: string;
  page: number;
  pageSize: number;
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
    adminUsers: {
      activate: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/activate`,
      detail: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}`,
      list: ({ keyword, page, pageSize }: ListAdminUsersParams) =>
        buildQueryEndpoint("/api/v1/auth/admin/users", {
          Page: page,
          PageSize: pageSize,
          Search: keyword?.trim(),
        }),
      suspend: (id: string) =>
        `/api/v1/auth/admin/users/${encodeURIComponent(id)}/suspend`,
    },
    auth: {
      firebaseLogin: "/api/v1/auth/firebase/login",
      login: "/api/v1/auth/login",
      logout: "/api/v1/auth/logout",
      refresh: "/api/v1/auth/refresh",
      register: "/api/v1/auth/register",
    },
    currentUser: {
      changePassword: "/api/v1/auth/users/me/change-password",
      externalLogins: "/api/v1/auth/users/me/external-logins",
      externalLogin: (provider: string) =>
        `/api/v1/auth/users/me/external-logins/${encodeURIComponent(provider)}`,
      externalLoginLink: (provider: string) =>
        `/api/v1/auth/users/me/external-logins/${encodeURIComponent(provider)}/link`,
      me: "/api/v1/auth/users/me",
      profile: "/api/v1/auth/users/profile",
      session: (sessionId: string) =>
        `/api/v1/auth/users/me/sessions/${encodeURIComponent(sessionId)}`,
      sessions: "/api/v1/auth/users/me/sessions",
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
      adminUsers: {
        create: "/api/mock/admin/users",
        delete: (id: string) =>
          `/api/mock/admin/users/${encodeURIComponent(id)}`,
        update: (id: string) =>
          `/api/mock/admin/users/${encodeURIComponent(id)}`,
      },
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
