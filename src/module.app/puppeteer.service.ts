import { Injectable } from '@nestjs/common';
import { WhatcherService } from './whatcher.service';
import { MailService } from './mail.service';
import { WppService } from './wpp.service';
import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer';

@Injectable()
class PuppeteerService {
  private tmpFolderPath = path.join(__dirname, '.tmp');
  private scrnShotPath = path.join(this.tmpFolderPath, 'atual.png');
  private oldScrnShotPath = path.join(this.tmpFolderPath, 'old.png');
  constructor(
    private whatcherService: WhatcherService,
    private mailService: MailService,
    private wppService: WppService
  ) {
    const selectors = JSON.parse(process.env.SELECTORS_TO_WATCH);
    const url = process.env.URL_TOWATCH;
    setInterval(() => {
      this.isChangged(url, selectors);
    }, 150000);
  }

  async notifyChange(path1: string, path2: string) {
    const base64_1 = fs.readFileSync(path1, { encoding: 'base64' });
    const base64_2 = fs.readFileSync(path2, { encoding: 'base64' });
    console.log(base64_1.substring(0, 100));
    await this.wppService.sendNotification(path1, path2);
    await this.mailService.sendNotification(base64_1, base64_2);
  }

  async notifyTimeOut(path1: string) {
    const base64_1 = fs.readFileSync(path1, { encoding: 'base64' });
    console.log(base64_1.substring(0, 100));
    await this.wppService.timeOutNotification(path1);
    await this.mailService.timeOutNotification(base64_1);
  }

  async isChangged(url: string, selectors: string[]) {
    if (fs.existsSync(this.scrnShotPath)) {
      if (fs.existsSync(this.oldScrnShotPath)) {
        fs.unlinkSync(this.oldScrnShotPath);
      }
      fs.renameSync(this.scrnShotPath, this.oldScrnShotPath);
    }
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url);
    try {
      for (let i = 0; i < selectors.length; i++) {
        await page.waitForSelector(selectors[i]);
      }
      await page.screenshot({ path: this.scrnShotPath, fullPage: true });
      await browser.close();
      if (fs.existsSync(this.oldScrnShotPath)) {
        const diff = await this.whatcherService.compare(
          this.oldScrnShotPath,
          this.scrnShotPath
        );
        if (diff < 100) {
          await this.notifyChange(this.oldScrnShotPath, this.scrnShotPath);
        }
      }
    } catch (error) {
      await page.screenshot({ path: this.scrnShotPath, fullPage: true });
      await browser.close();
      await this.notifyTimeOut(this.scrnShotPath);
    }
  }
}

export { PuppeteerService };
