import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { verifyRecvWebhook } from '../public/examples/verify-webhook.mjs';
const body = Buffer.from('{ "status": "FILLED", "amount": "10.000001" }');
const secret = 'test-only-endpoint-secret';
const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
test('accepts actual raw-body HMAC and rejects tampering, malformed and wrong credentials', () => {
  assert.equal(verifyRecvWebhook(body, signature, secret), true);
  for (const input of [
    undefined,
    '',
    'sha256=zz',
    'sha256=ab',
    `${signature}00`,
    `sha512=${signature.slice(7)}`,
  ])
    assert.equal(verifyRecvWebhook(body, input, secret), false);
  assert.equal(
    verifyRecvWebhook(
      Buffer.from(JSON.stringify(JSON.parse(body))),
      signature,
      secret,
    ),
    false,
  );
  assert.equal(verifyRecvWebhook(body, signature, 'wrong-secret'), false);
  assert.equal(verifyRecvWebhook(body.toString(), signature, secret), false);
});
