import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/attendance/${params.id}`, {
      method: "GET",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API ATTENDANCE GET ERROR]", errorText);
      return NextResponse.json(
        { error: "Error al obtener la asistencia", message: errorText },
        { status: response.status }
      );
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API ATTENDANCE GET ERROR]", error);
    return NextResponse.json(
      { error: "Attendance fetch failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      console.error("[API ATTENDANCE PATCH] Invalid JSON body:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/attendance/${params.id}`, {
      method: "PATCH",
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
    console.error("[API ATTENDANCE PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Attendance update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/attendance/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API ATTENDANCE DELETE ERROR]", error);
    return NextResponse.json(
      { error: "Attendance delete failed" },
      { status: 500 }
    );
  }
}
