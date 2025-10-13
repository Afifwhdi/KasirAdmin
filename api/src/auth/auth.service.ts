import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async login(email: string, password: string) {
    try {
      console.log('Login attempt for email:', email);
      
      // Get user from database (PostgreSQL uses $1, $2 for parameters, not ?)
      const users = await this.dataSource.query(
        'SELECT id, name, email, password, role FROM users WHERE email = $1 LIMIT 1',
        [email],
      );
      
      console.log('Query result:', users);
      
      const user = users[0];

      if (!user) {
        console.log('User not found');
        throw new UnauthorizedException('Email atau password salah');
      }

      console.log('User found:', { id: user.id, email: user.email, role: user.role });

      // Verify password (Laravel uses bcrypt)
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Email atau password salah');
      }

      // Return user data (without password)
      return {
        status: 'success',
        message: 'Login berhasil',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      
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
      const [user] = await this.dataSource.query(
        'SELECT id, name, email FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );

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
    } catch (error) {
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
      // PHP uses $2y$, Node bcrypt uses $2a$ or $2b$
      // They are compatible, but some bcrypt versions need $2y$ replaced with $2a$
      const normalizedHash = hashedPassword.replace(/^\$2y\$/, '$2a$');
      
      console.log('Original hash:', hashedPassword);
      console.log('Normalized hash:', normalizedHash);
      console.log('Plain password:', plainPassword);
      
      const result = await bcrypt.compare(plainPassword, normalizedHash);
      console.log('Bcrypt compare result:', result);
      
      return result;
    } catch (error) {
      console.error('Bcrypt error:', error);
      return false;
    }
  }
}
