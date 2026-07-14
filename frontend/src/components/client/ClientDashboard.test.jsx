import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ClientDashboard from "./ClientDashboard";

// See Login.test.jsx for why react-router-dom itself isn't mocked (Jest 27,
// bundled by react-scripts 5, can't resolve react-router-dom v7's ESM
// "exports" map) — a real MemoryRouter + marker route is used instead.
jest.mock("axios");

const mockLogout = jest.fn();
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "client-1", name: "Jean Client", role: "client" }, logout: mockLogout }),
}));

const INVOICE_WITH_PENDING_TRANCHE = {
  id: "inv-1", invoice_number: "FAC-2026-001", status: "pending",
  project_description: "Rénovation salle de bain", total_ttc: 1085,
  created_at: "2026-01-01T00:00:00Z",
  payment_tranches: [
    { id: "tr-1", label: "Acompte", amount: 500, due_date: "2026-02-01", status: "pending" },
  ],
};

beforeEach(() => {
  jest.resetAllMocks();
  axios.create.mockReturnValue(axios);
  delete window.location;
  window.location = { href: "", origin: "http://localhost:3000" };
});

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/espace-client"]}>
      <Routes>
        <Route path="/espace-client" element={<ClientDashboard />} />
        <Route path="/connexion" element={<div data-testid="landed-login" />} />
      </Routes>
    </MemoryRouter>
  );
}

async function renderOnInvoicesTab() {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/quotes")) return Promise.resolve({ data: [] });
    if (url.endsWith("/invoices")) return Promise.resolve({ data: [INVOICE_WITH_PENDING_TRANCHE] });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  const user = userEvent.setup();
  renderDashboard();
  await user.click(await screen.findByText("Mes Factures"));
  await screen.findByTestId("client-invoice-inv-1");
  return user;
}

test("logs the user out and redirects to /connexion on a 401 while loading data", async () => {
  axios.get.mockRejectedValue({ response: { status: 401 } });
  renderDashboard();

  expect(await screen.findByTestId("landed-login")).toBeInTheDocument();
  expect(mockLogout).toHaveBeenCalled();
});

test("clicking \"Payer par carte\" starts a Stripe checkout for the right invoice/tranche", async () => {
  axios.post.mockResolvedValue({ data: { checkout_url: "https://checkout.stripe.com/session/abc" } });
  const user = await renderOnInvoicesTab();

  await user.click(screen.getByTestId("pay-tranche-tr-1"));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/payments/checkout"),
    { invoice_id: "inv-1", tranche_id: "tr-1", origin_url: "http://localhost:3000" }
  ));
  await waitFor(() => expect(window.location.href).toBe("https://checkout.stripe.com/session/abc"));
});

test("clicking \"PayPal\" creates a PayPal order for the right invoice/tranche", async () => {
  axios.post.mockResolvedValue({ data: { approve_url: "https://paypal.com/checkoutnow?token=xyz" } });
  const user = await renderOnInvoicesTab();

  await user.click(screen.getByTestId("paypal-tranche-tr-1"));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/payments/paypal/create-order"),
    { invoice_id: "inv-1", tranche_id: "tr-1", origin_url: "http://localhost:3000" }
  ));
  await waitFor(() => expect(window.location.href).toBe("https://paypal.com/checkoutnow?token=xyz"));
});

test("shows a payment error message instead of crashing when Stripe checkout fails", async () => {
  axios.post.mockRejectedValue({ response: { data: { detail: "Paiement par carte non configuré" } } });
  const user = await renderOnInvoicesTab();

  await user.click(screen.getByTestId("pay-tranche-tr-1"));

  expect(await screen.findByText("Paiement par carte non configuré")).toBeInTheDocument();
});

test("clicking \"Virement\" fetches and displays the bank transfer details", async () => {
  axios.get.mockImplementation((url) => {
    if (url.endsWith("/quotes")) return Promise.resolve({ data: [] });
    if (url.endsWith("/invoices")) return Promise.resolve({ data: [INVOICE_WITH_PENDING_TRANCHE] });
    if (url.endsWith("/payments/bank-transfer-info")) return Promise.resolve({
      data: { configured: true, account_holder: "E3C SARL", iban: "FR7630006000011234567890189", bic: "AGRIFRPP", bank_name: "Crédit Agricole" },
    });
    return Promise.reject(new Error(`unexpected GET ${url}`));
  });
  const user = userEvent.setup();
  renderDashboard();
  await user.click(await screen.findByText("Mes Factures"));
  await screen.findByTestId("client-invoice-inv-1");

  await user.click(screen.getByTestId("bank-transfer-tranche-tr-1"));

  expect(await screen.findByTestId("bank-transfer-panel")).toHaveTextContent("FR7630006000011234567890189");
});
