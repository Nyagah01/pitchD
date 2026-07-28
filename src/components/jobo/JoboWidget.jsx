import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { listJoboMessages, saveJoboMessage, sendJoboMessage } from "../../lib/jobo";
import { getApplication, saveGeneratedDoc, listGeneratedDocs } from "../../lib/applications";
import { friendlyError } from "../../lib/friendlyError";

const INTRO = {
  role: "assistant",
  content:
    "Hey, I'm Jobo. Ask me to look into a company, vent about the job hunt, or ask for interview tips — I'm here for all of it.",
};

export default function JoboWidget() {
  const { id: applicationId } = useParams();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INTRO]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState(null);
  const [savedOfferIndex, setSavedOfferIndex] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    listJoboMessages().then((rows) => {
      if (rows.length > 0) setMessages(rows);
    });
  }, [open]);

  useEffect(() => {
    if (!applicationId) {
      setContext(null);
      return;
    }
    getApplication(applicationId).then((app) => {
      setContext({ company: app.company, role: app.role, jobDescription: app.job_description });
    });
  }, [applicationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setSending(true);
    saveJoboMessage("user", text).catch(() => {});
    try {
      const { content, saveOffer } = await sendJoboMessage(nextMessages, context);
      setMessages((prev) => [...prev, { role: "assistant", content, saveOffer }]);
      saveJoboMessage("assistant", content).catch(() => {});
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSending(false);
    }
  }

  async function handleAddToInterviewPrep(index, saveOffer) {
    if (!applicationId) return;
    const docs = await listGeneratedDocs(applicationId);
    const existing = docs.find((d) => d.type === "interview_prep")?.content;
    const merged = existing ? `${existing}\n\nCOMPANY BACKGROUND (from Jobo):\n${saveOffer}` : `COMPANY BACKGROUND (from Jobo):\n${saveOffer}`;
    await saveGeneratedDoc(applicationId, "interview_prep", merged);
    setSavedOfferIndex(index);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="cta-glow fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:bottom-6 sm:right-6"
        aria-label={open ? "Close Jobo" : "Open Jobo"}
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[9.5rem] top-auto z-40 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[32rem] sm:w-96">
          <div className="flex shrink-0 items-center gap-2 border-b border-border p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bot size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Jobo</p>
              <p className="text-xs text-muted">Your job-hunt buddy</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-primary text-white" : "bg-bg text-text"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.saveOffer && (
                      <button
                        onClick={() => handleAddToInterviewPrep(i, m.saveOffer)}
                        disabled={!applicationId || savedOfferIndex === i}
                        className="mt-2 flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary disabled:opacity-60"
                      >
                        <Sparkles size={12} />
                        {savedOfferIndex === i
                          ? "Added to interview prep"
                          : applicationId
                          ? "Add to interview prep"
                          : "Open an application to save this"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && <p className="text-xs text-muted">Jobo is thinking…</p>}
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Message Jobo…"
              className="flex-1 rounded-full border border-border bg-bg px-3.5 py-2 text-sm text-text outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-60"
              aria-label="Send"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
