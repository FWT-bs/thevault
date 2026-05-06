// Tiny in-memory flag the login screen uses to decide whether to push
// the user into onboarding or straight into /home. Survives navigation
// (because it is module-level) but resets on a full app reload — that's
// fine for this prototype since there's no persistence layer wired up.

let _hasOnboarded = false;

export function hasOnboarded() {
  return _hasOnboarded;
}

export function markOnboarded() {
  _hasOnboarded = true;
}

export function resetOnboarded() {
  _hasOnboarded = false;
}
