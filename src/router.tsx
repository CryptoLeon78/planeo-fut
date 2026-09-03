import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createConfiguredQueryClient } from "./lib/query-config";

export const getRouter = () => {
  const queryClient = createConfiguredQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 1000 * 60 * 3,
  });

  return router;
};
