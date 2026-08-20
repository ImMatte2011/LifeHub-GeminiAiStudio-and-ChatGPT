import { db } from './index.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(
  id: string,
  email: string,
  fullName: string,
  passwordHash: string,
  roleId: string = 'member',
  avatarUrl?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        id,
        username: email.split('@')[0] || id,
        email,
        passwordHash,
        fullName: fullName || email.split('@')[0],
        avatarUrl: avatarUrl || '',
        roleId,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl: avatarUrl || '',
          lastLogin: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('PostgreSQL query getOrCreateUser failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('PostgreSQL query getAllUsers failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  } catch (error) {
    console.error('PostgreSQL query getUserById failed:', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
