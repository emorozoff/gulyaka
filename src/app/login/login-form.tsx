"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail, type SignInState } from "./actions";

const initial: SignInState = { status: "idle" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithEmail, initial);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-6 text-center">
        <p className="font-serif text-lg leading-snug">
          Письмо отправлено на <span className="font-semibold">{state.email}</span>
        </p>
        <p className="text-sm text-muted-fg">
          Откройте письмо и нажмите ссылку, чтобы войти. Ссылка действует 1 час.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          required
          disabled={pending}
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-accent">{state.message}</p>
      )}
      <Button type="submit" variant="accent" disabled={pending}>
        {pending ? "Отправляем…" : "Прислать ссылку для входа"}
      </Button>
      <p className="text-center text-xs text-muted-fg">
        Введите email — пришлём magic link для входа без пароля.
      </p>
    </form>
  );
}
