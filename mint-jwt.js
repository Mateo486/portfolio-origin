#!/usr/bin/env node
/**
 * Dependency-free RS256 JWT minter.
 *
 * Usage:
 *   node mint-jwt.js [sub] [ttl_seconds] [private_key_path]
 *
 * Defaults: sub=mateo, ttl=2592000 (30d), key=./jwt-private.pem
 *
 * The matching public key is in ./jwt-public.pem, and the JWKS Cloudflare
 * needs to upload is ./jwks.json (regenerate with gen-jwks.js if needed).
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const sub    = process.argv[2] || "mateo";
const ttl    = parseInt(process.argv[3] || "2592000", 10); // 30 days
const keyPath = process.argv[4] || path.join(__dirname, "jwt-private.pem");

const key = fs.readFileSync(keyPath, "utf8");
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const now  = Math.floor(Date.now() / 1000);

const header  = { alg: "RS256", typ: "JWT", kid: "portfolio-demo-1" };
const payload = { iss: "mateoaristi.us", sub, iat: now, exp: now + ttl, scope: "read:private" };

const p1 = b64u(JSON.stringify(header));
const p2 = b64u(JSON.stringify(payload));
const signer = crypto.createSign("RSA-SHA256");
signer.update(`${p1}.${p2}`);
const sig = signer.sign(key).toString("base64url");
console.log(`${p1}.${p2}.${sig}`);
