import crypto from "crypto";

/**
 * Generate Digest (base64(SHA256(JSON body)))
 * Hanya dipakai untuk method POST (atau yang punya body).
 * @param {Object} body - object yang akan dikirim sebagai JSON body
 * @returns {string} base64 digest
 */
function generateDigest(body) {
  if (!body) return "";

  const jsonBody = JSON.stringify(body);
  const sha256Hash = crypto
    .createHash("sha256")
    .update(jsonBody, "utf8")
    .digest(); // buffer

  return sha256Hash.toString("base64");
}

/**
 * Generate DOKU Signature untuk Request Header
 * @param {Object} params
 * @param {string} params.requestId - Request-Id (UUID/string unik)
 * @param {string} params.requestTimestamp - ISO 8601, contoh: new Date().toISOString()
 * @param {string} params.requestTarget - path endpoint, contoh: "/doku-virtual-account/v2/payment-code"
 * @param {string} [params.digest] - Digest (wajib untuk POST)
 * @returns {{ signature: string, rawSignature: string }}
 */
function generateSignature({
  requestId,
  requestTimestamp,
  requestTarget,
  digest,
}) {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_ACTIVE_SECRET_KEY;

  if (!clientId || !secretKey) {
    throw new Error(
      "DOKU_CLIENT_ID or DOKU_ACTIVE_SECRET_KEY is not set in environment variables"
    );
  }

  // Susun komponen sesuai dokumentasi, satu baris per komponen
  const components = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
  ];

  // Digest hanya untuk POST (kalau ada)
  if (digest) {
    components.push(`Digest:${digest}`);
  }

  const rawSignature = components.join("\n");

  // HMAC-SHA256 base64 menggunakan Secret Key dari DOKU Back Office
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature, "utf8")
    .digest("base64");

  const signature = `HMACSHA256=${hmac}`;

  return { signature, rawSignature };
}

/**
 * Contoh helper lengkap untuk bikin header DOKU (POST)
 */
function buildDokuHeaders({
  requestId,
  requestTimestamp,
  requestTarget,
  body,
}) {
  const digest = generateDigest(body);
  const { signature } = generateSignature({
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
  });

  return {
    "Client-Id": process.env.DOKU_CLIENT_ID,
    "Request-Id": requestId,
    "Request-Timestamp": requestTimestamp,
    "Request-Target": requestTarget,
    Digest: digest,
    Signature: signature,
    "Content-Type": "application/json",
  };
}

export { generateDigest, generateSignature, buildDokuHeaders };
