import { NextRequest, NextResponse } from "next/server";
import { AuthKitToken } from "@picahq/authkit-node";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const authKitToken = new AuthKitToken(process.env.PICA_SECRET_KEY as string);

  const token = await authKitToken.create({
    identity: "user_123", // a meaningful identifier (i.e., userId, teamId or organizationId)
    identityType: "user" // can be either user, team or organization
  });

  // Add CORS headers to the response
  return NextResponse.json(token, {
    headers: corsHeaders,
  });
}
