import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Auto-generar identityCode si el usuario no tiene uno (usuarios legacy)
    let identityCode = user.identityCode;
    if (!identityCode) {
      identityCode = await this.usersService.generateIdentityCode(user.id);
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        identityCode,
      }
    };
  }

  async register(data: any) {
    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = await this.usersService.create({
      email: data.email,
      fullName: data.fullName || data.username,
      password: hashedPassword,
    });

    // Generar código de identidad único
    const identityCode = await this.usersService.generateIdentityCode(newUser.id);

    const { password, ...result } = newUser;
    return { ...result, identityCode };
  }

  async getProfile(userId: string) {
    let user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Auto-generar identityCode si el usuario no tiene uno (usuarios legacy)
    if (!user.identityCode) {
      const identityCode = await this.usersService.generateIdentityCode(userId);
      user = { ...user, identityCode };
    }

    const stats = await this.usersService.getUserStats(userId);
    const { password, ...result } = user;
    return { ...result, stats };
  }

  async updateProfile(userId: string, data: any) {
    const updatedUser = await this.usersService.update(userId, {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatarUrl,
    });
    const { password, ...result } = updatedUser;
    return result;
  }

  async changePassword(userId: string, data: any) {
    console.log('Changing password for user:', userId);
    const user = await this.usersService.findById(userId);
    if (!user) {
      console.log('User not found in DB:', userId);
      throw new UnauthorizedException('Usuario no encontrado');
    }

    console.log('Validating current password...');
    
    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.newPassword, salt);

    await this.usersService.update(userId, {
      password: hashedPassword,
    });

    return { message: 'Contraseña actualizada correctamente' };
  }
}
