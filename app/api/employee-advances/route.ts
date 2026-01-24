import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${BACKEND_URL}/api/employee-advances?${queryString}`
      : `${BACKEND_URL}/api/employee-advances`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al obtener los adelantos", message: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API EMPLOYEE ADVANCES GET ERROR]", error);
    return NextResponse.json({ error: "Employee advances fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const bodyText = await request.text();

    if (!bodyText || bodyText.trim() === "") {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    // Validar JSON
    try {
      JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/employee-advances`, {
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
    console.error("[API EMPLOYEE ADVANCES POST ERROR]", error);
    return NextResponse.json({ error: "Employee advance create failed" }, { status: 500 });
  }
}

