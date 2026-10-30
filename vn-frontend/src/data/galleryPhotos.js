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

export const galleryPhotos = [
  departures.airport1,
  australiaVisa,
  departures.farewell1,
  officeGuide,
  ...japanVisas.slice(0, 4),
  departures.airport2,
  ...japanVisas.slice(4, 10),
  departures.farewell2,
  ...japanVisas.slice(10),
]

export const galleryPreview = [departures.airport1, japanVisas[0], departures.farewell1, australiaVisa, officeGuide, japanVisas[7], departures.airport2, departures.farewell2]
