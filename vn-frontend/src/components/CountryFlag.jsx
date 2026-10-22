const knownCodes = new Set(['au', 'ca', 'gb', 'us', 'de', 'fr', 'ie', 'jp'])

export default function CountryFlag({ code, name, size = 24 }) {
  const normalizedCode = typeof code === 'string' ? code.toLowerCase() : ''
  const width = Math.round(size * 4 / 3)
  const style = { width: `${width}px`, height: `${size}px` }

  if (knownCodes.has(normalizedCode)) {
    return <img className="country-flag" src={`/images/flags/${normalizedCode}.svg`} alt={name ? `${name} flag` : ''} role="img" style={style} width={width} height={size} />
  }

  return <span className="country-flag country-flag-fallback" role="img" aria-label={name ? `${name} location` : 'Country'} style={style}>
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  </span>
}
