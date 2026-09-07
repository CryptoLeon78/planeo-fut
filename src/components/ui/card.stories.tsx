import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./card";

const meta = { title: "UI/Card", component: Card, tags: ["autodocs"] } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SessionSummary: Story = {
  render: () => <Card className="w-80 space-y-2 p-5"><h3 className="font-semibold">MD-3 · Posesión</h3><p className="text-sm text-muted-foreground">75 minutos · Intensidad media</p></Card>,
};
