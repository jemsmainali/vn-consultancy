// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'united-states',
  intro: 'The United States has thousands of accredited colleges and universities, flexible majors and strong research. Costs vary enormously between institutions, and several visa rules for students are changing or under court review in 2026.',
  quickFacts: [
    { label: 'Student visa', value: 'F-1 (academic students)' },
    { label: 'Work while studying', value: 'On campus up to 20 hours a week in session' },
    { label: 'After graduation', value: 'Optional Practical Training (OPT), plus STEM OPT extension' },
    { label: 'Main intakes', value: 'Fall (August/September) and Spring (January)' },
  ],
  overview: {
    system: 'Community colleges offer two-year associate degrees, often with transfer pathways. Universities and colleges offer four-year bachelor’s degrees, master’s (usually 1–2 years) and doctorates. Only schools certified by the Student and Exchange Visitor Program (SEVP) can issue the Form I-20 needed for an F-1 visa.',
    fields: ['Computer science and data science', 'Engineering', 'Business analytics and management', 'Public health and life sciences', 'Economics', 'Mathematics and statistics'],
    cities: ['Boston', 'New York', 'Chicago', 'Dallas and Houston', 'the San Francisco Bay Area', 'College towns across every state'],
    advantages: ['Huge choice of institutions and programmes', 'Flexible majors and research opportunities', 'Assistantships and merit aid at some universities', 'OPT and STEM OPT practical training after study'],
  },
  costs: {
    tuition: [
      { label: 'Community college (associate)', range: [8000, 20000] },
      { label: 'Public university – bachelor’s (international rate)', range: [25000, 45000] },
      { label: 'Private university – bachelor’s', range: [35000, 65000] },
      { label: 'Master’s degree', range: [20000, 60000] },
    ],
    tuitionNote: 'Annual tuition before scholarships. Many schools add mandatory fees and health insurance.',
    living: [
      { label: 'Rent (shared apartment or dormitory)', range: [700, 1800] },
      { label: 'Food and groceries', range: [300, 600] },
      { label: 'Transport', range: [50, 200] },
      { label: 'Utilities, internet and phone', range: [100, 250] },
      { label: 'Health insurance (school plan, monthly equivalent)', range: [150, 350] },
      { label: 'Personal and study expenses', range: [150, 300] },
    ],
    cityNote: 'Boston, New York and California cities are far more expensive than college towns in the Midwest and South. Many areas need a car.',
    requirement: {
      type: 'official',
      text: 'There is no single national amount. Your school lists the estimated cost of attendance for one academic year on your Form I-20, and you must show liquid funds to cover at least that first year, plus evidence for later years.',
      source: { label: 'U.S. Department of State – Student visa', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html' },
    },
  },
  admission: {
    academic: [
      'Bachelor’s: NEB Grade 12 completion. Selective universities look at grades, essays, recommendations and activities. SAT/ACT is optional at many schools and required at some.',
      'Master’s: many universities expect 16 years of education (a four-year bachelor’s). Three-year degrees are accepted case by case, sometimes after a credential evaluation.',
      'Some programmes require the GRE or GMAT; many have made them optional.',
    ],
    language: ['TOEFL iBT, IELTS Academic and Duolingo English Test are widely accepted; each university sets its own minimum.', 'Common minimums are TOEFL 79–100 or IELTS 6.5–7.0, higher for competitive programmes.'],
    documents: ['Passport', 'Transcripts and certificates (sometimes with a credential evaluation)', 'English test scores', 'Statement of purpose or personal essays', 'Letters of recommendation', 'CV or resume', 'Bank statements and sponsor letters', 'Form I-20 from the school', 'SEVIS I-901 fee receipt and DS-160 confirmation', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Start 12–15 months before a Fall intake.', 'Many priority and scholarship deadlines fall between November and February.', 'After admission, the school issues the I-20 once financial documents are approved.', 'Book the visa interview as early as allowed; you can enter the U.S. up to 30 days before the programme start date.'],
    note: 'Requirements differ by university and even by department. Check each programme page.',
  },
  visa: {
    name: 'F-1 student visa',
    overview: 'After admission, your school issues a Form I-20. You pay the SEVIS I-901 fee, complete the online DS-160 form, pay the visa application fee and attend an interview at the U.S. Embassy in Kathmandu.',
    requirements: [
      { label: 'SEVIS I-901 fee', text: 'USD 350 for F-1 applicants, paid on FMJfee.com before the visa is issued.', type: 'official' },
      { label: 'Visa application (MRV) fee', text: 'USD 185 is the published student visa fee. Confirm the current amount on the U.S. Embassy Nepal site before paying.', type: 'verify' },
      { label: 'Visa integrity fee', text: 'A USD 250 “visa integrity fee” was created by U.S. law in 2025. Reports say collection has started unevenly at different consulates. Check the embassy’s fee page.', type: 'verify' },
      { label: 'Ties and intent', text: 'F-1 is a non-immigrant visa. Officers assess your study plan, finances and intention to follow visa rules.', type: 'official' },
      { label: 'Length of stay rules', text: 'A July 2026 DHS rule would replace “duration of status” with fixed admission periods (generally up to four years). Reports say a federal court postponed it. Ask your school’s international office about the current status.', type: 'verify' },
    ],
    processing: 'Interview wait times are published by the State Department and change often. Visa refusal rates for Nepali F-1 applicants have been high in recent years, so prepare a clear, honest study and funding plan.',
  },
  fit: {
    suits: ['Strong academic profiles aiming for research, STEM or business careers', 'Students who want flexible majors or a liberal-arts education', 'Families able to fund the full cost or students winning substantial aid'],
    pros: ['World-leading universities and research', 'Merit aid and assistantships at some institutions', 'OPT and STEM OPT after graduation'],
    cons: ['Very high costs at many universities', 'High F-1 refusal rates for Nepali applicants', 'Several student and work visa rules are changing or in litigation'],
  },
  sources: [
    { label: 'ICE – I-901 SEVIS fee', url: 'https://www.ice.gov/sevis/i901' },
    { label: 'ICE – Employment for F and M students', url: 'https://www.ice.gov/sevis/employment' },
    { label: 'Study in the States – STEM OPT extension overview', url: 'https://studyinthestates.dhs.gov/stem-opt-hub/additional-resources/stem-opt-extension-overview' },
    { label: 'Federal Register – Fixed time period of admission (17 July 2026)', url: 'https://www.federalregister.gov/documents/2026/07/17/2026-14439/establishing-a-fixed-time-period-of-admission-and-an-extension-of-stay-procedure-for-nonimmigrant' },
    { label: 'U.S. Department of State – Student visa', url: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html' },
  ],
  verify: [
    'Current visa application fee and whether the USD 250 visa integrity fee is being collected in Kathmandu.',
    'Litigation status of the July 2026 fixed-admission-period rule.',
    'Current status of the USD 100,000 H-1B payment and its exemptions.',
    'Any new travel or visa restrictions affecting Nepali nationals (immigrant visa issuance for Nepal was reported paused in 2026; F-1 was not reported affected).',
  ],
}
