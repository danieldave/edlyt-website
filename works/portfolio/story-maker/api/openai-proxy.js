// api/openai-proxy.js
// -----------------------------------------------------------------------------
//  Vercel Serverless Function
//  Secure OpenAI Proxy (for frontend apps without exposing OPENAI_KEY)
//  Includes:
//   - CORS Support
//   - Optional Frontend Authentication Token
//   - Basic Rate Limiting (per IP)
//   - Full Error Safety
//   - Raw Forwarding to OpenAI Chat Completion Endpoint
// -----------------------------------------------------------------------------


// ───────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────

// OPTIONAL: set in Vercel dashboard → Environment Variables
// This prevents *any random website* from calling your proxy.
const FRONTEND_AUTH_TOKEN = process.env.FRONTEND_AUTH_TOKEN || null;

// Basic rate-limit settings
const RATE_LIMIT_WINDOW_MS = 12 * 1000; // 12 sec window
const RATE_LIMIT_MAX = 5; // max 5 calls per window per IP

// In-memory store (works perfectly for small projects)
let ipStore = {};


// ───────────────────────────────────────────────────────────────
// CORS HANDLER
// Allows your website OR any allowed domain to call the proxy
// Add specific domains below if needed.
// ───────────────────────────────────────────────────────────────
function applyCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Token");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return true; // OPTIONS handled
  }
  return false;
}


// ───────────────────────────────────────────────────────────────
// RATE LIMITER
// ───────────────────────────────────────────────────────────────
function rateLimit(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    "unknown";

  const now = Date.now();

  if (!ipStore[ip]) {
    ipStore[ip] = { count: 1, start: now };
    return false; // allowed
  }

  const elapsed = now - ipStore[ip].start;

  if (elapsed > RATE_LIMIT_WINDOW_MS) {
    ipStore[ip] = { count: 1, start: now };
    return false; // allowed
  }

  ipStore[ip].count++;

  if (ipStore[ip].count > RATE_LIMIT_MAX) {
    res.status(429).json({
      error: "Too many requests. Slow down.",
      allowed: RATE_LIMIT_MAX,
      window_ms: RATE_LIMIT_WINDOW_MS
    });
    return true; // blocked
  }

  return false; // allowed
}


// ───────────────────────────────────────────────────────────────
// MAIN HANDLER
// ───────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Apply CORS
  if (applyCors(req, res)) return;

  // Only POST allowed
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify frontend auth token (ONLY if you configured one)
  if (FRONTEND_AUTH_TOKEN) {
    const provided = req.headers["x-auth-token"];
    if (provided !== FRONTEND_AUTH_TOKEN) {
      return res.status(401).json({
        error: "Unauthorized — invalid frontend token"
      });
    }
  }

  // Apply rate limiting
  if (rateLimit(req, res)) return;

  // Parse payload
  let payload;
  try {
    payload = req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  if (!payload || !payload.model || !payload.messages) {
    return res.status(400).json({
      error: "Payload must include: model, messages"
    });
  }

  // Load your key
  const OPENAI_KEY = process.env.OPENAI_KEY;
  if (!OPENAI_KEY) {
    return res
      .status(500)
      .json({ error: "OPENAI_KEY not configured in Vercel environment" });
  }

  // Forward request to OpenAI
  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify(payload)
      }
    );

    const text = await openaiResponse.text();

    // Forward status + JSON from OpenAI directly
    res.status(openaiResponse.status).setHeader("Content-Type", "application/json");
    return res.send(text);
  } catch (err) {
    console.error("Proxy internal error:", err);
    return res.status(500).json({
      error: "Proxy server error",
      details: err.message
    });
  }
}
