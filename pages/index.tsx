import React, { useState } from 'react';
// @ts-ignore: no types for pdfjs-dist

interface Suggestion {
  title: string;
  description: string;
  fitScore: number;
  adjacencyScore: number;
}

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resumeText, setResumeText] = useState<string>('');
  const [aspirations, setAspirations] = useState({
    dreamRole: '',
    enjoyTasks: '',
    preferredEnvironment: '',
  });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const handleFileUpload = async (file: File) => {
    if (file.type === 'text/plain') {
      const text = await file.text();
      setResumeText(text);
    } else if (file.type === 'application/pdf') {
      // Attempt to parse PDF in browser via dynamic import
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(' ') + '\n';
        }
        setResumeText(text);
      } catch (err) {
        alert('Erreur lors de la lecture du PDF. Essayez un fichier .txt');
      }
    } else {
      alert('Format non supporté. Utilisez .txt ou .pdf');
    }
  };
  const handleNext = () => {
    if (step === 1 && resumeText) setStep(2);
    else if (step === 2) setStep(3), fetchSuggestions();
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, aspirations }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (e) {
      alert('Erreur');
    }
    setLoading(false);
  };

  const ProgressBar = ({ value }: { value: number }) => (
    <div style={{ background: '#eee', borderRadius: 6, width: '100%' }}>
      <div
        style={{
          width: `${value}%`,
          background: 'linear-gradient(90deg,#00c6ff,#0072ff)',
          padding: '4px 0',
          borderRadius: 6,
        }}
      />
    </div>
  );

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🎮 Career Quest</h1>
      {step === 1 && (
        <section>
          <h2>Étape 1 : Télécharge ton CV</h2>
          <input
            type="file"
            accept=".txt, .pdf"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          />
          {resumeText && <button onClick={handleNext}>Suivant</button>}
        </section>
      )}
      {step === 2 && (
        <section>
          <h2>Étape 2 : Tes aspirations</h2>
          <label>
            Rôle de rêve :
            <input
              value={aspirations.dreamRole}
              onChange={(e) => setAspirations({ ...aspirations, dreamRole: e.target.value })}
            />
          </label>
          <br />
          <label>
            Tâches que tu aimes :
            <input
              value={aspirations.enjoyTasks}
              onChange={(e) => setAspirations({ ...aspirations, enjoyTasks: e.target.value })}
            />
          </label>
          <br />
          <label>
            Environnement préféré :
            <input
              value={aspirations.preferredEnvironment}
              onChange={(e) =>
                setAspirations({ ...aspirations, preferredEnvironment: e.target.value })
              }
            />
          </label>
          <br />
          <button onClick={handleNext}>Explorer mes carrières</button>
        </section>
      )}
      {step === 3 && (
        <section>
          <h2>Étape 3 : Résultats</h2>
          {loading && <p>⏳ Génération...</p>}
          {!loading && suggestions.length > 0 &&
            suggestions.map((s, idx) => (
              <div key={idx} style={{ border: '1px solid #ccc', margin: '12px 0', padding: 12 }}>
                <h3>
                  {s.title} <span style={{ fontSize: 14 }}>(fit {s.fitScore}%)</span>
                </h3>
                <ProgressBar value={s.fitScore} />
                <p>{s.description}</p>
              </div>
            ))}
        </section>
      )}
    </main>
  );
} 