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
    <div className="w-full h-3 bg-gray-300 rounded">
      <div
        className="h-3 rounded bg-primary"
        style={{ width: `${value}%` }}
      />
    </div>
  );

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 flex items-center justify-center gap-2">
        <span role="img" aria-label="gamepad">🎮</span> <span className="text-primary">Irawo Career Pathing</span>
      </h1>
      {step === 1 && (
        <section className="card">
          <h2>Étape 1 : Provide ton CV</h2>
          <p>Upload un PDF/texte ou colle directement ton CV :</p>
          <input type="file" accept=".txt,.pdf" className="file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-primary file:text-dark file:font-semibold file:rounded cursor-pointer" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
          <textarea value={manualEntry} onChange={e=>setManualEntry(e.target.value)} placeholder="Ou colle ton CV ici..." rows={8} className="mt-4" />
          <button
            disabled={!resumeText && !manualEntry}
            className="mt-4 px-4 py-2 bg-primary text-dark font-semibold rounded disabled:opacity-40"
            onClick={() => {
              if (!resumeText) setResumeText(manualEntry);
              handleNext();
            }}
          >
            Suivant
          </button>
        </section>
      )}
      {step === 2 && (
        <section>
          <h2>Étape 2 : Tes aspirations</h2>
          <label>
            Rôle de rêve :
            <input
              className="w-full"
              value={aspirations.dreamRole}
              onChange={(e) => setAspirations({ ...aspirations, dreamRole: e.target.value })}
            />
          </label>
          <br />
          <label>
            Tâches que tu aimes :
            <input
              className="w-full"
              value={aspirations.enjoyTasks}
              onChange={(e) => setAspirations({ ...aspirations, enjoyTasks: e.target.value })}
            />
          </label>
          <br />
          <label>
            Environnement préféré :
            <input
              className="w-full"
              value={aspirations.preferredEnvironment}
              onChange={(e) =>
                setAspirations({ ...aspirations, preferredEnvironment: e.target.value })
              }
            />
          </label>
          <br />
          <button
            className="mt-4 px-4 py-2 bg-primary text-dark font-semibold rounded"
            onClick={handleNext}
          >
            Explorer mes carrières
          </button>
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
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-5 mb-4 bg-white hover:shadow-lg transition cursor-pointer"
                >
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