export function debugLog(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(message, ...args)
  }
}

export function debugError(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(message, ...args)
  }
}
