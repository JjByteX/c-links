// Web NFC (decision-log #7). Chrome on Android only. The browser has no
// built-in TypeScript types for it, so the small part used here is typed
// locally.

type NdefMessage = { records: { recordType: "url"; data: string }[] };
type NdefReaderLike = {
  write: (message: NdefMessage, options?: { signal?: AbortSignal }) => Promise<void>;
};
type NdefReaderConstructor = new () => NdefReaderLike;

const nfcReader = () =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { NDEFReader?: NdefReaderConstructor }).NDEFReader;

// True only where writing is possible at all. This does not prove the phone
// has NFC turned on; that failure is reported when the write is attempted.
export const nfcWriteSupported = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  nfcReader() !== undefined;

// Writes one URL record and resolves when a chip has been written. Replaces
// whatever the chip held. Rejects with a DOMException; aborting the signal
// cancels the wait for a chip.
export async function writeChip(
  url: string,
  signal: AbortSignal,
): Promise<void> {
  const Reader = nfcReader();
  if (!Reader) throw new DOMException("Web NFC is not available", "NotSupportedError");
  await new Reader().write({ records: [{ recordType: "url", data: url }] }, { signal });
}

export function chipErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
      return "NFC access was denied. Allow NFC for this site in the browser's site settings, then try again.";
    case "NotSupportedError":
      return "This phone or browser cannot write NFC chips. Use Chrome on an Android phone with NFC.";
    case "NotReadableError":
      return "NFC is turned off. Turn it on in the phone's settings, then try again.";
    case "NetworkError":
      return "The chip could not be written. Keep it against the phone until it finishes. A locked or very small chip also fails.";
    default:
      return `The chip could not be written: ${error instanceof Error ? error.message : "unknown error"}`;
  }
}
