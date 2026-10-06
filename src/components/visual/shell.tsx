"use client";
import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Photo } from "./primitives";
import { logoutAction } from "@/lib/actions/auth";
const publicLinks = [
  ["Services", "/services"],
  ["Who We Help", "/who-we-help"],
  ["Our Work", "/our-work"],
  ["How It Works", "/how-it-works"],
  ["About", "/about"],
];
const clientLinks = [
  ["Dashboard", "/dashboard"],
  ["My Campaign", "/my-campaign"],
  ["Marketing Calendar", "/calendar"],
  ["My Brand", "/my-brand"],
];
export function VisualHeader({
  customer = false,
  demo = false,
  name = "",
  shop = "",
  localeControl,
  signedIn = false,
}: {
  customer?: boolean;
  demo?: boolean;
  name?: string;
  shop?: string;
  localeControl?: ReactNode;
  signedIn?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const prefix = demo ? "/demo" : "";
  const links = customer ? clientLinks : publicLinks;
  return (
    <header className={`ps-header ${customer ? "ps-customer-header" : ""}`}>
      <div className="ps-header-inner">
        <Logo href={customer ? prefix + "/dashboard" : "/"} />
        <nav
          className={`ps-nav ${open ? "ps-nav-open" : ""}`}
          aria-label={customer ? "Client navigation" : "Main navigation"}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              menuRef.current?.focus();
            }
          }}
        >
          {links.map(([label, url]) => (
            <Link
              key={url}
              href={prefix + url}
              onClick={() => setOpen(false)}
              aria-current={
                pathname === prefix + url ||
                pathname.startsWith(prefix + url + "/")
                  ? "page"
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
          {localeControl && <div className="ps-menu-locale">{localeControl}</div>}
        </nav>
        <div className="ps-header-actions">
          {customer ? (
            <>
              <Link
                className="ps-notification"
                href={prefix + "/dashboard#updates"}
                aria-label="Messages and updates"
              >
                <Bell size={23} />
                <i />
              </Link>
              <div className="ps-account">
                <button
                  onClick={() => setAccount(!account)}
                  aria-expanded={account}
                >
                  {demo ? (
                    <Photo name="avatar" className="ps-avatar" />
                  ) : (
                    <span
                      className="ps-avatar ps-avatar-initial"
                      aria-hidden="true"
                    >
                      {name.slice(0, 1)}
                    </span>
                  )}
                  <span>
                    <strong>{name}</strong>
                    <small>{shop}</small>
                  </span>
                  <ChevronDown size={16} />
                </button>
                {account && (
                  <div className="ps-account-menu">
                    <Link href={prefix + "/my-brand"}>My Brand</Link>
                    <Link href="/assessment">Help & Support</Link>
                    {demo ? (
                      <Link href="/">Back to website</Link>
                    ) : (
                      <form action={logoutAction}>
                        <button type="submit">Log Out</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/assessment" className="ps-button ps-header-cta">
                Book a Free Assessment
                <ArrowRight size={14} />
              </Link>
              <Link
                className="ps-login"
                href={signedIn ? "/dashboard" : "/login"}
              >
                <UserRound size={13} />
                {signedIn ? "Dashboard" : "Client Login"}
              </Link>
            </>
          )}
          {localeControl && <div className="ps-header-locale">{localeControl}</div>}
          <button
            className="ps-menu"
            ref={menuRef}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function VisualFooter() {
  return (
    <footer className="ps-footer">
      <div>
        <Logo href="/" />
        <p>
          Social media management
          <br />
          for small and growing businesses.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        {publicLinks.map(([n, p]) => (
          <Link href={p} key={p}>
            {n}
          </Link>
        ))}
      </nav>
      <div>
        <div className="ps-footer-social">Instagram · Facebook · TikTok</div>
        <p>
          <Link href="/legal/privacy">Privacy</Link> &nbsp;{" "}
          <Link href="/legal/terms">Terms</Link> &nbsp;{" "}
          <Link href="/assessment">Contact</Link>
          <br />© {new Date().getFullYear()} PoStory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
