import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { listConversationsForUser } from "@/lib/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const conversations = listConversationsForUser(user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list conversations.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Failed to list conversations." }, { status: 500 });
  }
}
