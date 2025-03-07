import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { session } } = await supabase.auth.getSession();

    // Lista de rutas públicas (no requieren autenticación)
    const publicRoutes = [
      "/",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/favicon.ico",
      "/auth/callback" // Importante: permitir la ruta de callback sin autenticación
      // Añade aquí cualquier otra ruta pública
    ];

    // Verificar si la ruta actual está en la lista de rutas públicas
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname === route || 
      request.nextUrl.pathname.startsWith(`${route}/`)
    );

    // Redirigir a inicio de sesión si NO es una ruta pública y el usuario no está autenticado
    if (!isPublicRoute && !session) {
      // Añadir la URL actual como parámetro de redirección para volver después del inicio de sesión
      const redirectUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirigir al dashboard si el usuario está en la página principal y está autenticado
    if (request.nextUrl.pathname === "/" && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Para depuración en caso de problemas
    if (request.nextUrl.pathname === "/auth/callback" && !request.nextUrl.searchParams.get("code")) {
      console.log("Callback sin código de autorización");
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    console.error("Error en middleware:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
