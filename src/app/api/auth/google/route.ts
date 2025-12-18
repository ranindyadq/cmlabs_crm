import { NextResponse } from "next/server";
import { getGoogleAuthURL } from "@/lib/google";

export async function GET() {
  try {
    const url = getGoogleAuthURL();
    // Redirect user ke halaman login Google
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: "Gagal inisialisasi login Google" }, { status: 500 });
  }
}