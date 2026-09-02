import crypto from 'crypto';

/**
 * Valida la firma HMAC-SHA256 de Meta WhatsApp Cloud API enviada en el header X-Hub-Signature-256.
 * 
 * Formato del header: "sha256={hash_hex}"
 * Utiliza crypto.timingSafeEqual para prevenir ataques de temporización (timing attacks).
 */
export function verifyMetaSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader?: string | null,
  appSecret?: string | null
): boolean {
  // Si no se configuró appSecret, se permite la petición (útil para desarrollo/mock)
  if (!appSecret || appSecret.trim() === '') {
    return true;
  }

  if (!signatureHeader || !rawBody) {
    return false;
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedSignature = parts[1].trim().toLowerCase();

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody);
  const calculatedSignature = hmac.digest('hex').toLowerCase();

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
  } catch {
    return false;
  }
}
