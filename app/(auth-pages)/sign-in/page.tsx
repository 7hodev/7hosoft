import Link from "next/link";
import { signInAction } from "@/app/actions";
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
import { Building2, Mail } from "lucide-react";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import PasswordInput from "@/components/password-input";
export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <Link href="/">
          <div className="flex items-center gap-2 mb-4 fixed top-10 left-10">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">7hoSoft</span>
          </div>
        </Link>
        <Card className="w-full max-w-md border-none shadow-none">
          <form action={signInAction}>
            <CardHeader className="space-y-2">
              <CardTitle className="text-3xl font-bold">¡Bienvenido!</CardTitle>
              <CardDescription>
                Ingresa a tu cuenta para gestionar tu negocio
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
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="tu@empresa.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <PasswordInput />
              </div>
              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <FormMessage message={searchParams} />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <SubmitButton
                className="w-full"
                pendingText="Iniciando sesión..."
              >
                Iniciar sesión
              </SubmitButton>
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href="/sign-up" className="text-primary hover:underline">
                  Regístrate
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right side - Image and Text */}
      <div className="hidden lg:flex w-3/5 bg-gradient-to-br from-primary/90 to-primary dark:from-secondary/90 dark:to-secondary p-8 items-center justify-center relative overflow-hidden">
        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">
            Gestiona tu negocio de manera inteligente
          </h2>
          <p className="text-lg opacity-90">
            7hoSoft es la solución completa para la gestión de tu empresa.
            Accede desde cualquier dispositivo, en cualquier momento y lugar.
          </p>
        </div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80')] opacity-10 bg-cover bg-center" />
      </div>
    </div>
  );
}
