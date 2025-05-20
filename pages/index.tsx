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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Découvrez votre <span className="text-primary">parcours de carrière idéal</span>
          </h1>
          <p className="text-lg text-gray-700">
            Téléchargez votre CV, répondez à quelques questions et laissez notre système gamifié
            vous suggérer les meilleures opportunités professionnelles.
          </p>
          {/* Optional: Add the two buttons here later if needed */}
        </header>

        {step === 1 && (
          <section className="card text-center">
            <h2 className="text-2xl font-semibold mb-6">Commencez votre quête de carrière</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
              <div className="mx-auto mb-4 text-primary w-12 h-12">
                {/* Simple Upload Icon from image */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 15.75l-1.5.75a3 3 0 01-3-3V8.25a3 3 0 013-3h15a3 3 0 013 3v7.5a3 3 0 01-3 3l-1.5-.75m-6.75 6l.91-2.148a3 3 0 00-3.712-1.89M16.5 7.5H18a2.25 2.25 0 012.25 2.25v.94l-3.397 3.397m-3.885-1.95a2.25 2.25 0 01-2.105-2.723L6.325 7.269m12.524 1.19L12 12.75m0 0l-.115-.03a1.125 1.125 0 01-.961-.374M12 12.75h-3.879m0 0l-.921.303A1.125 1.125 0 017.5 15h2.25m2.25 0h3.879m0 0l1.523.492a1.125 1.125 0 011.42-.56z" />
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2">Téléchargez votre CV</p>
              <p className="text-gray-600 mb-4">Glissez-déposez votre fichier ici ou cliquez pour parcourir</p>
              <input
                type="file"
                accept=".txt,.pdf"
                className="hidden"
                id="file-upload"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <label htmlFor="file-upload" className="inline-block px-8 py-3 bg-primary text-dark font-semibold rounded-lg cursor-pointer hover:bg-yellow-400 transition">
                Parcourir les fichiers
              </label>
              {/* Re-add manual entry textarea below the file input area */}
              <textarea
                value={manualEntry}
                onChange={e=>setManualEntry(e.target.value)}
                placeholder="Ou colle le texte de ton CV ici..."
                rows={8}
                className="border border-gray-300 rounded p-4 w-full mt-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">Formats acceptés: TXT, PDF (Max 5MB)</p>
            {/* Conditions and Policy links */}
            <p className="text-sm text-gray-500">
              En téléchargeant votre CV, vous acceptez nos <a href="#" className="text-primary hover:underline">Conditions d'utilisation</a> et <a href="#" className="text-primary hover:underline">Politique de confidentialité</a>.
            </p>
            {/* Suivant button moved outside the dashed area but within the card */}
            <button
              disabled={!resumeText && !manualEntry}
              className="mt-6 w-full px-4 py-3 bg-dark text-primary font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-800 transition"
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
          <section className="card">
            <h2 className="text-2xl font-semibold mb-6">Étape 2 : Tes aspirations</h2>
            <div className="space-y-4">
              <label className="block">
                Rôle de rêve :
                <input
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={aspirations.dreamRole}
                  onChange={(e) => setAspirations({ ...aspirations, dreamRole: e.target.value })}
                />
              </label>
              <label className="block">
                Tâches que tu aimes :
                <input
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={aspirations.enjoyTasks}
                  onChange={(e) => setAspirations({ ...aspirations, enjoyTasks: e.target.value })}
                />
              </label>
              <label className="block">
                Environnement préféré :
                <input
                  className="w-full mt-1 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  value={aspirations.preferredEnvironment}
                  onChange={(e) =>
                    setAspirations({ ...aspirations, preferredEnvironment: e.target.value })
                  }
                />
              </label>
            </div>
            <button
              className="mt-8 w-full px-4 py-3 bg-dark text-primary font-semibold rounded-lg hover:bg-gray-800 transition"
              onClick={handleNext}
            >
              Explorer mes carrières
            </button>
          </section>
        )}

        {step === 3 && (
          <section className="card">
            <h2 className="text-2xl font-semibold mb-6">Étape 3 : Résultats</h2>
            {loading && <p className="text-center text-primary">⏳ Génération...</p>}
            {!loading && suggestions.length === 0 && (
              <p className="text-center text-gray-600">Aucune suggestion de carrière trouvée. Essayez de reformuler vos aspirations ou d'améliorer votre CV.</p>
            )}
            {!loading && suggestions.length > 0 &&
              suggestions.map((s, idx) => {
                const isOpen = expanded === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl p-5 mb-4 bg-white hover:shadow-lg transition cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : idx)}
                  >
                    <h3
                      className="text-lg font-semibold text-dark mb-2 flex items-center justify-between"
                    >
                      <span>
                        {s.title} <span className="text-sm font-normal text-gray-600">(fit {s.fitScore}%)</span>
                      </span>
                      <span>{isOpen ? '▲' : '▼'}</span>
                    </h3>
                    <ProgressBar value={s.fitScore} />
                    <p className="text-gray-700 mt-2">{s.description}</p>
                    {isOpen && (
                      <div className="mt-4 text-gray-700">
                        <strong>Forces :</strong>
                        <ul className="list-disc list-inside ml-2">
                          {s.strengths.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                        <strong>Faiblesses :</strong>
                        <ul className="list-disc list-inside ml-2">
                          {s.weaknesses.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                        <strong>Compétences à acquérir :</strong>
                        <ul className="list-disc list-inside ml-2">
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

        {/* Step Summary Cards */}
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-xl bg-white shadow-md">
            <div className="mx-auto mb-4 text-primary w-12 h-12">
              {/* Upload Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Téléchargez votre CV</h3>
            <p className="text-gray-600 text-sm">Notre système analysera vos compétences et votre expérience.</p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-md">
            <div className="mx-auto mb-4 text-primary w-12 h-12">
              {/* Questions Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712m-4.242-3.712L9.879 7.519m4.242 0L14.121 7.519M5.25 12A2.25 2.25 0 017.5 9.75h9a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0017.25 22.5H6.75A2.25 2.25 0 004.5 20.25v-7.5zm6 4.5H9.75a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5zm2.25 0h-1.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Répondez aux questions</h3>
            <p className="text-gray-600 text-sm">Partagez vos aspirations et préférences professionnelles.</p>
          </div>
          <div className="p-6 rounded-xl bg-white shadow-md">
            <div className="mx-auto mb-4 text-primary w-12 h-12">
              {/* Results Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5 4.5l-6 6m1.145-18.218L9.876 3.645a4.5 4.5 0 00-6.633 5.455l1.476 3.342m.052 1.124a3 3 0 01-.233.653l-1.591 1.591c-.22.22-.58.22-.8 0l-.017-.017a.75.75 0 01-.017-1.06L7.5 14.25m4.84-9.75l4.5 4.5m0-4.5l-4.5 4.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Découvrez vos options</h3>
            <p className="text-gray-600 text-sm">Recevez des suggestions de carrière personnalisées.</p>
          </div>
        </section>

      </div>
    </div>
  );
} 