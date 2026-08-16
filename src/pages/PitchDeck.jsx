import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PITCH_SLIDES, generatePitchDeckPDF } from '@/utils/generatePitchDeckPDF';

export default function PitchDeck() {
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = () => {
    setGenerating(true);
    setDone(false);
    try {
      // jsPDF save is synchronous
      setTimeout(() => {
        generatePitchDeckPDF();
        setGenerating(false);
        setDone(true);
      }, 50);
    } catch (e) {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to={createPageUrl('Home')} className="flex items-center gap-1 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        {/* Hero */}
        <div className="rounded-3xl bg-[#004d40] text-white p-8 md:p-12 relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#006d5b] rounded-full -mr-32 -mt-32 opacity-40" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider mb-4">
              <FileText className="w-4 h-4" />
              INVESTOR PITCH DECK
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Fixie</h1>
            <p className="text-lg text-teal-100 max-w-xl mb-6">
              The trusted operating system for local repair services and transport in Kenya.
              Book a certified technician in seconds — guaranteed.
            </p>
            <Button
              onClick={handleDownload}
              disabled={generating}
              className="bg-white text-[#004d40] hover:bg-teal-50 text-base h-12 px-6 font-semibold"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Building PDF…
                </>
              ) : done ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Download again
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download Pitch Deck (PDF)
                </>
              )}
            </Button>
            {done && (
              <p className="text-sm text-teal-100 mt-3">Your PDF has been downloaded.</p>
            )}
          </div>
        </div>

        {/* Slide previews */}
        <div className="grid md:grid-cols-2 gap-5">
          {PITCH_SLIDES.map((slide, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <div className="text-xs font-semibold text-amber-600 tracking-wider mb-2">
                {String(i + 1).padStart(2, '0')} • {slide.eyebrow.toUpperCase()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{slide.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{slide.body}</p>
              {slide.stats ? (
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  {slide.stats.map((s, j) => (
                    <div key={j} className="bg-[#004d40] rounded-xl p-3 text-white">
                      <div className="text-lg font-bold leading-tight">{s.value}</div>
                      <div className="text-[10px] text-teal-100 mt-1 leading-snug">{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-2 mt-auto">
                  {slide.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#004d40] mt-1.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">
          Confidential — for investor discussion only • Fixie 2026
        </p>
      </div>
    </div>
  );
}