"use client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SignUp } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="rounded-xl border p-6 bg-white/50">
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  );
}
