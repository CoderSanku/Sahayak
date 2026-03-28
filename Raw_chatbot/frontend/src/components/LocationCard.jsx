// src/components/LocationCard.jsx
// Renders office location from GET /location/nearest-office response
// Response shape: { office_id, taluka, village, address, incharge, contact, map:{url} }
// or { message: "not found" }

export default function LocationCard({ data }) {
  if (!data) return null;

  // Backend might return a plain message string when not found
  if (data.message && !data.office_id) {
    return <div className="bubble bot">📍 {data.message}</div>;
  }

  return (
    <div className="loc-card">
      <div className="loc-row">
        <span className="loc-icon">📍</span>
        <span className="loc-label">Taluka</span>
        <span className="loc-value">{data.taluka || "N/A"}</span>
      </div>
      <div className="loc-row">
        <span className="loc-icon">🏡</span>
        <span className="loc-label">Village</span>
        <span className="loc-value">{data.village || "N/A"}</span>
      </div>
      <div className="loc-row">
        <span className="loc-icon">📌</span>
        <span className="loc-label">Address</span>
        <span className="loc-value">{data.address || "N/A"}</span>
      </div>
      <div className="loc-row">
        <span className="loc-icon">👤</span>
        <span className="loc-label">Incharge</span>
        <span className="loc-value">{data.incharge || "N/A"}</span>
      </div>
      <div className="loc-row">
        <span className="loc-icon">📞</span>
        <span className="loc-label">Contact</span>
        <span className="loc-value">{data.contact || "N/A"}</span>
      </div>
      {data.map?.url && (
        <div style={{ marginTop: 10 }}>
          <a className="map-btn" href={data.map.url} target="_blank" rel="noreferrer">
            🗺️ Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}