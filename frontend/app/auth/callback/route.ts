import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
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

  const sp = req.nextUrl.searchParams;

  // 1) OTP/PKCEをセッションへ
  const code = sp.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Code exchange error:', error);
      
      // メール認証失敗をログに記録
      console.log(`[EMAIL_AUTH] Authentication failed: ${error.message}`);
      
      const to = new URL("/login?e=exchange&msg=" + encodeURIComponent(error.message), req.url);
      return NextResponse.redirect(to);
    }
    
    // メール認証成功をログに記録
    console.log('[EMAIL_AUTH] Authentication successful');
  }

  // セッション確認
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('User fetch error:', userError);
    return NextResponse.redirect(new URL("/login?e=user&msg=" + encodeURIComponent(userError.message), req.url));
  }
  if (!user) return NextResponse.redirect(new URL("/login?e=nosession", req.url));

  // 2) 招待があれば accept_invite()
  const inviteId = sp.get("inv");
  if (inviteId) {
    const { error } = await supabase.rpc("accept_invite", { p_invite_id: inviteId });
    if (error) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?invite=invalid", req.url));
    }
  }

  // 3) ownerの初回サインアップ時：org未所属なら作成してownerで紐付け
  const { data: existing } = await supabase
    .from("org_members")
    .select("org_id").eq("user_id", user.id).limit(1);

  if (!existing || existing.length === 0) {
    // org名はメールのローカル部を使用
    const orgName = (user.email || "My Org").split("@")[0];

    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ name: orgName, owner_id: user.id })
      .select("id")
      .single();

    if (!orgErr && org?.id) {
      await supabase
        .from("org_members")
        .insert({ org_id: org.id, user_id: user.id, role: "owner" });
    }
  }

  // 認証完了後はメインページへ遷移
  return NextResponse.redirect(new URL("/", req.url));
}
