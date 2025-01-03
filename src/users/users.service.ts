import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schemas';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { ChangePasswordAuthDto, CodeAuthDto, CreateAuthDto } from '@/auth/dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerServece: MailerService,
  ) { }

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    if (user) {
      return true;
    }
    return false;
  };
  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;
    const hashPassword = await hashPasswordHelper(password);
    // check email
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`${email}はすでに登録済みです。`);
    }
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      image,
    });
    return {
      _id: user._id,
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    if (!current) current = 1;
    if (!pageSize) pageSize = 10;
    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password')
      .sort(sort as any);
    return { results, totalPages };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id },
      { ...updateUserDto },
    );
  }

  async remove(_id: string) {
    // check id
    if (mongoose.isValidObjectId(_id)) {
      // delete
      return this.userModel.deleteOne({ _id });
    } else {
      throw new BadRequestException('_idが不正です。');
    }
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    // check email
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`${email}はすでに登録済みです。`);
    }

    // hash password
    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuidv4();
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      isActive: false,
      codeId,
      codeExpired: dayjs().add(10, 'minutes'),
    });
    // send email

    this.mailerServece.sendMail({
      to: user.email, // list of receivers
      subject: 'Active your account', // Subject line
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId, // variable to be replaced in template
      },
    });

    return {
      _id: user._id,
    };

  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.userModel.findOne({
      codeId: data.code,
      _id: data._id,
    });
    if (!user) {
      throw new BadRequestException('無効なコードです。');
    }

    // check expre code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      // valid update user
      await this.userModel.updateOne({
        _id: data._id,
      },
        { isActive: true },
      );
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('有効期限が切れています。');
    }
  }
  async retryActive(email: string) {
    // check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('アカウントが存在しません。');
    }

    if (user.isActive) {
      throw new BadRequestException('アカウントは既に有効です。');
    }
    // send Email
    const codeId = uuidv4();

    // update codeId and expiredTime
    await user.updateOne({
      codeId,
      codeExpired: dayjs().add(10, 'minutes'),
    });
    this.mailerServece.sendMail({
      to: user.email, // list of receivers
      subject: 'Active your account', // Subject line
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId, // variable to be replaced in template
      },
    });
    return { _id: user._id };
  }

  async retryPassword(email: string) {
    // check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('アカウントが存在しません。');
    }

    // send Email
    const codeId = uuidv4();

    // update codeId and expiredTime
    await user.updateOne({
      codeId,
      codeExpired: dayjs().add(10, 'minutes'),
    });
    this.mailerServece.sendMail({
      to: user.email, // list of receivers
      subject: 'Active your account', // Subject line
      template: 'register',
      context: {
        name: user.name ?? user.email,
        activationCode: codeId, // variable to be replaced in template
      },
    });
    return { _id: user._id, email: user.email };
  }

  async changePassword(data: ChangePasswordAuthDto) {
    const { email, password, confirmPassword } = data;
    if (password !== confirmPassword) {
      throw new BadRequestException('パスワードが一致しません。');
    }
    // check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('アカウントが存在しません。');
    }

    // check expre code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);
    if (isBeforeCheck) {
      // valid update password
      const newPassword = await hashPasswordHelper(password);
      await user.updateOne({ password: newPassword });
      return { isBeforeCheck };
    } else {
      throw new BadRequestException('有効期限が切れています。');
    }
  }
}
