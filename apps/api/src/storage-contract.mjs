const requiredStorageMethods = [
  "getHealthSummary",
  "createGuestSession",
  "registerAccount",
  "getUserById",
  "getAccountByEmail",
  "createSessionForUser",
  "getSessionByAccessToken",
  "touchSession",
  "createEmailVerificationToken",
  "getLatestEmailVerificationTokenForUser",
  "verifyEmailByTokenHash",
  "touchDevice",
  "acceptSyncChanges",
  "listSyncEvents",
  "cleanupLifecycle",
]

export function ensureStorageContract(storage) {
  for (const methodName of requiredStorageMethods) {
    if (typeof storage?.[methodName] !== "function") {
      throw new Error(`Storage adapter must implement ${methodName}()`)
    }
  }

  return storage
}
