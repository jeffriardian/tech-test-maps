import { useState, useEffect, useRef } from 'react'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [places, setPlaces] = useState([])
  const [embedQ, setEmbedQ] = useState('')
  const [warning, setWarning] = useState('')
  const [loading, setLoading] = useState(false)
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
    setLoading(true)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (data.warning) setWarning(data.warning)
      setPlaces(data.places || [])
      setEmbedQ(data.embed_q || '')
    } catch (err) {
      setWarning('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1 className="title">Local LLM → Google Maps</h1>
      <form onSubmit={submit} className="searchBar">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. sushi near central Jakarta"
          className="input"
        />
        <button className="btn" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {warning && <div className="warn">{warning}</div>}

      <div className="mapSection">
        <div ref={mapRef} className="mapBox" />
      </div>

      <div className="results">
        <h3>Results</h3>
        {places.length === 0 && !loading && <p>No results yet</p>}
        <div className="resultsGrid">
          {places.map(p => (
            <div key={p.place_id || p.name} className="resultCard">
              <div className="resultTitle">{p.name}</div>
              <div className="resultInfo">{p.address || 'n/a'}</div>
              <div className="resultRating">Rating: {p.rating || 'n/a'}</div>
              {p.place_id && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    p.name
                  )}&query_place_id=${p.place_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mapLink"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
