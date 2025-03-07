import Link from "next/link";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, User, Mail } from "lucide-react";
import { SmtpMessage } from "../smtp-message";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import PasswordInput from "@/components/password-input";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Image and Text */}
      <div className="hidden lg:flex w-3/5 bg-gradient-to-br from-primary/90 to-primary dark:from-secondary/90 dark:to-secondary p-8 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">
            Todo lo que necesitas para tu negocio
          </h2>
          <p className="text-lg opacity-90">
            Una suite completa de herramientas diseñada para hacer crecer tu
            negocio. Únete a miles de empresas que ya confían en 7hoSoft.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] opacity-10 bg-cover bg-center" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8">
      <Link href="/">
          <div className="flex items-center gap-2 mb-4 lg:fixed lg:top-10 lg:left-10">
            
            <span className="text-4xl lg:text-2xl font-bold drop-shadow-lg">7hoSoft</span>
          </div>
        </Link>
        <Card className="w-full max-w-md border-none shadow-none">
          <form action={signUpAction}>
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Crear cuenta</CardTitle>
            <CardDescription >
              Comienza a gestionar tu negocio de manera profesional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoogleSignInButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="display_name"
                  type="text"
                  placeholder="Tu nombre"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <PasswordInput /> 
            </div>
            <FormMessage message={searchParams} />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <SubmitButton className="w-full" pendingText="Creando cuenta...">
              Crear cuenta
            </SubmitButton>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/sign-in" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
