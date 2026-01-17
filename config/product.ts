export interface ProductConfig {
  productId: string;
  sku?: string;
  brand: string;
  name: string;
  tagline: string;
  description: string;
  rating: {
    score: number;
    countText: string;
  };
  badges: string[];
  price: {
    amount: number;
    currency: string;
    display: string;
    compareAtDisplay?: string;
  };
  variants: string[];
  heroImage: string;
  images: Array<{
    src: string;
    alt: string;
  }>;
  features: Array<{
    title: string;
    description: string;
  }>;
  sections: {
    hero: boolean;
    socialProof: boolean;
    comparison: boolean;
    howItWorks: boolean;
    testimonials: boolean;
    faq: boolean;
    guarantee: boolean;
    shipping: boolean;
  };
  testimonials: Array<{
    name: string;
    rating: number;
    text: string;
  }>;
  faq: Array<{
    q: string;
    a: string;
  }>;
  links: {
    checkout: string;
    faq: string;
    kontakt: string;
    vilkar: string;
    personvern: string;
    retur: string;
    frakt: string;
    garanti: string;
  };
}

export const product = {
  productId: "luminera-led-leseskjerm",
  sku: "LUM-LED-001",
  brand: "Luminera",
  name: "LED Lampe",
  tagline: "Les i senga uten å forstyrre andre – mykt og jevnt lys over hele siden",
  description: "En transparent LED-leseskjerm som gir jevn belysning over hele boksiden. Perfekt for nattlesing uten å forstyrre partneren din. Med varmt, mykt lys, 99-min timer og lang batteritid.",
  rating: {
    score: 4.8,
    countText: "2500+ lesere",
  },
  badges: ["99-min timer", "3 lysmoduser", "30 dager åpent kjøp", "35 timer batteri"],
  price: {
    amount: 249,
    currency: "NOK",
    display: "249,-",
    compareAtDisplay: undefined, // No compare price
  },
  variants: ["Svart", "Hvit", "Rosa"],
  heroImage: "/products/bookbright/BR.avif",
  images: [
    {
      src: "/products/bookbright/BR.avif",
      alt: "LED Leseskjerm for Nattlesing - Hovedbilde",
    },
    {
      src: "/products/bookbright/BR1.avif",
      alt: "LED Leseskjerm for Nattlesing - Sidevisning",
    },
    {
      src: "/products/bookbright/br3.avif",
      alt: "LED Leseskjerm for Nattlesing - I bruk",
    },
    {
      src: "/products/bookbright/br4.avif",
      alt: "LED Leseskjerm for Nattlesing - Detalj",
    },
    {
      src: "/products/bookbright/br5.avif",
      alt: "LED Leseskjerm for Nattlesing - Nattlesing",
    },
    {
      src: "/products/bookbright/br6.avif",
      alt: "LED Leseskjerm for Nattlesing - Lukket",
    },
  ],
  features: [
    {
      title: "Jevn belysning over hele siden",
      description: "Transparent design som lyser jevnt over hele boksiden uten mørke flekker eller skarpe lyspunkter. Perfekt for komfortabel lesing.",
    },
    {
      title: "Varmt og mykt lys",
      description: "Tre varme lysmoduser som ikke belaster øynene. Spesielt designet for nattlesing uten å forstyrre søvnrytmen din.",
    },
    {
      title: "99-minutter automatisk timer",
      description: "Sett en timer på 15, 30, 60 eller 99 minutter. Skrur seg automatisk av, så du kan sove trygt uten å tenke på å slå av lyset.",
    },
    {
      title: "Oppladbart med lang batteritid",
      description: "1200mAh batteri som varer opptil 35 timer på lav styrke. Perfekt for flere lesesessioner uten å måtte lade ofte.",
    },
    {
      title: "Forstyrrer ikke partneren",
      description: "Mykt, retningsbestemt lys som kun belyser boksiden din. Rommet forblir mørkt, så partneren din kan sove uforstyrret.",
    },
    {
      title: "Lett og slank design",
      description: "Ultralett og tynn design som ikke veier ned boken. Enkelt å ta med seg på reise eller bruke hjemme i senga.",
    },
  ],
  sections: {
    hero: true,
    socialProof: true,
    comparison: true,
    howItWorks: true,
    testimonials: true,
    faq: true,
    guarantee: true,
    shipping: true,
  },
  testimonials: [
    {
      name: "Maria K.",
      rating: 5,
      text: "Endelig kan jeg lese om kvelden uten å vekke mannen min! Lyset er så mykt og jevnt at jeg nesten glemmer at det er på. Anbefales på det sterkeste.",
    },
    {
      name: "Erik L.",
      rating: 5,
      text: "Batteriet varer i flere uker med daglig bruk. Timer-funksjonen er genial – jeg sovner ofte med boken i hånden, og lyset skrur seg av automatisk.",
    },
    {
      name: "Sofie H.",
      rating: 5,
      text: "Jeg har prøvd mange leselys, men dette er det første som faktisk gir jevn belysning uten skygger. Veldig fornøyd med kjøpet!",
    },
    {
      name: "Thomas B.",
      rating: 4,
      text: "Perfekt for nattlesing. De tre lysmodusene er nok for meg, og jeg liker at jeg kan justere styrken. Litt dyr, men verdt det.",
    },
    {
      name: "Ingrid M.",
      rating: 5,
      text: "Dette produktet har endret lesevanene mine. Jeg leser mye mer nå fordi jeg kan gjøre det i senga uten å forstyrre noen. Fantastisk!",
    },
  ],
  faq: [
    {
      q: "Hvordan fungerer den transparente LED-teknologien?",
      a: "Leseskjermen bruker LED-lamper plassert langs kanten som sender jevnt lys gjennom en transparent plate. Dette gir belysning over hele boksiden uten mørke områder eller skarpe lyspunkter.",
    },
    {
      q: "Hvor lenge varer batteriet?",
      a: "Batteriet på 1200mAh varer opptil 35 timer på lav styrke, omtrent 20 timer på middels styrke, og rundt 12 timer på høy styrke. Det tar ca. 3-4 timer å lade fullt opp.",
    },
    {
      q: "Kan jeg bruke den med alle bøker?",
      a: "Ja, leseskjermen fungerer med alle størrelser bøker – fra pocket-utgaver til store hardcover-bøker. Den er fleksibel og justerbar.",
    },
    {
      q: "Forstyrrer lyset søvnrytmen?",
      a: "Nei, de tre lysmodusene er spesielt designet med varmt, mykt lys som ikke påvirker produksjonen av melatonin. Perfekt for nattlesing uten å forstyrre søvnen.",
    },
    {
      q: "Hva skjer hvis jeg glemmer å slå av lyset?",
      a: "Med 99-minutter timer-funksjonen skrur lyset seg automatisk av. Du kan velge mellom 15, 30, 60 eller 99 minutter. Perfekt for å unngå å bruke batteri unødvendig.",
    },
    {
      q: "Er den vanskelig å montere?",
      a: "Nei, leseskjermen er veldig enkel å montere. Den klemmer seg fast på boken uten å skade sidene. Ingen verktøy eller komplisert montering nødvendig.",
    },
    {
      q: "Hva hvis jeg ikke er fornøyd?",
      a: "Du har 30 dagers åpent kjøp. Hvis du ikke er fornøyd, kan du returnere produktet i original emballasje og få full refusjon. Se vår retur-side for mer informasjon.",
    },
  ],
  links: {
    checkout: "/checkout",
    faq: "/faq",
    kontakt: "/kontakt",
    vilkar: "/vilkar",
    personvern: "/personvern",
    retur: "/retur",
    frakt: "/frakt",
    garanti: "/garanti",
  },
} as const satisfies ProductConfig;
