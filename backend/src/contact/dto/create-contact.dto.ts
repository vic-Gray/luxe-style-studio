import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

export class ContactDto {
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;
}
