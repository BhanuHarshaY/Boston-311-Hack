import { NextResponse } from "next/server";
import { fetchAllBostonData } from "@/lib/boston-data";

export async function GET() {
  try {
    const data = await fetchAllBostonData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live data" },
      { status: 500 },
    );
  }
}
