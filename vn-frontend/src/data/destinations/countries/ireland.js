// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'ireland',
  intro: 'Ireland is an English-speaking EU country with a strong technology and pharmaceutical sector. Graduates can stay for 12 or 24 months to look for work, depending on their qualification level.',
  quickFacts: [
    { label: 'Visa', value: 'Long-stay (D) study visa, then Stamp 2 permission' },
    { label: 'Work while studying', value: '20 hours a week in term, 40 in holidays' },
    { label: 'After graduation', value: 'Third Level Graduate Programme (Stamp 1G)' },
    { label: 'Main intakes', value: 'September, with some January starts' },
  ],
  overview: {
    system: 'Universities, technological universities and colleges award qualifications on the National Framework of Qualifications (NFQ). Honours bachelor’s degrees are Level 8; master’s degrees are Level 9. Most taught master’s programmes take one year.',
    fields: ['Computer science and data analytics', 'Pharmaceutical and biomedical science', 'Business and finance', 'Engineering', 'Nursing and health', 'Hospitality management'],
    cities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Maynooth', 'Waterford'],
    advantages: ['English-speaking and in the EU', 'Major European offices of global technology companies', 'One-year master’s programmes', 'Graduate stay-back permission'],
  },
  costs: {
    tuition: [
      { label: 'Bachelor’s degree', range: [10000, 25000] },
      { label: 'Taught master’s', range: [10000, 30000] },
      { label: 'Medicine', range: [45000, 60000] },
    ],
    tuitionNote: 'Annual fees for non-EU students. Fees vary by institution and subject.',
    living: [
      { label: 'Rent (room in shared house or student residence)', range: [600, 1200] },
      { label: 'Food and groceries', range: [250, 400] },
      { label: 'Transport (student Leap card)', range: [60, 120] },
      { label: 'Utilities, internet and phone', range: [60, 120] },
      { label: 'Personal and study expenses', range: [100, 200] },
    ],
    cityNote: 'Dublin has a severe housing shortage and the highest rents. Cork, Galway and Limerick are cheaper but also tight. Secure accommodation before arrival.',
    requirement: {
      type: 'official',
      text: 'You must have immediate access to at least €10,000 for each year of study (courses over eight months), in addition to course fees. Visa-required applicants are checked at the visa stage.',
      amount: 10000,
      source: { label: 'Irish Immigration Service Delivery – Planning to study in Ireland', url: 'https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/planning-to-study-in-ireland/' },
    },
  },
  admission: {
    academic: ['Bachelor’s: NEB Grade 12 with strong results; competitive programmes ask for more, and some students take a foundation year.', 'Master’s: a recognised bachelor’s degree, typically with second-class honours or equivalent grades.'],
    language: ['IELTS Academic 6.0–6.5 overall is common; TOEFL iBT, PTE Academic and Duolingo are accepted by many institutions.'],
    documents: ['Passport', 'Letter of acceptance from an eligible course', 'Evidence of fees paid', 'Evidence of €10,000 access per year and sponsor documents', 'Private medical insurance', 'Academic documents and English results', 'Explanation of any gaps in education', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Apply 8–10 months before September.', 'Pay fees and arrange insurance.', 'Apply for the study visa online (AVATS) and submit documents as instructed.', 'Register for Stamp 2 permission after arrival.'],
    note: 'Courses must be on the Interim List of Eligible Programmes (ILEP) for Stamp 2 permission.',
  },
  visa: {
    name: 'Long-stay (D) study visa',
    overview: 'Nepali citizens need a visa to enter Ireland. You apply online and submit documents as instructed for your location. After arriving, you register with immigration and receive Stamp 2 student permission and an Irish Residence Permit card.',
    requirements: [
      { label: 'Finances', text: '€10,000 accessible per year of study plus course fees.', type: 'official' },
      { label: 'Insurance', text: 'Private medical insurance is required.', type: 'official' },
      { label: 'Registration', text: 'Register your immigration permission after arrival; you receive an Irish Residence Permit (IRP).', type: 'official' },
      { label: 'Where to submit', text: 'Ireland has no embassy in Nepal. Check the Irish Immigration Service and the Irish Embassy covering Nepal for where to send documents.', type: 'verify' },
    ],
    processing: 'Processing times are published by the Irish Immigration Service and vary by visa office and season.',
  },
  fit: {
    suits: ['Technology, data, pharma and business students', 'Students wanting an English-speaking EU country', 'One-year master’s applicants'],
    pros: ['Graduate stay-back of up to 24 months for master’s graduates', 'Large technology employers', 'One-year master’s'],
    cons: ['Severe housing shortage', 'High living costs in Dublin', 'Smaller country with fewer institutions'],
  },
  sources: [
    { label: 'Irish Immigration – Planning to study in Ireland', url: 'https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/planning-to-study-in-ireland/' },
    { label: 'Irish Immigration – Immigration permission/stamps', url: 'https://www.irishimmigration.ie/registering-your-immigration-permission/information-on-registering/immigration-permission-stamps/' },
    { label: 'Irish Immigration – Frequently asked questions for students', url: 'https://www.irishimmigration.ie/coming-to-study-in-ireland/frequently-asked-questions-for-students/' },
    { label: 'Irish Immigration – Third level graduate programme', url: 'https://www.irishimmigration.ie/my-situation-has-changed-since-i-arrived-in-ireland/third-level-graduate-programme/' },
  ],
  verify: [
    'Where Nepali applicants submit supporting documents and current visa fees.',
    'Current Government of Ireland scholarship amounts and dates.',
  ],
}
