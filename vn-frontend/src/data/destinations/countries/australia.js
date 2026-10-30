// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'australia',
  intro: 'Australia offers career-focused university and vocational study with strong student support services. Visa rules tightened in 2025–26, so a well-documented, genuine study plan matters more than ever.',
  quickFacts: [
    { label: 'Student visa', value: 'Student visa (subclass 500)' },
    { label: 'Work while studying', value: '48 hours per fortnight in session' },
    { label: 'After graduation', value: 'Temporary Graduate visa (subclass 485)' },
    { label: 'Main intakes', value: 'February and July (some courses also start in other months)' },
  ],
  overview: {
    system: 'Universities offer bachelor’s (usually 3 years), master’s (1–2 years) and research degrees. Vocational education and training (VET) providers, including TAFE institutes, offer certificates and diplomas. Every course offered to international students must be registered on CRICOS.',
    fields: ['Information technology and data', 'Nursing and health sciences', 'Engineering', 'Accounting and business', 'Hospitality and tourism management', 'Education and social work'],
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Perth', 'Canberra', 'Hobart', 'Regional campuses'],
    advantages: ['English-speaking country with a large Nepali community', 'Work rights of 48 hours per fortnight during study terms', 'Post-study work options for eligible graduates', 'Regional study can bring extra post-study time for eligible graduates'],
  },
  costs: {
    tuition: [
      { label: 'Vocational diploma / advanced diploma', range: [8000, 22000] },
      { label: 'Bachelor’s degree', range: [25000, 50000] },
      { label: 'Master’s by coursework', range: [28000, 55000] },
      { label: 'Medicine, dentistry, veterinary science', range: [60000, 90000] },
    ],
    tuitionNote: 'Annual fees for international students. Universities in Sydney and Melbourne and specialist programmes are usually at the top of the range.',
    living: [
      { label: 'Rent (shared room or studio)', range: [1100, 2000] },
      { label: 'Food and groceries', range: [400, 700] },
      { label: 'Transport', range: [120, 250] },
      { label: 'Utilities, internet and phone', range: [120, 250] },
      { label: 'Personal and study expenses', range: [200, 400] },
    ],
    cityNote: 'Sydney and Melbourne rents are usually the highest. Adelaide, Hobart and regional cities are generally cheaper, but there are fewer part-time jobs in smaller locations.',
    requirement: {
      type: 'verify',
      text: 'For the visa you must show enough money for travel, course fees and living costs. The living-cost figure widely published for a single main applicant is AUD 29,710 per year. Confirm the current amount and acceptable evidence in the Home Affairs Document Checklist Tool before you prepare funds.',
      amount: 29710,
      source: { label: 'Home Affairs – Document Checklist Tool', url: 'https://immi.homeaffairs.gov.au/visas/web-evidentiary-tool' },
    },
  },
  admission: {
    academic: [
      'Bachelor’s: completion of NEB Grade 12 (+2). Universities set their own minimum GPA or percentage by course; competitive courses ask for more.',
      'Master’s: a recognised bachelor’s degree. Some universities accept three-year degrees from Nepal for some courses; others require a four-year degree or extra study.',
      'Diploma (VET): completion of Grade 12 and the provider’s English requirement.',
    ],
    language: [
      'For the Student visa, Home Affairs generally requires an IELTS overall score of 6.0 or an equivalent result in another approved test. Lower scores may apply when English study (ELICOS) or foundation study is packaged with your main course.',
      'Universities often ask for more, commonly IELTS 6.5 overall with no band below 6.0. Accepted tests include IELTS, PTE Academic and TOEFL iBT. Home Affairs does not accept at-home tests.',
    ],
    documents: ['Passport', 'Academic transcripts and certificates (character and migration certificates where requested)', 'English test results', 'Statement of purpose / Genuine Student answers', 'Financial documents and sponsor evidence', 'CV and work experience letters, if any', 'Offer letter and Confirmation of Enrolment (CoE)', 'Overseas Student Health Cover (OSHC)', 'No Objection Certificate (NOC) from Nepal’s Ministry of Education'],
    timeline: ['Start 9–12 months before your intake.', 'Apply to institutions 6–8 months ahead.', 'Accept the offer, pay the deposit and receive the CoE.', 'Lodge the visa application well before the course starts.'],
    note: 'Entry requirements are set by each institution and course. Always check the course page or ask your counsellor for the current requirement.',
  },
  visa: {
    name: 'Student visa (subclass 500)',
    overview: 'You apply online through ImmiAccount after receiving a Confirmation of Enrolment (CoE). The Department of Home Affairs assesses whether you are a genuine student and meet financial, English, health and character requirements.',
    requirements: [
      { label: 'Application charge', text: 'AUD 2,500 for most applicants from 1 July 2026 (previously AUD 2,000).', type: 'official' },
      { label: 'Genuine Student requirement', text: 'You must show that you intend to study genuinely and that your course fits your background and plans.', type: 'official' },
      { label: 'Health insurance', text: 'OSHC is required for the whole visa period unless an exemption applies.', type: 'official' },
      { label: 'Family members', text: 'From 2 October 2026, new Student visa applications generally cannot include family members unless an exemption applies (for example some Pacific, ASEAN or Australian Government-sponsored students). Nepali applicants are not in the listed exemptions.', type: 'official' },
      { label: 'Applying from inside Australia', text: 'From 2 October 2026, most temporary visa holders cannot apply for a Student visa while in Australia, and you generally must be outside Australia when an offshore application is granted.', type: 'official' },
      { label: 'Evidence level for Nepal', text: 'Education-sector sources report that Nepal was moved to the highest evidence level in January 2026, which usually means more financial and English evidence is requested. Ask your institution which evidence it needs.', type: 'verify' },
    ],
    processing: 'Home Affairs publishes a processing-time guide based on recently decided applications. It is not specific to your application. Offshore applications are prioritised under Ministerial Direction 115 according to each provider’s allocation.',
  },
  fit: {
    suits: ['Students who want practical, career-oriented degrees in English', 'Nursing, IT, engineering and accounting applicants', 'Families able to show substantial funds and a clear study plan'],
    pros: ['Well-regulated education sector (CRICOS, TEQSA, ASQA)', 'Generous work hours compared with many countries', 'Post-study work options for eligible graduates'],
    cons: ['High tuition and living costs in major cities', 'Student visa scrutiny is high for Nepali applicants', 'New 2026 rules restrict bringing family members'],
  },
  sources: [
    { label: 'Study Australia – Student visa (subclass 500)', url: 'https://www.studyaustralia.gov.au/en/plan-your-move/your-guide-to-visas/student-visa-subclass-500' },
    { label: 'Study Australia – Student visa changes: October 2026 update', url: 'https://www.studyaustralia.gov.au/en/tools-and-resources/news/student-visa-changes-october-2026' },
    { label: 'Study Australia – Student Visa Application Charge increase (1 July 2026)', url: 'https://www.studyaustralia.gov.au/en/Agent-Hub/agent-news-index/student-visa-application-charge-increase' },
    { label: 'Study Australia – Ministerial Direction 115', url: 'https://www.studyaustralia.gov.au/en/Agent-Hub/agent-news-index/ministerial-direction-115' },
    { label: 'Study Australia – Temporary Graduate visa (subclass 485)', url: 'https://www.studyaustralia.gov.au/en/plan-your-move/your-guide-to-visas/temporary-graduate-visa-subclass-485' },
    { label: 'Home Affairs – Temporary Graduate visa (subclass 485)', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-graduate-485' },
    { label: 'Home Affairs – English language requirements', url: 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language' },
  ],
  verify: [
    'The AUD 29,710 living-cost figure: confirm in the Document Checklist Tool.',
    'Exact Post-Higher Education Work stream durations for each qualification level.',
    'Nepal’s current evidence level under the Simplified Student Visa Framework.',
    'Destination Australia availability and amounts at your chosen campus.',
  ],
}
