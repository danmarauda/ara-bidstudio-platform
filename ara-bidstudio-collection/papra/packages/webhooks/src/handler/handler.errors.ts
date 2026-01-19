export function createInvalidSignatureError() {
  return Object.assign(
    new Error('[ALIAS Docs Webhooks] Invalid signature'),
    {
      code: 'webhook.invalid_signature',
    },
  );
}

export function createUnsupportedSignatureVersionError() {
  return Object.assign(
    new Error('[ALIAS Docs Webhooks] Unsupported signature version, supported versions are "v1"'),
    {
      code: 'webhook.unsupported_signature_version',
    },
  );
}

export function createInvalidSignatureFormatError() {
  return Object.assign(
    new Error('[ALIAS Docs Webhooks] Invalid signature format, unprocessable signature'),
    {
      code: 'webhook.invalid_signature_format',
    },
  );
}
