/**
 * Serialize config to be used in templates
 * @param obj Config object
 * @returns Stringified config with kept function expressions
 */
export const serializeConfig = (obj: any) => {
  // Stringify function body
  if (typeof obj === 'function') {
    return obj.toString()
  }

  // Run recursively on objects and arrays
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      return `[${obj.map(serializeConfig).join(', ')}]`
    } else {
      return `{${Object.entries(obj).map(([key, value]) => `${serializeConfig(key)}: ${serializeConfig(value)}`).join(', ')}}`
    }
  }

  return JSON.stringify(obj)
}
