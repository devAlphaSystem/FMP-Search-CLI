#!/usr/bin/env node

/**
 * Setup script for curl_cffi (optional anti-bot enhancement).
 *
 * Checks for Python 3.10+ and installs the curl_cffi package which provides
 * Chrome TLS/HTTP2 fingerprint impersonation to bypass bot detection.
 *
 * Usage: node setup-cffi.js
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function ok(msg) {
  console.log(`${C.green}[OK]${C.reset} ${msg}`);
}
function warn(msg) {
  console.log(`${C.yellow}[WARN]${C.reset} ${msg}`);
}
function fail(msg) {
  console.log(`${C.red}[FAIL]${C.reset} ${msg}`);
}
function info(msg) {
  console.log(`${C.cyan}[INFO]${C.reset} ${msg}`);
}

async function findPython() {
  for (const bin of ["python3", "python"]) {
    try {
      const { stdout } = await execFileAsync(bin, ["--version"], { timeout: 5000 });
      const ver = stdout.trim();
      const match = ver.match(/(\d+)\.(\d+)/);
      if (match && (parseInt(match[1]) > 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) >= 10))) {
        return { bin, version: ver };
      }
    } catch {}
  }
  return null;
}

async function isCurlCffiInstalled(pythonBin) {
  try {
    await execFileAsync(pythonBin, ["-c", "import curl_cffi; print(curl_cffi.__version__)"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function installCurlCffi(pythonBin) {
  info("Installing curl_cffi...");
  try {
    const { stdout, stderr } = await execFileAsync(pythonBin, ["-m", "pip", "install", "curl_cffi", "--upgrade"], {
      timeout: 120000,
    });
    if (stdout) console.log(C.gray + stdout.trim() + C.reset);
    return true;
  } catch (err) {
    const output = err.stderr || err.stdout || err.message;
    fail("pip install failed:");
    console.log(C.gray + output + C.reset);
    return false;
  }
}

async function main() {
  console.log(`\n${C.cyan}curl_cffi Setup${C.reset}\n`);

  const py = await findPython();
  if (!py) {
    fail("Python 3.10+ not found.");
    console.log();
    info("Install Python from https://www.python.org/downloads/");
    info("Make sure to check 'Add Python to PATH' during installation.");
    process.exit(1);
  }
  ok(`${py.version} found (${py.bin})`);

  try {
    await execFileAsync(py.bin, ["-m", "pip", "--version"], { timeout: 5000 });
    ok("pip available");
  } catch {
    fail("pip not found. Install it: https://pip.pypa.io/en/stable/installation/");
    process.exit(1);
  }

  if (await isCurlCffiInstalled(py.bin)) {
    ok("curl_cffi already installed");
  } else {
    const installed = await installCurlCffi(py.bin);
    if (!installed) {
      process.exit(1);
    }
    if (await isCurlCffiInstalled(py.bin)) {
      ok("curl_cffi installed successfully");
    } else {
      fail("curl_cffi installation could not be verified");
      process.exit(1);
    }
  }

  try {
    const { stdout } = await execFileAsync(py.bin, ["-c", "from curl_cffi import requests; print('curl_cffi OK')"], { timeout: 5000 });
    ok(stdout.trim());
  } catch (err) {
    warn("curl_cffi installed but import test failed: " + err.message);
  }

  console.log();
  ok("Setup complete. The CLI tools will now use Chrome TLS fingerprint impersonation.");
  console.log();
}

main();
