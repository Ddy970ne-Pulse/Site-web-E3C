import axios from "axios";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./Login";

// react-router-dom v7's ESM "exports" map isn't resolvable by the Jest 27
// bundled with react-scripts 5, so `jest.mock("react-router-dom", ...)`
// (even spreading requireActual) fails to load the module at all. Routing
// through a real MemoryRouter with marker routes sidesteps that entirely —
// and is arguably a more faithful test of the actual redirect behavior.
jest.mock("axios");

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/connexion"]}>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<Login />} />
          <Route path="/espace-client" element={<div data-testid="landed-client-dashboard" />} />
          <Route path="/admin" element={<div data-testid="landed-admin-dashboard" />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  // No social providers configured by default — matches a fresh install.
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/auth/me")) return Promise.reject({ response: { status: 401 } });
    return Promise.resolve({ data: { google_client_id: "", facebook_app_id: "", apple_client_id: "" } });
  });
});

test("submits credentials and redirects a client to the client dashboard", async () => {
  axios.post.mockResolvedValue({ data: { id: "1", role: "client", name: "Jean" } });
  const user = userEvent.setup();
  renderLogin();

  await user.type(screen.getByTestId("login-email"), "jean@example.com");
  await user.type(screen.getByTestId("login-password"), "correcthorsebattery");
  await user.click(screen.getByTestId("login-submit"));

  expect(await screen.findByTestId("landed-client-dashboard")).toBeInTheDocument();
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/auth/login"),
    { email: "jean@example.com", password: "correcthorsebattery" },
    { withCredentials: true }
  );
});

test("redirects an admin to the admin dashboard", async () => {
  axios.post.mockResolvedValue({ data: { id: "1", role: "admin", name: "Admin" } });
  const user = userEvent.setup();
  renderLogin();

  await user.type(screen.getByTestId("login-email"), "admin@e3c-construction.com");
  await user.type(screen.getByTestId("login-password"), "whatever");
  await user.click(screen.getByTestId("login-submit"));

  expect(await screen.findByTestId("landed-admin-dashboard")).toBeInTheDocument();
});

test("shows the backend's error message on invalid credentials and does not navigate", async () => {
  axios.post.mockRejectedValue({ response: { data: { detail: "Email ou mot de passe incorrect" } } });
  const user = userEvent.setup();
  renderLogin();

  await user.type(screen.getByTestId("login-email"), "nobody@example.com");
  await user.type(screen.getByTestId("login-password"), "wrong");
  await user.click(screen.getByTestId("login-submit"));

  expect(await screen.findByTestId("login-error")).toHaveTextContent("Email ou mot de passe incorrect");
  expect(screen.queryByTestId("landed-client-dashboard")).not.toBeInTheDocument();
  expect(screen.queryByTestId("landed-admin-dashboard")).not.toBeInTheDocument();
});

test("falls back to a generic error message when the backend gives none (e.g. rate-limited)", async () => {
  axios.post.mockRejectedValue({ response: { status: 429, data: {} } });
  const user = userEvent.setup();
  renderLogin();

  await user.type(screen.getByTestId("login-email"), "nobody@example.com");
  await user.type(screen.getByTestId("login-password"), "wrong");
  await user.click(screen.getByTestId("login-submit"));

  expect(await screen.findByTestId("login-error")).toHaveTextContent("Identifiants incorrects");
});

test("does not render any social sign-in button when no provider is configured", async () => {
  renderLogin();
  expect(await screen.findByTestId("login-email")).toBeInTheDocument();
  expect(screen.queryByText(/google/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/facebook/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/apple/i)).not.toBeInTheDocument();
});
