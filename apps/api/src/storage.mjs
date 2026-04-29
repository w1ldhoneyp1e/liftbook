import { createFileStoreFromPath } from "./file-store.mjs"
import { createPostgresStore } from "./postgres-store.mjs"
import { ensureStorageContract } from "./storage-contract.mjs"

export async function createStorage(config) {
  const storageDriver = config.storage.driver

  if (storageDriver === "file") {
    return ensureStorageContract(
      await createFileStoreFromPath(config.storage.dataFile)
    )
  }

  if (storageDriver === "postgres") {
    return ensureStorageContract(
      await createPostgresStore({
        databaseUrl: config.storage.databaseUrl,
      })
    )
  }

  throw new Error(`Unsupported storage driver: ${storageDriver}`)
}
