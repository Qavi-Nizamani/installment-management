import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get: (name) => {
          return request.cookies.get(name)?.value;
        },
        set: (name, value, options) => {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set(name, value, options);
        },
        remove: (name, options) => {
          request.cookies.delete(name);
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set(name, "", options);
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } else if (user && request.nextUrl.pathname.startsWith("/auth") && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    // User is authenticated, check if they have a tenant (allow /auth/callback for email verification)
    const { data: existingMember } = await supabase
      .from('members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    const url = request.nextUrl.clone();
    if (existingMember) {
      // User has a tenant, redirect to dashboard
      url.pathname = "/dashboard";
    } else {
      // User doesn't have a tenant, redirect to onboarding
      url.pathname = "/onboarding/setup-workspace";
    }
    return NextResponse.redirect(url);
  } else if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // User is authenticated and trying to access dashboard, check if they have a tenant
    const { data: existingMember } = await supabase
      .from('members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!existingMember) {
      // User doesn't have a tenant, redirect to onboarding
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/setup-workspace";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
