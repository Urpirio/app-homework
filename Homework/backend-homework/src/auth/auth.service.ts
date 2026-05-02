import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
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
    if (!user.isVerified) {
      throw new ForbiddenException('Tu cuenta no ha sido verificada. Por favor verifica tu correo.');
    }

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

    // Generar código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    const newUser = await this.usersService.create({
      email: data.email,
      fullName: data.fullName || data.username,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires: expires,
      isVerified: false,
    });

    // Enviar correo real con Resend
    await this.emailService.sendVerificationCode(data.email, verificationCode);

    // Generar código de identidad único
    const identityCode = await this.usersService.generateIdentityCode(newUser.id);

    const { password, ...result } = newUser;
    return { ...result, identityCode };
  }

  async verifyCode(email: string, code: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('El código ingresado es incorrecto');
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      throw new BadRequestException('El código ha expirado');
    }

    await this.usersService.update(user.id, {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return { message: 'Cuenta verificada con éxito' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Por seguridad, no decimos si el email existe o no
      return { message: 'Si el correo existe, se ha enviado un código' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await this.usersService.update(user.id, {
      verificationCode,
      verificationCodeExpires: expires,
    });

    await this.emailService.sendPasswordResetCode(email, verificationCode);
    return { message: 'Código de recuperación enviado' };
  }

  async resetPassword(data: any) {
    const user = await this.usersService.findOne(data.email);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.verificationCode !== data.code) {
      throw new BadRequestException('El código ingresado es incorrecto');
    }

    if (user.verificationCodeExpires && new Date() > user.verificationCodeExpires) {
      throw new BadRequestException('El código ha expirado');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null,
    });

    return { message: 'Contraseña restablecida correctamente' };
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
