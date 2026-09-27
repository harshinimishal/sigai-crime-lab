import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediately expire
    });

    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    console.error("Admin logout error:", err);
    return NextResponse.json(
      { error: "Error logging out." },
      { status: 500 }
    );
  }
}
