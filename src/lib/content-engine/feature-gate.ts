import "server-only";

/**
 * Off by default: main may be auto-deployed before its PostgreSQL migration.
 * Enable only after migrations, storage access and tenant smoke tests pass.
 * Keep the existing /store workflow unaffected by this feature gate.
 */
export function isContentEngineEnabled(): boolean {
  return process.env.CONTENT_ENGINE_ENABLED === "true";
}

export function unavailableContentEngine() {
  return Response.json(
    {error:"content_engine_not_enabled",message:"Brand Studio is not enabled on this deployment."},
    {status:503,headers:{"Cache-Control":"no-store","Retry-After":"3600"}},
  );
}
