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
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

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
    <div className="flex-1 flex flex-col justify-center items-center gap-5 min-w-64">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
          Already have an account?{" "}
              <Link
                className="text-primary font-medium underline"
                href="/sign-in"
              >
                Sign in
              </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col min-w-64">
            <div className="flex flex-col gap-2 [&>input]:mb-3 mt-3">
              <Label htmlFor="display_name">Username</Label>
              <Input
                name="display_name"
                placeholder="PacoGonzalez45"
                required
              />
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
              />
            </div>
            <SubmitButton formAction={signUpAction} pendingText="Signing up...">
            Sign up
          </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <FormMessage message={searchParams} />
        </CardFooter>
      </Card>
      <SmtpMessage />
    </div>
  );
}
