import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: NextRequest) {
  const { orgId, email } = await req.json();
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: ownerRow } = await supabase
    .from("org_members")
    .select("role").eq("org_id", orgId).eq("user_id", user.id).eq("role","owner")
    .maybeSingle();

  if (!ownerRow) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { data: inv, error } = await supabase
    .from("invites").insert({ org_id: orgId, email, invited_by: user.id })
    .select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${inv.id}`;
  return NextResponse.json({ inviteUrl });
}
