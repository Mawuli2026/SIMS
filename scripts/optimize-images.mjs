import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = resolve(projectRoot, "public");
const outputDirectory = resolve(publicDirectory, "assets", "media");

await mkdir(outputDirectory, { recursive: true });

const assets = [
  {
    input: resolve(publicDirectory, "Sims-background.png"),
    output: resolve(outputDirectory, "sims-background-v1.webp"),
    transform: (image) => image.webp({ quality: 76, effort: 6, smartSubsample: true }),
  },
  {
    input: resolve(publicDirectory, "Sims-background.png"),
    output: resolve(outputDirectory, "sims-background-768-v1.webp"),
    transform: (image) => image
      .resize({ width: 768, withoutEnlargement: true })
      .webp({ quality: 74, effort: 6, smartSubsample: true }),
  },
  {
    input: resolve(publicDirectory, "sims-logo.png"),
    output: resolve(outputDirectory, "sims-logo-v1.webp"),
    transform: (image) => image
      .resize({ width: 320, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6, smartSubsample: true }),
  },
];

for (const asset of assets) {
  await asset.transform(sharp(asset.input)).toFile(asset.output);
  const source = await stat(asset.input);
  const optimized = await stat(asset.output);
  const reduction = Math.round((1 - optimized.size / source.size) * 100);
  console.log(`${asset.output.replace(`${projectRoot}\\`, "")}: ${optimized.size} bytes (${reduction}% smaller than source)`);
}
