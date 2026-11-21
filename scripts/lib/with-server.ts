// Start `next start` on :3000, wait until it answers, run a check, always kill the process tree.
import { spawn, spawnSync } from "node:child_process";

const BASE = "http://localhost:3000";

const answers = () =>
  fetch(BASE + "/", { redirect: "manual" }).then(
    () => true,
    () => false,
  );

export async function withServer(check: (baseUrl: string) => Promise<void>): Promise<void> {
  if (await answers()) throw new Error("port 3000 busy, stop the running server");
  const win = process.platform === "win32";
  const child = spawn("npx next start -p 3000", { shell: true, detached: !win, stdio: "ignore" });
  try {
    const deadline = Date.now() + 60_000;
    while (!(await answers())) {
      if (Date.now() > deadline) throw new Error("next start did not answer within 60 s");
      await new Promise((r) => setTimeout(r, 500));
    }
    await check(BASE);
  } finally {
    if (win) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    else process.kill(-child.pid!, "SIGKILL");
    // wait for the port to free so a following withServer() call can start
    for (let i = 0; i < 40 && (await answers()); i++) await new Promise((r) => setTimeout(r, 250));
  }
}
