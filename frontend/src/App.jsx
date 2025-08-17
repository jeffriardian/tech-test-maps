import { useState, useEffect, useRef } from 'react'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [places, setPlaces] = useState([])
  const [embedQ, setEmbedQ] = useState('')
  const [warning, setWarning] = useState('')
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  const clientKey = import.meta.env.VITE_GOOGLE_MAPS_CLIENT_KEY

  // Load Google Maps JS API
  useEffect(() => {
    if (!clientKey) return

    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${clientKey}`
      script.async = true
      script.onload = () => console.log('Google Maps API loaded')
      document.head.appendChild(script)
    }
  }, [clientKey])

  // Render map + markers
  useEffect(() => {
    if (!window.google || !embedQ) return

    const center = places[0]
      ? { lat: places[0].lat, lng: places[0].lng }
      : { lat: -6.2, lng: 106.8 }

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
    })

    places.forEach(p => {
      if (p.lat && p.lng) {
        new window.google.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map: mapInstance.current,
          title: p.name,
        })
      }
    })
  }, [places, embedQ])

  async function submit(e) {
    e.preventDefault()
    setWarning('')
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (data.warning) setWarning(data.warning)
    setPlaces(data.places || [])
    setEmbedQ(data.embed_q || '')
  }

  return (
    <div className="container">
      <h1>Local LLM → Google Maps (demo)</h1>
      <form onSubmit={submit}>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. sushi near central Jakarta"
          className="input"
        />
        <button className="btn">Search</button>
      </form>

      {warning && <div className="warn">{warning}</div>}

      <div className="mapWrap">
        <h3>Map</h3>
        <div
          ref={mapRef}
          style={{ width: '100%', height: '450px', border: 0 }}
        />
      </div>

      <div className="results">
        <h3>Results</h3>
        <ul>
          {places.map(p => (
            <li key={p.place_id || p.name}>
              <b>{p.name}</b> — {p.address || 'n/a'} — rating: {p.rating || 'n/a'}{' '}
              {p.place_id && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}&query_place_id=${p.place_id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
