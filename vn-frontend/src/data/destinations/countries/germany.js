// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'germany',
  intro: 'Most public universities in Germany charge no tuition for international students, though you pay a semester contribution and need to show living funds. Many master’s programmes are taught in English; most bachelor’s programmes need German.',
  quickFacts: [
    { label: 'Visa', value: 'National (D) visa for study, then a residence permit' },
    { label: 'Work while studying', value: '140 full days or 280 half days a year' },
    { label: 'After graduation', value: 'Residence permit to look for work, up to 18 months' },
    { label: 'Main intakes', value: 'Winter semester (October) and summer semester (April)' },
  ],
  overview: {
    system: 'Universities (Universitäten) focus on research and theory; universities of applied sciences (Hochschulen / Fachhochschulen) are more practical. Bachelor’s degrees usually take 3–3.5 years and master’s 1.5–2 years.',
    fields: ['Mechanical and electrical engineering', 'Computer science and data engineering', 'Automotive and renewable energy', 'Natural sciences', 'Business and economics', 'Public health'],
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Aachen', 'Dresden and Leipzig'],
    advantages: ['Little or no tuition at most public universities', 'Strong engineering and research', 'Up to 18 months to look for work after graduation', 'Central location in Europe'],
  },
  costs: {
    tuition: [
      { label: 'Public university – semester contribution (most states)', range: [200, 800], note: 'per year (about €100–400 per semester)' },
      { label: 'Public universities in Baden-Württemberg (non-EU students)', range: [3000, 3000], note: '€1,500 per semester plus contribution' },
      { label: 'Private universities', range: [10000, 30000] },
    ],
    tuitionNote: 'Some states and individual programmes charge fees; check each university. The semester contribution often includes a public transport ticket.',
    living: [
      { label: 'Rent (student residence or shared flat)', range: [350, 750] },
      { label: 'Food and groceries', range: [200, 300] },
      { label: 'Health insurance (public, student rate)', range: [120, 150] },
      { label: 'Transport (if not included in semester ticket)', range: [30, 60] },
      { label: 'Phone, internet and personal', range: [100, 180] },
    ],
    cityNote: 'Munich, Frankfurt and Hamburg are the most expensive. Eastern German cities such as Leipzig, Dresden and Chemnitz are cheaper.',
    requirement: {
      type: 'official',
      text: 'You must prove you can finance your stay. The usual benchmark is €11,904 per year (€992 per month), most often shown through a blocked account (Sperrkonto), a formal declaration of commitment or a scholarship. The German Embassy in Kathmandu says a blocked account is not mandatory when you apply but may be requested during processing.',
      amount: 11904,
      source: { label: 'German Embassy Kathmandu – Study visa', url: 'https://kathmandu.diplo.de/np-en/service/01-visaeinreise/2225320-2225320' },
    },
  },
  admission: {
    academic: [
      'Bachelor’s: a Nepali Grade 12 certificate generally does not give direct entry. Students usually need a foundation course (Studienkolleg) and its final assessment, or successful study at a university in Nepal first. Check the DAAD admission database for your exact qualification.',
      'Master’s: a recognised bachelor’s degree in a closely related subject, often with specific credit requirements. Many applications go through uni-assist.',
    ],
    language: ['English-taught master’s: usually IELTS 6.5 or TOEFL iBT 80–90.', 'German-taught programmes: usually TestDaF or DSH at a high level (around C1).', 'Basic German (A1–B1) helps greatly with daily life and part-time jobs.'],
    documents: ['Passport with at least 12 months validity', 'Admission letter', 'School leaving and higher secondary certificates, degree transcripts', 'Motivation letter and CV', 'Language certificates', 'Financial proof (blocked account, declaration of commitment or scholarship)', 'Health insurance (after visa approval, per the Kathmandu embassy)', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Winter semester deadlines are often between January and July; check each programme.', 'Book the embassy appointment early; waiting times can be long.', 'Open a blocked account if requested and arrange insurance.'],
    note: 'Each university decides admission. Some programmes require a preliminary review documentation (VPD) from uni-assist.',
  },
  visa: {
    name: 'National visa for study',
    overview: 'You apply in person at the German Embassy in Kathmandu after booking an online appointment. In Germany, you register your address and apply for a residence permit at the local foreigners’ office.',
    requirements: [
      { label: 'Visa fee', text: '€75, payable in NPR in cash at the embassy unless you hold a scholarship that waives it.', type: 'official' },
      { label: 'Financial proof', text: 'Usually €11,904 per year (€992 per month). A blocked account may be requested during processing.', type: 'official' },
      { label: 'Health insurance', text: 'Valid health insurance is required; students usually join public insurance after enrolment.', type: 'official' },
      { label: 'Complete applications only', text: 'The embassy accepts only complete applications and may reject incomplete ones.', type: 'official' },
    ],
    processing: 'Appointment and processing times vary and can be long in peak months. Apply as soon as you have admission.',
  },
  fit: {
    suits: ['Engineering, computer science and science students', 'Applicants willing to learn German', 'Students looking for low-tuition options'],
    pros: ['Little or no tuition at most public universities', 'Up to 18 months to look for work', 'Strong industry links'],
    cons: ['Studienkolleg usually needed for bachelor’s after Grade 12', 'German often needed for jobs', 'Housing shortages in big cities'],
  },
  sources: [
    { label: 'German Embassy Kathmandu – Study visa', url: 'https://kathmandu.diplo.de/np-en/service/01-visaeinreise/2225320-2225320' },
    { label: 'Make it in Germany – Securing funding', url: 'https://www.make-it-in-germany.com/en/study-vocational-training/studies-in-germany/complete/securing-funding' },
    { label: 'DAAD – Side jobs', url: 'https://www.daad.de/en/studying-in-germany/work-career/side-jobs/' },
    { label: 'DAAD – Career planning', url: 'https://www.daad.de/en/studying-in-germany/work-career/career-planning/' },
  ],
  verify: [
    'Whether the €11,904 blocked-account benchmark changes for the 2026/27 winter semester.',
    'Current appointment waiting times at the German Embassy in Kathmandu.',
  ],
}
