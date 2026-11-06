import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  it("toggles password visibility", () => {
    render(<PasswordInput id="pw" aria-label="Contraseña" />);
    const input = screen.getByLabelText("Contraseña", { exact: true });
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(input).toHaveAttribute("type", "text");

    const hide = screen.getByRole("button", { name: "Ocultar contraseña" });
    expect(hide).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(hide);
    expect(input).toHaveAttribute("type", "password");
  });
});
