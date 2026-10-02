import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";

const scriptDirectory = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const defaults = {
  output: join(projectRoot, "exports", "rodes-signage-cycle.mp4"),
  width: 1920,
  height: 1080,
};

function usage() {
  console.log(`Usage: npm run export:mp4 -- [options]

Options:
  --output <file>   MP4 destination (default: exports/rodes-signage-cycle.mp4)
  --width <pixels>  Video width (default: 1920)
  --height <pixels> Video height (default: 1080)
  --help            Show this help`);
}

function parseArguments(argumentsList) {
  const options = { ...defaults };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--help") {
      usage();
      process.exit(0);
    }
    if (!["--output", "--width", "--height"].includes(argument)) {
      throw new Error(`Unknown option: ${argument}`);
    }
    const value = argumentsList[index + 1];
    if (!value) throw new Error(`Missing value for ${argument}`);
    index += 1;
    if (argument === "--output") options.output = resolve(value);
    else options[argument.slice(2)] = Number(value);
  }

  for (const dimension of ["width", "height"]) {
    if (!Number.isInteger(options[dimension]) || options[dimension] < 320) {
      throw new Error(`--${dimension} must be an integer of at least 320`);
    }
  }
  if (extname(options.output).toLowerCase() !== ".mp4") {
    throw new Error("--output must end in .mp4");
  }
  return options;
}

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

async function startStaticServer() {
  const server = createServer(async (request, response) => {
    try {
      const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
      const filePath = resolve(projectRoot, relativePath);
      if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const file = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(file);
    } catch (error) {
      response.writeHead(error?.code === "ENOENT" ? 404 : 500).end("Not found");
    }
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  return server;
}

function run(command, argumentsList) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, argumentsList, { stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code) => code === 0
      ? resolveRun()
      : rejectRun(new Error(`FFmpeg exited with code ${code}`)));
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error("Bundled FFmpeg was not found. Run npm install.");

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "rodes-signage-export-"));
  const temporaryVideo = join(temporaryDirectory, "cycle.webm");
  let server;
  let browser;

  try {
    await mkdir(dirname(options.output), { recursive: true });
    server = await startStaticServer();
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/?export=1`;

    console.log(`Recording one signage cycle at ${options.width}x${options.height}...`);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: temporaryDirectory,
        size: { width: options.width, height: options.height },
      },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__signageCycleComplete = new Promise((resolveCycle) => {
        window.addEventListener("signage:cycle-complete", () => resolveCycle(true), { once: true });
      });
    });
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => window.__signageCycleComplete);

    const video = page.video();
    await context.close();
    await video.saveAs(temporaryVideo);
    await browser.close();
    browser = undefined;

    console.log("Encoding MP4...");
    await run(ffmpegPath, [
      "-y", "-i", temporaryVideo,
      "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      options.output,
    ]);
    console.log(`Created ${options.output}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((resolveClose) => server.close(resolveClose));
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`Export failed: ${error.message}`);
  if (error.message.includes("Executable doesn't exist")) {
    console.error("Run: npm run export:setup");
  }
  process.exitCode = 1;
});
