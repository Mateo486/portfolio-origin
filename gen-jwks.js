#!/usr/bin/env node
/**
 * Generate a JWKS (JSON Web Key Set) from an RSA public key for Cloudflare
 * API Shield JWT Validation.
 *
 * Usage: node gen-jwks.js [public_key_path] > jwks.json
 */
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const pubPath = process.argv[2] || path.join(__dirname, "jwt-public.pem");
const pub = crypto.createPublicKey(fs.readFileSync(pubPath, "utf8"));
const jwk = pub.export({ format: "jwk" });

const set = {
  keys: [{
    kty: jwk.kty,
    kid: "portfolio-demo-1",
    alg: "RS256",
    use: "sig",
    n: jwk.n,
    e: jwk.e,
  }],
};

console.log(JSON.stringify(set, null, 2));
