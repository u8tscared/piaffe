import { applyD1Migrations } from "cloudflare:test";
import { env as rawEnv } from "cloudflare:workers";
const env = rawEnv as unknown as import("../src/env").Env & { TEST_MIGRATIONS: any };
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
