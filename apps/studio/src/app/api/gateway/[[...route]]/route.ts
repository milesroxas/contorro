import { gatewayApp } from "@repo/gateway/app";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  return gatewayApp.fetch(request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
