import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/env";

const BACKEND_URL = getBackendUrl();

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    
    // Forward query params (filterByOrganization, work_id, trade, isActive)
    const queryString = searchParams.toString();
    const url = queryString 
      ? `${BACKEND_URL}/api/employees?${queryString}`
      : `${BACKEND_URL}/api/employees`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader ?? "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API EMPLOYEES ERROR]", errorText);
      return NextResponse.json(
        { error: "Error al obtener los empleados", message: errorText },
        { status: response.status }
      );
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : [];

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API EMPLOYEES GET ERROR]", error);
    return NextResponse.json(
      { error: "Employees fetch failed" },
      { status: 500 }
    );
  }
}

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
      console.error("[API EMPLOYEES POST] Invalid JSON body:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/employees`, {
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
    console.error("[API EMPLOYEES POST ERROR]", error);
    return NextResponse.json(
      { error: "Employees create failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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
      console.error("[API EMPLOYEES PATCH] Invalid JSON body:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/employees`, {
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
    console.error("[API EMPLOYEES PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Employees update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const body = await request.text();

    const response = await fetch(`${BACKEND_URL}/api/employees`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader ?? "",
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API EMPLOYEES DELETE ERROR]", error);
    return NextResponse.json(
      { error: "Employees delete failed" },
      { status: 500 }
    );
  }
}
