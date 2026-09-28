import Link from "next/link";
import { notFound } from "next/navigation";
import { carsDatabase, formatINR, formatINRFull } from "../../data";
import PrintSpecificationsButton from "../../components/PrintSpecificationsButton";

interface CarDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CarDetailsPageProps) {
  const { id } = await params;
  const car = carsDatabase.find((entry) => entry.id === id);

  return {
    title: car
      ? `${car.make} ${car.model} ${car.variant} | AutoMatch`
      : "Vehicle details | AutoMatch",
  };
}

export default async function CarDetailsPage({ params }: CarDetailsPageProps) {
  const { id } = await params;
  const car = carsDatabase.find((entry) => entry.id === id);

  if (!car) notFound();

  return (
    <main className="min-h-screen bg-editorial-pattern text-foreground">
      <header className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-ivory-border bg-white/90 px-5 py-4 backdrop-blur-md md:px-8">
        <Link
          href="/recommendations"
          className="font-serif text-sm font-bold uppercase tracking-[0.16em] text-foreground"
        >
          AUTOMATCH 
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/recommendations"
            className="font-serif text-xs italic text-ivory-text-muted underline decoration-ivory-border underline-offset-4 hover:text-brand"
          >
            Back to recommendations
          </Link>
          <PrintSpecificationsButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <section className="mb-8 grid gap-8 border-b border-ivory-border pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              Complete variant record · {car.type} · {car.fuelType}
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
              {car.make} <span className="italic text-brand">{car.model}</span>
            </h1>
            <p className="mt-2 font-serif text-lg italic text-ivory-text-muted">
              {car.variant || "Standard variant"}
              {car.year ? ` · ${car.year}` : ""}
            </p>
          </div>
          <div className="border-l-2 border-brand pl-5 md:min-w-56">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ivory-text-muted">
              Ex-showroom price
            </p>
            <p className="mt-1 font-serif text-3xl font-bold text-foreground">
              {formatINR(car.price)}
            </p>
            <p className="font-mono text-xs text-ivory-text-muted">
              {formatINRFull(car.price)}
            </p>
          </div>
        </section>

        <section className="mb-10 grid grid-cols-2 gap-px border border-ivory-border bg-ivory-border md:grid-cols-4">
          {[
            ["Power", car.specs.power],
            [
              "Displacement",
              car.datasetSpecs.engineCc
                ? `${car.datasetSpecs.engineCc} cc`
                : "Not listed",
            ],
            ["Mileage", car.specs.rangeOrMpg],
            ["Transmission", car.datasetSpecs.transmission],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-4 py-4 md:px-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-ivory-text-muted">
                {label}
              </p>
              <p className="mt-1 font-serif text-base font-semibold text-foreground">
                {value}
              </p>
            </div>
          ))}
        </section>

        <div className="space-y-8">
          {car.specifications.map((section, index) => (
            <section
              key={section.title}
              className="specification-section border-t border-ivory-border pt-4"
            >
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-mono text-[10px] text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="font-serif text-xl font-semibold">
                  {section.title}
                </h2>
                <span className="font-mono text-[9px] text-ivory-text-muted">
                  {section.fields.length} specifications
                </span>
              </div>
              <div className="overflow-x-auto border border-ivory-border bg-white">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ivory-border bg-ivory-hover font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted">
                      <th scope="col" className="px-4 py-3 font-medium">
                        Specification
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Recorded value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.fields.map((field) => (
                      <tr
                        key={field.label}
                        className="border-b border-ivory-border/70 last:border-0"
                      >
                        <th
                          scope="row"
                          className="w-1/2 px-4 py-3 text-left font-serif font-normal text-ivory-text-muted"
                        >
                          {field.label}
                        </th>
                        <td className="px-4 py-3 font-serif font-semibold text-foreground">
                          {field.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-ivory-border pt-4 font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted">
          Specifications are shown as recorded in the supplied vehicle dataset.
          Empty source fields are omitted.
        </p>
      </div>
    </main>
  );
}
