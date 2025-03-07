"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const display_name = formData.get("display_name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !display_name) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email, password y nombre de usuario son requeridos",
    );
  }

  // Consulta directa a la tabla auth.users a través de RPC para verificar si el email ya existe
  // Esta es una forma directa y simple de verificar sin depender de intentos de autenticación
  try {
    // Intentamos registrar al usuario - Supabase devolverá un error específico si ya existe
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { display_name }
      },
    });

    // Si hay error, mostramos mensaje específico para email duplicado
    if (error) {
      console.error(`Error de registro: [${error.code}] ${error.message}`);
      
      // Si el mensaje contiene "already" o el código es de error de duplicación
      if (error.message.toLowerCase().includes("already") || 
          error.message.toLowerCase().includes("exist") ||
          error.message.toLowerCase().includes("ya existe") ||
          error.code === "23505" ||
          error.status === 400) {
        
        return encodedRedirect(
          "error", 
          "/sign-up", 
          "Este correo ya está registrado. Por favor inicia sesión o recupera tu contraseña."
        );
      }
      
      // Cualquier otro error específico
      return encodedRedirect("error", "/sign-up", error.message);
    }

    // Registro exitoso
    return encodedRedirect(
      "success",
      "/sign-up",
      "Gracias por registrarte. Por favor verifica tu correo para continuar.",
    );
  } catch (err) {
    console.error("Error crítico al registrar:", err);
    
    // Verificar si podría ser un error de duplicación
    const errorStr = String(err).toLowerCase();
    if (errorStr.includes("already") || errorStr.includes("duplicate") || errorStr.includes("exist")) {
      return encodedRedirect(
        "error", 
        "/sign-up", 
        "Este correo ya está registrado. Por favor inicia sesión o recupera tu contraseña."
      );
    }
    
    // Error verdaderamente genérico
    return encodedRedirect(
      "error", 
      "/sign-up", 
      "Error al registrar usuario. Inténtalo de nuevo más tarde."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard"); 
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?redirect_to=/reset-password`,
    //redirectTo: `${origin}/reset-password`,
    // Iniciar sesión automáticamente con el email
    // redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`, 
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Passwords do not match",
    );
  }

  const supabase = await createClient();

  // Actualizar la contraseña
  const { error } = await supabase.auth.updateUser({
    password, // Usamos la nueva contraseña
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/dashboard", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

