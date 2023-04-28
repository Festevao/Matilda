import { Injectable } from '@nestjs/common';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'fs';
import path from 'path';

@Injectable()
class WhatcherService {
  private tmpFolderPath = path.join(__dirname, '.tmp');
  private diffPath = path.join(this.tmpFolderPath, 'diff.png');

  async compare(path1: string, path2: string) {
    const img1 = PNG.sync.read(fs.readFileSync(path1));
    const img2 = PNG.sync.read(fs.readFileSync(path2));
    const { width, height } = img1;
    const diff = new PNG({ width, height });

    const difference = pixelmatch(img1.data, img2.data, diff.data, width, height, {
      threshold: 0.1,
    });

    fs.writeFileSync(this.diffPath, PNG.sync.write(diff));

    const compatibility = 100 - (difference * 100) / (width * height);

    return compatibility;
  }
}
export { WhatcherService };
