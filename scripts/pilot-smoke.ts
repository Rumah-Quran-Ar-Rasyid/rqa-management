import "dotenv/config";

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const smokePort = z.coerce.number().int().min(1024).max(65535).default(3117).parse(
  process.env.PILOT_SMOKE_PORT,
);
const baseUrl = `http://127.0.0.1:${smokePort}`;
const appUrl = z.url().parse(process.env.APP_URL);
let serverOutput = "";
let server: ReturnType<typeof spawn>;

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Server smoke berhenti lebih awal.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response;
    } catch {
      // Server masih memulai.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Health endpoint tidak siap.\n${serverOutput}`);
}

async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // Coba lokasi berikutnya.
    }
  }
  throw new Error("Chrome/Chromium tidak ditemukan untuk pemeriksaan viewport 360 piksel.");
}

async function inspectMobileViewport() {
  const chrome = await findChrome();
  const profile = await mkdtemp(join(tmpdir(), "rqa-pilot-smoke-"));
  const remotePort = await availablePort();
  let browserOutput = "";
  const browser = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${remotePort}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: ["ignore", "pipe", "pipe"] });
  browser.stdout?.on("data", (chunk: Buffer) => { browserOutput += chunk.toString(); });
  browser.stderr?.on("data", (chunk: Buffer) => { browserOutput += chunk.toString(); });

  try {
    let endpoint = "";
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const version = await fetch(`http://127.0.0.1:${remotePort}/json/version`);
        if (version.ok) {
          endpoint = (await version.json() as { webSocketDebuggerUrl: string }).webSocketDebuggerUrl;
          break;
        }
      } catch {
        // Browser masih memulai.
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!endpoint) throw new Error(`Chrome DevTools Protocol tidak siap.\n${browserOutput}`);

    const socket = new WebSocket(endpoint);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("Koneksi browser gagal.")), { once: true });
    });
    let id = 0;
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        id?: number;
        result?: unknown;
        error?: { message: string };
      };
      if (!message.id) return;
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
    const send = <T>(method: string, params: Record<string, unknown> = {}) =>
      new Promise<T>((resolve, reject) => {
        id += 1;
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });

    const target = await send<{ targetId: string }>("Target.createTarget", { url: `${baseUrl}/login` });
    const session = await send<{ sessionId: string }>("Target.attachToTarget", {
      targetId: target.targetId,
      flatten: true,
    });
    const sendSession = <T>(method: string, params: Record<string, unknown> = {}) =>
      new Promise<T>((resolve, reject) => {
        id += 1;
        pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
        socket.send(JSON.stringify({ id, method, params, sessionId: session.sessionId }));
      });
    await sendSession("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 800,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sendSession("Page.navigate", { url: `${baseUrl}/login` });
    await new Promise((resolve) => setTimeout(resolve, 750));
    const evaluation = await sendSession<{
      result: { value: { width: number; scrollWidth: number; overflow: boolean; title: string } };
    }>("Runtime.evaluate", {
      expression: `(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        title: document.title
      }))()`,
      returnByValue: true,
    });
    socket.close();
    return evaluation.result.value;
  } finally {
    browser.kill("SIGTERM");
    await rm(profile, { recursive: true, force: true });
  }
}

function availablePort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function main() {
 server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "start"], {
   env: {
     ...process.env,
     APP_URL: appUrl,
     HOSTNAME: "127.0.0.1",
     PORT: String(smokePort),
   },
   stdio: ["ignore", "pipe", "pipe"],
 });
 server.stdout?.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });
 server.stderr?.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });
 try {
  const health = await waitForHealth();
  const payload = await health.json() as { status?: string; service?: string };
  if (payload.status !== "ok" || payload.service !== "rumah-quran-ar-rasyid") {
    throw new Error("Payload health tidak sesuai kontrak.");
  }
  const login = await fetch(`${baseUrl}/login`);
  if (!login.ok || !(await login.text()).includes("Rumah Qur’an Ar-Rasyid")) {
    throw new Error("Halaman masuk tidak dapat dirender.");
  }
  const protectedPage = await fetch(`${baseUrl}/app`, { redirect: "manual" });
  if (![302, 303, 307, 308].includes(protectedPage.status)) {
    throw new Error(`Halaman internal tanpa session tidak diarahkan (${protectedPage.status}).`);
  }
  const viewport = await inspectMobileViewport();
  if (viewport.width !== 360 || viewport.overflow) {
    throw new Error(`Viewport mobile gagal: ${JSON.stringify(viewport)}.`);
  }
  console.info("Smoke pilot lulus:", {
    health: payload.status,
    unauthenticatedRedirect: protectedPage.status,
    viewport,
  });
  } finally {
    server.kill("SIGTERM");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
