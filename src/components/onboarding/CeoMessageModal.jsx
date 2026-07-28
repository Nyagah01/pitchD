import { useState } from "react";
import { X } from "lucide-react";
import { CEO_NAME, CEO_TITLE, CEO_MESSAGE_PARAGRAPHS, getGreeting } from "../../lib/ceoMessage";
import TypewriterLines from "../common/TypewriterLines";

export default function CeoMessageModal({ open, onClose, firstName }) {
  const [signatureVisible, setSignatureVisible] = useState(false);

  if (!open) return null;

  const lines = [
    { text: getGreeting(firstName), className: "text-sm font-medium text-text" },
    ...CEO_MESSAGE_PARAGRAPHS.map((para) => ({ text: para, className: "text-sm leading-relaxed text-muted" })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="glass-card flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-3xl">
        <div className="flex shrink-0 items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/ceo-photo.jpg"
              alt={CEO_NAME}
              className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-text">A word from our founder</p>
              <p className="text-xs text-muted">While we structure your profile...</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6">
          <div className="flex flex-col gap-3">
            <TypewriterLines lines={lines} onDone={() => setSignatureVisible(true)} />
            {signatureVisible && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-text">{CEO_NAME}</p>
                <p className="text-sm font-normal text-muted">{CEO_TITLE}</p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 p-6 pt-4">
          <button
            onClick={onClose}
            className="cta-glow w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
