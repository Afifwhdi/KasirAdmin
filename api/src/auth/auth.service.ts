import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async login(username: string, password: string) {
    try {
      interface UserRow {
        id: number;
        name: string;
        email: string;
        username: string;
        password: string;
        role: string;
      }

      const users = await this.dataSource.query<UserRow[]>(
        'SELECT id, name, email, username, password, role FROM users WHERE username = $1 LIMIT 1',
        [username],
      );

      const user = users[0];

      if (!user) {
        throw new UnauthorizedException('Username atau password salah');
      }

      const isPasswordValid = await this.verifyPassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Username atau password salah');
      }

      // Return user data (without password)
      return {
        status: 'success',
        message: 'Login berhasil',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      return {
        status: 'error',
        message: 'Gagal login: ' + (error as Error).message,
      };
    }
  }

  async verifyUser(userId: number) {
    try {
      interface UserRow {
        id: number;
        name: string;
        email: string;
      }

      const result = await this.dataSource.query<UserRow[]>(
        'SELECT id, name, email FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );
      const user = result[0];

      if (!user) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      return {
        status: 'success',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch {
      return {
        status: 'error',
        message: 'User tidak valid',
      };
    }
  }

  private async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
      return await bcrypt.compare(plainPassword, normalizedHash);
    } catch {
      return false;
    }
  }
}
