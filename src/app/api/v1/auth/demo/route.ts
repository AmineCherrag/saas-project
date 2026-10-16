import { NextRequest, NextResponse } from "next/server";
import { SampleDataSeeder } from "@/lib/demo/sample-data-seeder";

export async function GET(request: NextRequest) {
  try {
    const { sessionToken } = SampleDataSeeder.seedDemoEnvironment();

    const redirectUrl = new URL("/dashboard", request.url);
    redirectUrl.searchParams.set("demo", "true");

    const response = NextResponse.redirect(redirectUrl);

    // Set secure HTTP-only session cookie
    response.cookies.set("tradepulse_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to launch demo account";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = SampleDataSeeder.seedDemoEnvironment();

    const response = NextResponse.json({
      success: true,
      data: {
        message: "Demo sample account session initialized.",
        redirectUrl: "/dashboard?demo=true",
      },
      error: null,
    });

    response.cookies.set("tradepulse_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to launch demo account";
    return NextResponse.json(
      { success: false, data: null, error: { message } },
      { status: 500 }
    );
  }
}
