"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="font-semibold">Mini CRM</div>

          <nav className="flex items-center gap-3">
            <NavLink href="/dashboard" active={pathname === "/dashboard"}>
              Dashboard
            </NavLink>
            <NavLink href="/clients" active={pathname === "/clients"}>
              Clients
            </NavLink>

            <button
              onClick={logout}
              className="rounded-xl border px-3 py-2 hover:bg-white/5"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, active, children }: any) {
  return (
    <Link
      href={href}
      className={`rounded-xl border px-3 py-2 hover:bg-white/5 ${active ? "bg-white/5" : ""}`}
    >
      {children}
    </Link>
  );
}
