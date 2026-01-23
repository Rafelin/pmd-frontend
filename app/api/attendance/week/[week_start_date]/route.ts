import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function GET(
  request: Request,
  { params }: { params: { week_start_date: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/attendance/week/${params.week_start_date}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader ?? "",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API ATTENDANCE WEEK ERROR]", errorText);
      return NextResponse.json(
        { error: "Error al obtener la planilla semanal", message: errorText },
        { status: response.status }
      );
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API ATTENDANCE WEEK ERROR]", error);
    return NextResponse.json(
      { error: "Weekly attendance fetch failed" },
      { status: 500 }
    );
  }
}
