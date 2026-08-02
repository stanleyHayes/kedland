import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";

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

export class UpdateProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "displayName must be at least 2 characters" })
  @MaxLength(100, { message: "displayName must be at most 100 characters" })
  displayName?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  avatarUrl?: string | null;
}

/**
 * The second step of a two-factor sign-in.
 *
 * Decorated, like every DTO here: the global pipe runs with
 * `forbidNonWhitelisted`, so a property with no validator is not merely
 * unchecked — it is rejected outright, and the endpoint returns "property should
 * not exist" for a field it very much requires.
 *
 * `code` is loose on purpose. It accepts either six digits or a recovery code,
 * and the two have different shapes; deciding which is which belongs in
 * `MfaService`, where a wrong code and an unknown one give the same answer.
 */
export class MfaVerifyDto {
  @ApiProperty({ description: "The challenge returned by /auth/login" })
  @IsString()
  @IsNotEmpty({ message: "challenge should not be empty" })
  challenge!: string;

  @ApiProperty({ example: "123456", description: "Six digits, or a recovery code" })
  @IsString()
  @IsNotEmpty({ message: "code should not be empty" })
  @MaxLength(64)
  code!: string;
}

/** Confirms an enrolment by proving the authenticator app works. */
export class MfaEnableDto {
  @ApiProperty({ description: "The secret from /auth/mfa/setup" })
  @IsString()
  @IsNotEmpty({ message: "secret should not be empty" })
  secret!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty({ message: "code should not be empty" })
  @MaxLength(64)
  code!: string;
}

/** Turning two-factor off needs the password, not just a session. */
export class MfaDisableDto {
  @ApiProperty({ description: "The account's current password" })
  @IsString()
  @IsNotEmpty({ message: "password should not be empty" })
  password!: string;
}
