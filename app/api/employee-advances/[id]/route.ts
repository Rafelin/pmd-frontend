import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization");
    const { id } = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/employee-advances/${id}`, {
      method: "GET",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API EMPLOYEE ADVANCES ID GET ERROR]", error);
    return NextResponse.json({ error: "Employee advance fetch failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization");
    const { id } = await context.params;
    const bodyText = await request.text();

    if (!bodyText || bodyText.trim() === "") {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    try {
      JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/api/employee-advances/${id}`, {
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
    console.error("[API EMPLOYEE ADVANCES ID PATCH ERROR]", error);
    return NextResponse.json({ error: "Employee advance update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization");
    const { id } = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/employee-advances/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API EMPLOYEE ADVANCES ID DELETE ERROR]", error);
    return NextResponse.json({ error: "Employee advance delete failed" }, { status: 500 });
  }
}

