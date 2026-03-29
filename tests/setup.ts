// Set env vars before any module loads — runs once per test file
process.env["DATABASE_URL"] =
  "postgresql://lia_test:lia_test_password@localhost:5433/lia_core_test";
process.env["HTTP_INTERNAL_API_KEY"] = "test-internal-key-32-chars-long!!";
process.env["HTTP_GATEWAY_API_KEY"] = "test-gateway-key-32-chars-long!!!";
process.env["JWT_SECRET"] = "test-jwt-secret-that-is-at-least-32-chars-long!!";
process.env["JWT_EXPIRES_IN"] = "1h";
process.env["LOG_LEVEL"] = "silent";
