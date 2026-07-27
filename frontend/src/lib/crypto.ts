function obfuscate(data: string): string {
  const raw = btoa(data);
  return raw.split('').reverse().join('');
}

function deobfuscate(obfuscated: string): string | null {
  try {
    return atob(obfuscated.split('').reverse().join(''));
  } catch {
    return null;
  }
}

/**
 * This is NOT cryptographic encryption. It is reversible obfuscation for storage only.
 * Do not store sensitive data with this.
 */
export function obfuscateData(data: string): string {
  return 'v2:' + obfuscate(data);
}

/**
 * This is NOT cryptographic encryption. It is reversible obfuscation for storage only.
 * Do not store sensitive data with this.
 */
export function deobfuscateData(encrypted: string): string | null {
  try {
    const prefix = encrypted.substring(0, 3);
    const body = encrypted.substring(3);
    if (prefix !== 'v2:') return null;
    return deobfuscate(body);
  } catch {
    return null;
  }
}