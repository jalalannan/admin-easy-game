/**
 * Edge-compatible password hashing utilities using Web Crypto API
 * Replaces bcryptjs for Edge Runtime compatibility
 */

/**
 * Hash a password using PBKDF2 (Web Crypto API)
 * @param password - Plain text password
 * @returns Hashed password with salt (format: salt:hash)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to array buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Hash the password using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  
  // Convert to hex strings
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Return format: salt:hash
  return `${saltHex}:${hashHex}`;
}

/**
 * Compare a password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password (format: salt:hash)
 * @returns True if passwords match
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    // Split the stored hash into salt and hash
    const [saltHex, storedHashHex] = hashedPassword.split(':');
    
    if (!saltHex || !storedHashHex) {
      return false;
    }
    
    // Convert salt from hex to Uint8Array
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Convert password to array buffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    // Hash the password using the same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      key,
      256
    );
    
    // Convert to hex string
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare hashes
    return hashHex === storedHashHex;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

