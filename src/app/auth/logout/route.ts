import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  // Cara menghapus cookie adalah dengan mengirim cookie baru dengan nama yang sama 
  // tapi masa berlakunya sudah lewat (maxAge: 0 atau expires di masa lalu)
  const cookie = serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Langsung kadaluwarsa
  });

  const response = NextResponse.json({ message: "Logout berhasil" });
  response.headers.set("Set-Cookie", cookie);

  return response;
}