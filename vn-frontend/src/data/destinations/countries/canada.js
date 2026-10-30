// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'canada',
  intro: 'Canada combines universities, colleges and polytechnics with a post-graduation work permit route. Since 2024 the government has capped study permits and tightened work-permit eligibility, so programme choice now matters a great deal.',
  quickFacts: [
    { label: 'Student permit', value: 'Study permit (with a visitor visa or eTA for entry)' },
    { label: 'Work while studying', value: '24 hours a week off campus in session' },
    { label: 'After graduation', value: 'Post-Graduation Work Permit (PGWP), if eligible' },
    { label: 'Main intakes', value: 'September and January, some May starts' },
  ],
  overview: {
    system: 'Universities award bachelor’s, master’s and doctoral degrees. Colleges and polytechnics offer certificates, diplomas, advanced diplomas, graduate certificates and some degrees. You must study at a Designated Learning Institution (DLI) to get a study permit.',
    fields: ['Computer science and IT', 'Engineering and skilled trades', 'Healthcare and nursing', 'Business and supply chain', 'Agriculture and environmental science', 'Early childhood education'],
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary and Edmonton', 'Ottawa', 'Halifax and Atlantic Canada'],
    advantages: ['Large range of college and university programmes', 'Off-campus work rights during study', 'PGWP for eligible graduates', 'Diverse, multicultural cities'],
  },
  costs: {
    tuition: [
      { label: 'College diploma or graduate certificate', range: [15000, 22000] },
      { label: 'Bachelor’s degree', range: [25000, 45000] },
      { label: 'Master’s degree', range: [18000, 45000] },
    ],
    tuitionNote: 'Annual tuition for international students. Fees depend heavily on the province, institution and programme.',
    living: [
      { label: 'Rent (shared room or basement unit)', range: [800, 1800] },
      { label: 'Food and groceries', range: [300, 500] },
      { label: 'Transport (student pass)', range: [80, 150] },
      { label: 'Utilities, internet and phone', range: [100, 200] },
      { label: 'Personal and winter clothing', range: [150, 300] },
    ],
    cityNote: 'Toronto and Vancouver have the highest rents. Prairie and Atlantic provinces are usually cheaper but have smaller job markets.',
    requirement: {
      type: 'official',
      text: 'Outside Quebec, a single applicant must show CAD 23,448 for living expenses for applications submitted on or after 1 September 2026, in addition to first-year tuition and travel costs. Quebec sets its own amount.',
      amount: 23448,
      source: { label: 'IRCC – Proof of financial support', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html' },
    },
  },
  admission: {
    academic: [
      'College programmes: NEB Grade 12, with programme-specific subject requirements.',
      'Bachelor’s: NEB Grade 12 with competitive grades in prerequisite subjects.',
      'Graduate certificates and master’s: a recognised bachelor’s degree; some master’s programmes require four-year degrees.',
    ],
    language: ['IELTS Academic, TOEFL iBT, PTE Academic and other tests are accepted depending on the institution.', 'Common minimums: IELTS 6.0–6.5 for college programmes and 6.5 or higher for universities.', 'Remember that PGWP has its own language requirement at the work-permit stage.'],
    documents: ['Passport', 'Letter of acceptance from a DLI', 'Provincial or territorial attestation letter (PAL/TAL), unless exempt', 'Proof of financial support (for example a GIC, bank statements, education loan)', 'Academic documents and English test results', 'Study plan / letter of explanation', 'Biometrics and, if requested, a medical exam', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Shortlist programmes 10–12 months ahead.', 'Apply to institutions and pay the deposit after admission.', 'Get a PAL/TAL from the institution if required.', 'Apply for the study permit online as early as possible.'],
    note: 'From 1 January 2026, master’s and doctoral students at public institutions do not need a PAL (Quebec has separate rules). Most other students still do.',
  },
  visa: {
    name: 'Study permit',
    overview: 'You apply online to Immigration, Refugees and Citizenship Canada (IRCC). If approved, you receive a letter of introduction and a visitor visa; the study permit itself is issued at the port of entry.',
    requirements: [
      { label: 'Fees', text: 'Study permit CAD 150 plus biometrics CAD 85 per person.', type: 'official' },
      { label: 'Financial support', text: 'CAD 23,448 living costs (single applicant, outside Quebec, from 1 Sept 2026) plus tuition and travel.', type: 'official' },
      { label: 'Caps and attestation letters', text: 'Most applicants need a PAL/TAL under the national cap. Master’s and doctoral students at public institutions are exempt from 1 January 2026.', type: 'official' },
      { label: 'Family members', text: 'Spousal open work permits are now limited mainly to partners of master’s students in longer programmes, doctoral students and certain professional programmes. Check IRCC for the exact list.', type: 'verify' },
    ],
    processing: 'IRCC publishes processing times that change weekly. Apply as early as possible after receiving your acceptance letter.',
  },
  fit: {
    suits: ['Students seeking applied college programmes or graduate degrees', 'Applicants comfortable with cold climates', 'Students planning carefully around PGWP eligibility'],
    pros: ['Off-campus work rights', 'PGWP for eligible graduates', 'Many programme types and price points'],
    cons: ['Caps and attestation letters for most students', 'High rents in major cities', 'PGWP field-of-study and language rules for many programmes'],
  },
  sources: [
    { label: 'IRCC – Proof of financial support', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html' },
    { label: 'IRCC – Work off campus', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/work-off-campus.html' },
    { label: 'IRCC – Apply for a study permit as a graduate student', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/graduate-student/how-to-apply.html' },
    { label: 'IRCC – PGWP: who can apply', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html' },
    { label: 'IRCC – Fee list', url: 'https://ircc.canada.ca/english/information/fees/fees.asp' },
  ],
  verify: [
    'The exact list of programmes whose students’ spouses qualify for an open work permit.',
    'Whether a medical exam is required for your application (IRCC will instruct you).',
  ],
}
