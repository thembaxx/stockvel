"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { PageEnter } from "@/components/motion";
import {
  HouseIcon,
  UsersThreeIcon,
  ReceiptIcon,
  ArrowsLeftRightIcon,
  CalendarDotsIcon,
  HeartIcon,
  ChecksIcon,
  ChartBarIcon,
  GearSixIcon,
  ArrowUpRightIcon,
  CaretDownIcon,
  PlusIcon,
  BellIcon,
  MagnifyingGlassIcon,
  XIcon,
  DotsThreeOutlineIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import { Brand } from "@/components/brand";
import { useDemo } from "./context";
import { actors } from "./model";
import { RecordPaymentDialog, ShareDialog } from "./forms";
import { Overview } from "./overview";
import { Contributions } from "./contributions";
import {
  Members,
  Reconciliation,
  Payouts,
  Benefits,
  Approvals,
  Reports,
  Settings,
} from "./screens";

export type View =
  | "overview"
  | "members"
  | "contributions"
  | "reconciliation"
  | "payouts"
  | "benefits"
  | "approvals"
  | "reports"
  | "settings";
const baseNavigation = [
  { view: "overview", label: "Overview", Icon: HouseIcon },
  { view: "members", label: "Members", Icon: UsersThreeIcon },
  { view: "contributions", label: "Contributions", Icon: ReceiptIcon },
  { view: "reconciliation", label: "Reconciliation", Icon: ArrowsLeftRightIcon },
] as const;
const href = (view: string) => (view === "overview" ? "/demo" : `/demo/${view}`);
export function Workspace({ view }: { view: View }) {
  const router = useRouter();
  const { state, actor, setActor, switchSociety, toast, notify } = useDemo();
  const [modal, setModal] = useState<"record" | "share" | null>(null);
  const [more, setMore] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  useEffect(() => {
    if (view === "benefits") switchSociety("burial");
    else if (view === "payouts") switchSociety("rotating");
  }, [view, switchSociety]); // Deliberate demo entry points; no server permissions are inferred.
  function chooseSociety(type: "rotating" | "burial") {
    switchSociety(type);
    if (view === "payouts" && type === "burial") router.push("/demo/benefits");
    if (view === "benefits" && type === "rotating") router.push("/demo/payouts");
  }
  const navigation = [
    ...baseNavigation,
    {
      view: state.type === "rotating" ? "payouts" : "benefits",
      label: state.type === "rotating" ? "Payout rotation" : "Benefit requests",
      Icon: state.type === "rotating" ? CalendarDotsIcon : HeartIcon,
    },
    { view: "approvals", label: "Approvals", Icon: ChecksIcon },
    { view: "reports", label: "Reports", Icon: ChartBarIcon },
  ];
  const title =
    view === "overview"
      ? "Overview"
      : view === "payouts"
        ? "Payout rotation"
        : view === "benefits"
          ? "Benefit requests"
          : view.charAt(0).toUpperCase() + view.slice(1);
  const actions = { onRecord: () => setModal("record"), onShare: () => setModal("share") };
  let screen: ReactNode;
  switch (view) {
    case "contributions":
      screen = <Contributions onRecord={actions.onRecord} />;
      break;
    case "members":
      screen = <Members />;
      break;
    case "reconciliation":
      screen = <Reconciliation />;
      break;
    case "payouts":
      screen = <Payouts />;
      break;
    case "benefits":
      screen = <Benefits />;
      break;
    case "approvals":
      screen = <Approvals />;
      break;
    case "reports":
      screen = <Reports />;
      break;
    case "settings":
      screen = <Settings />;
      break;
    default:
      screen = <Overview {...actions} />;
  }
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand light />
        <div className="society-switch">
          <span className="society-switch-icon">
            {state.type === "rotating" ? <UsersThreeIcon size={21} /> : <HeartIcon size={21} />}
          </span>
          <div>
            <small>Your workspace</small>
            <select
              aria-label="Choose society"
              value={state.type}
              onChange={(e) => chooseSociety(e.target.value as "rotating" | "burial")}
            >
              <option value="rotating">Ubuntu Savings Circle</option>
              <option value="burial">Sisonke Burial Society</option>
            </select>
          </div>
          <CaretDownIcon size={13} />
        </div>
        <span className="sidebar-label">SOCIETY MANAGEMENT</span>
        <nav aria-label="Workspace navigation">
          {navigation.map(({ view: v, label, Icon }) => (
            <Link
              key={v}
              href={href(v)}
              className={`sidebar-link ${view === v ? "current" : ""}`}
              aria-current={view === v ? "page" : undefined}
            >
              <Icon size={21} weight={view === v ? "fill" : "regular"} />
              {label}
              {v === "approvals" && <span className="nav-count">1</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <ShieldCheckIcon size={25} weight="light" />
            <h4>A clearer way together.</h4>
            <p>
              Your bank holds the money.
              <br />
              We help you keep the record.
            </p>
            <Link href="/">
              Meet StokvelOS <ArrowUpRightIcon size={15} />
            </Link>
          </div>
          <Link
            href="/demo/settings"
            className={`sidebar-link ${view === "settings" ? "current" : ""}`}
          >
            <GearSixIcon size={21} /> Society settings
          </Link>
          <Link href="/" className="sidebar-link sidebar-back">
            <ArrowLeftIcon size={18} /> Back to website
          </Link>
          <div className="sidebar-user">
            <span className="avatar sage">
              {actor.name
                .split(" ")
                .map((s) => s[0])
                .join("")}
            </span>
            <div>
              <b>{actor.name}</b>
              <small>{actor.role}</small>
            </div>
            <span className="user-online" />
          </div>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <b>{title}</b>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Search members"
              onClick={() => setShowSearch(!showSearch)}
            >
              <MagnifyingGlassIcon size={21} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="Show pending actions"
              onClick={() =>
                notify(
                  "2 payments await verification. The next committee payout needs 2 approvals.",
                )
              }
            >
              <BellIcon size={21} />
              <i />
            </button>
            <span className="header-divider" />
            <span className="avatar warm">
              {actor.name
                .split(" ")
                .map((s) => s[0])
                .join("")}
            </span>
            <label className="actor-select">
              <span>Demo reviewer</span>
              <select
                aria-label="Act as demo reviewer"
                value={actor.id}
                onChange={(e) => setActor(e.target.value)}
              >
                {actors.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.name} · {a.role}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <div className="demo-banner">
          <span>
            <span className="tiny-dot" /> Interactive demo{" "}
            <span className="banner-desktop">· Fictional data · Changes reset on refresh</span>
          </span>
          <Link href="/privacy">
            About this prototype <ArrowUpRightIcon size={13} />
          </Link>
        </div>
        {showSearch && (
          <div className="global-search">
            <label>
              <MagnifyingGlassIcon size={19} />
              <input
                autoFocus
                placeholder="Find a member…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div>
              {state.members
                .filter((m) => search && m.name.toLowerCase().includes(search.toLowerCase()))
                .map((m) => (
                  <Link href="/demo/members" key={m.id} onClick={() => setShowSearch(false)}>
                    {m.name}
                    <ArrowUpRightIcon size={15} />
                  </Link>
                ))}
            </div>
            {search &&
              !state.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase())) && (
                <p>No members found.</p>
              )}
          </div>
        )}
        <main id="main-content" className="workspace-main">
          <PageEnter id={view}>{screen}</PageEnter>
        </main>
        <footer className="workspace-footer">
          <span>
            <ShieldCheckIcon size={14} /> Sample records · No live money movement
          </span>
          <span>StokvelOS · Africa/Johannesburg</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {[
          { v: "overview", l: "Home", I: HouseIcon },
          { v: "members", l: "Members", I: UsersThreeIcon },
          { v: "contributions", l: "Contributions", I: ReceiptIcon },
          {
            v: state.type === "rotating" ? "payouts" : "benefits",
            l: state.type === "rotating" ? "Payouts" : "Benefits",
            I: state.type === "rotating" ? CalendarDotsIcon : HeartIcon,
          },
        ].map(({ v, l, I }) => (
          <Link
            href={href(v)}
            key={v}
            aria-current={view === v ? "page" : undefined}
            className={view === v ? "current" : ""}
          >
            <I size={22} weight={view === v ? "fill" : "regular"} />
            <span>{l}</span>
          </Link>
        ))}
        <button onClick={() => setMore(!more)} aria-expanded={more}>
          <DotsThreeOutlineIcon size={22} />
          <span>More</span>
        </button>
      </nav>
      <AnimatePresence>
        {more && (
          <m.div
            className="mobile-more"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex-between">
              <b>More from your society</b>
              <button
                className="icon-button"
                onClick={() => setMore(false)}
                aria-label="Close more menu"
              >
                <XIcon size={20} />
              </button>
            </div>
            <label>
              Society
              <select
                value={state.type}
                onChange={(e) => chooseSociety(e.target.value as "rotating" | "burial")}
              >
                <option value="rotating">Ubuntu Savings Circle</option>
                <option value="burial">Sisonke Burial Society</option>
              </select>
            </label>
            {[
              { v: "reconciliation", l: "Bank reconciliation" },
              { v: "approvals", l: "Committee approvals" },
              { v: "reports", l: "Reports & exports" },
              { v: "settings", l: "Society settings" },
            ].map(({ v, l }) => (
              <Link key={v} href={href(v)} onClick={() => setMore(false)}>
                {l}
                <ArrowUpRightIcon size={17} />
              </Link>
            ))}
          </m.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal === "record" && <RecordPaymentDialog key="record" onClose={() => setModal(null)} />}{" "}
        {modal === "share" && <ShareDialog key="share" onClose={() => setModal(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <m.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <CheckIcon />
            <span>{toast}</span>
            <button onClick={() => notify("")} aria-label="Dismiss notification">
              <XIcon size={18} />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function CheckIcon() {
  return <ChecksIcon size={23} />;
}
