// src/components/ChatBox.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import Message from "./Message";
import InputBar from "./InputBar";
import PdfModal from "./PdfModal";
import ComplaintPanel from "./ComplaintPanel";
import FaqPanel from "./FaqPanel";
import StatusPanel from "./StatusPanel";
import ComplaintStatusPanel from "./ComplaintStatusPanel";
import {
  fetchCertificateList,
  fetchCertificateInfo,
  fetchNearestOffice,
  fetchNearestOfficeByCoords,
} from "../api";

const UI = {
  en: {
    welcome: "Welcome to Sahayak! 🙏\nI help you with government certificates and office locations in Maharashtra.",
    chooseLang: "Please choose your language:",
    chooseService: "What would you like help with?",
    chooseCert: "Select the certificate you need:",
    enterTaluka: "Please type your Taluka name:",
    locationAsk: "How would you like to find the nearest office?",
    gpsLocating: "📡 Getting your location...",
    gpsSuccess: "📍 Location detected! Searching for nearest office...",
    gpsFailed: "Could not get your location. Please type your Taluka manually.",
    gpsPermissionDenied: "Location permission denied. Please type your Taluka name:",
    enterVillage: "Now type your Village name:",
    locationFound: "📍 Nearest Tehsildar Office:",
    locationNotFound: "Office not found. Please check the taluka / village name and try again.",
    loadingCerts: "⏳ Fetching certificate list...",
    loadingInfo: "⏳ Fetching certificate info...",
    loadingOffice: "⏳ Searching for nearest office...",
    serverError: "⚠️ Server error. Make sure the backend is running at localhost:8000.",
    placeholder: "Type a message...",
  },
  hi: {
    welcome: "सहायक में आपका स्वागत है! 🙏\nमैं महाराष्ट्र में सरकारी प्रमाण पत्र और कार्यालय स्थान में मदद करता हूँ।",
    chooseLang: "कृपया अपनी भाषा चुनें:",
    chooseService: "आप किसमें मदद चाहते हैं?",
    chooseCert: "कृपया प्रमाण पत्र चुनें:",
    enterTaluka: "कृपया अपना तालुका दर्ज करें:",
    locationAsk: "निकटतम कार्यालय कैसे खोजें?",
    gpsLocating: "📡 आपका स्थान प्राप्त हो रहा है...",
    gpsSuccess: "📍 स्थान मिला! निकटतम कार्यालय खोज रहे हैं...",
    gpsFailed: "स्थान प्राप्त नहीं हो सका। कृपया तालुका मैन्युअल दर्ज करें।",
    gpsPermissionDenied: "स्थान अनुमति नहीं मिली। कृपया तालुका नाम दर्ज करें:",
    enterVillage: "अब अपना गाँव का नाम दर्ज करें:",
    locationFound: "📍 निकटतम तहसीलदार कार्यालय:",
    locationNotFound: "कार्यालय नहीं मिला। तालुका/गाँव का नाम जाँचें।",
    loadingCerts: "⏳ प्रमाण पत्र सूची लोड हो रही है...",
    loadingInfo: "⏳ जानकारी प्राप्त हो रही है...",
    loadingOffice: "⏳ निकटतम कार्यालय खोज रहे हैं...",
    serverError: "⚠️ सर्वर त्रुटि। बैकएंड चल रहा है या नहीं जाँचें।",
    placeholder: "संदेश लिखें...",
  },
  mr: {
    welcome: "सहायकमध्ये आपले स्वागत आहे! 🙏\nमहाराष्ट्रातील शासकीय प्रमाणपत्रे आणि कार्यालय स्थानासाठी मी मदत करतो.",
    chooseLang: "कृपया आपली भाषा निवडा:",
    chooseService: "आपल्याला कशात मदत हवी आहे?",
    chooseCert: "कृपया प्रमाणपत्र निवडा:",
    enterTaluka: "कृपया आपला तालुका प्रविष्ट करा:",
    locationAsk: "जवळचे कार्यालय कसे शोधायचे?",
    gpsLocating: "📡 तुमचे स्थान मिळवत आहे...",
    gpsSuccess: "📍 स्थान सापडले! जवळचे कार्यालय शोधत आहे...",
    gpsFailed: "स्थान मिळवता आले नाही. कृपया तालुका मॅन्युअली प्रविष्ट करा.",
    gpsPermissionDenied: "स्थान परवानगी नाकारली. कृपया तालुका नाव प्रविष्ट करा:",
    enterVillage: "आता आपले गाव नाव प्रविष्ट करा:",
    locationFound: "📍 जवळचे तहसीलदार कार्यालय:",
    locationNotFound: "कार्यालय सापडले नाही. तालुका/गाव नाव तपासा.",
    loadingCerts: "⏳ प्रमाणपत्र यादी लोड होत आहे...",
    loadingInfo: "⏳ माहिती मिळवत आहे...",
    loadingOffice: "⏳ जवळचे कार्यालय शोधत आहे...",
    serverError: "⚠️ सर्व्हर त्रुटी. बॅकएंड सुरू आहे का ते तपासा.",
    placeholder: "संदेश टाइप करा...",
  },
};

let _id = 0;
const nid = () => ++_id;

export default function ChatBox() {
  const [messages, setMessages]      = useState([]);
  const [lang, setLang]              = useState(null);
  const [mode, setMode]              = useState("lang");      // lang|home|cert|cert_detail|location
  const [locationStep, setLocStep]   = useState("taluka");
  const [talukaVal, setTalukaVal]    = useState("");
  const [certList, setCertList]      = useState([]);
  const [sessionState, setSessState] = useState({});
  const [isTyping, setTyping]        = useState(false);
  const [pdfUrl, setPdfUrl]          = useState(null);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [faqOpen, setFaqOpen]             = useState(false);
  const [statusOpen, setStatusOpen]                 = useState(false);
  const [complaintStatusOpen, setComplaintStatusOpen] = useState(false);
  const bodyRef   = useRef(null);
  const initDone  = useRef(false);   // ← prevents StrictMode double-fire

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping]);

  const t = UI[lang] || UI.en;

  const addMsg = useCallback((msg) => {
    setMessages((prev) => [...prev, { _id: nid(), ...msg }]);
  }, []);

  const botDelay = (ms = 650) =>
    new Promise((r) => { setTyping(true); setTimeout(() => { setTyping(false); r(); }, ms); });

  // ── INIT — runs once only ──────────────────────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    addMsg({
      from: "bot", type: "text",
      text: "Welcome to Sahayak! 🙏\nI help with government certificates and office locations in Maharashtra.",
    });
    setTimeout(() => {
      addMsg({
        from: "bot", type: "lang_select",
        text: "Please choose your language / कृपया भाषा निवडा / कृपया भाषा चुनें:",
      });
    }, 400);
  }, []); // eslint-disable-line

  // ── LANGUAGE ───────────────────────────────────────────────────────────────
  async function handleSelectLang(l) {
    setLang(l);
    const names = { en: "English", hi: "हिंदी", mr: "मराठी" };
    addMsg({ from: "user", type: "text", text: names[l] });
    await botDelay(500);
    const ui = UI[l];
    addMsg({ from: "bot", type: "text", text: ui.welcome });
    setTimeout(() => {
      addMsg({ from: "bot", type: "home_menu", text: ui.chooseService });
      setMode("home");
    }, 300);
  }

  // ── HOME MENU ──────────────────────────────────────────────────────────────
  async function handleSelectService(service, silent = false) {
    if (service === "cert") {
      if (!silent) addMsg({ from: "user", type: "text", text: "📜 Certificates" });
      setMode("cert");
      await botDelay(500);

      // Remove any previous loading msg
      const loadKey = (UI[lang] || UI.en).loadingCerts;
      addMsg({ from: "bot", type: "text", text: loadKey });

      try {
        const list = await fetchCertificateList(lang || "en");
        setMessages((prev) => prev.filter((m) => m.text !== loadKey));

        if (list.length > 0) {
          // Build cert objects — display name is what backend returns (plain string)
          // We use it both for display and as the message sent to /chat
          const certs = list.map((name) => ({
            certificate_id: name,
            display_name: { en: name, hi: name, mr: name },
          }));
          setCertList(certs);
          addMsg({ from: "bot", type: "cert_list", text: t.chooseCert, certs });
        } else {
          addMsg({ from: "bot", type: "text", text: "Could not load list. Please type the certificate name directly.", isError: true });
          setMode("home");
          setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 400);
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.text !== loadKey));
        addMsg({ from: "bot", type: "text", text: t.serverError, isError: true });
        setMode("home");
        setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 400);
      }
    } else if (service === "status") {
      if (!silent) addMsg({ from: "user", type: "text", text: "📋 Check Application Status" });
      await botDelay(300);
      addMsg({ from: "bot", type: "text", text: lang === "mr" ? "स्थिती तपासणी पॅनेल उघडत आहे..." : lang === "hi" ? "स्थिति पैनल खुल रहा है..." : "Opening status checker..." });
      setStatusOpen(true);
    } else if (service === "faq") {
      if (!silent) addMsg({ from: "user", type: "text", text: "❓ FAQs" });
      await botDelay(300);
      addMsg({ from: "bot", type: "text", text: lang === "mr" ? "FAQ पॅनेल उघडत आहे..." : lang === "hi" ? "FAQ पैनल खुल रहा है..." : "Opening FAQ panel..." });
      setFaqOpen(true);
    } else if (service === "complaint") {
      if (!silent) addMsg({ from: "user", type: "text", text: "📝 File a Complaint" });
      await botDelay(400);
      addMsg({ from: "bot", type: "text", text: lang === "mr" ? "तक्रार पॅनेल उघडत आहे..." : lang === "hi" ? "शिकायत पैनल खुल रहा है..." : "Opening complaint panel..." });
      setComplaintOpen(true);
    } else {
      if (!silent) addMsg({ from: "user", type: "text", text: "📍 Nearest Office" });
      setMode("location");
      setLocStep("taluka");
      setTalukaVal("");
      await botDelay(400);
      addMsg({ from: "bot", type: "location_ask", text: t.locationAsk });
    }
  }

  // ── CERTIFICATE DETAIL ─────────────────────────────────────────────────────
  async function handleSelectCert(cert) {
    const displayName = cert.display_name[lang || "en"] || cert.display_name.en;
    addMsg({ from: "user", type: "text", text: displayName });
    setMode("cert_detail");

    const loadKey = t.loadingInfo;
    setTyping(true);

    try {
      const res = await fetchCertificateInfo(displayName, lang || "en", sessionState);
      setTyping(false);

      if (res.session_state) setSessState(res.session_state);

      if (res.status === "success" && res.data) {
        addMsg({ from: "bot", type: "cert_detail", data: res.data, sample: res.sample || null });
      } else if (res.status === "clarification_required") {
        // Backend unsure — show options as clickable buttons
        addMsg({ from: "bot", type: "options", text: res.message, options: res.options });
        setMode("cert"); // stay in cert mode so option click works
      } else if (res.status === "confirmation_required") {
        addMsg({
          from: "bot", type: "options",
          text: res.message,
          options: [res.suggested_certificate_name, "Show me all certificates"],
        });
        setMode("cert");
      } else {
        addMsg({ from: "bot", type: "text", text: res.message || t.serverError, isError: true });
        setMode("home");
        setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 400);
      }
    } catch {
      setTyping(false);
      addMsg({ from: "bot", type: "text", text: t.serverError, isError: true });
      setMode("home");
      setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 400);
    }
  }

  // ── GPS LOCATION (Approach B — Haversine distance) ───────────────────────
  async function handleGpsLocation() {
    addMsg({ from: "user", type: "text", text: "📍 Use My Current Location" });
    addMsg({ from: "bot", type: "text", text: t.gpsLocating });

    if (!navigator.geolocation) {
      setMessages((prev) => prev.filter((m) => m.text !== t.gpsLocating));
      addMsg({ from: "bot", type: "text", text: t.gpsFailed, isError: true });
      addMsg({ from: "bot", type: "text", text: t.enterTaluka });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setMessages((prev) => prev.map((m) =>
          m.text === t.gpsLocating ? { ...m, text: t.gpsSuccess } : m
        ));

        try {
          // Approach B: send GPS coords to backend — Haversine finds nearest office
          const data = await fetchNearestOfficeByCoords(latitude, longitude);

          if (data.error || data.message || (!data.office_id && !data.address)) {
            setMessages((prev) => prev.map((m) =>
              m.text === t.gpsSuccess ? { ...m, text: t.gpsFailed, isError: true } : m
            ));
            addMsg({ from: "bot", type: "text", text: t.enterTaluka });
            setLocStep("taluka");
            return;
          }

          const distText = data.distance_km ? ` (${data.distance_km} km away)` : "";
          addMsg({ from: "bot", type: "text", text: t.locationFound + distText });
          addMsg({ from: "bot", type: "location_card", data });
          setLocStep("taluka");
          setTalukaVal("");
          setMode("home");
          setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 500);

        } catch {
          setMessages((prev) => prev.map((m) =>
            m.text === t.gpsSuccess ? { ...m, text: t.serverError, isError: true } : m
          ));
          setLocStep("taluka");
          setTalukaVal("");
          setMode("home");
          setTimeout(() => addMsg({ from: "bot", type: "home_menu", text: t.chooseService }), 400);
        }
      },
      (error) => {
        setMessages((prev) => prev.filter((m) => m.text !== t.gpsLocating));
        if (error.code === error.PERMISSION_DENIED) {
          addMsg({ from: "bot", type: "text", text: t.gpsPermissionDenied, isError: true });
        } else {
          addMsg({ from: "bot", type: "text", text: t.gpsFailed, isError: true });
          addMsg({ from: "bot", type: "text", text: t.enterTaluka });
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  // ── LOCATION INPUT ─────────────────────────────────────────────────────────
  async function handleLocationInput(text) {
    addMsg({ from: "user", type: "text", text });

    if (locationStep === "taluka") {
      setTalukaVal(text);
      setLocStep("village");
      await botDelay(400);
      addMsg({ from: "bot", type: "text", text: t.enterVillage });
    } else {
      setTyping(true);
      try {
        const data = await fetchNearestOffice(talukaVal, text);
        setTyping(false);
        if (data.error || (!data.office_id && !data.taluka && !data.address)) {
          // Error — show message then go back to main menu
          addMsg({ from: "bot", type: "text", text: data.message || t.locationNotFound, isError: true });
          setLocStep("taluka");
          setTalukaVal("");
          setMode("home");
          setTimeout(() => {
            addMsg({ from: "bot", type: "home_menu", text: t.chooseService });
          }, 400);
        } else {
          addMsg({ from: "bot", type: "text", text: t.locationFound });
          addMsg({ from: "bot", type: "location_card", data });
          setLocStep("taluka");
          setTalukaVal("");
          setMode("home");
        }
      } catch {
        setTyping(false);
        addMsg({ from: "bot", type: "text", text: t.serverError, isError: true });
        setLocStep("taluka");
        setTalukaVal("");
        setMode("home");
        setTimeout(() => {
          addMsg({ from: "bot", type: "home_menu", text: t.chooseService });
        }, 400);
      }
    }
  }

  // ── OPTION CLICK (clarification/confirmation) ─────────────────────────────
  async function handleOptionClick(opt) {
    if (opt === "Show me all certificates") {
      handleSelectService("cert", true);
      return;
    }
    // Manual location fallback from location_ask buttons
    if (opt === "__manual_location__") {
      addMsg({ from: "user", type: "text",
        text: lang === "mr" ? "✏️ मॅन्युअली प्रविष्ट करा" : lang === "hi" ? "✏️ मैन्युअल दर्ज करें" : "✏️ Type Manually" });
      addMsg({ from: "bot", type: "text", text: t.enterTaluka });
      return;
    }
    await handleSelectCert({
      certificate_id: opt,
      display_name: { en: opt, hi: opt, mr: opt },
    });
  }

  // ── FREE TEXT TYPED BY USER ────────────────────────────────────────────────
  async function handleSend(text) {
    // Location flow — just collect taluka then village
    if (mode === "location") {
      await handleLocationInput(text);
      return;
    }

    // Already in cert detail — treat new text as new cert search
    if (mode === "cert" || mode === "cert_detail") {
      await handleSelectCert({
        certificate_id: text,
        display_name: { en: text, hi: text, mr: text },
      });
      return;
    }

    // Home mode — smart routing from text
    if (mode === "home") {
      const lower = text.toLowerCase();
      const certKeywords      = ["certif","प्रमाण","प्रमाणपत्र","certificate","दाखला","प्रमाणपत्रे"];
      const locKeywords       = ["office","location","taluka","tehsil","कार्यालय","तालुका","तहसील"];
      const complaintKeywords       = ["complaint","grievance","complain","शिकायत","तक्रार"];
      const faqKeywords              = ["faq","help","how to","question","सहायता","मदत","प्रश्न"];
      const statusKeywords           = ["status","track","application id","app-","स्थिति","स्थिती","आवेदन स्थिति"];
      const complaintStatusKeywords  = ["complaint status","cmp-","complaint id","track complaint","शिकायत स्थिति","शिकायत स्थिती","तक्रार स्थिती"];

      if (faqKeywords.some((k) => lower.includes(k))) {
        await handleSelectService("faq", true);
      } else if (complaintStatusKeywords.some((k) => lower.includes(k))) {
        addMsg({ from: "user", type: "text", text });
        await botDelay(400);
        setComplaintStatusOpen(true);
      } else if (complaintKeywords.some((k) => lower.includes(k))) {
        await handleSelectService("complaint", true);
      } else if (statusKeywords.some((k) => lower.includes(k))) {
        await handleSelectService("status", true);
      } else if (certKeywords.some((k) => lower.includes(k))) {
        await handleSelectService("cert", true);
      } else if (locKeywords.some((k) => lower.includes(k))) {
        await handleSelectService("location", true);
      } else {
        // Unknown text in home mode — ask user what they want instead of guessing
        addMsg({ from: "user", type: "text", text });
        await botDelay(400);
        addMsg({ from: "bot", type: "text",
          text: lang === "mr"
            ? "तुम्हाला काय हवे आहे ते निवडा:"
            : lang === "hi"
            ? "कृपया एक विकल्प चुनें:"
            : "Please choose what you need:" });
        addMsg({ from: "bot", type: "home_menu", text: t.chooseService });
      }
      return;
    }

    // Fallback for lang mode (shouldn't happen — input is disabled)
    addMsg({ from: "user", type: "text", text });
  }

  // ── BACK NAVIGATION ────────────────────────────────────────────────────────
  function handleBack(target) {
    setSessState({});
    if (target === "home") {
      setMode("home");
      addMsg({ from: "bot", type: "home_menu", text: t.chooseService });
    } else if (target === "cert") {
      setMode("cert");
      if (certList.length > 0) {
        addMsg({ from: "bot", type: "cert_list", text: t.chooseCert, certs: certList });
      } else {
        handleSelectService("cert", true);
      }
    }
  }

  // ── INPUT PLACEHOLDER ──────────────────────────────────────────────────────
  const placeholder = () => {
    if (mode === "lang") return "Choose language above...";
    if (mode === "location" && locationStep === "taluka")
      return lang === "mr" ? "तालुका प्रविष्ट करा..." : lang === "hi" ? "तालुका दर्ज करें..." : "Enter taluka name...";
    if (mode === "location" && locationStep === "village")
      return lang === "mr" ? "गाव नाव प्रविष्ट करा..." : lang === "hi" ? "गाँव का नाम दर्ज करें..." : "Enter village name...";
    if (mode === "cert" || mode === "cert_detail")
      return lang === "mr" ? "प्रमाणपत्राचे नाव टाइप करा..." : lang === "hi" ? "प्रमाण पत्र का नाम टाइप करें..." : "Type certificate name or choose above...";
    return t.placeholder;
  };

  const handlers = {
    onSelectLang:    handleSelectLang,
    onGpsLocation:   handleGpsLocation,
    onSelectService: handleSelectService,
    onSelectCert:    handleSelectCert,
    onBack:          handleBack,
    onOptionClick:   handleOptionClick,
    onViewPdf:       setPdfUrl,
    onOpenComplaint:       () => setComplaintOpen(true),
    onOpenStatus:          () => setStatusOpen(true),
    onOpenComplaintStatus: () => setComplaintStatusOpen(true),
  };

  function returnToHome() {
    setMode("home");
    const ui = UI[lang] || UI.en;
    addMsg({ from: "bot", type: "home_menu", text: ui.chooseService });
  }

  return (
    <>
      <div className="chat-shell">
        <div className="chat-header">
          <div className="header-avatar">🏛️</div>
          <div className="header-info">
            <div className="header-title">Sahayak · सहायक</div>
            <div className="header-sub">
              <span className="status-dot" />
              Maharashtra Certificate Guidance
            </div>
          </div>
          {/* FAQ icon button — top right of header */}
          <button
            onClick={() => setFaqOpen(true)}
            title="FAQs / Help"
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.35)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.18s, border-color 0.18s, transform 0.18s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              e.currentTarget.style.borderColor = "#fff";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.15)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            ?
          </button>
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.map((msg) => (
            <Message key={msg._id} msg={msg} handlers={handlers} lang={lang || "en"} />
          ))}
          {isTyping && (
            <div className="msg-row bot">
              <div className="bot-avatar-sm">🤖</div>
              <div className="typing-dots"><span /><span /><span /></div>
            </div>
          )}
        </div>

        <InputBar
          onSend={handleSend}
          disabled={mode === "lang"}
          placeholder={placeholder()}
        />
      </div>

      {pdfUrl && <PdfModal url={pdfUrl} onClose={() => setPdfUrl(null)} />}
      <ComplaintPanel
        open={complaintOpen}
        onClose={() => { setComplaintOpen(false); returnToHome(); }}
        lang={lang || "en"}
      />
      <FaqPanel
        open={faqOpen}
        onClose={() => setFaqOpen(false)}
        lang={lang || "en"}
      />
      <StatusPanel
        open={statusOpen}
        onClose={() => { setStatusOpen(false); returnToHome(); }}
        lang={lang || "en"}
      />
      <ComplaintStatusPanel
        open={complaintStatusOpen}
        onClose={() => { setComplaintStatusOpen(false); returnToHome(); }}
        lang={lang || "en"}
      />
    </>
  );
}