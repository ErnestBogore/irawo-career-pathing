import React, { useState, useEffect } from 'react';
// @ts-ignore: no types for pdfjs-dist

interface Weakness {
  description: string;
}

interface Suggestion {
  description: string;
  correspondingWeakness?: string; // Optional field to link suggestion to a weakness
}

interface AnalysisResult {
  weaknesses: Weakness[];
  suggestions: Suggestion[];
}

const pdfJsVersion = '3.11.174';

export default function Home() {
  const [step, setStep] = useState<1 | 3>(1); // Step 2 removed
  const [resumeText, setResumeText] = useState<string>('');
  // Removed aspirations state
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null); // Changed state to hold analysis result
  const [manualEntry, setManualEntry] = useState('');
  // Removed expanded state as it was for career suggestions

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

  const handleAnalyze = () => {
    if (resumeText || manualEntry) {
      if (!resumeText) setResumeText(manualEntry);
      setStep(3); // Directly go to step 3
      fetchAnalysis();
    }
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }), // Only send resumeText
      });
      const data: AnalysisResult = await res.json(); // Type the response
      setAnalysisResult(data);
    } catch (e) {
      alert('Erreur lors de l\'analyse du CV.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Optimisez votre <span className="text-primary">CV pour les recruteurs</span>
          </h1>
          <p className="text-lg text-gray-700">
            Téléchargez votre CV et obtenez des suggestions personnalisées pour le rendre plus attractif pour les entreprises tech.
          </p>
        </header>

        {step === 1 && (
          <section className="card text-center">
            <h2 className="text-2xl font-semibold mb-6">Analysez votre CV</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
              <div className="mx-auto mb-4 text-primary w-12 h-12">
                {/* Simple Upload Icon from image */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 15.75l-1.5.75a3 3 0 01-3-3V8.25a3 3 0 013-3h15a3 3 0 013 3v7.5a3 3 0 01-3 3l-1.5-.75m-6.75 6l.91-2.148a3 3 0 00-3.712-1.89M16.5 7.5H18a2.25 2.25 0 012.25 2.25v.94l-3.397 3.397m-3.885-1.95a2.25 2.25 0 01-2.105-2.723L6.325 7.269m12.524 1.19L12 12.75m0 0l-.115-.03a1.125 1.125 0 01-.961-.374M12 12.75h-3.879m0 0l-.921.303A1.125 1.125 0 017.5 15h2.25m2.25 0h3.879m0 0l1.523.492a1.125 1.125 0 011.42-.56z" />
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2">Téléchargez votre CV</p>
              <p className="text-gray-600 mb-4">Glissez-déposez votre fichier ici ou collez le texte ci-dessous</p>
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
              <textarea
                value={manualEntry}
                onChange={e=>setManualEntry(e.target.value)}
                placeholder="Ou colle le texte de ton CV ici..."
                rows={8}
                className="border border-gray-300 rounded p-4 w-full mt-6 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <p className="text-sm text-gray-500 mb-4">Formats acceptés: TXT, PDF (Max 5MB)</p>
            <p className="text-sm text-gray-500">
              En téléchargeant votre CV, vous acceptez nos <a href="#" className="text-primary hover:underline">Conditions d'utilisation</a> et <a href="#" className="text-primary hover:underline">Politique de confidentialité</a>.
            </p>
            <button
              disabled={!resumeText && !manualEntry}
              className="mt-6 w-full px-4 py-3 bg-dark text-primary font-semibold rounded-lg disabled:opacity-40 hover:bg-gray-800 transition"
              onClick={handleAnalyze}
            >
              Analyser mon CV
            </button>
          </section>
        )}

        {/* Step 2 (Aspirations) removed */}

        {step === 3 && (
          <section className="card">
            <h2 className="text-2xl font-semibold mb-6">Résultats de l'analyse</h2>
            {loading && <p className="text-center text-primary">⏳ Analyse en cours...</p>}
            {!loading && analysisResult && analysisResult.weaknesses.length === 0 && analysisResult.suggestions.length === 0 && (
              <p className="text-center text-gray-600">Aucune faiblesse ou suggestion trouvée. Votre CV semble déjà très optimisé !</p>
            )}
            {!loading && analysisResult && (analysisResult.weaknesses.length > 0 || analysisResult.suggestions.length > 0) && (
              <div>
                {analysisResult.weaknesses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Points faibles identifiés :</h3>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      {analysisResult.weaknesses.map((item, index) => (
                        <li key={index} className="text-gray-700">{item.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.suggestions.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Suggestions d'amélioration :</h3>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      {analysisResult.suggestions.map((item, index) => (
                        <li key={index} className="text-gray-700">{item.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Step Summary Cards - Updating text and removing one card */}
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center"> {/* Changed to 2 columns */}
          <div className="p-6 rounded-xl bg-white shadow-md">
            <div className="mx-auto mb-4 text-primary w-12 h-12">
              {/* Upload Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysez votre CV</h3>
            <p className="text-gray-600 text-sm">Notre système identifiera les points à améliorer pour les recruteurs tech.</p>
          </div>
          {/* Removed the 'Répondez aux questions' card */}
          <div className="p-6 rounded-xl bg-white shadow-md">
            <div className="mx-auto mb-4 text-primary w-12 h-12">
              {/* Results Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5 4.5l-6 6m1.145-18.218L9.876 3.645a4.5 4.5 0 00-6.633 5.455l1.476 3.342m.052 1.124a3 3 0 01-.233.653l-1.591 1.591c-.22.22-.58.22-.8 0l-.017-.017a.75.75 0 01-.017-1.06L7.5 14.25m4.84-9.75l4.5 4.5m0-4.5l-4.5 4.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Obtenez des suggestions</h3>
            <p className="text-gray-600 text-sm">Recevez des conseils pour optimiser votre CV pour les recruteurs tech.</p>
          </div>
        </section>

      </div>
    </div>
  );
} 