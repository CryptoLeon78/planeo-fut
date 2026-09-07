import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Guardar sesión" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Destructive: Story = { args: { variant: "destructive", children: "Eliminar" } };
export const Loading: Story = { args: { disabled: true, children: "Guardando…" } };
