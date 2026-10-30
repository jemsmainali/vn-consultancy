// Public destination previews used by navigation, cards, the footer and page titles.
// Keep this file free of tuition, living-cost, visa and employment details: the full
// country guides are served to signed-in users by the backend (GET /destinations/:slug).

const commonsImage = (slug, [width, height], alt, credit) => ({
  src: `/images/destinations/${slug}-1200.jpg`,
  srcSet: `/images/destinations/${slug}-640.jpg 640w, /images/destinations/${slug}-1200.jpg 1200w`,
  sizes: '(max-width: 640px) calc(100vw - 32px), (max-width: 1100px) 50vw, 560px',
  width,
  height,
  alt,
  credit: { ...credit, source: 'Wikimedia Commons' },
})

export const destinations = [
  {
    slug: 'australia', name: 'Australia', code: 'au', currency: 'AUD',
    intro: 'Career-focused universities and vocational institutes, known for practical teaching and strong student support.',
    highlights: ['English-speaking, with a large Nepali community', 'Universities and TAFE institutes nationwide', 'Every course on a national register (CRICOS)'],
    studyAreas: ['IT and data', 'Nursing and health', 'Engineering', 'Accounting and business'],
    lifestyle: 'Sunny coastal cities, outdoor living and good public transport in major centres.',
    image: {
      src: '/images/vn-photos/destinations/australia-card-720.jpg',
      srcSet: '/images/vn-photos/destinations/australia-card-480.webp 480w, /images/vn-photos/destinations/australia-card-720.webp 720w',
      sizes: '(max-width: 640px) calc(100vw - 32px), (max-width: 1100px) 50vw, 560px',
      width: 720, height: 405, alt: 'Sydney Opera House, Australia',
    },
  },
  {
    slug: 'united-states', name: 'United States', code: 'us', currency: 'USD',
    intro: 'Thousands of accredited colleges and universities, flexible majors and world-leading research.',
    highlights: ['Huge choice of institutions and programmes', 'Flexible majors you can shape over time', 'Strong research and campus facilities'],
    studyAreas: ['Computer and data science', 'Engineering', 'Business analytics', 'Public health'],
    lifestyle: 'From big-city campuses to classic college towns, with a lively campus culture.',
    image: commonsImage('united-states', [1200, 900], 'Boston skyline seen across the Charles River', { author: 'Ethan Dyson', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', page: 'https://commons.wikimedia.org/wiki/File:Boston_Skyline_from_Charles_River_2.jpg' }),
  },
  {
    slug: 'united-kingdom', name: 'United Kingdom', code: 'gb', currency: 'GBP',
    intro: 'Globally recognised universities with shorter degrees: most taught master’s programmes take one year.',
    highlights: ['Three-year bachelor’s degrees in England', 'One-year taught master’s programmes', 'Large South Asian communities in many cities'],
    studyAreas: ['Business and management', 'Computer science and AI', 'Engineering', 'Public health and nursing'],
    lifestyle: 'Historic cities, easy train travel and a mild, often rainy climate.',
    image: commonsImage('united-kingdom', [1200, 709], 'Old Town skyline of Edinburgh, Scotland', { author: "Anthony O'Neil", license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0', page: 'https://commons.wikimedia.org/wiki/File:Old_Town_skyline,_Edinburgh_-_geograph.org.uk_-_8087811.jpg' }),
  },
  {
    slug: 'canada', name: 'Canada', code: 'ca', currency: 'CAD',
    intro: 'Universities, colleges and polytechnics in safe, multicultural cities, with a wide choice of programmes.',
    highlights: ['College and university routes', 'Strong applied and technical programmes', 'Diverse, welcoming cities'],
    studyAreas: ['Computer science and IT', 'Engineering', 'Healthcare', 'Business and supply chain'],
    lifestyle: 'Friendly, multicultural cities with long, snowy winters.',
    image: commonsImage('canada', [1200, 533], 'Toronto skyline at sunset from Snake Island', { author: 'Jchmrt', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', page: 'https://commons.wikimedia.org/wiki/File:Sunset_Toronto_Skyline_Panorama_Crop_from_Snake_Island.jpg' }),
  },
  {
    slug: 'new-zealand', name: 'New Zealand', code: 'nz', currency: 'NZD',
    intro: 'Eight publicly funded universities plus polytechnics, in smaller, calmer cities with stunning scenery.',
    highlights: ['All eight universities are publicly funded', 'Smaller classes and personal attention', 'Safe, relaxed and welcoming'],
    studyAreas: ['IT', 'Engineering', 'Agriculture and environment', 'Health sciences'],
    lifestyle: 'Outdoor lifestyle, walkable cities and a temperate, changeable climate.',
    image: commonsImage('new-zealand', [1200, 676], 'Wellington Harbour, New Zealand', { author: 'Wainuiomartian', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0', page: 'https://commons.wikimedia.org/wiki/File:Wellington_Harbour_from_Te_Ara_Tupua.jpg' }),
  },
  {
    slug: 'germany', name: 'Germany', code: 'de', currency: 'EUR',
    intro: 'Research-led public universities and world-class engineering, with many English-taught master’s programmes.',
    highlights: ['Strong engineering and research tradition', 'Many English-taught master’s programmes', 'Central location in Europe'],
    studyAreas: ['Mechanical and electrical engineering', 'Computer science', 'Renewable energy', 'Business and economics'],
    lifestyle: 'Excellent public transport, shared student flats and four distinct seasons.',
    image: commonsImage('germany', [1200, 801], 'Heidelberg Castle and the Old Bridge at night, Germany', { author: 'R. J. Mathar', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', page: 'https://commons.wikimedia.org/wiki/File:Heidelberg_Castle_and_the_Old_bridge_(2021).jpg' }),
  },
  {
    slug: 'ireland', name: 'Ireland', code: 'ie', currency: 'EUR',
    intro: 'An English-speaking EU country with respected universities and a thriving technology and pharmaceutical sector.',
    highlights: ['English-speaking and in the EU', 'One-year master’s programmes', 'European base for global technology companies'],
    studyAreas: ['Computer science and data', 'Pharmaceutical science', 'Business and finance', 'Nursing and health'],
    lifestyle: 'Friendly, compact cities and a mild, rainy climate all year.',
    image: commonsImage('ireland', [1200, 787], "River Liffey in Dublin with the Ha'penny Bridge", { author: 'P. Hughes', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0', page: 'https://commons.wikimedia.org/wiki/File:Dubln_-_River_Liffey_with_Ha%27Penny_Bridge_in_distance.jpg' }),
  },
  {
    slug: 'france', name: 'France', code: 'fr', currency: 'EUR',
    intro: 'Public universities, respected business and engineering schools, and a growing range of English-taught master’s.',
    highlights: ['Renowned business and engineering schools', 'Growing number of English-taught master’s', 'Gateway to the rest of Europe'],
    studyAreas: ['Business and management', 'Engineering', 'Fashion and design', 'Hospitality and culinary arts'],
    lifestyle: 'Rich culture, great food and fast trains linking every region.',
    image: commonsImage('france', [1200, 793], 'Pont Alexandre III and the Eiffel Tower in Paris at dusk', { author: 'Jorge Royan', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0', page: 'https://commons.wikimedia.org/wiki/File:Paris_-_Pont_Alexandre_III_and_the_Eiffel_Tower_-_4066.jpg' }),
  },
  {
    slug: 'japan', name: 'Japan', code: 'jp', currency: 'JPY',
    intro: 'Many students begin at a Japanese language school, then move on to a vocational school or university.',
    highlights: ['Safe, well-organised society', 'Routes from language school to graduate school', 'Leader in technology and engineering'],
    studyAreas: ['Information technology', 'Engineering and robotics', 'Business and hospitality', 'Japanese language'],
    lifestyle: 'Punctual trains, safe streets, hot summers and cold winters.',
    image: commonsImage('japan', [1200, 738], 'Kiyomizu-dera temple in Kyoto in autumn', { author: 'Martin Falbisoner', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', page: 'https://commons.wikimedia.org/wiki/File:Kiyomizu-dera,_Kyoto,_November_2016_-01.jpg' }),
  },
  {
    slug: 'south-korea', name: 'South Korea', code: 'kr', currency: 'KRW',
    intro: 'Degree and Korean-language programmes at modern universities in a fast-moving technology hub.',
    highlights: ['Strong technology and research industry', 'Korean-language programmes for beginners', 'Modern cities with fast transport'],
    studyAreas: ['Engineering and semiconductors', 'Computer science', 'Business and trade', 'Korean language and culture'],
    lifestyle: 'Vibrant cities, fast subways and four distinct seasons.',
    image: commonsImage('south-korea', [1200, 800], 'Gyeonghoeru pavilion at Gyeongbokgung Palace, Seoul', { author: 'Frank Schulenburg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', page: 'https://commons.wikimedia.org/wiki/File:Gyeonghoeru_(Royal_Banquet_Hall)_at_Gyeongbokgung_Palace,_Seoul.jpg' }),
  },
]

export const destinationBySlug = (slug) => destinations.find((item) => item.slug === slug)
export const destinationByName = (name) => destinations.find((item) => item.name.toLowerCase() === String(name).toLowerCase())
export const destinationPath = (item) => `/destinations/${item.slug}`
