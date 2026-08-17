import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, fullName?: string, avatarUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        username: email.split('@')[0] || uid,
        email,
        fullName: fullName || email.split('@')[0],
        avatarUrl: avatarUrl || '',
        roleId: 'member',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
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
    console.error('Database query getOrCreateUser failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query getAllUsers failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
