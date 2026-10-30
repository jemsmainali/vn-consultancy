import { destinations } from '../registry'
import australia from './australia'
import unitedStates from './united-states'
import unitedKingdom from './united-kingdom'
import canada from './canada'
import newZealand from './new-zealand'
import germany from './germany'
import ireland from './ireland'
import france from './france'
import japan from './japan'
import southKorea from './south-korea'

const content = [australia, unitedStates, unitedKingdom, canada, newZealand, germany, ireland, france, japan, southKorea]
const bySlug = Object.fromEntries(content.map((item) => [item.slug, item]))

// Registry entry (name, flag, image) merged with the full researched content.
export const countryProfiles = destinations.map((item) => ({ ...item, ...bySlug[item.slug], cardIntro: item.intro }))
export const countryProfile = (slug) => countryProfiles.find((item) => item.slug === slug)
