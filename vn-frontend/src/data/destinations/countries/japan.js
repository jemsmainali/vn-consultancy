// Public summary only. Scholarships, visa steps, work rules, post-study routes, student life and
// official links are served to signed-in users from app/data/destinations/<slug>.json.
export default {
  slug: 'japan',
  intro: 'Many Nepali students begin in Japan at a Japanese language school, then move to a vocational school or university. Japanese ability shapes your study, work and career options, and the Embassy of Japan in Nepal warns applicants about brokers and false documents.',
  quickFacts: [
    { label: 'Status of residence', value: '“Student” (via a Certificate of Eligibility)' },
    { label: 'Work while studying', value: 'With permission: up to 28 hours a week' },
    { label: 'After graduation', value: 'Change to a work status with a job offer' },
    { label: 'Main intakes', value: 'April and October (language schools also January and July)' },
  ],
  overview: {
    system: 'Japanese language schools (1–2 years), specialised training colleges (senmon gakkō, usually 2 years), universities (4 years) and graduate schools. English-taught degrees exist mainly at graduate level and in some undergraduate programmes.',
    fields: ['Information technology', 'Engineering and robotics', 'Business and hospitality', 'Nursing care (kaigo) and welfare', 'Automotive and mechanics', 'Japanese studies'],
    cities: ['Tokyo', 'Osaka', 'Fukuoka', 'Nagoya', 'Kyoto', 'Sendai'],
    advantages: ['Safe, well-organised society', 'Strong demand for workers in some sectors', 'Range of routes from language school to graduate school', 'Government and JASSO scholarships'],
  },
  costs: {
    tuition: [
      { label: 'Japanese language school (incl. enrolment fees)', range: [700000, 900000] },
      { label: 'Specialised training college', range: [800000, 1300000] },
      { label: 'National university – first year incl. admission fee', range: [820000, 820000] },
      { label: 'Private university – first year', range: [1100000, 1600000] },
    ],
    tuitionNote: 'Study in Japan lists first-year costs of about ¥820,000 at national, ¥930,000 at public and ¥1,100,000 at private universities, including admission fees. Language school and college figures are estimates.',
    living: [
      { label: 'Rent (dormitory or shared apartment)', range: [35000, 70000] },
      { label: 'Food', range: [25000, 40000] },
      { label: 'Transport', range: [5000, 15000] },
      { label: 'Utilities, internet and phone', range: [10000, 18000] },
      { label: 'National Health Insurance and personal', range: [10000, 20000] },
    ],
    cityNote: 'Tokyo and Osaka are the most expensive; regional cities such as Fukuoka and Sendai are cheaper. The national average apartment rent for students was about ¥41,000 in JASSO’s 2023 survey.',
    requirement: {
      type: 'official',
      text: 'There is no single published amount. Your school and the Immigration Services Agency assess whether you or your sponsor can pay tuition and living costs when they review your Certificate of Eligibility. The Embassy of Japan in Nepal warns that part-time income alone is not enough to cover tuition and living costs.',
      source: { label: 'Embassy of Japan in Nepal – Caution to those wishing to study in Japan', url: 'https://www.np.emb-japan.go.jp/files/000111308.pdf' },
    },
  },
  admission: {
    academic: ['Language school: completion of 12 years of education and a minimum amount of Japanese study (often JLPT N5 level or 150+ hours), set by each school.', 'Specialised colleges: usually JLPT N2 or equivalent Japanese ability.', 'Universities: EJU and Japanese ability for Japanese-taught programmes; English tests for English-taught programmes.'],
    language: ['Japanese: JLPT, NAT-TEST or J.TEST results, depending on the school.', 'English-taught programmes: IELTS or TOEFL iBT, as each university specifies.'],
    documents: ['Passport', 'Academic certificates and transcripts', 'Japanese study certificate and test results', 'Sponsor’s income, tax and bank documents', 'Relationship documents for the sponsor', 'Certificate of Eligibility (issued after the school applies)', 'NOC from Nepal’s Ministry of Education'],
    timeline: ['Apply to a language school 6–8 months before the intake.', 'The school applies for your Certificate of Eligibility (CoE).', 'After the CoE is issued, apply for the visa at the Embassy of Japan in Nepal.'],
    note: 'Only use official channels. The embassy warns that false documents lead to refusal and can affect future applications.',
  },
  visa: {
    name: 'Student status of residence',
    overview: 'Your school applies for a Certificate of Eligibility (CoE) from the Immigration Services Agency of Japan. With the CoE, you apply for a visa at the Embassy of Japan in Nepal and receive a residence card on arrival.',
    requirements: [
      { label: 'Certificate of Eligibility', text: 'Required before the visa application.', type: 'official' },
      { label: 'Genuine documents', text: 'The embassy warns against brokers and false documents.', type: 'official' },
      { label: 'Health insurance', text: 'Students living in Japan join National Health Insurance.', type: 'official' },
    ],
    processing: 'CoE processing usually takes several months; the visa stage is shorter. Times vary by intake and school.',
  },
  fit: {
    suits: ['Students committed to learning Japanese', 'IT, engineering, hospitality and care-work career plans', 'Students who value safety and structure'],
    pros: ['Safe and well-organised', 'Multiple routes, from language school to graduate school', 'Work options after graduation for those with a job offer'],
    cons: ['Japanese ability is essential for most jobs', 'Part-time income cannot cover full costs', 'Broker and document fraud risks; use official channels only'],
  },
  sources: [
    { label: 'Study in Japan – Part-time work', url: 'https://www.studyinjapan.go.jp/en/work-in-japan/part-time-jobs/' },
    { label: 'Study in Japan – Academic fees', url: 'https://www.studyinjapan.go.jp/en/planning/academic-fees/' },
    { label: 'Study in Japan – Accommodation', url: 'https://www.studyinjapan.go.jp/en/life/accomodation/' },
    { label: 'Embassy of Japan in Nepal – Caution to those wishing to study in Japan', url: 'https://www.np.emb-japan.go.jp/files/000111308.pdf' },
  ],
  verify: ['Current length and conditions of the Designated Activities job-hunting status after graduation.'],
}
