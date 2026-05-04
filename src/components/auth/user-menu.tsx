import Link from "next/link";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/sign-out/actions";

export async function UserMenu() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-bg/85 px-3.5 py-2 text-sm shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-muted"
      >
        <LogIn size={14} aria-hidden />
        Войти
      </Link>
    );
  }

  const email = user.email ?? "";
  const initial = email.slice(0, 1).toUpperCase();

  return (
    <form action={signOut}>
      <button
        type="submit"
        title={email}
        className="pointer-events-auto group inline-flex items-center gap-2 rounded-full bg-bg/85 px-2.5 py-1.5 text-sm shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:bg-muted"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-fg font-medium">
          {initial || <UserRound size={14} aria-hidden />}
        </span>
        <span className="max-w-[140px] truncate text-muted-fg group-hover:text-fg">
          {email}
        </span>
        <LogOut
          size={14}
          aria-hidden
          className="text-muted-fg group-hover:text-fg"
        />
      </button>
    </form>
  );
}
