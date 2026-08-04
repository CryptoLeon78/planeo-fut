import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

describe("language switcher", () => {
  it("switches football copy to British English and persists the choice", async () => {
    localStorage.clear();
    render(
      <I18nProvider>
        <LanguageSwitcher />
        <h1>Calendario semanal</h1>
        <p>¿Se cumplieron los objetivos?</p>
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "English (United Kingdom)" }));
    expect(await screen.findByRole("heading", { name: "Weekly schedule" })).toBeInTheDocument();
    expect(screen.getByText("Were the coaching outcomes achieved?")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en-GB");
    await waitFor(() => expect(localStorage.getItem("planeofut-language")).toBe("en-GB"));

    fireEvent.click(screen.getByRole("button", { name: "Español (España)" }));
    expect(await screen.findByRole("heading", { name: "Calendario semanal" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es-ES");
  });
});