import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

async function bootstrap() {
  // Static demo mode (e.g. GitHub Pages): serve /api from the browser so the
  // app works without the Express backend. Enabled via VITE_DEMO_MODE=true.
  if (import.meta.env.VITE_DEMO_MODE === "true") {
    const { installDemoApi } = await import("./demo/demo-api");
    installDemoApi();
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
