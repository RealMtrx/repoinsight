import { render } from "ink";
import App from "./App.js";

export async function startInteractiveTUI(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.log("");
    console.log("  Interactive TUI requires a terminal.");
    console.log("  Run 'repoinsight help' for available commands.");
    console.log("");
    return;
  }
  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}
