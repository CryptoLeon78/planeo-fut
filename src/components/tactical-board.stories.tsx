import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TacticalBoard, type TacticalBoardData } from "./tactical-board";

function Controlled({ initial, readOnly }: { initial: TacticalBoardData; readOnly?: boolean }) {
  const [value, setValue] = useState(initial);
  return <div className="max-w-3xl"><TacticalBoard value={value} onChange={setValue} readOnly={readOnly} /></div>;
}

const meta = {
  title: "Feature/TacticalBoard",
  component: Controlled,
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vacia: Story = { args: { initial: { version: 1, title: "", elements: [] } } };

export const ConElementos: Story = {
  args: {
    initial: {
      version: 1,
      title: "Rondo 4v2",
      elements: [
        { id: "p1", type: "player", x: 30, y: 40, label: "4", color: "#38bdf8" },
        { id: "o1", type: "opponent", x: 60, y: 40, label: "2", color: "#fb7185" },
        { id: "z1", type: "zone", x: 20, y: 20, x2: 60, y2: 60, color: "#34d399", label: "Presión" },
        { id: "a1", type: "arrow", x: 30, y: 40, x2: 55, y2: 25, color: "#a7f3d0" },
        { id: "g1", type: "goal", x: 90, y: 50, color: "#e2e8f0" },
      ],
    },
  },
};

export const SoloLectura: Story = { args: { ...ConElementos.args, readOnly: true } };
