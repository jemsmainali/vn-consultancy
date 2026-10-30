// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'france',
  intro: 'France has state-regulated fees at public universities, respected business and engineering schools, and a growing number of English-taught master’s programmes. Most bachelor’s programmes are taught in French.',
  quickFacts: [
    { label: 'Visa', value: 'Long-stay student visa (VLS-TS “étudiant”)' },
    { label: 'Work while studying', value: '964 hours a year (about 20 hours a week)' },
    { label: 'After graduation', value: 'One-year job-search / business-creation residence permit' },
    { label: 'Main intakes', value: 'September, some January starts' },
  ],
  overview: {
    system: 'Public universities follow the LMD structure: licence (bachelor’s, 3 years), master (2 years) and doctorat. Grandes écoles and business schools are selective and often charge higher fees.',
    fields: ['Business and management', 'Engineering', 'Fashion, design and luxury management', 'Hospitality and culinary arts', 'Data science and AI', 'International relations'],
    cities: ['Paris', 'Lyon', 'Toulouse', 'Lille', 'Grenoble', 'Montpellier'],
    advantages: ['Regulated tuition at public universities', 'Housing aid (CAF) available to many international students', 'One-year job-search permit for master’s graduates', 'Access to the wider European job market'],
  },
  costs: {
    tuition: [
      { label: 'Public university – licence (per year)', range: [2902, 2902], note: 'differentiated fee for non-EU students, 2026–27' },
      { label: 'Public university – master (per year)', range: [3950, 3950], note: 'differentiated fee for non-EU students, 2026–27' },
      { label: 'Doctorate (per year)', range: [398, 398] },
      { label: 'Business and private schools (per year)', range: [10000, 25000] },
    ],
    tuitionNote: 'Some universities partly or fully exempt international students from differentiated fees. Campus France pages show slightly different 2026–27 figures in places, so confirm the fee with your university.',
    living: [
      { label: 'Rent – Paris', range: [600, 1100] },
      { label: 'Rent – other cities', range: [350, 650] },
      { label: 'Food and groceries', range: [200, 300] },
      { label: 'Transport (student pass)', range: [25, 80] },
      { label: 'Phone, internet and personal', range: [100, 180] },
    ],
    cityNote: 'Paris is much more expensive than regional university cities such as Lyon, Toulouse or Lille.',
    requirement: {
      type: 'verify',
      text: 'You must show sufficient monthly resources for your stay. The amount commonly cited by Campus France offices is €615 per month, but sources differ. Confirm the current figure on France-Visas when you apply.',
      amount: 615 * 12,
      amountLabel: '€615 × 12 months',
      source: { label: 'France-Visas – official visa website', url: 'https://france-visas.gouv.fr/' },
    },
  },
  admission: {
    academic: ['Licence: NEB Grade 12 plus French-language ability for French-taught programmes.', 'Master: a recognised bachelor’s degree; selection is competitive and programme-specific.', 'English-taught programmes are mostly at master’s level and in business and engineering schools.'],
    language: ['French-taught programmes: usually DELF/DALF B2 or TCF/TEF results.', 'English-taught programmes: typically IELTS 6.0–6.5 or equivalent.'],
    documents: ['Passport', 'Admission letter', 'Academic transcripts and certificates (sometimes translated)', 'Language certificates', 'Proof of resources', 'Accommodation proof or attestation', 'CV and motivation letter', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Many applications open from October to January for the following September.', 'Complete the Campus France / Études en France procedure if it applies to Nepal.', 'Apply for the VLS-TS visa after admission.', 'Validate your visa online within three months of arrival.'],
    note: 'Check whether Nepal is covered by the Études en France procedure for your application year.',
  },
  visa: {
    name: 'VLS-TS “étudiant”',
    overview: 'The long-stay student visa also serves as a residence permit for the first year. You apply on France-Visas and submit documents through the designated visa service. After arrival you validate the visa online.',
    requirements: [
      { label: 'Resources', text: 'Proof of sufficient monthly resources (commonly €615 per month; confirm on France-Visas).', type: 'verify' },
      { label: 'Validation', text: 'Validate your VLS-TS online after arrival on the official ANEF website.', type: 'official' },
      { label: 'Campus France procedure', text: 'Students from countries covered by the Études en France procedure must complete it before the visa.', type: 'verify' },
    ],
    processing: 'Processing depends on the season and visa centre. Apply as soon as you have admission.',
  },
  fit: {
    suits: ['Business, hospitality, fashion and engineering students', 'Students willing to learn French', 'Budget-conscious applicants targeting public universities'],
    pros: ['Regulated public university fees', 'Housing aid for many students', 'One-year job-search permit'],
    cons: ['French needed for most bachelor’s programmes and jobs', 'Administrative processes can be slow', 'Paris is expensive'],
  },
  sources: [
    { label: 'Campus France – Tuition fees in France', url: 'https://www.campusfrance.org/en/tuition-fees-France' },
    { label: 'Campus France – Student long-stay visa', url: 'https://www.campusfrance.org/en/student-long-stay-visa' },
    { label: 'Ministry of Higher Education – FAQ on differentiated fees (July 2026)', url: 'https://www.enseignementsup-recherche.gouv.fr/sites/default/files/2026-07/FAQ%20DIDEEC_ENGLISH.pdf' },
  ],
  verify: [
    'The current minimum monthly resources for the student visa.',
    'Whether Nepal is covered by the Études en France procedure.',
    'The exact 2026–27 differentiated fee amounts at your university.',
  ],
}
