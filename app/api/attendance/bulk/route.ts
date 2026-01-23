import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const bodyText = await request.text();
    
    if (!bodyText || bodyText.trim() === "") {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    try {
      JSON.parse(bodyText);
    } catch (parseError) {
      console.error("[API ATTENDANCE BULK] Invalid JSON body:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/attendance/bulk`, {
      method: "POST",
      headers: {
        Authorization: authHeader ?? "",
        "Content-Type": "application/json",
      },
      body: bodyText,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API ATTENDANCE BULK ERROR]", error);
    return NextResponse.json(
      { error: "Bulk attendance create failed" },
      { status: 500 }
    );
  }
}
