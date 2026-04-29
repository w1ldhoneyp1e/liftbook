import { createFileStore } from "./file-store.mjs"
import { ensureStorageContract } from "./storage-contract.mjs"

export async function createStorage() {
  const storageDriver = process.env.LIFTBOOK_STORAGE_DRIVER ?? "file"

  if (storageDriver === "file") {
    return ensureStorageContract(await createFileStore())
  }

  throw new Error(`Unsupported storage driver: ${storageDriver}`)
}
