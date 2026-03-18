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
    "English", "Spanish", "Portuguese", "French", "German",
    "Italian", "Dutch", "Danish", "Swedish", "Norwegian",
    "Finnish", "Polish", "Czech", "Romanian", "Hungarian"
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

    const BATCH_SIZE = 5;
    let result = [];

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const batch = parsed.slice(i, i + BATCH_SIZE);

      setProgress(`Processing ${i + 1}-${i + batch.length} of ${parsed.length}`);

      const promises = batch.map(async (row) => {
        const prompt = `
You are editing a Shopify CSV row.

Translate ONLY the values to ${lang}.

STRICT RULES:
- DO NOT add/remove fields
- DO NOT change keys
- KEEP structure EXACTLY the same

VARIANTS:
- ALWAYS translate Option1/2/3 Name and Value
- DO NOT create new variants

DO NOT TRANSLATE:
- Variant Inventory Policy
- Variant Inventory Tracker
- Variant Fulfillment Service
- Variant Requires Shipping
- Variant Taxable

RETURN ONLY JSON

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

          let translated;

          try {
            translated = JSON.parse(json.choices[0].message.content);
          } catch {
            return row;
          }

          // 🔥 FORCE VARIANT FIX
          const variantFields = [
            "Option1 Name", "Option1 Value",
            "Option2 Name", "Option2 Value",
            "Option3 Name", "Option3 Value"
          ];

          for (const field of variantFields) {
            if (row[field] && translated[field] === row[field]) {
              try {
                const retryPrompt = `Translate this word to ${lang}: "${row[field]}"`;

                const retryRes = await fetch("https://api.openai.com/v1/chat/completions", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                  },
                  body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    messages: [{ role: "user", content: retryPrompt }],
                    temperature: 0
                  })
                });

                const retryJson = await retryRes.json();
                translated[field] = retryJson.choices[0].message.content.trim();

              } catch {
                translated[field] = row[field];
              }
            }
          }

          return translated;

        } catch {
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

        <h2>CSV Translator</h2>

        <p style={{ fontSize: 13, color: "#666" }}>
          Translate Shopify product CSV files instantly
        </p>

        <input
          type="text"
          placeholder="OpenAI API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 15 }}
        />

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          style={{ marginTop: 15 }}
        />

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{ width: "100%", padding: 12, marginTop: 15 }}
        >
          {languages.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>

        <button
          onClick={translate}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            marginTop: 20,
            backgroundColor: "#007AFF",
            color: "#fff",
            border: "none",
            borderRadius: 10
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