import sharp from 'sharp';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, extname, parse } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const root = join(__dirname, '..');

const quality = 75;

const sources = [
  { dir: join(root, 'src', 'assets'), pattern: /\.(png|jpe?g)$/i },
  { dir: join(root, 'public'), pattern: /\.(png|jpe?g)$/i },
];

async function optimize() {
  for (const source of sources) {
    if (!existsSync(source.dir)) continue;
    const files = readdirSync(source.dir).filter(f => source.pattern.test(f));
    for (const file of files) {
      const inputPath = join(source.dir, file);
      const { name } = parse(file);
      const outputName = name + '.webp';
      const outputPath = join(source.dir, outputName);

      try {
        const inputBuf = readFileSync(inputPath);
        const outputBuf = await sharp(inputBuf)
          .webp({ quality })
          .toBuffer();

        writeFileSync(outputPath, outputBuf);
        const inKB = (inputBuf.length / 1024).toFixed(0);
        const outKB = (outputBuf.length / 1024).toFixed(0);
        console.log(`  ${file} (${inKB}KB) -> ${outputName} (${outKB}KB)`);
      } catch (err) {
        console.error(`  Failed ${file}:`, err.message);
      }
    }
  }
}

console.log('Optimizing images...');
optimize().then(() => console.log('Done!'));
