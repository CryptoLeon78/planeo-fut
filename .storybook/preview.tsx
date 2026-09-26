import type { Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../src/styles.css";

const queryClient = new QueryClient();

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0f172a" }, { name: "light", value: "#ffffff" }] },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};

export default preview;
