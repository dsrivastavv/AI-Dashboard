const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").trim();
const AUTH_BASE_URL = (process.env.REACT_APP_AUTH_BASE_URL || "").trim();
const LOGIN_PATH = (process.env.REACT_APP_LOGIN_PATH || "/accounts/google/login/").trim();
const LOGOUT_PATH = (process.env.REACT_APP_LOGOUT_PATH || "/accounts/logout/").trim();

export class ApiError extends Error {
  constructor(message, { status = 0, payload = null, authRedirect = false, loginUrl = "" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.authRedirect = authRedirect;
    this.loginUrl = loginUrl;
  }
}

function buildUrl(path, params = {}) {
  const base = API_BASE_URL || window.location.origin;
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });
  if (API_BASE_URL) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

function getAuthBaseUrl() {
  if (AUTH_BASE_URL) {
    return AUTH_BASE_URL;
  }
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  if (typeof window !== "undefined" && window.location.port === "3000") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return window.location.origin;
}

function shouldReturnAbsoluteUrl(baseUrl) {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return new URL(baseUrl, window.location.origin).origin !== window.location.origin;
  } catch (error) {
    return true;
  }
}

function currentFrontendPath() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }
  return `${window.location.pathname || "/dashboard"}${window.location.search || ""}${window.location.hash || ""}`;
}

function canUseFrontendNext(authBase) {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return new URL(authBase, window.location.origin).origin === window.location.origin;
  } catch (error) {
    return false;
  }
}

export function buildLoginRedirectUrl(nextPath) {
  const loginBase = getAuthBaseUrl();
  const url = new URL(LOGIN_PATH, loginBase);
  if (canUseFrontendNext(loginBase)) {
    url.searchParams.set("next", nextPath || currentFrontendPath());
  }
  if (shouldReturnAbsoluteUrl(loginBase)) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

export function buildLogoutRedirectUrl(nextPath = "/authentication/sign-in") {
  const logoutBase = getAuthBaseUrl();
  const url = new URL(LOGOUT_PATH, logoutBase);
  if (canUseFrontendNext(logoutBase)) {
    url.searchParams.set("next", nextPath);
  }
  if (shouldReturnAbsoluteUrl(logoutBase)) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

async function parseJsonOrDetectAuth(response) {
  const contentType = response.headers.get("content-type") || "";
  const finalUrl = response.url || "";
  const looksLikeAnyLoginPage =
    finalUrl.includes("/accounts/login") || finalUrl.includes("/accounts/google/login");
  const looksLikeLoginRedirect =
    response.redirected && looksLikeAnyLoginPage;

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (looksLikeLoginRedirect || looksLikeAnyLoginPage) {
    throw new ApiError("Authentication required", {
      status: response.status || 302,
      authRedirect: true,
      loginUrl: buildLoginRedirectUrl(),
    });
  }

  const text = await response.text();
  throw new ApiError("Expected JSON response from backend", {
    status: response.status,
    payload: { raw: text.slice(0, 500) },
  });
}

async function requestJson(path, { params } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJsonOrDetectAuth(response);
  if (response.status === 401 && data?.auth_required) {
    throw new ApiError(data?.error || "Authentication required", {
      status: response.status,
      payload: data,
      authRedirect: true,
      // Backend 401 payloads may point `next` to an API endpoint; keep login returning to the current UI route.
      loginUrl: buildLoginRedirectUrl(),
    });
  }
  if (!response.ok || data?.ok === false) {
    throw new ApiError(data?.error || `${response.status} ${response.statusText}`, {
      status: response.status,
      payload: data,
    });
  }
  return data;
}

export function getServers() {
  return requestJson("/api/servers/");
}

export function getLatestMetrics(server) {
  return requestJson("/api/metrics/latest/", { params: { server } });
}

export function getHistoryMetrics({ server, minutes }) {
  return requestJson("/api/metrics/history/", { params: { server, minutes } });
}
