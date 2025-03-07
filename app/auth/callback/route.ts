import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  
  // Comprobamos ambos parámetros para mayor compatibilidad
  const redirectTo = 
    requestUrl.searchParams.get("next") || 
    requestUrl.searchParams.get("redirect_to");

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error al intercambiar código por sesión:", error.message);
        return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent("Error de autenticación con Google: " + error.message)}`);
      }
      
      // Verificamos que el usuario esté autenticado correctamente
      if (!data?.session) {
        console.error("No se pudo establecer la sesión después del intercambio de código");
        return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent("No se pudo completar el inicio de sesión")}`);
      }
      
      console.log("Autenticación exitosa, redirigiendo...");
    } catch (error) {
      console.error("Error en el procesamiento del callback:", error);
      return NextResponse.redirect(`${origin}/sign-in?error=${encodeURIComponent("Error al procesar la autenticación")}`);
    }
  } else {
    console.warn("No se encontró código de autorización en la URL");
  }

  if (redirectTo) {
    // Asegurarse de que la redirección sea absoluta o relativa según corresponda
    return redirectTo.startsWith('http') 
      ? NextResponse.redirect(redirectTo)
      : NextResponse.redirect(`${origin}${redirectTo.startsWith('/') ? '' : '/'}${redirectTo}`);
  }

  // URL por defecto para redirigir después de completar el proceso de inicio de sesión
  return NextResponse.redirect(`${origin}/dashboard`);
}
