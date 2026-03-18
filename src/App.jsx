import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from "react";
import Papa from "papaparse";

// 🏠 HOME PAGE
function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ marginTop: 30 }}>

  <div style={{ marginBottom: 20 }}>
    <button onClick={() => navigate("/calculator")}>
      Ad Spend Calculator
    </button>
    <p style={{ fontSize: 12, color: "#999", marginTop: 5 }}>
      Old feature — coming soon
    </p>
  </div>

  <div style={{ marginBottom: 20 }}>
    <button onClick={() => navigate("/tracker")}>
      Campaign Tracker
    </button>
    <p style={{ fontSize: 12, color: "#999", marginTop: 5 }}>
      Old feature — coming soon
    </p>
  </div>

  <div>
    <button onClick={() => navigate("/translator")}>
      CSV Translator
    </button>
  </div>

</div>
  );
}

// 🧮 CALCULATOR PAGE
function Calculator() {
  return <h2 style={{ padding: 40 }}>Calculator coming...</h2>;
}

// 📊 TRACKER PAGE
function Tracker() {
  return <h2 style={{ padding: 40 }}>Tracker coming...</h2>;
}

// 🌍 TRANSLATOR PAGE
function Translator() {
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState(null);
  const [lang, setLang] = useState("Spanish");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [status, setStatus] = useState("");

  const languages = [
    "English",
    "Spanish",
    "Portuguese",
    "French",
    "German",
    "Italian",
    "Dutch",
    "Danish",
    "Swedish",
    "Norwegian",
    "Finnish",
    "Polish",
    "Czech",
    "Romanian",
    "Hungarian"
  ];

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const translate = async () => {
    if (!apiKey || !file) {
      alert("Missing API key or file");
      return;
    }

    setLoading(true);
    setStatus("");
    setProgress("Reading file...");

    const text = await file.text();

    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    }).data;

    const BATCH_SIZE = 5; // ⚡ speed control
    let result = [];

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const batch = parsed.slice(i, i + BATCH_SIZE);

      setProgress(`Processing ${i + 1}-${i + batch.length} of ${parsed.length}`);

      const promises = batch.map(async (row) => {
  const prompt = `
Translate this Shopify product data to ${lang}.

STRICT RULES:
- Output MUST be fully in ${lang}
- Keep JSON structure EXACTLY the same
- Do NOT remove or rename keys
- Do NOT add extra text
- Keep HTML unchanged

CRITICAL:
- DO NOT translate or modify these fields:
  - Variant Inventory Policy
  - Variant Inventory Tracker
  - Variant Fulfillment Service
  - Variant Requires Shipping
  - Variant Taxable

- Keep their original values EXACTLY as they are

DATA:
${JSON.stringify(row)}
`;

        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
              model: "gpt-4.1-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2
            })
          });

          const json = await res.json();

          if (!json.choices) return row;

          return JSON.parse(json.choices[0].message.content);
        } catch (err) {
          console.log("Error:", err);
          return row;
        }
      });

      const batchResults = await Promise.all(promises);
      result.push(...batchResults);
    }

    setProgress("Generating CSV...");

    const csv = Papa.unparse(result);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "translated.csv";
    a.click();

    // ✅ FINAL STATUS
    setLoading(false);
    setProgress("");
    setStatus("✅ Translation completed — file downloaded");
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f5f7fb",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Arial"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        padding: 30,
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
      }}>

        <h2 style={{ marginBottom: 10 }}>CSV Translator</h2>

        <p style={{
          fontSize: 13,
          color: "#666",
          marginBottom: 20
        }}>
          Translate Shopify product CSV files instantly
        </p>

        <p style={{
          color: "#e63946",
          fontSize: 12,
          marginBottom: 15
        }}>
          ⚠️ Use an API key with small balance (€5–10)
        </p>

        <input
          type="text"
          placeholder="OpenAI API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 15
          }}
        />

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          style={{ marginBottom: 15 }}
        />

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 20
          }}
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>

        <button
          onClick={translate}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            backgroundColor: "#007AFF",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {loading ? "Translating..." : status ? "Done ✅" : "Translate CSV"}
        </button>

        <p style={{
          marginTop: 20,
          fontSize: 13,
          color: loading ? "#555" : "#2ecc71"
        }}>
          {loading ? progress : status}
        </p>

      </div>
    </div>
  );
}


// 🌐 ROUTER
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/translator" element={<Translator />} />
      </Routes>
    </Router>
  );
}