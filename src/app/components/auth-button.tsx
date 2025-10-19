"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/src/app/components/logout-button";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <Button size="sm" variant={"outline"} disabled>
        Loading...
      </Button>
    );
  }

  return user ? (
    <LogoutButton />
  ) : (
    <Button
      asChild
      size="sm"
      variant={"outline"}
      className="hover:cursor-pointer"
    >
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}
