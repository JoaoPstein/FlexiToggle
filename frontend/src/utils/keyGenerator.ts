/**
 * Utility functions for generating project keys and API keys
 */

/**
 * Generates a random project key
 * Format: [prefix]-[random-string]
 */
export function generateProjectKey(name?: string): string {
  // If name is provided, use it as base, otherwise use random
  let base = '';
  
  if (name) {
    base = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 20); // Limit length
  }
  
  if (!base) {
    base = 'project';
  }
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${base}-${randomSuffix}`;
}

/**
 * Generates a random API key
 * Format: fh_[environment]_[random-string]
 */
export function generateApiKey(environment: string = 'dev'): string {
  const prefix = 'fh';
  const env = environment.toLowerCase().substring(0, 4);
  const randomPart = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  
  return `${prefix}_${env}_${randomPart}`;
}

/**
 * Validates if a project key is valid
 */
export function isValidProjectKey(key: string): boolean {
  const regex = /^[a-z0-9-_]+$/;
  return regex.test(key) && key.length >= 3 && key.length <= 50;
}

/**
 * Generates a random string for various purposes
 */
export function generateRandomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Converts a name to a valid key format
 */
export function nameToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}
