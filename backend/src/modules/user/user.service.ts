import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument, UserStatus } from '../../database/schemas/user.schema';
import { Role, RoleDocument } from '../../database/schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: createUserDto.email });
    if (existing) throw new ConflictException(`User with email ${createUserDto.email} already exists`);

    const companyEmail = this.generateCompanyEmail(
      createUserDto.firstName,
      createUserDto.lastName,
    );

    const hashedPassword = await bcrypt.hash(
      createUserDto.password || this.generateTempPassword(),
      12,
    );

    const user = new this.userModel({
      ...createUserDto,
      companyEmail,
      password: hashedPassword,
      status: UserStatus.PENDING,
    });

    const saved = await user.save();
    this.logger.log(`Created user: ${saved.email} (${saved._id})`);
    return saved;
  }

  async findAll(query: { page?: number; limit?: number; role?: string; department?: string }) {
    const { page = 1, limit = 20, role, department } = query;
    const filter: any = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateUserDto }, { new: true })
      .exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserDocument> {
    return this.update(id, { status } as any);
  }

  async softDelete(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { $set: { isActive: false, status: UserStatus.INACTIVE, endDate: new Date() } },
        { new: true },
      )
      .exec();
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async addProvisionedService(userId: string, service: string, externalId?: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { provisionedServices: service },
        ...(externalId ? { $set: { [`externalIds.${service}`]: externalId } } : {}),
      })
      .exec();
  }

  async removeProvisionedService(userId: string, service: string) {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $pull: { provisionedServices: service },
        $unset: { [`externalIds.${service}`]: '' },
      })
      .exec();
  }

  private generateCompanyEmail(firstName: string, lastName: string): string {
    const domain = this.configService.get<string>('COMPANY_EMAIL_DOMAIN', 'company.com');
    const base = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '.');
    return `${base}@${domain}`;
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4).toUpperCase();
  }
}
