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

export const siteImages = {
  logo: { src: '/images/vn-group-logo.jpg', alt: 'VN Group Study Abroad' },
  hero: photo('hero', 'hero-main', [480, 800, 1200], 1200, 1200, 900, 'VN Group counsellors and students with a Westcliff University representative at an info session in Kathmandu', '(max-width: 820px) calc(100vw - 42px), (max-width: 1280px) 52vw, 620px'),
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
  ceo: { src: '/images/ceo.jpg', alt: 'Portrait of VN Group managing director and founder' },
  loginGraduate: { src: '/images/login-graduate.jpg', alt: 'A smiling graduate celebrating with both arms raised', width: 360, height: 360 },
}

const countries = [
  { name: 'Australia', flag: '🇦🇺', code: 'AU' },
  { name: 'Canada', flag: '🇨🇦', code: 'CA' },
  { name: 'United Kingdom', flag: '🇬🇧', code: 'UK' },
  { name: 'United States', flag: '🇺🇸', code: 'US' },
  { name: 'Germany', flag: '🇩🇪', code: 'DE' },
  { name: 'France', flag: '🇫🇷', code: 'FR' },
  { name: 'Ireland', flag: '🇮🇪', code: 'IE' },
  { name: 'Japan', flag: '🇯🇵', code: 'JP' },
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
    ],
  },
  home: {
    hero: {
      eyebrow: 'Study abroad guidance · Nepal',
      title: 'Your next chapter starts with',
      emphasis: 'a clear plan.',
      description: 'Explore study options and plan your next steps with VN Group.',
      primaryLabel: 'Free Counselling',
      secondaryLabel: 'Explore Destinations',
      photo: siteImages.hero,
    },
    stats: [
      { label: 'Students placed', value: 'TODO_REPLACE' },
      { label: 'Partner universities', value: 'TODO_REPLACE' },
      { label: 'Years of experience', value: 'TODO_REPLACE' },
      { label: 'Visa success rate', value: 'TODO_REPLACE', suffix: '%' },
    ],
    countries,
    process: [
      { title: 'Free Counselling', description: 'Talk through your goals, questions, and potential next steps.', icon: 'conversation' },
      { title: 'Choose Course and Country', description: 'Compare study options against your interests and plans.', icon: 'compass', image: siteImages.choose },
      { title: 'Apply', description: 'Prepare and submit an application to your chosen institution.', icon: 'document', image: siteImages.apply },
      { title: 'Visa', description: 'Review the relevant visa process and organize your documents.', icon: 'passport', image: siteImages.visa },
      { title: 'Fly', description: 'Use a pre-departure checklist as you prepare for travel.', icon: 'plane', image: siteImages.fly },
    ],
    services: [
      { id: 'counselling', title: 'Counselling', description: 'Talk through your study interests, questions, and potential next steps.', linkLabel: 'Learn more', image: siteImages.counselling, illustration: siteImages.counsellingTopics },
      { id: 'admissions', title: 'Admissions', description: 'Explore course options and application requirements.', linkLabel: 'Learn more', image: siteImages.choose },
      { id: 'scholarships', title: 'Scholarships', description: 'Review scholarship information provided by institutions.', linkLabel: 'Learn more', image: siteImages.scholarships },
      { id: 'visa-filing', title: 'Visa Filing', description: 'Organize the visa process and its supporting documents.', linkLabel: 'Learn more', image: siteImages.apply },
      { id: 'test-prep', title: 'IELTS/PTE Guidance', description: 'Discuss English-language test preparation and score requirements.', linkLabel: 'Learn more', image: siteImages.ielts },
      { id: 'pre-departure', title: 'Pre-departure Briefing', description: 'Review a practical checklist for preparing to study abroad.', linkLabel: 'Learn more', image: siteImages.fly },
    ],
    successStories: [],
    partnerLogos: [],
    partnerVisits: [
      { image: siteImages.griffin, caption: 'Visiting Griffin College, Australia' },
      { image: siteImages.sahe, caption: 'Visiting Southern Academy of Higher Education' },
    ],
    enquiry: {
      countries: countries.map(({ name }) => name),
      qualifications: ['Secondary school', 'High school', 'Diploma', "Bachelor's degree", "Master's degree", 'Other'],
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
      description: 'Answers will be added after VN Group reviews the current guidance.',
    },
  },
  footer: {
    note: 'Guidance for your next step.',
    explore: [
      { label: 'About Us', to: '/about' },
      { label: 'Destinations', to: '/destinations' },
      { label: 'Services', to: '/#services' },
      { label: 'Process', to: '/#process' },
      { label: 'Success Stories', to: '/#services' },
      { label: 'Blog', to: '/faqs' },
      { label: 'FAQs', to: '/faqs' },
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

export const siteContentReady = (value) => typeof value === 'string' && value.trim() !== '' && !value.includes('TODO_REPLACE')
