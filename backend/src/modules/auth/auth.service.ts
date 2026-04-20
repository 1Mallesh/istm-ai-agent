import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../database/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAdmin: user.isAdmin,
      },
    };
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  async createAdminUser(email: string, password: string, firstName: string, lastName: string) {
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new ConflictException('Admin user already exists');

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      department: 'IT',
      jobTitle: 'System Administrator',
      isAdmin: true,
      status: 'active',
    });

    await admin.save();
    return { message: 'Admin user created successfully' };
  }
}
