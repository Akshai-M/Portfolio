export function SupademoTour() {
  return (
    <section
      aria-labelledby="product-tour-heading"
      className="px-6 pb-[var(--space-8)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Product tour</p>
          <h2
            id="product-tour-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            See Livefolio in action
          </h2>
          <p className="prose-measure mx-auto mt-3 text-body text-text-secondary">
            Walk through how a resume becomes a published portfolio.
          </p>
        </div>

        <div
          className="relative mx-auto mt-8 w-full max-h-[80svh] py-10 [aspect-ratio:1.72] [box-sizing:content-box]"
        >
          <iframe
            src="https://app.supademo.com/embed/cmsim278j2140qmaaj7ypuliv?embed_v=2&utm_source=embed"
            loading="lazy"
            title="Build and Publish Your Professional Portfolio on Livefolio"
            allow="clipboard-write"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </section>
  );
}
