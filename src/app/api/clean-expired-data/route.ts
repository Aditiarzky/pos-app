import { NextRequest, NextResponse } from "next/server";
import { cleanExpiredData } from "@/lib/clean-expired-data";

export async function POST(request: NextRequest) {
  try {
    const result = await cleanExpiredData();
    
    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
