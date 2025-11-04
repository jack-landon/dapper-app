import { NextResponse } from "next/server";
import { getStakeWall } from "@/server/get";

export async function GET() {
  try {
    const stakes = await getStakeWall();
    return NextResponse.json(stakes);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load stake wall" }, { status: 500 });
  }
}


