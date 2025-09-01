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

  // 3) 新規ユーザーの場合、ユーザー情報と組織を作成
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!existingUser) {
    console.log(`[AUTH_CALLBACK] Creating new user profile for: ${user.id}`);
    
    // 組織名はメールのローカル部を使用
    const orgName = (user.email || "My Org").split("@")[0];
    const username = user.email?.split("@")[0] || "user";

    // 組織を作成
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .insert({ 
        name: orgName,
        representative_name: username,
        owner_id: user.id 
      })
      .select("id")
      .single();

    if (!orgErr && org?.id) {
      // ユーザープロフィールを作成
      const { error: userErr } = await supabase
        .from("users")
        .insert({
          id: user.id,
          org_id: org.id,
          username: username,
          email: user.email || "",
          password_hash: "", // Supabase Auth使用のため空文字
          email_verified: true,
          role: "owner"
        });

      if (userErr) {
        console.error('[AUTH_CALLBACK] Failed to create user profile:', userErr);
      } else {
        console.log(`[AUTH_CALLBACK] Created user profile and organization: ${orgName} (ID: ${org.id}) for user: ${user.id}`);
      }
    } else {
      console.error('[AUTH_CALLBACK] Failed to create organization:', orgErr);
    }
  } else {
    console.log(`[AUTH_CALLBACK] User ${user.id} already exists`);
  }

  // 認証完了後はメインページへ遷移
  return NextResponse.redirect(new URL("/", req.url));
}
