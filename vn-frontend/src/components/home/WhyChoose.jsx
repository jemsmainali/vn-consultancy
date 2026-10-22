import { siteContent } from '../../data/siteContent'
import SectionHeading from './SectionHeading'

function CredibilityIcon({ name }) {
  const shapes = {
    compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" /></>,
    conversation: <><path d="M4 5.5h16v10H11l-4.5 3v-3H4z" /><path d="M8 9h8m-8 3h5" /></>,
    document: <><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6m-6 3h6" /></>,
    shield: <><path d="M12 3.5 19 6v5.5c0 4.4-2.8 7.6-7 9-4.2-1.4-7-4.6-7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>
}

export default function WhyChoose() {
  return <section className="data-section home-why-section" aria-labelledby="why-choose-title">
    <div className="data-container">
      <SectionHeading eyebrow="Our approach" title="Why choose VN Group" id="why-choose-title" />
      <div className="home-why-grid">
        {siteContent.home.whyChoose.map((item) => <article className="home-why-card" key={item.title}>
          <span className="home-why-icon"><CredibilityIcon name={item.icon} /></span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>)}
      </div>
    </div>
  </section>
}

