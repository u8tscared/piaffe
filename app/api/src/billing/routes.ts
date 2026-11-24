import { Hono } from "hono";
import type { AppEnv } from "../env";
const app = new Hono<AppEnv>();
export default app;
/** Tâche planifiée facultative du lot (appelée par le cron du Worker). */
export async function cron(_env: AppEnv["Bindings"], _cron: string): Promise<void> {}
