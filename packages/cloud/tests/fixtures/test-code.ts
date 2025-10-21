/**
 * Example TypeScript code for testing CodeChunker
 */

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export class UserService {
  private users: Map<number, User> = new Map();
  private nextId: number = 1;

  /**
   * Create a new user
   */
  async createUser(name: string, email: string): Promise<User> {
    const user: User = {
      id: this.nextId++,
      name,
      email,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  /**
   * Update user information
   */
  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  /**
   * Find users by email
   */
  async findUsersByEmail(email: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.email.toLowerCase().includes(email.toLowerCase())
    );
  }
}

export class AuthService {
  private tokens: Map<string, number> = new Map();

  /**
   * Generate authentication token
   */
  generateToken(userId: number): string {
    const token = Math.random().toString(36).substring(2);
    this.tokens.set(token, userId);
    return token;
  }

  /**
   * Validate token and return user ID
   */
  validateToken(token: string): number | null {
    return this.tokens.get(token) || null;
  }

  /**
   * Revoke a token
   */
  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }
}
