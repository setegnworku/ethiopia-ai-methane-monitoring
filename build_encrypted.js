#!/usr/bin/env node
/**
 * Encrypt src/index.html into a password-protected index.html for GitHub Pages.
 *
 *   PAGE_PASSWORD=... node build_encrypted.js
 *
 * The page is encrypted with AES-256-GCM using a key derived from the password
 * (PBKDF2-SHA256). The browser decrypts it after the password is entered.
 * The password itself is never written to any file.
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ITERATIONS = 600000;
const password = process.env.PAGE_PASSWORD;
if (!password) {
  console.error("Set PAGE_PASSWORD in the environment.");
  process.exit(1);
}

const plain = fs.readFileSync(path.join(__dirname, "src", "index.html"));
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const body = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);

const payload = JSON.stringify({
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  data: body.toString("base64"),
  iterations: ITERATIONS,
});

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Concept note — password required</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
      font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; color: #17222a;
      background:
        radial-gradient(900px 420px at 88% -5%, rgba(25,163,160,.42), transparent 62%),
        radial-gradient(700px 380px at 5% 110%, rgba(227,146,61,.30), transparent 60%),
        linear-gradient(155deg, #0d1b24 0%, #12303d 58%, #1d4a4a 100%);
    }
    .box {
      width: 100%; max-width: 420px; background: #fbfaf7; border-radius: 18px; padding: 34px 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    .eyebrow { font-size: .74rem; letter-spacing: .09em; text-transform: uppercase; color: #c9772b; font-weight: 700; }
    h1 { font-size: 1.35rem; line-height: 1.3; margin: 8px 0 6px; color: #0d1b24; }
    p { color: #56656e; margin: 0 0 22px; font-size: .95rem; }
    input {
      width: 100%; padding: 13px 14px; font-size: 1rem; border: 1px solid #d6d3cb; border-radius: 10px;
      background: #fff; outline: none;
    }
    input:focus { border-color: #19a3a0; box-shadow: 0 0 0 3px rgba(25,163,160,.18); }
    button {
      width: 100%; margin-top: 12px; padding: 13px; font-size: 1rem; font-weight: 600; border: 0; border-radius: 10px;
      background: #e3923d; color: #1e1307; cursor: pointer;
    }
    button:disabled { opacity: .6; cursor: wait; }
    .err { color: #9a3d1d; font-size: .9rem; margin-top: 10px; min-height: 1.2em; }
  </style>
</head>
<body>
  <form class="box" id="gate">
    <div class="eyebrow">Concept note · zero draft</div>
    <h1>AI-integrated methane monitoring for Ethiopia's ruminant livestock</h1>
    <p>This page is password protected. Enter the password you received.</p>
    <input id="pw" type="password" placeholder="Password" autocomplete="current-password" autofocus required />
    <button id="go" type="submit">Open</button>
    <div class="err" id="err"></div>
  </form>
  <script>
    const PAYLOAD = ${payload};
    const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    document.getElementById("gate").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("go");
      const err = document.getElementById("err");
      btn.disabled = true; btn.textContent = "Opening…"; err.textContent = "";
      try {
        const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(document.getElementById("pw").value), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iterations, hash: "SHA-256" },
          base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.data));
        const html = new TextDecoder().decode(plain);
        document.open(); document.write(html); document.close();
      } catch (_) {
        err.textContent = "Wrong password. Please try again.";
        btn.disabled = false; btn.textContent = "Open";
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "index.html"), page);
console.log(`index.html written (${(page.length / 1024).toFixed(0)} KB, encrypted)`);
