import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json(
    {
      status: "ok",
      service: "rumah-quran-ar-rasyid",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
    },
  );

  response.headers.set("Cache-Control", "no-store");
  return response;
}
