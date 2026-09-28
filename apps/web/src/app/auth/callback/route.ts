import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath, safeNextPath } from "@/lib/auth";

// Enkel de types die bij inloggen horen. Andere (recovery, email_change) weiger je hier.
const LOGIN_OTP_TYPES: EmailOtpType[] = ["email", "magiclink", "signup"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  let userId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user?.id ?? null;
  } else if (tokenHash && type && LOGIN_OTP_TYPES.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }

  // Altijd een pad op je eigen origin, nooit een volledige URL uit de query string.
  const path = await getPostLoginPath(userId, next);
  return NextResponse.redirect(new URL(path, origin));
}
