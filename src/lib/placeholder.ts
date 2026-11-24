/** True while a value is still a "[PLACEHOLDER]" from the sample content. */
export function isPlaceholder(value: string | undefined): boolean {
  return !value || /^\[.*\]$/.test(value.trim());
}
