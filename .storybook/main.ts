import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: { name: "@storybook/react-vite", options: {} },
  viteFinal: async (config) => mergeConfig(config, {
    resolve: { alias: { "@": new URL("../src", import.meta.url).pathname } },
  }),
};

export default config;
