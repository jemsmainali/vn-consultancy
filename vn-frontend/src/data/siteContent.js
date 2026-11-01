const photo = (folder, name, widths, fallbackWidth, width, height, alt, sizes) => {
  const base = `/images/vn-photos/${folder}/${name}`
  const webp = widths.map((size) => `${base}-${size}.webp`)
  return {
    src: `${base}-${fallbackWidth}.jpg`,
    webpSrc: webp[0],
    webpSrcSet: widths.map((size, index) => `${webp[index]} ${size}w`).join(', '),
    sizes,
    width,
    height,
    alt,
  }
}

const suppliedIllustration = (name, width, height, alt) => ({
  src: `/images/vn-photos/${name}.jfif`,
  width,
  height,
  alt,
  sizes: '(max-width: 560px) calc(100vw - 48px), (max-width: 820px) 80vw, 320px',
})

// Licensed Unsplash photos stored locally (see PHOTO_CREDITS.md). Illustrative only, never presented as VN Group activity.
const licensedPhoto = (name, height, alt, sizes) => ({
  src: `/images/site/${name}-1200.jpg`,
  webpSrc: `/images/site/${name}-1200.webp`,
  webpSrcSet: [480, 800, 1200].map((size) => `/images/site/${name}-${size}.webp ${size}w`).join(', '),
  sizes,
  width: 1200,
  height,
  alt,
  licensed: true,
})
const SERVICE_SIZES = '(max-width: 640px) calc(100vw - 32px), (max-width: 1100px) 46vw, 30vw'
const STEP_SIZES = '(max-width: 900px) calc(100vw - 32px), 44vw'

export const siteImages = {
  logo: { src: '/images/vn-group-logo.jpg', alt: 'VN Group Study Abroad' },
  hero: photo('hero', 'hero-main', [480, 800, 1200], 1200, 1200, 900, 'VN Group counsellors and students with a Westcliff University representative at an info session in Kathmandu', '100vw'),
  australia: photo('destinations', 'australia-card', [480, 720], 720, 720, 405, 'Sydney Opera House, Australia', '(max-width: 560px) 45vw, (max-width: 820px) 46vw, 23vw'),
  counselling: photo('services', 'counselling-session', [480, 800, 1200], 1200, 1200, 800, 'A VN Group counsellor speaking to a group of students', '(max-width: 820px) calc(100vw - 42px), (max-width: 1280px) 46vw, 560px'),
  counsellingTopics: suppliedIllustration('counselling', 735, 556, 'Counselling diagram showing advice, help, empathy, and support'),
  choose: suppliedIllustration('choose', 650, 651, 'Illustration of a globe with country flags and world landmarks'),
  apply: suppliedIllustration('apply', 385, 350, 'Approved application stamp illustration'),
  fly: suppliedIllustration('fly', 650, 650, 'Travel illustration with an airplane, suitcase, and landmarks'),
  visa: suppliedIllustration('visa1', 735, 490, 'Study abroad illustration with a plane, graduation cap, and world flags'),
  scholarships: suppliedIllustration('scholorships', 250, 202, 'Scholarship graduation cap illustration'),
  ielts: suppliedIllustration('Iltes', 736, 736, 'Illustration of a study counsellor and student support services'),
  griffin: photo('partners', 'partner-griffin-college', [480, 800, 960], 960, 960, 720, 'VN Group representative visiting Griffin College', '(max-width: 700px) calc(100vw - 40px), (max-width: 1280px) 45vw, 560px'),
  sahe: photo('partners', 'partner-sahe', [480, 800, 1200], 1200, 1200, 900, 'VN Group representatives at Southern Academy of Higher Education', '(max-width: 700px) calc(100vw - 40px), (max-width: 1280px) 45vw, 560px'),
  partnerMeeting: photo('about', 'partner-meeting', [480, 800, 960], 960, 960, 720, 'VN Group team meeting with a partner delegation', '(max-width: 820px) calc(100vw - 42px), (max-width: 1280px) 44vw, 540px'),
  events: photo('about', 'events-wide', [480, 800, 1200], 1200, 1200, 675, 'VN Group team attending an international education conference', '(max-width: 820px) calc(100vw - 42px), (max-width: 1280px) 90vw, 1120px'),
  admissionsSession: { ...photo('services', 'admissions-westcliff-session', [480, 800, 1200], 1200, 1200, 1600, 'A Westcliff University representative presenting to students at a VN Group info session in Kathmandu', SERVICE_SIZES), position: 'center 30%' },
  visaGrantTeam: { ...photo('services', 'visa-grant-team', [480, 800, 1200], 1200, 1200, 900, 'A student holding a visa grant letter with two VN Group team members at the VN Group office', SERVICE_SIZES), position: 'center 35%' },
  stepCounselling: photo('steps', 'counselling-maryville', [480, 800, 960], 960, 960, 720, 'Students in an admissions session at a desk with a Maryville University sign', STEP_SIZES),
  stepIntakeBriefing: { ...photo('steps', 'intake-briefing', [480, 800, 1200], 1200, 1200, 761, 'A VN Group presenter explaining university intake dates beside a projected academic calendar', STEP_SIZES), position: '35% center' },
  stepVisaGrant: { ...photo('steps', 'visa-grant-office', [480, 800, 1200], 1200, 1200, 1600, 'A student holding a visa grant letter with a VN Group counsellor at the VN Group office', STEP_SIZES), position: 'center 30%' },
  serviceCampus: licensedPhoto('service-campus', 786, 'A university campus building across a green lawn', SERVICE_SIZES),
  serviceGraduation: licensedPhoto('service-graduation', 800, 'Graduates throwing their caps in front of a university building', SERVICE_SIZES),
  serviceDocuments: licensedPhoto('service-documents', 801, 'Two people reviewing documents beside a laptop', SERVICE_SIZES),
  serviceExam: licensedPhoto('service-exam', 800, 'A student filling in a test answer sheet with a pencil', SERVICE_SIZES),
  serviceLuggage: licensedPhoto('service-luggage', 800, 'A traveller standing in a doorway with two suitcases', SERVICE_SIZES),
  stepConsultation: licensedPhoto('step-consultation', 800, 'An adviser and a student talking across a desk', STEP_SIZES),
  stepPlanning: licensedPhoto('step-planning', 799, 'A hand tracing a route on a world map beside a notebook', STEP_SIZES),
  stepApplication: licensedPhoto('step-application', 800, 'A student working on an application at a laptop', STEP_SIZES),
  stepOffer: licensedPhoto('step-offer', 900, 'A group of students celebrating good news at a laptop', STEP_SIZES),
  stepChecklist: licensedPhoto('step-checklist', 800, 'An open notebook with a pen and glasses, ready for a checklist', STEP_SIZES),
  stepDepartures: licensedPhoto('step-departures', 800, 'A traveller looking up at an airport departures board', STEP_SIZES),
  ceo: { src: '/images/ceo.jpg', alt: 'Portrait of VN Group managing director and founder' },
  loginGraduate: { src: '/images/login-graduate.jpg', alt: 'A smiling graduate celebrating with both arms raised', width: 360, height: 360 },
}

const countries = [
  { name: 'Australia', code: 'au' },
  { name: 'Canada', code: 'ca' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' },
  { name: 'Germany', code: 'de' },
  { name: 'France', code: 'fr' },
  { name: 'Ireland', code: 'ie' },
  { name: 'Japan', code: 'jp' },
  { name: 'South Korea', code: 'kr' },
  { name: 'New Zealand', code: 'nz' },
].map((country) => ({
  ...country,
  image: country.name === 'Australia' ? siteImages.australia : null,
  intro: 'TODO_REPLACE',
  intakes: 'TODO_REPLACE',
  tuitionRange: 'TODO_REPLACE',
  livingCostRange: 'TODO_REPLACE',
  requirements: 'TODO_REPLACE',
}))

export const siteContent = {
  brand: {
    name: 'VN Group Study Abroad',
    tagline: 'Clear next steps for students in Nepal exploring international education.',
    logo: siteImages.logo,
    foundedYear: 2012,
  },
  navigation: {
    about: [
      { label: 'Our Story', detail: 'Meet VN Group and its leadership.', to: '/about' },
      { label: 'Our Team', detail: 'Learn about the people at VN Group.', to: '/about' },
      { label: 'Why VN Group', detail: 'Read our approach to study guidance.', to: '/about' },
      { label: 'Partner Universities', detail: 'See partner visits and institutions.', to: '/#partner-visits-title' },
    ],
    services: [
      { label: 'Counselling', detail: 'Talk through your interests and next steps.', icon: 'conversation', to: '/#service-counselling' },
      { label: 'Admissions', detail: 'Explore course options and applications.', icon: 'document', to: '/#service-admissions' },
      { label: 'Scholarships', detail: 'Review scholarship information from institutions.', icon: 'award', to: '/#service-scholarships' },
      { label: 'Visa Filing', detail: 'Organize visa steps and supporting documents.', icon: 'passport', to: '/#service-visa-filing' },
      { label: 'IELTS/PTE Guidance', detail: 'Discuss English test preparation.', icon: 'language', to: '/#service-test-prep' },
      { label: 'Pre-departure Briefing', detail: 'Review a practical preparation checklist.', icon: 'plane', to: '/#service-pre-departure' },
    ],
    resources: [
      { label: 'Success Stories', detail: 'Explore student support and outcomes.', to: '/#services' },
      { label: 'Blog', detail: 'Read answers and study guidance.', to: '/faqs' },
      { label: 'FAQs', detail: 'Browse frequently asked questions.', to: '/faqs' },
      { label: 'How It Works', detail: 'See the student journey step by step.', to: '/journey' },
      { label: 'Gallery', detail: 'Visa successes, departures and partner visits.', to: '/gallery' },
    ],
  },
  home: {
    hero: {
      eyebrow: 'years of trusted guidance',
      title: 'Your next chapter',
      emphasis: 'starts here.',
      rotatingCountries: ['Australia', 'United States', 'Canada', 'Japan', 'South Korea'],
      description: 'Discover global opportunities. Build your future with VN Group.',
      primaryLabel: 'Free Counselling',
      secondaryLabel: 'Explore Destinations',
      photo: siteImages.hero,
    },
    whyChoose: [
      { icon: 'compass', title: 'A clear plan', description: 'Explore study options and plan your next steps with VN Group.' },
      { icon: 'conversation', title: 'End-to-end support', description: 'From counselling to admissions, visa filing, and pre-departure briefing.' },
      { icon: 'document', title: 'Admissions guidance', description: 'Explore course options and application requirements.' },
      { icon: 'shield', title: 'Transparent guidance', description: 'With transparent guidance, meticulous document preparation, and honest counseling, we turn uncertainty into achievement.' },
    ],
    stats: [
      { label: 'Students placed', value: 'TODO_REPLACE' },
      { label: 'Partner universities', value: 'TODO_REPLACE' },
      { label: 'Years of experience', value: 'TODO_REPLACE' },
      { label: 'Visa success rate', value: 'TODO_REPLACE', suffix: '%' },
    ],
    countries,
    process: [
      { title: 'Free Counselling', description: 'Talk through your goals, academic background and budget with a counsellor, and leave with clear next steps.', image: siteImages.stepCounselling },
      { title: 'Choose Your Course and Country', description: 'Compare programmes, entry requirements, costs and destinations to build a realistic shortlist.', image: siteImages.stepIntakeBriefing },
      { title: 'University Application', description: 'Prepare your statement of purpose and supporting documents, then apply to the universities on your shortlist.', image: siteImages.stepApplication },
      { title: 'Receive Your Offer', description: 'Review the offer conditions, accept your place and complete any deposit or document steps the university asks for.', image: siteImages.stepOffer },
      { title: 'Visa Preparation', description: 'Organise your financial evidence and documents against the official visa requirements for your destination.', image: siteImages.stepVisaGrant },
      { title: 'Pre-departure Preparation', description: 'Plan travel, accommodation and arrival, with a briefing on what to expect in your first weeks abroad.', image: siteImages.stepDepartures },
    ],
    services: [
      { id: 'counselling', title: 'Career & Study Counselling', description: 'A free, one-to-one conversation about your grades, interests, budget and career goals, so you can compare courses and countries with clear information before you commit.', points: ['Course and career direction', 'Country and budget comparison', 'A realistic timeline and next steps'], linkLabel: 'Book free counselling', to: '/#enquire', image: siteImages.counselling },
      { id: 'admissions', title: 'University Admissions', description: 'Shortlisting programmes that fit your academic record, checking entry requirements and preparing complete applications.', linkLabel: 'Explore destinations', to: '/destinations', image: siteImages.admissionsSession },
      { id: 'scholarships', title: 'Scholarship Guidance', description: 'Finding scholarships you may be eligible for and understanding their criteria and deadlines. Awards are decided by institutions and funders.', linkLabel: 'Read scholarship FAQs', to: '/faqs', image: siteImages.serviceGraduation },
      { id: 'visa-filing', title: 'Visa Application Support', description: 'Understanding your destination’s visa requirements, organising financial and academic documents, and reviewing your file before you submit.', linkLabel: 'See the full process', to: '/journey', image: siteImages.visaGrantTeam },
      { id: 'test-prep', title: 'IELTS/PTE Preparation', description: 'Which English test your universities and visa accept, the scores to aim for, and how to plan your preparation.', linkLabel: 'Read English test FAQs', to: '/faqs', image: siteImages.serviceExam },
      { id: 'pre-departure', title: 'Pre-departure Guidance', description: 'A practical briefing before you fly: travel documents, accommodation, money, packing and your first weeks abroad.', linkLabel: 'See the full process', to: '/journey', image: siteImages.serviceLuggage },
    ],
    successStories: [],
    partnerLogos: [],
    partnerVisits: [
      { image: siteImages.griffin, caption: 'Visiting Griffin College, Australia' },
      { image: siteImages.sahe, caption: 'Visiting Southern Academy of Higher Education' },
      { image: siteImages.partnerMeeting, caption: 'Meeting with a partner delegation' },
    ],
    enquiry: {
      countries: countries.map(({ name }) => name),
      // Saved to the existing education_level column. The "Intended:" prefix keeps these
      // distinct from older enquiries, where that column held the student's last qualification.
      studyLevels: [
        { label: 'Foundation / pathway', value: 'Intended: Foundation / pathway' },
        { label: 'Diploma', value: 'Intended: Diploma' },
        { label: "Bachelor's degree", value: "Intended: Bachelor's degree" },
        { label: "Master's degree", value: "Intended: Master's degree" },
        { label: 'PhD / research', value: 'Intended: PhD / research' },
        { label: 'Language course', value: 'Intended: Language course' },
        { label: 'Not sure yet', value: 'Intended: Not sure yet' },
      ],
      notSureDestination: 'Not sure yet',
    },
    counsellors: [],
    faqs: [
      { question: 'TODO_REPLACE', answer: 'TODO_REPLACE' },
      { question: 'TODO_REPLACE', answer: 'TODO_REPLACE' },
      { question: 'TODO_REPLACE', answer: 'TODO_REPLACE' },
      { question: 'TODO_REPLACE', answer: 'TODO_REPLACE' },
    ],
  },
  contact: {
    whatsappNumber: '+9779851066164',
    whatsappMessage: 'Hello, I am interested in study abroad guidance.',
    signInHelpMessage: 'Hello VN Group, I need help signing in.',
    phone: '+9779851066164',
    email: 'vngroup.edu@gmail.com',
    address: 'TODO_REPLACE',
    officeHours: 'TODO_REPLACE',
    mapEmbedUrl: 'TODO_REPLACE',
    mapTitle: 'VN Group office location',
    socials: [],
  },
  form: {
    nepaliPhoneExample: '98XXXXXXXX',
  },
  pages: {
    destinations: {
      title: 'Study destinations',
      description: 'Destination details will appear here after VN Group verifies the current information.',
      emptyMessage: 'Country comparisons are hidden until VN Group supplies verified intake dates, costs, and requirements.',
    },
    faqs: {
      title: 'Frequently asked questions',
      description: 'Practical answers for students in Nepal. Rules change, so each answer points you to what to check before you apply.',
    },
  },
  footer: {
    note: 'Guidance for your next step.',
    description: 'Honest counselling, careful document preparation and clear next steps for students in Nepal planning to study abroad.',
    explore: [
      { label: 'Home', to: '/' },
      { label: 'About Us', to: '/about' },
      { label: 'Destinations', to: '/destinations' },
      { label: 'Services', to: '/#services' },
      { label: 'How It Works', to: '/journey' },
      { label: 'Gallery', to: '/gallery' },
      { label: 'FAQs', to: '/faqs' },
      { label: 'Contact', to: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Refund Policy', to: '/refund-policy' },
    ],
  },
  leadership: {
    name: 'Pawan Mainali',
    title: 'Managing Director & Founder',
    credentials: '',
    image: siteImages.ceo,
    message: 'When we founded VN Group, our vision was simple yet profound: to bridge the gap between ambitious students in Nepal and world-class international education. Navigating universities abroad can feel overwhelming, but with transparent guidance, meticulous document preparation, and honest counseling, we turn uncertainty into achievement. Your aspirations are our personal mission.',
  },
  about: {
    timeline: [{ year: 2012, title: 'VN Group founded' }],
    institutionsEyebrow: 'Our approach',
    institutionsTitle: 'How we work with institutions',
    institutionsCopy: 'TODO_REPLACE',
    eventsEyebrow: 'Connecting across borders',
    eventsTitle: 'We attend global education fairs',
  },
  login: { heroTitle: 'Your next chapter is closer than you think.', quote: 'TODO_REPLACE' },
  legal: {
    privacy: { title: 'Privacy Policy', body: 'TODO_REPLACE' },
    terms: { title: 'Terms', body: 'TODO_REPLACE' },
    refund: { title: 'Refund Policy', body: 'TODO_REPLACE' },
  },
}

export const yearsOfExperience = (now = new Date()) => now.getFullYear() - siteContent.brand.foundedYear

export function formatPhoneDisplay(phone) {
  const digits = phone.replace(/\D/g, '')
  const national = digits.startsWith('977') ? digits.slice(3) : digits
  if (digits.startsWith('977') && national.length === 10) {
    return `+977 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
  }
  return phone
}

export const siteContentReady = (value) => typeof value === 'string' && value.trim() !== '' && !value.includes('TODO_REPLACE')
