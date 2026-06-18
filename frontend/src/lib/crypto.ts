export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

export function encryptData(data: string): string {
  return 'v2:' + obfuscate(data);
}

export function decryptData(encrypted: string): string | null {
  try {
    const prefix = encrypted.substring(0, 3);
    const body = encrypted.substring(3);
    if (prefix !== 'v2:') return null;
    return deobfuscate(body);
  } catch {
    return null;
  }
}
