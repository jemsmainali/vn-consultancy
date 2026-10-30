// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'south-korea',
  intro: 'South Korea offers degree programmes and Korean-language programmes at universities, with government GKS scholarships for a small number of Nepali applicants each year. Work rights depend on your programme, your TOPIK level and your university’s status.',
  quickFacts: [
    { label: 'Visa', value: 'D-2 (degree) or D-4 (Korean language)' },
    { label: 'Work while studying', value: 'With permission; hours linked to TOPIK level' },
    { label: 'After graduation', value: 'D-10 job-seeking visa, then work visas such as E-7' },
    { label: 'Main intakes', value: 'March and September (language programmes run quarterly)' },
  ],
  overview: {
    system: 'Four-year bachelor’s degrees, two-year master’s and doctoral programmes, plus university-run Korean language institutes. Many degree programmes are taught in Korean; English-taught options are more common at graduate level.',
    fields: ['Engineering and semiconductors', 'Computer science', 'Business and international trade', 'Korean language and culture', 'Biotechnology', 'Design and media'],
    cities: ['Seoul', 'Busan', 'Daegu', 'Daejeon', 'Gwangju', 'Incheon'],
    advantages: ['Lower tuition than many English-speaking countries', 'GKS scholarships with full funding', 'Strong technology industry', 'Modern cities and transport'],
  },
  costs: {
    tuition: [
      { label: 'Korean language programme (4 terms)', range: [5000000, 7000000] },
      { label: 'Bachelor’s – national university', range: [4000000, 6000000] },
      { label: 'Bachelor’s – private university', range: [7000000, 12000000] },
      { label: 'Master’s degree', range: [5000000, 14000000] },
    ],
    tuitionNote: 'Annual tuition. Many universities give tuition reductions to students with higher TOPIK scores.',
    living: [
      { label: 'Dormitory or one-room rent', range: [250000, 700000] },
      { label: 'Food', range: [300000, 450000] },
      { label: 'Transport', range: [60000, 100000] },
      { label: 'Phone and internet', range: [30000, 60000] },
      { label: 'National Health Insurance and personal', range: [150000, 250000] },
    ],
    cityNote: 'Seoul is the most expensive, and private rentals often need a large deposit. Regional cities and dormitories cost much less.',
    requirement: {
      type: 'verify',
      text: 'You must show a bank balance certificate and recent statements covering your study costs. The Embassy of Korea in Nepal asks for statements from an “A level” bank and original documents. The minimum amount varies by programme and university; confirm it with the embassy and your university before applying.',
      source: { label: 'Embassy of the Republic of Korea in Nepal – Visa issuance', url: 'https://overseas.mofa.go.kr/np-en/wpge/m_1714/contents.do' },
    },
  },
  admission: {
    academic: ['Bachelor’s: completion of NEB Grade 12 with transcripts verified as required.', 'Master’s: a recognised bachelor’s degree; research programmes may need a supervisor’s support.', 'Language programmes: Grade 12 completion and proof of funds.'],
    language: ['Korean-taught degrees: usually TOPIK level 3–4 or higher (some admit with lower levels and require Korean study first).', 'English-taught degrees: IELTS or TOEFL iBT as each university requires.'],
    documents: ['Passport', 'Certificate of admission', 'Verified academic certificates', 'TOPIK or IELTS score report', 'Balance certificate and 6 months of bank statements', 'Sponsor documents and relationship proof', 'Invitation letter and letter of guarantee where requested', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Spring (March) applications usually close between October and December.', 'Autumn (September) applications usually close between April and June.', 'Book an online appointment with the embassy for the visa.'],
    note: 'Requirements change frequently. The embassy accepts only original documents where originals are requested.',
  },
  visa: {
    name: 'D-2 student visa / D-4 language trainee visa',
    overview: 'After your university issues a certificate of admission, you apply at the Embassy of the Republic of Korea in Nepal by online appointment.',
    requirements: [
      { label: 'Financial evidence', text: 'Balance certificate and 6 months of statements from an “A level” bank.', type: 'official' },
      { label: 'Original documents', text: 'The embassy requires originals where specified; copies alone can lead to refusal.', type: 'official' },
      { label: 'Appointment', text: 'Visa applications need an online appointment.', type: 'official' },
    ],
    processing: 'Processing times vary by season; contact the embassy visa section for current timelines.',
  },
  fit: {
    suits: ['Students interested in technology, engineering or Korean culture', 'Strong applicants aiming for GKS', 'Students willing to learn Korean'],
    pros: ['Lower tuition than many English-speaking countries', 'Fully funded GKS scholarships', 'Safe, modern cities'],
    cons: ['Korean is needed for most jobs and many degrees', 'Work hours depend on TOPIK level', 'Very limited GKS places for Nepal'],
  },
  sources: [
    { label: 'Embassy of Korea in Nepal – Visa issuance', url: 'https://overseas.mofa.go.kr/np-en/wpge/m_1714/contents.do' },
    { label: 'Embassy of Korea in Nepal – Important announcement for visa applications', url: 'https://overseas.mofa.go.kr/np-en/brd/m_25533/view.do?seq=112' },
    { label: 'Embassy of Korea in Nepal – 2026 GKS undergraduate notice', url: 'https://overseas.mofa.go.kr/np-en/brd/m_25533/view.do?seq=145' },
    { label: 'Study in Korea – Employment system for international students', url: 'https://www.studyinkorea.go.kr/fr/work/aboutForeignerEmploymentSystem.do' },
  ],
  verify: [
    'Minimum bank balance currently required by the Embassy of Korea in Nepal.',
    'Current part-time work hour limits by TOPIK level and programme.',
    'Current D-10 length of stay and conditions.',
  ],
}
