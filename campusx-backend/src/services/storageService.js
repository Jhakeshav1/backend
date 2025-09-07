import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

export async function uploadFile(fileBuffer, filename) {
  const id = uuidv4();
  const safeName = `${id}_${filename.replace(/\s+/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.promises.writeFile(filePath, fileBuffer);
  const publicUrl = `/uploads/${safeName}`;
  return { url: publicUrl, path: filePath };
}
