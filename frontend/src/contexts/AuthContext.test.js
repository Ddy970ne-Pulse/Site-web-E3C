import axios from "axios";
import { renderHook, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

jest.mock("axios");

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  jest.resetAllMocks();
});

test("loads the current user and provider config on mount", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.resolve({ data: { id: "1", role: "client", name: "Jean" } });
    if (url.endsWith("/auth/providers")) return Promise.resolve({
      data: { google_client_id: "gid", facebook_app_id: "", apple_client_id: "" },
    });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });

  const { result } = renderHook(() => useAuth(), { wrapper });

  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.user).toEqual({ id: "1", role: "client", name: "Jean" });
  expect(result.current.providers.google_client_id).toBe("gid");
});

test("treats a 401 on /auth/me as logged out, not an error", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.reject({ response: { status: 401 } });
    return Promise.resolve({ data: { google_client_id: "", facebook_app_id: "", apple_client_id: "" } });
  });

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.user).toBeNull();
});

test("login() posts credentials and stores the returned user", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.reject({ response: { status: 401 } });
    return Promise.resolve({ data: { google_client_id: "", facebook_app_id: "", apple_client_id: "" } });
  });
  axios.post.mockResolvedValue({ data: { id: "42", role: "admin", name: "Admin" } });

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  let returned;
  await act(async () => {
    returned = await result.current.login("admin@e3c-construction.com", "secret");
  });

  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/auth/login"),
    { email: "admin@e3c-construction.com", password: "secret" },
    { withCredentials: true }
  );
  expect(returned).toEqual({ id: "42", role: "admin", name: "Admin" });
  expect(result.current.user).toEqual({ id: "42", role: "admin", name: "Admin" });
});

test("login() propagates a rejected credentials error and leaves the user unset", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.reject({ response: { status: 401 } });
    return Promise.resolve({ data: { google_client_id: "", facebook_app_id: "", apple_client_id: "" } });
  });
  const authError = { response: { status: 401, data: { detail: "Email ou mot de passe incorrect" } } };
  axios.post.mockRejectedValue(authError);

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  await expect(
    act(async () => {
      await result.current.login("nobody@example.com", "wrong");
    })
  ).rejects.toEqual(authError);

  expect(result.current.user).toBeNull();
});

test("googleLogin() posts the credential to /auth/google", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.reject({ response: { status: 401 } });
    return Promise.resolve({ data: { google_client_id: "gid", facebook_app_id: "", apple_client_id: "" } });
  });
  axios.post.mockResolvedValue({ data: { id: "7", role: "client", name: "Nouveau Client" } });

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  await act(async () => {
    await result.current.googleLogin("fake-google-credential");
  });

  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/auth/google"),
    { credential: "fake-google-credential" },
    { withCredentials: true }
  );
  expect(result.current.user.name).toBe("Nouveau Client");
});

test("logout() clears the user", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.resolve({ data: { id: "1", role: "client", name: "Jean" } });
    return Promise.resolve({ data: { google_client_id: "", facebook_app_id: "", apple_client_id: "" } });
  });
  axios.post.mockResolvedValue({});

  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.user).not.toBeNull());

  await act(async () => {
    await result.current.logout();
  });

  expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/auth/logout"), {}, { withCredentials: true });
  expect(result.current.user).toBeNull();
});
