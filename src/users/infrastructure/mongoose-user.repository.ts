import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../domain/user.entity';
import { IUserRepository, UserFilter } from '../domain/user.repository.interface';
import { UserDocument } from './user.document';
import { UserMapper } from './user.mapper';

@Injectable()
export class MongooseUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserDocument.name) private readonly model: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByTgId(tgId: string): Promise<User | null> {
    const doc = await this.model.findOne({ tgId }).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email }).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findAll(filter: UserFilter): Promise<User[]> {
    const query: any = {};

    if (filter.search) {
      query.$or = [
        { firstName: new RegExp(filter.search, 'i') },
        { lastName: new RegExp(filter.search, 'i') },
        { email: new RegExp(filter.search, 'i') },
      ];
    }

    if (filter.status) {
      query.status = filter.status;
    } else {
      query.status = { $ne: 'archived' };
    }

    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => UserMapper.toDomain(doc));
  }

  async findAdmin(): Promise<User | null> {
    const doc = await this.model
      .findOne({
        role: 'admin',
        googleTokens: { $exists: true },
      })
      .exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findAllWithGoogle(): Promise<User[]> {
    const docs = await this.model
      .find({
        googleTokens: { $exists: true },
        status: 'active',
      })
      .exec();
    return docs.map((doc) => UserMapper.toDomain(doc));
  }

  async save(user: User): Promise<User> {
    const persistence = UserMapper.toPersistence(user);
    const doc = await this.model
      .findByIdAndUpdate(user.id.toString(), { $set: persistence }, { upsert: true, new: true })
      .exec();
    return UserMapper.toDomain(doc);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.model.findOne({ googleId }).exec();
    return doc ? UserMapper.toDomain(doc) : null;
  }
}
