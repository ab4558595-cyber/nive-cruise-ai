import { Link } from "@tanstack/react-router";

export function LegalFooter() {
  return (
    <footer className="relative z-10 border-t border-[#0a2540]/10 bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-6 text-[13px] text-[#697386] sm:flex-row sm:px-10">
        <p>© {new Date().getFullYear()} Nive AI. All rights reserved.</p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link to="/terms" className="transition-colors hover:text-[#635bff]">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-[#635bff]">
            Privacy
          </Link>
          <Link to="/refunds" className="transition-colors hover:text-[#635bff]">
            Refund Policy
          </Link>
          <a
            href="mailto:bansal.monikaji1982@gmail.com"
            className="transition-colors hover:text-[#635bff]"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
