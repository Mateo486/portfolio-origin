#!/usr/bin/env node
/**
 * Dependency-free HS256 JWT minter.
 *
 * Usage:
 *   node mint-jwt.js <secret> [sub] [ttl_seconds]
 *
 * Example:
 *   node mint-jwt.js super-secret-key mateo 3600
 *
 * Prints one line: the compact JWT. Configure the same secret in
 * Cloudflare API Shield -> JWT Validation for /api/v1/private/*.
 */
const crypto = require("crypto");

const secret = process.argv[2];
const sub    = process.argv[3] || "mateo";
const ttl    = parseInt(process.argv[4] || "3600", 10);
if (!secret) { console.error("usage: node mint-jwt.js <secret> [sub] [ttl_seconds]"); process.exit(1); }

const b64u = (buf) => Buffer.from(buf).toString("base64url");
const now  = Math.floor(Date.now() / 1000);
const header  = { alg: "HS256", typ: "JWT", kid: "portfolio-demo-1" };
const payload = { iss: "mateoaristi.us", sub, iat: now, exp: now + ttl, scope: "read:private" };

const p1 = b64u(JSON.stringify(header));
const p2 = b64u(JSON.stringify(payload));
const sig = crypto.createHmac("sha256", secret).update(`${p1}.${p2}`).digest("base64url");
console.log(`${p1}.${p2}.${sig}`);
