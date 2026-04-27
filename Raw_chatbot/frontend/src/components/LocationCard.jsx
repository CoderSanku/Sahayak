import { motion } from "framer-motion";
import {
  MapPin, Home, Navigation, User,
  Phone, Map, AlertCircle,
} from "lucide-react";

export default function LocationCard({ data }) {
  if (!data) return null;

  if (data.message && !data.office_id) {
    return (
      <div className="bubble bot" style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <AlertCircle style={{ width: 15, height: 15, color: "#f59e0b" }} />
        {data.message}
      </div>
    );
  }

  const rows = [
    { icon: MapPin, label: "Taluka", value: data.taluka },
    { icon: Home, label: "Village", value: data.village },
    { icon: Navigation, label: "Address", value: data.address },
    { icon: User, label: "Incharge", value: data.incharge },
    { icon: Phone, label: "Contact", value: data.contact },
  ];

  return (
    <motion.div
      className="loc-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="loc-row"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <span className="loc-icon">
            <row.icon style={{ width: 16, height: 16 }} />
          </span>
          <span className="loc-label">{row.label}</span>
          <span className="loc-value">{row.value || "N/A"}</span>
        </motion.div>
      ))}

      {data.map?.url && (
        <motion.div
          style={{ marginTop: 12 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <motion.a
            className="map-btn"
            href={data.map.url}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
          >
            <Map style={{ width: 14, height: 14 }} />
            Open in Google Maps
          </motion.a>
        </motion.div>
      )}
    </motion.div>
  );
}