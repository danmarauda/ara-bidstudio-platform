/**
 * Server-side ephemeral storage for auth middleware
 * Provides nonce storage and JWT blacklist. This is a minimal
 * implementation to support API auth flows without an external store.
 * In production, replace with a durable storage (e.g., Convex, Redis).
 */
import 'server-only';

type NonceRecord = {
  nonce: string;
  expiresAt: number;
};

class EphemeralAuthStorage {
  private noncesByPublicKey: Map<string, NonceRecord> = new Map();
  private blacklistedTokens: Map<string, number> = new Map(); // jti -> expiresAt

  async storeNonce(
    publicKey: string,
    nonce: string,
    expiresAt: number
  ): Promise<void> {
    this.noncesByPublicKey.set(publicKey, { nonce, expiresAt });
  }

  async validateAndRemoveNonce(
    publicKey: string,
    nonce: string
  ): Promise<boolean> {
    const record = this.noncesByPublicKey.get(publicKey);
    if (!record) {
      return false;
    }

    const now = Date.now();
    if (record.expiresAt < now) {
      this.noncesByPublicKey.delete(publicKey);
      return false;
    }

    const isValid = record.nonce === nonce;
    // Remove once validated to prevent replay
    this.noncesByPublicKey.delete(publicKey);
    return isValid;
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const expiresAt = this.blacklistedTokens.get(jti);
    if (expiresAt === undefined) {
      return false;
    }
    const now = Date.now();
    if (expiresAt < now) {
      this.blacklistedTokens.delete(jti);
      return false;
    }
    return true;
  }

  async blacklistToken(jti: string, expiresAt: number): Promise<void> {
    this.blacklistedTokens.set(jti, expiresAt);
  }

  cleanupExpired(): void {
    const now = Date.now();
    // Cleanup expired nonces
    for (const [pubkey, { expiresAt }] of this.noncesByPublicKey.entries()) {
      if (expiresAt < now) {
        this.noncesByPublicKey.delete(pubkey);
      }
    }
    // Cleanup expired blacklisted tokens
    for (const [jti, expiresAt] of this.blacklistedTokens.entries()) {
      if (expiresAt < now) {
        this.blacklistedTokens.delete(jti);
      }
    }
  }
}

// Singleton instance
const singleton = new EphemeralAuthStorage();

// Periodic cleanup (every 10 minutes)
setInterval(() => singleton.cleanupExpired(), 10 * 60 * 1000).unref?.();

export function getStorage() {
  return singleton;
}
