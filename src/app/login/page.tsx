import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Вход",
};

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-fg hover:text-fg transition-colors"
        >
          <ArrowLeft size={16} aria-hidden />
          На карту
        </Link>

        <header className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl tracking-tight">Войти в Гуляку</h1>
          <p className="text-sm text-muted-fg">
            Чтобы сохранять избранное и отмечать пройденные маршруты.
          </p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
