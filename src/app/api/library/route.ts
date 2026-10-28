import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/session";
import { getUpstreamAuthHeader } from "@/lib/auth/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set(["eu_law", "albanian"]);

function getBackendBaseUrl(): string {
  let baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://eu-law.deputeti.ai";
  if (baseUrl.includes("#")) {
    baseUrl = baseUrl.split("#")[0];
  }
  return baseUrl.replace(/\/$/, "");
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const source = request.nextUrl.searchParams.get("source") || "eu_law";
    const q = request.nextUrl.searchParams.get("q") || "";
    const docId = request.nextUrl.searchParams.get("doc_id") || "";
    const mode = request.nextUrl.searchParams.get("mode") || "";
    const page = request.nextUrl.searchParams.get("page") || "1";
    const pageSize = request.nextUrl.searchParams.get("page_size") || "50";
    const limit = request.nextUrl.searchParams.get("limit") || "50";

    if (!ALLOWED_SOURCES.has(source)) {
      return NextResponse.json({ detail: "Invalid source." }, { status: 400 });
    }

    let authHeader: string;
    try {
      authHeader = await getUpstreamAuthHeader();
    } catch {
      return NextResponse.json({ detail: "Upstream authentication failed." }, { status: 502 });
    }

    const backendBase = getBackendBaseUrl();
    const backendUrl = docId
      ? mode === "chunks"
        ? `${backendBase}/api/v1/explorer/v2/${source}/documents/${encodeURIComponent(docId)}/chunks?page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`
        : `${backendBase}/api/v1/explorer/v2/${source}/documents/${encodeURIComponent(docId)}`
      : q.trim()
        ? `${backendBase}/api/v1/explorer/v2/${source}/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`
        : `${backendBase}/api/v1/explorer/v2/${source}/documents?page=${encodeURIComponent(page)}&page_size=${encodeURIComponent(pageSize)}`;

    let upstream = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (upstream.status === 401) {
      try {
        authHeader = await getUpstreamAuthHeader(true);
      } catch {
        return NextResponse.json({ detail: "Upstream authentication failed." }, { status: 502 });
      }
      upstream = await fetch(backendUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    }

    const text = await upstream.text();
    let parsed: unknown = { detail: "Invalid upstream response." };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { detail: "Invalid upstream response." };
    }

    return NextResponse.json(parsed, { status: upstream.status });
  } catch {
    return NextResponse.json({ detail: "Library request failed." }, { status: 500 });
  }
}
