// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'united-kingdom',
  intro: 'UK degrees are shorter than in many countries: most bachelor’s degrees in England take three years and taught master’s degrees usually take one year. The Graduate visa period is being reduced for applications made from 2027.',
  quickFacts: [
    { label: 'Student visa', value: 'Student visa' },
    { label: 'Work while studying', value: '20 hours a week in term (degree level)' },
    { label: 'After graduation', value: 'Graduate visa: 2 years if you apply by 31 Dec 2026, 18 months from 1 Jan 2027' },
    { label: 'Main intakes', value: 'September/October, with some January starts' },
  ],
  overview: {
    system: 'Universities offer bachelor’s degrees (3 years in England, Wales and Northern Ireland; usually 4 in Scotland), one-year taught master’s degrees and research degrees. Foundation and pathway programmes help students who do not meet direct entry requirements. To study on a Student visa you need a Confirmation of Acceptance for Studies (CAS) from a licensed student sponsor.',
    fields: ['Business and management', 'Computer science and AI', 'Engineering', 'Public health and nursing', 'Law', 'Finance and economics'],
    cities: ['London', 'Manchester', 'Birmingham', 'Glasgow and Edinburgh', 'Leeds and Sheffield', 'Cardiff and Belfast'],
    advantages: ['Shorter programmes reduce total cost and time', 'Globally recognised universities', 'Graduate visa without needing a job offer', 'Large South Asian communities in many cities'],
  },
  costs: {
    tuition: [
      { label: 'Foundation / pathway year', range: [12000, 22000] },
      { label: 'Bachelor’s degree (per year)', range: [15000, 30000] },
      { label: 'Taught master’s (one year)', range: [15000, 35000] },
      { label: 'Medicine and clinical degrees (per year)', range: [35000, 60000] },
    ],
    tuitionNote: 'Annual fees for international students. Business and specialist programmes at leading universities often cost more.',
    living: [
      { label: 'Rent (student room or shared flat)', range: [600, 1300] },
      { label: 'Food and groceries', range: [200, 350] },
      { label: 'Transport', range: [60, 180] },
      { label: 'Utilities, internet and phone', range: [50, 120] },
      { label: 'Personal and study expenses', range: [100, 200] },
    ],
    cityNote: 'London rents are much higher than elsewhere. Cities in the north of England, Scotland, Wales and Northern Ireland are usually cheaper.',
    requirement: {
      type: 'official',
      text: 'Unless exempt, you must show living costs of £1,529 per month for courses in London or £1,171 per month elsewhere, for up to 9 months, plus any unpaid first-year tuition. The money must have been held for 28 consecutive days.',
      amount: 1529 * 9,
      amountLabel: 'London, 9 months of living costs',
      source: { label: 'GOV.UK – Student visa: money', url: 'https://www.gov.uk/student-visa/money' },
    },
  },
  admission: {
    academic: [
      'Bachelor’s: NEB Grade 12 is often accepted for direct entry with good grades; otherwise a foundation year may be required.',
      'Master’s: a recognised bachelor’s degree. Many universities accept three-year Nepali degrees with good grades; some require four years or a pre-master’s.',
    ],
    language: [
      'For degree-level study you must show English at CEFR level B2. A university can assess this itself, or you can take a Secure English Language Test (SELT).',
      'Below degree level the requirement is CEFR B1 using a SELT.',
      'Universities usually set IELTS-equivalent requirements of 6.0–7.0 overall depending on the course.',
    ],
    documents: ['Passport', 'CAS number from your university', 'Academic transcripts and certificates', 'English evidence', 'Bank statements meeting the 28-day rule', 'Tuberculosis test certificate (required for applicants from Nepal)', 'ATAS certificate for some science and engineering postgraduate courses', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Apply through UCAS (undergraduate) or directly to universities (postgraduate).', 'Pay the deposit and complete credibility interviews if requested.', 'Receive the CAS.', 'Apply for the visa up to 6 months before your course starts.'],
    note: 'Requirements vary by university and course. Some universities also run their own credibility interviews before issuing a CAS.',
  },
  visa: {
    name: 'Student visa',
    overview: 'You apply online after receiving your CAS, provide biometrics at a visa application centre in Kathmandu and pay the visa fee and Immigration Health Surcharge.',
    requirements: [
      { label: 'Visa fee', text: '£558 when applying from outside the UK.', type: 'official' },
      { label: 'Immigration Health Surcharge', text: '£776 per year for students, paid when you apply.', type: 'official' },
      { label: 'TB test', text: 'Required for applicants from Nepal coming for more than 6 months.', type: 'official' },
      { label: 'Dependants', text: 'Partners and children can only join students on research-based higher degrees (or certain government-sponsored students) for courses starting on or after 1 January 2024.', type: 'official' },
      { label: 'Timing', text: 'You can apply up to 6 months before your course starts.', type: 'official' },
    ],
    processing: 'GOV.UK says you will usually get a decision within 3 weeks when applying from outside the UK. Priority services may be available for an extra fee.',
  },
  fit: {
    suits: ['Students wanting a fast one-year master’s', 'Business, law, computing and public health applicants', 'Experienced professionals targeting Chevening'],
    pros: ['Shorter programmes', 'NHS access through the surcharge', 'Graduate visa without a job offer'],
    cons: ['High living costs in London', 'Dependants restricted for taught master’s', 'Graduate visa shortened to 18 months for 2027 applicants'],
  },
  sources: [
    { label: 'GOV.UK – Student visa: money', url: 'https://www.gov.uk/student-visa/money' },
    { label: 'GOV.UK – Student visa: knowledge of English', url: 'https://www.gov.uk/student-visa/knowledge-of-english' },
    { label: 'GOV.UK – Immigration Rules Appendix Student (work limits)', url: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student' },
    { label: 'GOV.UK – Graduate visa', url: 'https://www.gov.uk/graduate-visa' },
    { label: 'GOV.UK – Student visa: family members', url: 'https://www.gov.uk/student-visa/family-members' },
    { label: 'GOV.UK – Countries where you need a TB test', url: 'https://www.gov.uk/tb-test-visa/countries-where-you-need-a-tb-test-to-enter-the-uk' },
    { label: 'GOV.UK – Immigration Health Surcharge', url: 'https://www.gov.uk/healthcare-immigration-application/how-much-pay' },
  ],
  verify: [
    'Whether Nepal is included in the current GREAT Scholarships round.',
    'The current Chevening deadline for the 2027–28 cycle.',
  ],
}
