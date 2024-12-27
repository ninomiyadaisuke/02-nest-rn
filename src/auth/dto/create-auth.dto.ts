import { IsNotEmpty } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'ユーザーネームが空欄です。' })
  email: string;
  @IsNotEmpty({ message: 'パスワードが空欄です。' })
  password: string;
}
