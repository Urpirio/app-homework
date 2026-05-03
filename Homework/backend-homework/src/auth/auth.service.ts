import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

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

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      institutionId: user.institutionId 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        identityCode,
        institutionId: user.institutionId,
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
      role: Role.STUDENT, // Por defecto al registrarse libremente
    });

    // Enviar correo real con Resend
    await this.emailService.sendVerificationCode(data.email, verificationCode);

    // Generar código de identidad único
    const identityCode = await this.usersService.generateIdentityCode(newUser.id);

    const { password, ...result } = newUser;
    return { ...result, identityCode };
  }

  async registerInstitutionalUser(data: any, adminUser: any) {
    if (adminUser.role !== Role.SCHOOL_ADMIN && adminUser.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('No tienes permisos para crear usuarios institucionales');
    }

    const institutionId = adminUser.institutionId || data.institutionId;
    if (!institutionId) {
      throw new BadRequestException('Se requiere un ID de institución');
    }

    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password || 'temp1234', salt); // Contraseña temporal por defecto

    const newUser = await this.usersService.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
      role: data.role as Role,
      institution: { connect: { id: institutionId } },
      isVerified: true, // Usuarios creados por admin se marcan como verificados
    });

    // Generar código de identidad único
    const identityCode = await this.usersService.generateIdentityCode(newUser.id);

    const { password: _, ...result } = newUser;
    return { ...result, identityCode };
  }

  async verifyCode(email: string, code: string, isReset: boolean = false) {
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

    if (!isReset) {
      await this.usersService.update(user.id, {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      });
    }

    return { message: 'Código verificado con éxito' };
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
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Auto-generar identityCode si el usuario no tiene uno (usuarios legacy)
    if (!user.identityCode) {
      await this.usersService.generateIdentityCode(userId);
    }

    if (user.role === Role.STUDENT) {
      return this.usersService.getStudentProfile(userId);
    } else if (user.role === Role.TEACHER) {
      return this.usersService.getTeacherProfile(userId);
    }

    const stats = await this.usersService.getUserStats(userId);
    const { password, ...result } = user;
    return { ...result, stats };
  }

  async updateProfile(userId: string, data: any) {
    const updatedUser = await this.usersService.update(userId, {
      fullName: data.fullName,
      email: data.email,
      role: data.role as Role,
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
