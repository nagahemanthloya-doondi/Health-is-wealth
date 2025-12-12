import React, { useState, useEffect } from 'react';
import { UserSettings, AppView, HealthyReport } from './types';
import { NeoButton, NeoInput, NeoCard } from './components/NeoComponents';
import Scanner from './components/Scanner';
import ReportCard from './components/ReportCard';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ONBOARDING);
  const [settings, setSettings] = useState<UserSettings>({
    geminiApiKey: '',
  });
  const [currentReport, setCurrentReport] = useState<HealthyReport | null>(null);

  // Load settings from local storage if available
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setSettings(prev => ({
        ...prev,
        geminiApiKey: storedKey,
      }));
      // Auto skip onboarding if key exists
      setView(AppView.DASHBOARD);
    }
  }, []);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.geminiApiKey) {
      alert("API KEY IS REQUIRED!");
      return;
    }
    // Simple persistence
    localStorage.setItem('gemini_api_key', settings.geminiApiKey);
    setView(AppView.DASHBOARD);
  };

  const handleReportGenerated = (report: HealthyReport) => {
    setCurrentReport(report);
    setView(AppView.REPORT);
  };

  const handleReset = () => {
    setCurrentReport(null);
    setView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('gemini_api_key');
    setSettings(prev => ({ ...prev, geminiApiKey: '' }));
    setView(AppView.ONBOARDING);
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black p-4 pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center max-w-4xl mx-auto border-b-4 border-black pb-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            HEALTHIS<span className="text-[#7ED957]">WEALTH</span>
          </h1>
          <p className="font-bold text-sm md:text-base mt-1 bg-black text-white inline-block px-2 transform rotate-1">
            NEO-BRUTALIST HEALTH SCANNER
          </p>
        </div>
        {view !== AppView.ONBOARDING && (
          <button onClick={handleLogout} className="underline font-bold text-sm hover:bg-black hover:text-white p-1 transition-colors">
            RESET KEY
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {view === AppView.ONBOARDING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <NeoCard className="w-full max-w-lg bg-[#FFDE59]" title="INITIALIZE">
              <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4">
                <p className="font-bold mb-2">
                  TO BEGIN, PROVE YOUR WORTH WITH CREDENTIALS.
                </p>
                <NeoInput 
                  label="Gemini API Key" 
                  placeholder="Paste your AI Studio Key here"
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                />
                <NeoButton type="submit" className="mt-4 text-xl">
                  ENTER SYSTEM
                </NeoButton>
                <p className="text-xs font-mono mt-4 border-t-2 border-black pt-2">
                  * Keys are stored locally in your browser.
                </p>
              </form>
            </NeoCard>
          </div>
        )}

        {view === AppView.DASHBOARD && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center max-w-2xl">
              <h2 className="text-3xl font-black uppercase mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white inline-block px-4 py-1 border-2 border-black">
                SCAN & ANALYZE
              </h2>
              <p className="font-bold mb-4">
                POINT CAMERA AT BARCODE. WE FETCH DATA FROM OPEN FOOD FACTS, GEMINI JUDGES IT.
                IF NO BARCODE, WE JUDGE THE PHOTO.
              </p>
            </div>
            
            <Scanner 
              apiKey={settings.geminiApiKey} 
              onReportGenerated={handleReportGenerated} 
            />
          </div>
        )}

        {view === AppView.REPORT && currentReport && (
          <ReportCard report={currentReport} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 text-center font-bold text-xs uppercase opacity-50">
        <p>Built with Gemini 2.5 Flash & Open Food Facts</p>
        <p>© {new Date().getFullYear()} healthiswealth. Stay Hard.</p>
      </footer>
    </div>
  );
};

export default App;