import { useState } from 'react'
import { siteContentReady } from '../../data/siteContent'
import { siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

const complete = (story) => story.permitted === true && [story.name, story.university, story.country, story.quote, story.photo?.src, story.photo?.alt].every(siteContentReady)

function StoryCard({ story }) {
  const [available, setAvailable] = useState(true)
  if (!available) return null
  return <article className="story-data-card">
    <img src={story.photo.src} alt={story.photo.alt} loading="lazy" onError={() => setAvailable(false)} />
    <blockquote>{story.quote}</blockquote>
    <h3>{story.name}</h3><p>{story.university} · {story.country}</p>
  </article>
}

export default function SuccessStories() {
  const stories = siteContent.home.successStories.filter(complete)
  if (!stories.length) return null
  return <section id="stories" className="data-section stories-data-section">
    <div className="data-container"><SectionHeading eyebrow="Student stories" title="Success stories" />
      <div className="story-data-grid">{stories.map((story) => <StoryCard key={story.name} story={story} />)}</div>
    </div>
  </section>
}
