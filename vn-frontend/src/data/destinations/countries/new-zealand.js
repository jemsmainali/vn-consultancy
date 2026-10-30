// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'new-zealand',
  intro: 'New Zealand has eight universities and a range of polytechnic and private institutions, smaller cities and a published visa processing time. Work rights during study increased to 25 hours a week.',
  quickFacts: [
    { label: 'Student visa', value: 'Fee Paying Student Visa' },
    { label: 'Work while studying', value: 'Up to 25 hours a week, depending on visa conditions' },
    { label: 'After graduation', value: 'Post-Study Work Visa, up to 3 years' },
    { label: 'Main intakes', value: 'February and July' },
  ],
  overview: {
    system: 'Qualifications sit on the New Zealand Qualifications and Credentials Framework (NZQCF). Universities offer bachelor’s (level 7), postgraduate diplomas (level 8), master’s (level 9) and doctorates (level 10). Polytechnics and private training establishments offer diplomas and applied degrees.',
    fields: ['Information technology', 'Engineering', 'Agriculture and environmental science', 'Health sciences', 'Business', 'Hospitality and tourism'],
    cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin', 'Palmerston North'],
    advantages: ['All eight universities are publicly funded', 'Smaller classes and calmer cities', 'Post-study work of up to 3 years for eligible degrees', 'Published visa processing estimate'],
  },
  costs: {
    tuition: [
      { label: 'Diploma (levels 5–6)', range: [18000, 28000] },
      { label: 'Bachelor’s degree', range: [25000, 45000] },
      { label: 'Postgraduate diploma / master’s', range: [28000, 50000] },
    ],
    tuitionNote: 'Annual fees for international students. Medicine, veterinary science and some engineering programmes cost more.',
    living: [
      { label: 'Rent (shared flat or hall)', range: [900, 1600] },
      { label: 'Food and groceries', range: [350, 550] },
      { label: 'Transport', range: [100, 200] },
      { label: 'Utilities, internet and phone', range: [100, 200] },
      { label: 'Personal and study expenses', range: [150, 300] },
    ],
    cityNote: 'Auckland and Wellington are the most expensive. Dunedin, Palmerston North and Hamilton are usually cheaper.',
    requirement: {
      type: 'official',
      text: 'You must show NZD 20,000 for each year of study (or NZD 1,667 per month for courses shorter than a year), plus tuition fees, unless your living costs are already paid or you have an acceptable sponsor.',
      amount: 20000,
      source: { label: 'Immigration New Zealand – Fee Paying Student Visa', url: 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/' },
    },
  },
  admission: {
    academic: ['Bachelor’s: NEB Grade 12 with results meeting the university’s entry level; some students start with a foundation programme.', 'Postgraduate: a recognised bachelor’s degree with the required grade average.'],
    language: ['IELTS Academic 6.0 overall is common for undergraduate study and 6.5 for postgraduate study; other tests such as TOEFL iBT and PTE Academic are widely accepted.'],
    documents: ['Passport', 'Offer of place', 'Evidence of tuition payment or scholarship', 'Evidence of funds for living costs', 'Academic documents and English results', 'Insurance acceptable to your education provider', 'Medical and chest X-ray certificates if asked', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Apply to institutions 6–9 months before the intake.', 'Receive the offer and pay fees as required.', 'Apply for the visa at least 3 months before you plan to travel; October to March is the busiest period.'],
    note: 'Each institution sets its own academic and English requirements.',
  },
  visa: {
    name: 'Fee Paying Student Visa',
    overview: 'You apply online to Immigration New Zealand with your offer of place, evidence of funds and insurance declaration.',
    requirements: [
      { label: 'Fee', text: 'NZD 850 (published on the Immigration New Zealand visa page).', type: 'official' },
      { label: 'Living funds', text: 'NZD 20,000 per year of study, or NZD 1,667 per month for shorter courses.', type: 'official' },
      { label: 'Insurance', text: 'Full medical and travel insurance acceptable to your education provider for your whole stay.', type: 'official' },
      { label: 'Health', text: 'You may be asked for a chest X-ray or medical examination, depending on the length of stay and your health declaration.', type: 'official' },
    ],
    processing: 'Immigration New Zealand publishes an indicative processing time (7 weeks at the time of research). It is a guide only.',
  },
  fit: {
    suits: ['Students who prefer smaller cities and a calmer pace', 'Agriculture, environment, IT and engineering applicants', 'Families wanting a published visa processing estimate'],
    pros: ['Up to 25 hours of work a week', 'Post-study work of up to 3 years', 'Outdoor lifestyle and safe communities'],
    cons: ['Smaller job market than Australia or Canada', 'Higher living costs in Auckland', 'Fewer institutions to choose from'],
  },
  sources: [
    { label: 'Immigration New Zealand – Fee Paying Student Visa', url: 'https://www.immigration.govt.nz/visas/fee-paying-student-visa/' },
    { label: 'Immigration New Zealand – Post-Study Work Visa', url: 'https://www.immigration.govt.nz/visas/post-study-work-visa/' },
  ],
  verify: ['Whether Nepal is eligible in the current Manaaki New Zealand Scholarships round.'],
}
