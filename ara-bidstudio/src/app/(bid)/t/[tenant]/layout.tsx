import React from "react";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { parseTenant } from "@/lib/tenant";

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenant: string }> }) {
  const { tenant: tenantParam } = await params;
  const tenant = parseTenant(tenantParam);
  return (
    <div className="min-h-screen w-full">
      <header className="w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">Bid Studio</div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/t/${tenant}/dashboard`} className="hover:underline">Dashboard</Link>
            <Link href={`/t/${tenant}/documents`} className="hover:underline">Documents</Link>
            <Link href={`/t/${tenant}/requirements`} className="hover:underline">Requirements</Link>
            <Link href={`/t/${tenant}/compliance`} className="hover:underline">Compliance</Link>
            <Link href={`/t/${tenant}/estimation`} className="hover:underline">Estimation</Link>
            <Link href={`/t/${tenant}/authoring`} className="hover:underline">Authoring</Link>
            <Link href={`/t/${tenant}/review`} className="hover:underline">Review</Link>
            <Link href={`/t/${tenant}/submission`} className="hover:underline">Submission</Link>
            <Link href={`/t/${tenant}/qa`} className="hover:underline">Q&A</Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">Tenant: {tenant}</div>
            <SignedIn>
              <UserButton afterSignOutUrl="/sign-in" />
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" className="text-sm text-blue-600 hover:underline">Sign in</Link>
            </SignedOut>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
