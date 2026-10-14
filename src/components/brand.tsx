import Link from "next/link";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="StokvelOS home" className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" fill="currentColor" />
          <path
            className="brand-glyph"
            d="M22 10.5c-1.8-2-9.7-2.4-11.4 1.1-2.2 4.8 11 2.6 10.7 7.5-.2 3.7-8.6 4.8-12.3 1.6"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        stokvel<span className="brand-os">os</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
