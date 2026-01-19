// Clerk middleware scaffold: protect app routes when Clerk is installed
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Protect everything under /t and auth pages handled separately
    "/t/:path*",
    "/((?!.+\.[\w]+$|_next).*)",
  ],
};
