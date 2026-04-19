import { StudioShell } from "@repo/presentation-studio";
import { headers as getHeaders } from "next/headers.js";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { resolveUserRole } from "@/lib/resolve-payload-user-role";
import config from "@/payload.config";

type Args = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function StudioPage({ searchParams }: Args) {
  const payloadConfig = await config;
  const headers = await getHeaders();
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers });

  const adminRoute = payloadConfig.routes?.admin ?? "/admin";
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value) && value[0] !== undefined) {
      qs.set(key, value[0]);
    }
  }
  const returnTo = qs.size > 0 ? `/studio?${qs.toString()}` : "/studio";

  if (!user) {
    redirect(`${adminRoute}/login?redirect=${encodeURIComponent(returnTo)}`);
  }

  const userRole = resolveUserRole(user) ?? "";

  return <StudioShell userRole={userRole} />;
}
