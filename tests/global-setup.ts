import { execSync } from "node:child_process";

const TEST_DB_URL =
  "postgresql://lia_test:lia_test_password@localhost:5433/lia_core_test";

export async function setup() {
  execSync("docker compose -f docker-compose.test.yml up -d --wait", {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  // Run migrations via tsx (separate process so it uses test DB URL)
  execSync("tsx src/scripts/migrate.ts", {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      LOG_LEVEL: "silent",
    },
  });
}

export async function teardown() {
  execSync("docker compose -f docker-compose.test.yml down -v", {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
