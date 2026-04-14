import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
    }

    // Follow redirects to get the final expanded URL
    const response = await fetch(url, { redirect: "follow" });
    const finalUrl = response.url;

    // Try to extract from the expanded URL using regex
    // Looks for @lat,lng e.g. @30.0444,31.2357
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = finalUrl.match(regex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      return NextResponse.json({ ok: true, lat, lng, finalUrl });
    }

    // If it's a place link but doesn't have @, sometimes it's located in other parameters,
    // but the @ pattern is the standard for Google Maps.
    return NextResponse.json({ ok: false, error: "Coordinates not found in url.", finalUrl }, { status: 404 });
  } catch (error: any) {
    console.error("Expand Maps Link Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
