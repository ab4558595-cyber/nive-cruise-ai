import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { DOC_FLAT, docHead } from "@/lib/docs-nav";
import { DocPage } from "@/lib/docs-ui";
import { DOC_BODIES } from "@/lib/docs-pages";

export const Route = createFileRoute("/docs/$slug")({
  head: ({ params }) => docHead(params.slug),
  loader: ({ params }) => {
    if (!DOC_BODIES[params.slug]) throw notFound();
    return { slug: params.slug };
  },
  notFoundComponent: DocNotFound,
  component: DocRoute,
});

function DocRoute() {
  const { slug } = Route.useLoaderData();
  const Body = DOC_BODIES[slug];
  return (
    <DocPage slug={slug}>
      <Body />
    </DocPage>
  );
}

function DocNotFound() {
  return (
    <div>
      <h1 className="text-[30px] font-bold tracking-[-0.02em]">Page not found</h1>
      <p className="mt-3 text-[16px] text-[#425466]">
        That documentation page doesn't exist. Try one of these:
      </p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2">
        {DOC_FLAT.slice(0, 8).map((d) => (
          <li key={d.slug}>
            <Link
              to="/docs/$slug"
              params={{ slug: d.slug }}
              className="block rounded-xl border border-[#0a2540]/10 px-4 py-3 text-[15px] font-medium transition-colors hover:border-[#635bff]"
            >
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
