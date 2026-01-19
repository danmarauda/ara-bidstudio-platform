import { auth } from "@clerk/nextjs/server";
import { DEFAULT_TENANT } from "./tenant";

type OrgSession = { orgSlug?: string; orgId?: string };

export async function getTenantSlugFromAuth(): Promise<string> {
  try {
    const session = await auth();
    const { orgSlug, orgId } = (session as unknown) as OrgSession;
    const slug = orgSlug || orgId || DEFAULT_TENANT;
    return String(slug).toLowerCase();
  } catch {
    return DEFAULT_TENANT;
  }
}
