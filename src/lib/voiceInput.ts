// Web Speech API wrapper — graceful no-op when unsupported.

type Rec = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
};

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createVoiceInput(opts: {
  onPartial?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (msg: string) => void;
  lang?: string;
}): { start: () => void; stop: () => void } | null {
  if (!isVoiceSupported()) return null;
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec: Rec = new Ctor();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = opts.lang ?? (navigator.language || "en-US");

  let finalText = "";
  rec.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interim += t;
    }
    if (interim) opts.onPartial?.(interim);
  };
  rec.onerror = (e: any) => opts.onError?.(e?.error || "Voice input error");
  rec.onend = () => {
    if (finalText.trim()) opts.onFinal(finalText.trim());
  };

  return {
    start: () => { finalText = ""; try { rec.start(); } catch { /* already started */ } },
    stop: () => { try { rec.stop(); } catch { /* not running */ } },
  };
}
