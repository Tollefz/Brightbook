import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Personvernerklæring',
  description: 'BookBright sin personvernerklæring. Les om hvordan vi behandler dine personopplysninger i tråd med GDPR.',
};

export default function PersonvernPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 text-sm text-gray-medium">
          <Link href="/" className="hover:text-brand">Hjem</Link>
          <span className="mx-2">/</span>
          <span className="text-dark">Personvern</span>
        </nav>

        {/* Header */}
        <div className="mb-12 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-brand" />
          <h1 className="mb-4 text-4xl font-bold text-dark">Personvern</h1>
          <p className="text-lg text-gray-medium">
            Sist oppdatert: {new Date().toLocaleDateString('no-NO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Innhold */}
        <section className="mb-8 space-y-8 rounded-xl bg-white p-8 shadow-sm">
          <div>
            <h2 className="mb-4 text-2xl font-bold text-dark">Dine personopplysninger</h2>
            <p className="mb-4 text-gray-medium">
              BookBright AS er behandlingsansvarlig for behandlingen av dine personopplysninger.
              Vi tar personvernet ditt på alvor og behandler personopplysningene dine i tråd med GDPR og norsk personvernlovgivning.
            </p>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-brand" />
              <h3 className="text-xl font-bold text-dark">Hva vi samler inn</h3>
            </div>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-medium">
              <li>Navn, e-postadresse og telefonnummer når du oppretter konto eller bestiller</li>
              <li>Leveringsadresse for å levere produkter til deg</li>
              <li>Betalingsinformasjon via Stripe (vi lagrer ikke kortnummer, dette håndteres av Stripe)</li>
              <li>Ordrehistorikk og kjøpsdata</li>
              <li>Cookies og teknisk informasjon for å forbedre din opplevelse på nettsiden</li>
            </ul>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-brand" />
              <h3 className="text-xl font-bold text-dark">Hvordan vi bruker opplysningene</h3>
            </div>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-medium">
              <li>Behandle og levere ordrer</li>
              <li>Kommunisere med deg om ordren din (bekreftelse, levering, retur)</li>
              <li>Håndtere kundeservice og support</li>
              <li>Forbedre våre tjenester og nettside</li>
              <li>Følge opp pålagt lovgivning (f.eks. regnskapsloven)</li>
            </ul>
            <p className="mb-4 text-gray-medium">
              Vi deler ikke opplysningene dine med tredjeparter uten ditt samtykke, unntatt når det er nødvendig for å levere våre tjenester:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-medium">
              <li>Stripe (betalingsbehandling) – se Stripe sin personvernerklæring</li>
              <li>Transportører (Posten, PostNord, Bring) for levering</li>
              <li>Regnskapsfører for regnskapsføring</li>
            </ul>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-brand" />
              <h3 className="text-xl font-bold text-dark">Dine rettigheter (GDPR)</h3>
            </div>
            <p className="mb-4 text-gray-medium">
              Du har følgende rettigheter i henhold til GDPR:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-medium">
              <li><strong>Innsyn:</strong> Du kan be om å få vite hvilke personopplysninger vi har om deg</li>
              <li><strong>Retting:</strong> Du kan be om å få rettet feilaktige opplysninger</li>
              <li><strong>Sletting:</strong> Du kan be om å få slettet dine personopplysninger</li>
              <li><strong>Begrensning:</strong> Du kan be om å begrense behandlingen av dine opplysninger</li>
              <li><strong>Dataportabilitet:</strong> Du kan be om å få utlevert dine opplysninger i et strukturt format</li>
              <li><strong>Protestere:</strong> Du kan protestere mot behandlingen av dine personopplysninger</li>
            </ul>
            <p className="mb-4 text-gray-medium">
              For å utøve dine rettigheter, kontakt oss på <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">{SITE_CONFIG.supportEmail}</a>.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-bold text-dark">Lagringstid</h3>
            <p className="mb-4 text-gray-medium">
              Vi lagrer personopplysningene dine så lenge det er nødvendig for å oppfylle formålet med behandlingen, eller så lenge vi har en juridisk forpliktelse til å lagre dem (f.eks. regnskapsloven krever 5 års lagring av fakturaer).
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-xl font-bold text-dark">Cookies</h3>
            <p className="mb-4 text-gray-medium">
              Vi bruker cookies for å forbedre din opplevelse på nettsiden. Du kan lese mer om vår bruk av cookies på <Link href="/cookies" className="text-brand hover:underline">vår cookies-side</Link>.
            </p>
          </div>
        </section>

        {/* Kontakt */}
        <section className="rounded-xl bg-brand-light p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-dark">Spørsmål om personvern?</h2>
          <p className="mb-6 text-gray-medium">
            Kontakt oss på <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">{SITE_CONFIG.supportEmail}</a>
          </p>
        </section>
      </div>
    </main>
  );
}

