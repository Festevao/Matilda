import { Injectable, Scope } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import path from 'path';

enum WppClientStatus {
  INITIALIZING = 0,
  AUTHENTICATING = 1,
  AUTHENTICATION_SUCCESS = 2,
  AUTHENTICATION_FAILED = 3,
  READY = 4,
  DISCONNECTED = 5,
}

class WppClient extends Client {
  constructor(readonly clientId: string) {
    super({
      authStrategy: new LocalAuth({
        clientId,
        dataPath: path.join(__dirname, '/session'),
      }),
      puppeteer: {
        headless: true,
      },
    });
  }
  qr: string;
  status: WppClientStatus = 0;
}

@Injectable({ scope: Scope.DEFAULT, durable: true })
class WppService {
  client: WppClient;
  numberToNotify: any;
  constructor() {
    try {
      console.log('init bot');
      this.numberToNotify = JSON.parse(process.env.WPP_TO);
      this.init('JaoEugenio');
    } catch (error) {
      console.error(error);
    }
  }

  init(client_id: string) {
    const newClient = new WppClient(client_id);

    newClient.on('qr', (qr) => {
      try {
        newClient.qr = qr;
        newClient.status = 1;
        console.log(`WPP CLIENT | ${client_id} QR RECEIVED`, qr);
        qrcode.generate(qr, { small: true });
      } catch (error) {
        console.error(error);
      }
    });

    newClient.on('authenticated', () => {
      newClient.status = 2;
      console.log(`WPP CLIENT | ${client_id} AUTHENTICATED`);
    });

    newClient.on('auth_failure', (message) => {
      newClient.status = 3;
      console.log(
        `WPP CLIENT | ${client_id} AUTHENTICATION FAILED with message: ${message}`
      );
    });

    newClient.on('ready', () => {
      newClient.status = 4;
      console.log(`WPP CLIENT | ${client_id} Client is ready!`);
    });

    newClient.on('disconnected', (reason) => {
      newClient.status = 5;
      console.log(
        `WPP CLIENT | ${client_id} Client disconnected by the reason: ${reason}`
      );
    });

    newClient.on('message', async (msg) => {
      if (msg.body === '!kill') {
        process.exit();
      } else if (msg.body === '!ping') {
        let image;
        try {
          image = MessageMedia.fromFilePath(path.join(__dirname, '.tmp/old.png'));
        } catch {
          image = MessageMedia.fromFilePath(path.join(__dirname, '.tmp/atual.png'));
        }
        try {
          await msg.reply(image, undefined, { caption: 'ATUAL' });
        } catch (error) {
          console.error(error);
        }
      }
    });

    this.client = newClient;
    try {
      newClient.initialize();
    } catch (error) {
      console.error(`WPP CLIENT | ${client_id} Error on initialize:`, error);
    }
  }

  async sendNotification(oldBase64: string, newBase64: string) {
    try {
      const msgOld = MessageMedia.fromFilePath(oldBase64);
      const msgNew = MessageMedia.fromFilePath(newBase64);

      this.numberToNotify.forEach((element) => {
        this.client.sendMessage(element, msgOld, { caption: 'ANTIGO' });
        this.client.sendMessage(element, msgNew, { caption: 'ATUAL' });
      });
    } catch (error) {
      console.error(error);
    }
  }

  async timeOutNotification(lastBase64: string) {
    try {
      const msgLast = MessageMedia.fromFilePath(lastBase64);

      this.numberToNotify.forEach((element) => {
        this.client.sendMessage(element, msgLast, {
          caption: 'FALHA AO ESPERAR POR UM SELETOR, ESSE É UM PRINT ATUAL DA PÁGINA',
        });
      });
    } catch (error) {
      console.error(error);
    }
  }
}

export { WppService };
