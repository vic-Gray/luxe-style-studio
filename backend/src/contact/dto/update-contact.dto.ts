import { PartialType } from "@nestjs/swagger";
import { ContactDto } from "./create-contact.dto";

export class UpdateContactDto extends PartialType(ContactDto) {}
