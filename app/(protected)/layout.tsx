"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  LayoutDashboard,
  Users,
  MoonStar,
  SunMedium,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  ShieldCheck,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    desc: "Overview & stats",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/clients",
    label: "Clients",
    desc: "Manage your clients",
    icon: <Users size={18} />,
  },
];

function pageTitle(pathname: string) {
  return NAV.find((n) => n.href === pathname)?.label ?? "Mini CRM";
}
function pageDesc(pathname: string) {
  return NAV.find((n) => n.href === pathname)?.desc ?? "Admin panel";
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.replace("/login");
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "1") setCollapsed(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const desc = useMemo(() => pageDesc(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* Desktop */}
      <div className="hidden lg:flex">
        <aside
          className={[
            "h-screen sticky top-0 border-r hairline bg-[rgb(var(--card))]",
            "transition-[width] duration-200 ease-out",
            collapsed ? "w-[92px]" : "w-[300px]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="p-4 border-b hairline">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-2xl border hairline bg-[rgb(var(--muted))] grid place-items-center shrink-0">
                  <ShieldCheck
                    size={18}
                    className="text-[rgb(var(--primary))]"
                  />
                </div>

                {!collapsed && (
                  <div className="min-w-0">
                    <div className="font-semibold truncate">Mini CRM</div>
                    <div className="text-xs muted-text truncate">
                      Admin panel
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCollapsed((v) => !v)}
                className="btn px-3"
                aria-label="Toggle sidebar"
                title="Collapse/Expand"
              >
                {collapsed ? (
                  <PanelLeftOpen size={18} />
                ) : (
                  <PanelLeftClose size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="px-3 py-3 space-y-2">
            {NAV.map((item) => (
              <SideLink
                key={item.href}
                href={item.href}
                active={pathname === item.href}
                collapsed={collapsed}
                label={item.label}
                desc={item.desc}
                icon={item.icon}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="mt-auto p-3 border-t hairline space-y-2">
            <div className={collapsed ? "hidden" : "card px-4 py-3"}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border hairline bg-[rgb(var(--muted))] grid place-items-center">
                  <span className="text-sm font-semibold">A</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">admin</div>
                  <div className="text-xs muted-text truncate">Role: admin</div>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-danger w-full"
              title="Logout"
            >
              <span className="inline-flex items-center gap-2">
                <LogOut size={16} />
                {!collapsed && "Logout"}
              </span>
            </button>

            {!collapsed && (
              <div className="pt-1 text-xs muted-text">
                © {new Date().getFullYear()} Mini CRM
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <Topbar
            title={title}
            desc={desc}
            onTheme={toggle}
            theme={theme}
            onMenu={() => {}}
            showMenu={false}
          />
          <main className="container-max py-6">{children}</main>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Topbar
          title={title}
          desc={desc}
          onTheme={toggle}
          theme={theme}
          onMenu={() => setDrawerOpen(true)}
          showMenu
        />

        <main className="container-max py-6">{children}</main>

        {drawerOpen && (
          <div
            className="modal-backdrop"
            onMouseDown={() => setDrawerOpen(false)}
          >
            <div
              className="modal max-w-sm"
              onMouseDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="card-hd flex items-center justify-between">
                <div>
                  <div className="font-semibold">Menu</div>
                  <div className="text-xs muted-text">Navigation</div>
                </div>
                <button
                  className="btn"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="card-bd space-y-2">
                {NAV.map((item) => (
                  <MobileLink
                    key={item.href}
                    href={item.href}
                    active={pathname === item.href}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl border hairline bg-[rgb(var(--card))] grid place-items-center">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs muted-text truncate">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  </MobileLink>
                ))}

                <div className="pt-2 border-t hairline" />

                <button onClick={toggle} className="btn w-full justify-between">
                  <span className="inline-flex items-center gap-2">
                    {theme === "dark" ? (
                      <MoonStar size={16} />
                    ) : (
                      <SunMedium size={16} />
                    )}
                    Theme
                  </span>
                  <span className="text-xs muted-text">
                    {theme === "dark" ? "Dark" : "Light"}
                  </span>
                </button>

                <button onClick={logout} className="btn btn-danger w-full">
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={16} />
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SideLink({
  href,
  active,
  collapsed,
  label,
  desc,
  icon,
}: {
  href: string;
  active: boolean;
  collapsed: boolean;
  label: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative block rounded-2xl border transition",
        "border-[rgb(var(--border))]/60 bg-[rgb(var(--muted))]/35 hover:bg-[rgb(var(--muted))]/60",
        active
          ? "border-[rgb(var(--primary))]/45 bg-[rgb(var(--primary))]/10 shadow-[0_0_0_1px_rgba(99,102,241,0.12)]"
          : "",
        collapsed ? "px-3 py-3" : "px-4 py-3",
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      {/* active indicator */}
      <span
        className={[
          "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full",
          active ? "bg-[rgb(var(--primary))]" : "bg-transparent",
        ].join(" ")}
      />

      <div className="flex items-start gap-3">
        <div
          className={[
            "h-9 w-9 rounded-xl border grid place-items-center shrink-0",
            "border-[rgb(var(--border))]/65 bg-[rgb(var(--card))]",
            active ? "border-[rgb(var(--primary))]/35" : "",
          ].join(" ")}
          aria-hidden="true"
        >
          {icon}
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <div className="font-medium leading-5">{label}</div>
            <div className="text-xs muted-text truncate">{desc}</div>
          </div>
        )}
      </div>
    </Link>
  );
}

function Topbar({
  title,
  desc,
  onTheme,
  theme,
  showMenu,
  onMenu,
}: {
  title: string;
  desc: string;
  onTheme: () => void;
  theme: "dark" | "light";
  showMenu: boolean;
  onMenu: () => void;
}) {
  return (
    <div className="border-b hairline bg-[rgb(var(--card))]/75 backdrop-blur">
      <div className="container-max py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm muted-text">Mini CRM</div>
          <div className="text-xl font-semibold truncate">{title}</div>
          <div className="text-sm muted-text truncate">{desc}</div>
        </div>

        <div className="flex items-center gap-2">
          {showMenu && (
            <button className="btn" onClick={onMenu} aria-label="Open menu">
              <Menu size={18} />
            </button>
          )}

          <button className="btn" onClick={onTheme} aria-label="Toggle theme">
            {theme === "dark" ? (
              <SunMedium size={18} />
            ) : (
              <MoonStar size={18} />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border p-4 transition",
        "border-[rgb(var(--border))]/60 bg-[rgb(var(--muted))]/35 hover:bg-[rgb(var(--muted))]/60",
        active
          ? "border-[rgb(var(--primary))]/45 bg-[rgb(var(--primary))]/10"
          : "",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
