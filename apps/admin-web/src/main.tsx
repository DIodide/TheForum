import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./shell";
import "./style.css";
import { Dashboard } from "./pages/dashboard";
import { DedupLog } from "./pages/dedup-log";
import { EventReview } from "./pages/event-review";
import { ListservConfig } from "./pages/listserv-config";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const root = document.getElementById("app");
if (!root) throw new Error("Root element not found");
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events" element={<EventReview />} />
            <Route path="configs" element={<ListservConfig />} />
            <Route path="duplicates" element={<DedupLog />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
