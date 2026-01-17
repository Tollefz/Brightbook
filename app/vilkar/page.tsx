import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Kjøpsvilkår',
  description: 'BookBright sin kjøpsvilkår. Les om angrerett, levering, betaling og garantier.',
};

export default function VilkarPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-gray-medium">
          <Link href="/" className="hover:text-brand">Hjem</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">Vilkår og betingelser</span>
        </nav>

        {/* Header */}
        <div className="mb-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-brand" />
          <h1 className="mb-4 text-4xl font-bold text-dark">Vilkår og betingelser</h1>
          <p className="text-lg text-gray-medium">
            Sist oppdatert: {new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Innhold */}
        <section className="mb-8 space-y-8 rounded-xl bg-white p-8 shadow-sm">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Generelt</h2>
            <p className="text-gray-medium">
              Ved å handle hos BookBright aksepterer du våre kjøpsvilkår. Disse vilkårene gjelder for alle kjøp
              gjort gjennom vår nettbutikk. Vilkårene er i tråd med norsk forbrukerkjøpslov og EU-forbrukerrettigheter.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Bestilling og betaling</h2>
            <p className="mb-4 text-gray-medium">
              Når du legger inn en ordre, aksepterer du å kjøpe produktet til den angitte prisen. Vi forbeholder oss retten til
              å avvise ordrer eller korrigere priser ved feil i våre priser. Du vil bli varslet hvis prisen må korrigeres.
            </p>
            <p className="mb-4 text-gray-medium">
              <strong>Betaling:</strong> Vi bruker Stripe for betalingsbehandling. Du kan betale med kredittkort eller debetkort.
              Betalingen behandles sikkert av Stripe, og vi lagrer ikke dine kortdetaljer. Ved kjøp godkjenner du at betalingen trekkes umiddelbart.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Levering</h2>
            <p className="mb-4 text-gray-medium">
              Vi leverer til hele Norge. Ordrene behandles manuelt etter betaling. Estimert leveringstid: 5–12 virkedager fra ordrebehandling.
            </p>
            <p className="mb-4 text-gray-medium">
              <strong>Frakt:</strong> Fast frakt: 99 kr for alle ordrer.
            </p>
            <p className="mb-4 text-gray-medium">
              Vi er ikke ansvarlige for forsinkelser utenfor vår kontroll (f.eks. streik, ekstremvær, pandemi).
              Du vil få varsel hvis leveringen blir forsinket.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Angrerett (14 dager)</h2>
            <p className="mb-4 text-gray-medium">
              Du har 14 dagers angrerett fra den dagen du mottar produktet, i henhold til forbrukerkjøpsloven § 25.
              Dette betyr at du kan returnere produktet uten å oppgi grunn.
            </p>
            <p className="mb-4 text-gray-medium">
              <strong>Betingelser for angrerett:</strong>
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-medium">
              <li>Produktet må være ubrukt og i original emballasje</li>
              <li>Alle deler og dokumentasjon må følge med</li>
              <li>Du må gi beskjed om angrerett innen 14 dager</li>
              <li>Produktet må sendes tilbake innen rimelig tid etter at du har gitt beskjed</li>
            </ul>
            <p className="mb-4 text-gray-medium">
              Se <Link href="/retur" className="text-brand hover:underline">vår retur-side</Link> for detaljer om hvordan du returnerer produktet.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Refusjon ved retur</h2>
            <p className="mb-4 text-gray-medium">
              Hvis du benytter deg av angreretten, refunderer vi hele kjøpesummen til samme betalingsmetode som du brukte ved kjøp.
              Refusjonen skjer innen 14 dager etter at vi har mottatt produktet tilbake.
            </p>
            <p className="mb-4 text-gray-medium">
              Vi kan trekke fra refusjonen hvis produktet har tapt verdi på grunn av håndtering utover det som er nødvendig for å fastslå produktets art, egenskaper og funksjon.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Garanti og reklamasjon</h2>
            <p className="mb-4 text-gray-medium">
              Alle produkter har 2 års reklamasjonsrett i henhold til forbrukerkjøpsloven. Dette gjelder feil og mangler som oppstår
              under normal bruk av produktet.
            </p>
            <p className="mb-4 text-gray-medium">
              Hvis produktet har en feil eller mangel, har du rett til å kreve retting, omlevering, prisavslag eller heving av kjøpet.
              Kontakt oss på <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">{SITE_CONFIG.supportEmail}</a> for reklamasjon.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Ansvarsbegrensning</h2>
            <p className="mb-4 text-gray-medium">
              BookBright er ikke ansvarlig for skader som følge av feil bruk av produktet. Vårt ansvar er begrenset til produktets verdi.
              Vi er ikke ansvarlig for indirekte skader eller tapt fortjeneste.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Klageadgang</h2>
            <p className="mb-4 text-gray-medium">
              Hvis du ikke er fornøyd med hvordan vi har behandlet din sak, kan du klage til Forbrukertilsynet eller ta saken til Forbrukerklageutvalget.
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="rounded-xl bg-brand-light p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-dark">Spørsmål om vilkårene?</h2>
          <p className="mb-6 text-gray-medium">
            Kontakt oss på <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">{SITE_CONFIG.supportEmail}</a>
          </p>
        </section>
      </div>
    </main>
  );
}

