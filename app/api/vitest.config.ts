import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            SESSION_SECRET: "test-secret-0123456789abcdef0123456789abcdef",
            APP_URL: "http://piaffe.test",
            MAIL_PROVIDER: "log",
            STRIPE_SECRET_KEY: "sk_test_fake",
            STRIPE_WEBHOOK_SECRET: "whsec_test",
            STRIPE_CONNECT_WEBHOOK_SECRET: "whsec_test_connect",
            GOOGLE_CLIENT_ID: "google-client-test",
            GOOGLE_CLIENT_SECRET: "google-secret-test",
            ADMIN_EMAILS: "admin.stabl@exemple.fr, seconde.admin@exemple.fr",
          },
        },
      }),
    ],
    test: { setupFiles: ["./test/setup.ts"] },
  };
});
