import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Accessibility (A11y) requirements", () => {
  it("renders buttons with accessible names and roles", () => {
    render(
      <Button aria-label="Duplicar microciclo">
        <span aria-hidden="true">📋</span>
      </Button>
    );
    const button = screen.getByRole("button", { name: "Duplicar microciclo" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Duplicar microciclo");
  });

  it("applies visible focus indicator classes on button component", () => {
    render(<Button>Acción accesible</Button>);
    const button = screen.getByRole("button", { name: "Acción accesible" });
    expect(button.className).toContain("focus-visible:ring-2");
    expect(button.className).toContain("focus-visible:ring-offset-2");
  });
});
