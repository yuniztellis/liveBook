"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Biblioteca", href: "/" },
  { label: "Adicionar livro", href: "/books/new" },
];

const Navbar = () => {
  const pathName = usePathname();
  const {user} = useUser();

  return (
    <header className="fixed z-50 w-full bg-[var(--bg-primary)]">
      <div className="wrapper navbar-height flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-0.5">
          <Image src="/assets/logo.png" alt="LiveBook" width={70} height={45} />
          <span className="logo-text py-1.5">LiveBook</span>
        </Link>

        <nav className="flex w-fit items-center gap-7.5">
          {navItems.map(({ label, href }) => {
            const isActive = pathName === href || (href !== "/" && pathName.startsWith(href));

            return (
              <Link
                href={href}
                key={label}
                className={cn("nav-link-base", isActive ? "nav-link-active" : "text-black hover:opacity-70")}
              >
                {label}
              </Link>
            );
          })}

          <div className="flex gap-7.5">

          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="nav-link-base">Iniciar sessão</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:opacity-90">
                  Criar conta
                </button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
            {user?.firstName && (
                <Link href="/subscriptions" className="nav-user-name">{user.firstName}</Link>
            )}
          </SignedIn>

          </div>

        </nav>
      </div>
    </header>
  );
};

export default Navbar;
