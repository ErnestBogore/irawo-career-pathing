import React, { useState, useEffect } from 'react';
// @ts-ignore: no types for pdfjs-dist

interface Suggestion {
  title: string;
  description: string;
  fitScore: number;
  strengths: string[];
  weaknesses: string[];
  skillsToAcquire: string[];
}

const pdfJsVersion = '3.11.174';

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
  const [manualEntry, setManualEntry] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfJsVersion}/pdf.worker.min.js`;
      } catch {
        // ignore
      }
    })();
  }, []);

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
        <section className="card">
          <h2>Étape 1 : Provide ton CV</h2>
          <p>Upload un PDF/texte ou colle directement ton CV :</p>
          <input type="file" accept=".txt,.pdf" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
          <textarea value={manualEntry} onChange={e=>setManualEntry(e.target.value)} placeholder="Ou colle ton CV ici..." rows={8} />
          <button disabled={!resumeText && !manualEntry} onClick={()=>{ if (!resumeText) setResumeText(manualEntry); handleNext(); }}>Suivant</button>
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
            suggestions.map((s, idx) => {
              const isOpen = expanded === idx;
              return (
                <div key={idx} style={{ border: '1px solid #ccc', margin: '12px 0', padding: 12 }}>
                  <h3
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    onClick={() => setExpanded(isOpen ? null : idx)}
                  >
                    <span>
                      {s.title} <span style={{ fontSize: 14 }}>(fit {s.fitScore}%)</span>
                    </span>
                    <span>{isOpen ? '▲' : '▼'}</span>
                  </h3>
                  <ProgressBar value={s.fitScore} />
                  <p>{s.description}</p>
                  {isOpen && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Forces :</strong>
                      <ul>
                        {s.strengths.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ul>
                      <strong>Faiblesses :</strong>
                      <ul>
                        {s.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                      <strong>Compétences à acquérir :</strong>
                      <ul>
                        {s.skillsToAcquire.map((sk, i) => (
                          <li key={i}>{sk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </section>
      )}
    </main>
  );
} 