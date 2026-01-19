"use client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SignIn } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-xl border p-6 bg-white/50">
        {/* When Clerk is not installed, this will error at build time. */}
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}
