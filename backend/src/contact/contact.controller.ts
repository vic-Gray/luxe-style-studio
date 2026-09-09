import { Body, Controller, Post } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { ContactDto } from "./dto/create-contact.dto";

@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendMessage(@Body() contactDto: ContactDto) {
    return this.contactService.sendContactEmail(contactDto);
  }
}
