import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'emailが空欄です。' })
  email: string;
  @IsNotEmpty({ message: 'パスワードが空欄です。' })
  password: string;

  @IsOptional()
  name: string;
}

export class CodeAuthDto {
  @IsNotEmpty({ message: 'idが空欄です。' })
  _id: string;
  @IsNotEmpty({ message: 'codeが空欄です。' })
  code: string;
}

export class ChangePasswordAuthDto {
  @IsNotEmpty({ message: 'codeが空欄です。' })
  code: string;
  @IsNotEmpty({ message: 'passwordが空欄です。' })
  password: string;
  @IsNotEmpty({ message: 'confirmPasswordが空欄です。' })
  confirmPassword: string;
  @IsNotEmpty({ message: 'emailが空欄です。' })
  email: string;
}
