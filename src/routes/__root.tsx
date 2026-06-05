import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { useAnalytics } from "@/hooks/useAnalytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "dqG5fQpUDEML2dcgVfR3wvoWhYCkwrNfsoNZbdLp0p8" },
      { title: "Nive AI" },
      { name: "description", content: "AI-powered coding assistant that generates code for various applications, including Arduino and mobile apps." },
      { name: "keywords", content: "Nive AI, nive ai, niveai, Nive, AI coding copilot, AI code generator, Nive AI India, Nive AI app" },
      { name: "author", content: "Nive AI" },
      { name: "application-name", content: "Nive AI" },
      { name: "apple-mobile-web-app-title", content: "Nive AI" },
      { property: "og:site_name", content: "Nive AI" },
      { property: "og:title", content: "Nive AI" },
      { property: "og:description", content: "AI-powered coding assistant that generates code for various applications, including Arduino and mobile apps." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nive-ai.co.in/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@niveai" },
      { name: "twitter:title", content: "Nive AI" },
      { name: "twitter:description", content: "AI-powered coding assistant that generates code for various applications, including Arduino and mobile apps." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4f284cb5-d11a-48f6-adf6-1288c58dc6b7" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/4f284cb5-d11a-48f6-adf6-1288c58dc6b7" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-3PCB797DC4",
      },
      {
        children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-3PCB797DC4');`,
      },
      {
        children: `try{var t=localStorage.getItem('cruise-ai-theme')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Nive AI",
          alternateName: ["nive ai", "niveai", "Nive", "Nive A.I."],
          url: "https://nive-ai.co.in",
          logo: "https://nive-ai.co.in/favicon.ico",
          description: "Nive AI is an elite AI coding copilot that writes production-quality code for any language or platform.",
          foundingDate: "2025",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Nive AI",
          alternateName: "nive ai",
          url: "https://nive-ai.co.in",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://nive-ai.co.in/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useAnalytics();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
