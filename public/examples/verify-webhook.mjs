import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verify the exact raw request bytes before parsing JSON. */
export function verifyRecvWebhook(rawBody, signature, secret) {
  if (
    !Buffer.isBuffer(rawBody) ||
    !secret ||
    typeof signature !== 'string' ||
    !/^sha256=[0-9a-f]{64}$/.test(signature)
  )
    return false;
  const supplied = Buffer.from(signature.slice(7), 'hex');
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  return timingSafeEqual(supplied, expected);
}
