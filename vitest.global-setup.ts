import { configDotenv } from "dotenv";
import findConfig from "find-config";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer | null = null;

/**
 * Global setup for Vitest
 *
 * Creates a fresh MongoMemoryServer instance for each test run.
 * The teardown function ensures proper cleanup to prevent port conflicts
 * and stale connections when running tests back-to-back.
 */
export default async function setup() {
  configDotenv({ path: findConfig(".env")! });

  // Ensure any previous instance is cleaned up (defensive)
  if (mongoServer) {
    await mongoServer.stop({ doCleanup: true, force: true });
    mongoServer = null;
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  const dbName = process.env.DATABASE_NAME;

  process.env.DATABASE_URL = uri;
  process.env.DATABASE_NAME = `test-${dbName}`;

  console.log(`✓ MongoMemoryServer started at ${uri}`);

  // Teardown function - called when tests complete
  return async () => {
    if (mongoServer) {
      console.log("⏳ Stopping MongoMemoryServer...");

      try {
        // Force stop with cleanup to release all resources
        await mongoServer.stop({ doCleanup: true, force: true });
        mongoServer = null;

        // Small delay to ensure port is fully released
        // This prevents "address already in use" errors on rapid consecutive runs
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("✓ MongoMemoryServer stopped and cleaned up");
      } catch (error) {
        console.error("⚠ Error stopping MongoMemoryServer:", error);
        // Still try to nullify the reference
        mongoServer = null;
      }
    }
  };
}
