import axios from "axios";

const BASE = "https://sahayak-backend-tcc1.onrender.com";

// ─── 1. Get certificate list from registry ───────────────────────────────────
// GET /chat/ does not return a list; we fetch the registry JSON directly via
// the static mount. Backend serves backend/data/registry at runtime, but there
// is no dedicated API for this. We call the /chat endpoint with the language
// so the backend's intent_classifier returns options list when input is generic.
// We instead expose the certificate index via a helper that calls /chat with a
// dummy generic message and collects the options array.
export async function fetchCertificateList(language = "en") {
  const res = await axios.post(`${BASE}/chat/`, {
    message: "list",
    session_state: { language },
  });
  // Backend returns { status:"clarification_required", options:[...] }
  if (res.data.options) return res.data.options; // array of display names
  return [];
}

// ─── 2. Get certificate details by name ──────────────────────────────────────
// POST /chat/   body: { message, session_state }
// Returns: { status:"success", data:{ certificate, documents }, sample, session_state }
//       or: { status:"clarification_required", options }
//       or: { status:"confirmation_required", message, suggested_certificate_name }
//       or: { status:"error", message }
export async function fetchCertificateInfo(certName, language = "en", sessionState = {}) {
  const res = await axios.post(`${BASE}/chat/`, {
    message: certName,
    // language must come LAST so it always overrides any stale value in sessionState
    session_state: { ...sessionState, language },
  });
  return res.data;
}

// ─── 3. Get nearest office ────────────────────────────────────────────────────
// GET /location/nearest-office?taluka=...&village=...
// Returns: { office_id, taluka, village, address, incharge, contact, map:{url} }
//       or: { message: "Not found" }
export async function fetchNearestOffice(taluka, village) {
  const res = await axios.get(`${BASE}/location/nearest-office`, {
    params: { taluka, village },
  });
  return res.data;
}

// ─── 4. Get sample certificate PDF path ──────────────────────────────────────
// GET /samples/sample-certificate?certificate=caste_certificate
// Returns: { success, sample:{ found, sample_pdf_url, certificate_name, disclaimer } }
export async function fetchSampleCertificate(certificateType) {
  const res = await axios.get(`${BASE}/samples/sample-certificate`, {
    params: { certificate: certificateType },
  });
  return res.data;
}

// ─── 5. Voice input ──────────────────────────────────────────────────────────
// POST /voice/voice-input   body: FormData with audio file
// Returns: { success, voice_input, language }
export async function sendVoiceInput(audioBlob) {
  const fd = new FormData();
  fd.append("audio", audioBlob, "voice.webm");
  const res = await axios.post(`${BASE}/voice/voice-input`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ─── 6. Guidance session: start ──────────────────────────────────────────────
// POST /guidance/start   body: { language }
// Returns: { session_id, message }
export async function startGuidanceSession(language) {
  const res = await axios.post(`${BASE}/guidance/start`, { language });
  return res.data;
}

// ─── 7. Guidance session: continue ───────────────────────────────────────────
// POST /guidance/continue   body: { session_id, user_input }
// Returns: { status, decision, is_complete, session_snapshot }
export async function continueGuidanceSession(sessionId, userInput) {
  const res = await axios.post(`${BASE}/guidance/continue`, {
    session_id: sessionId,
    user_input: userInput,
  });
  return res.data;
}

// ─── 8. Nearest office by GPS coordinates (Approach B — Haversine distance) ──
// GET /location/nearest-office-by-coords?lat=...&lon=...
// Returns nearest office by straight-line distance using Haversine formula
// Requires add_coordinates.py to have been run first
export async function fetchNearestOfficeByCoords(lat, lon) {
  const res = await axios.get(`${BASE}/location/nearest-office-by-coords`, {
    params: { lat, lon },
  });
  return res.data;
}

// ─── 9. Reverse geocode for display name only ────────────────────────────────
// GET /location/reverse-geocode?lat=...&lon=...
// Returns human-readable area name for display (e.g. "Borivali East")
export async function reverseGeocode(lat, lon) {
  const res = await axios.get(`${BASE}/location/reverse-geocode`, {
    params: { lat, lon },
  });
  return res.data;
}

// ─── Helper: full PDF URL ────────────────────────────────────────────────────
export function pdfUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE}${path}`;
}