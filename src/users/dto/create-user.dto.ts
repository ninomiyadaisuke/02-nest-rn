import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'nameは必須項目です。' })
  name: string;

  @IsNotEmpty({ message: 'emailはï必須項目です。' })
  @IsEmail({}, { message: 'Invalid email message' })
  email: string;
  @IsNotEmpty({ message: 'passwordは必須項目です。' })
  password: string;

  phone: string;
  address: string;
  image: string;
}
