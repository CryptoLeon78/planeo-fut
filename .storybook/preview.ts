import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: { expanded: true },
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#0f172a" }, { name: "light", value: "#ffffff" }] },
  },
};

export default preview;
