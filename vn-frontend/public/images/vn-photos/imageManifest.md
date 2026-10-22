# VN Group image manifest (for Codex)

Copy the folders hero/, destinations/, about/, partners/, services/ into public/images/.
Each photo has WebP files at several widths (name-WIDTH.webp) plus one JPG fallback at the largest width.
Use srcSet with the WebP files. Do not upscale any image beyond its largest width.

hero/hero-main-{1200,800,480}.webp - Info session at Radisson Hotel, Kathmandu with Westcliff University and a large group of Nepali students. 4:3. Home hero image (right side). Use object-position: center 40%. loading=eager, fetchpriority=high.
destinations/australia-card-{720,480}.webp - Sydney Opera House, no people in focus. 16:9. Australia destination card background only. Largest width is 720, so show it at most ~360 CSS px wide on 2x screens.
services/counselling-session-{1200,800,480}.webp - Counsellor presenting to a room of students. 3:2. Use for the Counselling service card and the "Free Counselling" step in How It Works.
partners/partner-griffin-college-{960,800,480}.webp - Visit to Griffin College (Australia), college logo on the wall behind. 4:3. Partner visits gallery, not the logo row.
partners/partner-sahe-{1200,800,480}.webp - Visit to Southern Academy of Higher Education (SAHE), logo wall behind. 4:3. Partner visits gallery, not the logo row.
about/partner-meeting-{960,800,480}.webp - Round-table meeting with a partner delegation. 4:3. About Us page, "How we work with institutions".
about/events-wide-{1200,800,480}.webp - Selfie at a large education conference with a full hall behind. 16:9. About Us page or a wide band near the footer, "We attend global education fairs".

Alt text suggestions:
hero-main: "VN Group counsellors and students with a Westcliff University representative at an info session in Kathmandu"
australia-card: "Sydney Opera House, Australia"
counselling-session: "A VN Group counsellor speaking to a group of students"
partner-griffin-college: "VN Group representative visiting Griffin College"
partner-sahe: "VN Group representatives at Southern Academy of Higher Education"
partner-meeting: "VN Group team meeting with a partner delegation"
events-wide: "VN Group team attending an international education conference"

Rules: show a photo only if it is listed here. Hide the item if the file is missing. Never use photos that are not in this manifest.
