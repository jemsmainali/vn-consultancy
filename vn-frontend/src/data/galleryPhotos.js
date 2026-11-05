export const galleryCategories = [
  { id: 'all', label: 'All photos' },
  { id: 'visa', label: 'Visa success' },
  { id: 'departures', label: 'Student life' },
  { id: 'team', label: 'Team & events' },
]

// Staff-managed gallery items use the backend categories; map them onto the public filters.
const managedCategoryMap = { 'student-life': 'departures', counselling: 'team', events: 'team', workshops: 'team', team: 'team', campus: 'team' }

export const fromManagedItem = (item, apiBase) => ({
  id: `managed-${item.id}`,
  category: managedCategoryMap[item.category] || 'team',
  src: apiBase + item.image_url,
  thumbSrc: apiBase + item.image_url,
  caption: item.caption,
  alt: item.alt_text,
})

const galleryPhoto = (name, category, width, height, caption, alt) => ({
  id: name,
  category,
  src: `/images/gallery/${name}-1200.jpg`,
  thumbSrc: `/images/gallery/${name}-480.jpg`,
  srcSet: `/images/gallery/${name}-480.jpg 480w, /images/gallery/${name}-1200.jpg ${width}w`,
  width,
  height,
  caption,
  alt,
})

const japanVisaStudents = [
  'Aashika Dahal', 'Neten Gole Tamang', 'Mamita Tamang', 'Narendra Budha', 'Bishal Karki',
  'Prinjila Tadi', 'Ambika Gurmachhan', 'Dipa Pun Magar', 'Saroj Pasman', 'Govind Yadav',
  'Niraj Paswan', 'Rohit Basnet', 'Sarita Tamang', 'Ranisha Ray', 'Niraj Karki',
  'Dipa Rokaya', 'Niroj Bogati', 'Nischal Thakuri', 'Sushila Kumari Mahato', 'Nirajan Kumar Karn',
]

const japanVisas = japanVisaStudents.map((student, index) => galleryPhoto(
  `visa-japan-${index + 1}`, 'visa', 1200, 1698,
  `${student} — Japan visa granted`,
  `VN Group congratulations poster for ${student} on receiving a Japan student visa`,
))

const departures = {
  airport1: galleryPhoto('departure-airport-1', 'departures', 1200, 1600, 'Ready to fly — a student at the airport with VN Group', 'A VN Group student wearing farewell scarves with luggage at the airport'),
  airport2: galleryPhoto('departure-airport-2', 'departures', 1002, 1506, 'Off to start a new chapter abroad', 'A VN Group student with a backpack and luggage trolley at the airport'),
  farewell1: galleryPhoto('departure-farewell-1', 'departures', 960, 1280, 'A warm send-off before departure', 'A VN Group team member placing a farewell scarf on a departing student'),
  farewell2: galleryPhoto('departure-farewell-2', 'departures', 960, 1280, 'Celebrating a student on departure day', 'A VN Group counsellor congratulating a departing student outside the airport'),
}
const officeGuide = galleryPhoto('team-office-guide', 'team', 960, 1280, 'Welcoming students at the VN Group office', 'VN Group team member handing a student guide to a visitor at the VN Group office')
const australiaVisa = galleryPhoto('visa-australia-utsav-kushwaha', 'visa', 1024, 1280, 'Utsav Kushwaha — Australian student visa granted', 'VN Group congratulations poster for Utsav Kushwaha on receiving an Australian student visa')

const supplied = {
  visaOffice: galleryPhoto('visa-grant-office', 'visa', 1200, 1600, 'Visa granted — celebrating at the VN Group office', 'A smiling student in a farewell scarf holding a visa grant letter with a VN Group counsellor at the VN Group office'),
  visaTeam: galleryPhoto('visa-grant-team', 'visa', 1200, 900, 'A visa grant letter in hand, with the VN Group team', 'A student holding a visa grant letter between two VN Group team members at the VN Group office'),
  westcliff: galleryPhoto('event-westcliff-session', 'team', 1200, 1600, 'Westcliff University information session in Kathmandu', 'A Westcliff University representative presenting accommodation options to students at a VN Group info session'),
  intakeBriefing: galleryPhoto('event-intake-briefing', 'team', 1200, 761, 'Walking students through university intake dates', 'A VN Group presenter speaking into a microphone beside a projected academic calendar'),
  maryville: galleryPhoto('counselling-maryville', 'departures', 960, 720, 'An admissions session with Maryville University', 'Three students in a session across a desk, with a Maryville University sign on the table'),
  graduation: galleryPhoto('graduation-maryville', 'departures', 556, 742, 'Graduation day at Maryville University', 'A graduate in cap and gown holding a red Maryville University diploma cover'),
}

const partnerVisits = {
  melbourneArrival: galleryPhoto('partner-melbourne-arrival', 'team', 1200, 900, 'Arriving in Melbourne for partner visits', 'A VN Group representative with a suitcase beneath the Melbourne sign at Melbourne Airport'),
  notreDame: galleryPhoto('partner-notre-dame', 'team', 1200, 1600, 'Visiting The University of Notre Dame Australia', 'A VN Group representative holding a university tote bag outside The University of Notre Dame Australia'),
  aiihe: galleryPhoto('partner-aiihe', 'team', 1200, 1600, 'Meeting at Australian International Institute of Higher Education', 'A VN Group representative shaking hands with a host at Australian International Institute of Higher Education'),
  sydneyCityCollege: galleryPhoto('partner-sydney-city-college', 'team', 1200, 1636, 'Visiting Sydney City College of Management', 'A VN Group representative at the reception of Sydney City College of Management'),
  charlesSturt: galleryPhoto('partner-charles-sturt', 'team', 1200, 1041, 'With the team at Charles Sturt University', 'VN Group representatives with staff at the Charles Sturt University reception desk'),
}

export const galleryPhotos = [
  supplied.visaOffice,
  departures.airport1,
  supplied.westcliff,
  australiaVisa,
  supplied.graduation,
  departures.farewell1,
  supplied.visaTeam,
  partnerVisits.notreDame,
  officeGuide,
  supplied.maryville,
  partnerVisits.charlesSturt,
  ...japanVisas.slice(0, 4),
  supplied.intakeBriefing,
  partnerVisits.aiihe,
  departures.airport2,
  ...japanVisas.slice(4, 10),
  partnerVisits.melbourneArrival,
  partnerVisits.sydneyCityCollege,
  departures.farewell2,
  ...japanVisas.slice(10),
]

export const galleryPreview = [supplied.visaOffice, departures.airport1, supplied.westcliff, japanVisas[0], supplied.graduation, departures.farewell1, australiaVisa, supplied.visaTeam, departures.airport2, departures.farewell2]
