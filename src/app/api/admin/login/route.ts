import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createAdminToken, setAdminCookie, clearAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password, action } = await req.json();

    // Logout
    if (action === "logout") {
      await clearAdminCookie();
      return NextResponse.json({ success: true });
    }

    // Login
    if (!checkAdminPassword(password || "")) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const token = await createAdminToken();
    await setAdminCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
