import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VisitorSelect.css";

export default function VisitorSelect() {
  const navigate = useNavigate();

  const stateName = "Kerala";

  // ✅ Kerala districts + major towns (frontend-only)
  const data = useMemo(
    () => ({
      Alappuzha: ["Alappuzha", "Cherthala", "Kayamkulam", "Chengannur", "Mavelikkara", "Ambalapuzha", "Haripad"],
      Ernakulam: ["Kochi", "Fort Kochi", "Kakkanad", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha", "Kothamangalam", "Tripunithura"],
      Idukki: ["Thodupuzha", "Munnar", "Kattappana", "Adimali", "Nedumkandam", "Kumily"],
      Kannur: ["Kannur", "Thalassery", "Payyanur", "Taliparamba", "Mattannur", "Iritty"],
      Kasaragod: ["Kasaragod", "Kanhangad", "Bekal", "Nileshwaram", "Cheruvathur"],
      Kollam: ["Kollam", "Paravoor", "Punalur", "Karunagappally", "Kottarakkara", "Chavara"],
      Kottayam: ["Kottayam", "Changanassery", "Pala", "Vaikom", "Ettumanoor", "Kanjirappally"],
      Kozhikode: ["Kozhikode", "Vadakara", "Koyilandy", "Beypore", "Thamarassery", "Ramanattukara"],

      // ✅ Malappuram includes Kuttippuram
      Malappuram: [
        "Malappuram", "Manjeri", "Perinthalmanna", "Tirur", "Ponnani", "Kottakkal",
        "Nilambur", "Kondotty", "Tanur", "Tirurangadi", "Parappanangadi",
        "Valanchery", "Kuttippuram", "Edappal", "Vengara"
      ],

      Palakkad: ["Palakkad", "Ottappalam", "Shoranur", "Chittur", "Mannarkkad", "Pattambi", "Cherpulassery"],
      Pathanamthitta: ["Pathanamthitta", "Thiruvalla", "Adoor", "Konni", "Ranni", "Pandalam"],
      Thiruvananthapuram: ["Thiruvananthapuram", "Kovalam", "Varkala", "Attingal", "Neyyattinkara", "Nedumangad"],
      Thrissur: ["Thrissur", "Guruvayur", "Chalakudy", "Kodungallur", "Irinjalakuda", "Kunnamkulam", "Wadakkanchery"],
      Wayanad: ["Kalpetta", "Sultan Bathery", "Mananthavady", "Vythiri", "Meppadi"],
    }),
    []
  );

  const districts = Object.keys(data).sort();
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const towns = district ? data[district] : [];

  const slug = (s) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  // ✅ ROBUST Current Location Detection
  const handleCurrentLocation = () => {
    setLocating(true);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const apiData = await response.json();
          console.log("📍 API Response:", apiData);

          const address = apiData.address;
          if (address) {
            // Extract and normalize district name
            let rawDistrict = address.state_district || address.district || "";
            const detectedDistrict = rawDistrict.replace(/ district/gi, "").trim();

            console.log("📍 Detected District:", detectedDistrict, "(Raw:", rawDistrict + ")");

            // Extract town name
            const detectedTown =
              address.city ||
              address.town ||
              address.village ||
              address.suburb ||
              address.residential ||
              "";

            // Find matching district (case-insensitive)
            const distKey = Object.keys(data).find(
              (k) => k.toLowerCase() === detectedDistrict.toLowerCase()
            );

            if (distKey) {
              setDistrict(distKey);

              // Find matching town (fuzzy match)
              const townList = data[distKey] || [];
              const townMatch = townList.find(
                (t) =>
                  detectedTown.toLowerCase().includes(t.toLowerCase()) ||
                  t.toLowerCase().includes(detectedTown.toLowerCase())
              );

              if (townMatch) {
                setTown(townMatch);
                setErrorMsg(`✅ Located: ${townMatch}, ${distKey}`);
              } else {
                setErrorMsg(
                  `📍 You are in ${distKey} (near ${detectedTown}). Please select exact town.`
                );
              }
            } else {
              setErrorMsg(
                `District '${detectedDistrict}' not found. (Raw: ${rawDistrict}). Are you in Kerala?`
              );
            }
          } else {
            setErrorMsg("Could not determine address from coordinates.");
          }
        } catch (err) {
          console.error("Location error:", err);
          setErrorMsg("Network error fetching location.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorMsg("Location access denied or failed.");
        setLocating(false);
      }
    );
  };

  const handleContinue = () => {
    if (!district || !town) return;

    // ✅ Custom poster page for Kuttippuram
    if (district === "Malappuram" && town === "Kuttippuram") {
      navigate("/ktpm");
      return;
    }

    // ✅ Normal town website route
    const townSlug = slug(town);
    navigate(`/town/${townSlug}`);
  };

  return (
    <div className="vs-bg">
      {/* Modern background blobs */}
      <div className="vs-blob vs-blob-1" />
      <div className="vs-blob vs-blob-2" />
      <div className="vs-blob vs-blob-3" />

      <div className="vs-wrap">
        <div className="vs-card">
          <div className="vs-badge">Visitor</div>

          <h2 className="vs-title">Where are you visiting?</h2>
          <p className="vs-sub">Select a district, then choose a town.</p>

          {/* ✅ State */}
          <label className="vs-label">State</label>
          <input className="vs-select" value={stateName} disabled />

          {/* District dropdown */}
          <label className="vs-label">District</label>
          <select
            className="vs-select"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setTown("");
            }}
          >
            <option value="">Choose district</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Town dropdown */}
          <label className="vs-label">Town</label>
          <select
            className="vs-select"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            disabled={!district}
          >
            <option value="">{district ? "Choose town" : "Select district first"}</option>
            {towns.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Location Error Message */}
          {errorMsg && <p className="vs-error" style={{ color: "red", fontSize: "0.9rem", marginTop: "5px" }}>{errorMsg}</p>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              className="vs-btn secondary"
              onClick={handleCurrentLocation}
              disabled={locating}
              style={{ background: '#f0f0f0', color: '#333', flex: 1 }}
            >
              {locating ? "Locating..." : "📍 Detect Location"}
            </button>

            <button className="vs-btn" onClick={handleContinue} disabled={!district || !town} style={{ flex: 1 }}>
              Continue →
            </button>
          </div>

          <p className="vs-foot">Kuttippuram opens your poster page. Others open `/town/:townSlug`.</p>
        </div>
      </div>
    </div>
  );
}
