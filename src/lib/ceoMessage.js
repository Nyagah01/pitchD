// Single source of truth for the CEO message, used on the public Landing page
// and (personalized) in the Onboarding structuring-wait modal, so both stay in sync.

export const CEO_NAME = "Brian Nyagah W";
export const CEO_TITLE = "CEO and Founder, Pitch'D";

export const CEO_MESSAGE_PARAGRAPHS = [
  "Job hunting can be a hassle, and we get it. It feels futile some days. Application after application, silence after silence. But hey, you've got this.",
  "You have every reason to be confident, because you deserve the job you're applying for. Every skill you've built, every project you've shipped, every late night you put in, that's real, and it counts.",
  "We built Pitchd because we've lived this too. The endless rewriting, the guessing at what recruiters actually want to see, the exhaustion of starting over for every single role. Your story is already there, we just help you tell it the way it deserves to be told, for whoever reads it next.",
  "So take a breath. Paste in everything you've got. We'll take it from here.",
  "We believe in you.",
];

export function getGreeting(firstName) {
  return firstName ? `Hey ${firstName},` : "Hey,";
}
