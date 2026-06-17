function generatePassphrase(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function xorEncode(data: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const result = new Uint8Array(dataBytes.length);
  for (let i = 0; i < dataBytes.length; i++) {
    result[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return btoa(String.fromCharCode(...result));
}

function xorDecode(encoded: string, key: string): string {
  const bytes = new Uint8Array(atob(encoded).split('').map((c) => c.charCodeAt(0)));
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return new TextDecoder().decode(result);
}

export function encryptData(data: string, passphrase: string): string {
  const key = passphrase;
  const header = btoa('ENCv1');
  return header + ':' + xorEncode(data, key);
}

export function decryptData(encrypted: string, passphrase: string): string | null {
  try {
    const parts = encrypted.split(':');
    if (parts[0] !== btoa('ENCv1')) return null;
    return xorDecode(parts.slice(1).join(':'), passphrase);
  } catch {
    return null;
  }
}

export { generatePassphrase };
