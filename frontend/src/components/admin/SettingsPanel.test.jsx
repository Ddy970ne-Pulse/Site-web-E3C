import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPanel from "./SettingsPanel";

jest.mock("axios");

const NONE_CONFIGURED = {
  stripe_api_key: { configured: false, source: "none", preview: null },
  stripe_webhook_secret: { configured: false, source: "none", preview: null },
  brevo_api_key: { configured: false, source: "none", preview: null },
  google_client_id: { configured: false, source: "none", preview: null },
  facebook_app_id: { configured: false, source: "none", preview: null },
  facebook_app_secret: { configured: false, source: "none", preview: null },
  apple_client_id: { configured: false, source: "none", preview: null },
  paypal_client_id: { configured: false, source: "none", preview: null },
  paypal_client_secret: { configured: false, source: "none", preview: null },
  paypal_mode: { configured: false, source: "none", preview: null },
  bank_account_holder: { configured: false, source: "none", preview: null },
  bank_iban: { configured: false, source: "none", preview: null },
  bank_bic: { configured: false, source: "none", preview: null },
  bank_name: { configured: false, source: "none", preview: null },
};

beforeEach(() => {
  jest.resetAllMocks();
  axios.create.mockReturnValue(axios);
});

test("loads and displays current configuration status", async () => {
  axios.get.mockResolvedValue({ data: NONE_CONFIGURED });
  render(<SettingsPanel />);

  expect(await screen.findAllByText("non configuré")).not.toHaveLength(0);
  expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/admin/settings"));
});

test("shows an error if settings fail to load", async () => {
  axios.get.mockRejectedValue({ response: { data: { detail: "Accès réservé à l'administrateur" } } });
  render(<SettingsPanel />);

  expect(await screen.findByText("Accès réservé à l'administrateur")).toBeInTheDocument();
});

test("saves only the fields the admin actually filled in, and shows a success message", async () => {
  axios.get.mockResolvedValue({ data: NONE_CONFIGURED });
  axios.put.mockResolvedValue({
    data: { ...NONE_CONFIGURED, google_client_id: { configured: true, source: "database", preview: "new-id" } },
  });
  const user = userEvent.setup();
  render(<SettingsPanel />);

  await screen.findAllByText("non configuré");
  await user.type(screen.getByTestId("settings-google_client_id"), "new-google-client-id");
  await user.click(screen.getByTestId("settings-save"));

  await waitFor(() => expect(axios.put).toHaveBeenCalledWith(
    expect.stringContaining("/admin/settings"),
    { google_client_id: "new-google-client-id" }
  ));
  expect(await screen.findByText(/enregistrés/)).toBeInTheDocument();
});

test("shows an error if saving fails", async () => {
  axios.get.mockResolvedValue({ data: NONE_CONFIGURED });
  axios.put.mockRejectedValue({ response: { data: { detail: "Échec de l'enregistrement" } } });
  const user = userEvent.setup();
  render(<SettingsPanel />);

  await screen.findAllByText("non configuré");
  await user.type(screen.getByTestId("settings-stripe_api_key"), "sk_live_test");
  await user.click(screen.getByTestId("settings-save"));

  expect(await screen.findByText("Échec de l'enregistrement")).toBeInTheDocument();
});
