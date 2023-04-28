import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
class MailService {
  private notifyEmails: any;
  private watchUrl: string;
  private from: any;
  constructor(private mailService: MailerService) {
    try {
      this.notifyEmails = JSON.parse(process.env.SMTP_TO);
      this.from = process.env.SMTP_FROM;
      this.watchUrl = process.env.URL_TOWATCH;
    } catch (error) {
      console.error(error);
    }
  }

  async sendNotification(oldBase64: string, newBase64: string) {
    try {
      if (!this.notifyEmails || !this.from) return;

      await this.mailService.sendMail({
        to: this.notifyEmails,
        from: this.from,
        subject: `Change detected on ${this.watchUrl}`,
        template: 'page_change',
        context: {
          oldBase64,
          newBase64,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  async timeOutNotification(lastBase64: string) {
    try {
      if (!this.notifyEmails || !this.from) return;

      await this.mailService.sendMail({
        to: this.notifyEmails,
        from: this.from,
        subject: `Change detected on ${this.watchUrl}`,
        template: 'time_out_selectors',
        context: {
          lastBase64,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
export { MailService };
