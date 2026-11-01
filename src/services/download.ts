// Hands a generated file to the user: the OS share sheet on touch devices, a regular download otherwise (PRD Flow 2).
import { XLSX_MIME } from "@/shared/exportFileName";

function download(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function deliverFile(blob: Blob, fileName: string): Promise<void> {
  const file = new File([blob], fileName, { type: XLSX_MIME });
  // Desktop Chrome also supports file sharing, so the share sheet is limited to touch devices.
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      // The user closed the share sheet: nothing else to do.
      if (e instanceof DOMException && e.name === "AbortError") return;
      // Any other failure (e.g. the click activation expired) falls back to a regular download.
    }
  }
  download(file);
}
