import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * A strong-password floor.
 *
 * Twelve characters rather than the usual eight, and no composition rules:
 * length is what actually resists guessing, and "must contain a symbol" mostly
 * produces `Password1!`. Build package §5.4 asks for strong passwords on the
 * dashboard because uncontrolled access is what killed the previous site.
 */
export const MIN_PASSWORD_LENGTH = 12;

export class LoginDto {
  @ApiProperty({ example: "office@kedland.edu.gh" })
  @IsEmail({}, { message: "email must be a valid email address" })
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "password should not be empty" })
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "refreshToken should not be empty" })
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail({}, { message: "email must be a valid email address" })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "token should not be empty" })
  token!: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `password must be at least ${String(MIN_PASSWORD_LENGTH)} characters`,
  })
  password!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: "currentPassword should not be empty" })
  currentPassword!: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH, {
    message: `newPassword must be at least ${String(MIN_PASSWORD_LENGTH)} characters`,
  })
  newPassword!: string;
}
