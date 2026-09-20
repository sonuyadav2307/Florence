"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FolderOpen, Flower2, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { SessionUser } from "@/lib/types";
import { isDemoMode } from "@/lib/config";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const items = [
    { href: "/projects", label: "Projects", icon: FolderOpen },
    { href: "/flowers", label: "Flower library", icon: Flower2 },
  ];
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-base",
              active ? "bg-brand-soft text-brand" : "text-ink hover:bg-brand-soft",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspaceChrome({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-[216px] flex-col border-r border-border bg-surface p-6 print:hidden lg:flex">
        <p className="font-serif text-[28px] leading-none text-brand">Florence</p>
        <p className="mt-2 text-sm text-muted">{user.workspaceName}</p>
        <div className="mt-8">
          <NavLinks />
        </div>
      </aside>
      <div className="lg:pl-[216px]">
        <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 print:hidden lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent>
              <p className="font-serif text-[28px] text-brand">Florence</p>
              <div className="mt-6">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <p className="font-serif text-2xl text-brand">Florence</p>
        </header>
        {isDemoMode() ? (
          <p className="border-b border-border bg-brand-soft px-4 py-2 text-sm text-brand print:hidden">
            Demo data saved on this device.
          </p>
        ) : null}
        <div className="mx-auto w-full max-w-[1600px] px-4 py-4 md:px-6 md:py-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
