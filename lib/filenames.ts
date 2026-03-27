export function sanitizeFileStem(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");

  return (
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "image"
  );
}

