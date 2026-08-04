import { compare, hash as bcryptHash } from 'bcrypt';

export async function hash(value: string, saltRounds: number): Promise<string> {
  return bcryptHash(value, saltRounds);
}

export async function verify(value: string, encodedHash: string): Promise<boolean> {
  if (!encodedHash.startsWith('$2')) return false;

  try {
    return await compare(value, encodedHash);
  }
  catch {
    return false;
  }
}
