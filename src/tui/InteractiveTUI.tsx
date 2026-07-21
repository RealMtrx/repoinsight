import { render } from "ink";
import App from "./App.js";

export async function startInteractiveTUI(): Promise<void> {
  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}
