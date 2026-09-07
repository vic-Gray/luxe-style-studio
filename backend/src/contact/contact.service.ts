import { Injectable, InternalServerErrorException } from "@nestjs/common";
import nodemailer from "nodemailer";
import { ContactDto } from "./dto/create-contact.dto";

@Injectable()
export class ContactService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });
  }

  async sendContactEmail(contactDto: ContactDto) {
    const { name, email, message } = contactDto;

    try {
      await this.transporter.sendMail({
        from: `"Matteekay Website" <${process.env.BREVO_SMTP_USER}>`,
        to: process.env.CONTACT_RECEIVER_EMAIL,
        replyTo: email,
        subject: `New Contact Message from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Contact Message</h2>

            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>

            <h3>Message:</h3>
            <p>${message}</p>
          </div>
        `,
      });

      return {
        success: true,
        message: "Message sent successfully",
      };
    } catch (error) {
      console.error("Brevo error:", error);

      throw new InternalServerErrorException("Failed to send message");
    }
  }
}
