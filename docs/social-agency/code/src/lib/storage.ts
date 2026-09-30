import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * MVP/本地开发阶段的文件存储:直接写到 public/uploads,靠 Next.js 的静态资源服务对外提供 URL。
 * 见 docs/20260927-详细设计.md M2:生产环境要换成 S3/Cloudflare R2 之类的对象存储,
 * 这里先占位保证功能能跑通——换存储只用改这一个文件,调用方(Server Action)不用动。
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB,对应 verify.sh 里的"资源约束"检查项

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

export class UploadError extends Error {}

export async function saveUploadedImage(file: File, prefix: string): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new UploadError(`不支持的图片格式:${file.type}`)
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadError('图片大小超过 5MB 限制')
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${prefix}-${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await writeFile(path.join(UPLOAD_DIR, filename), buffer)

  return `/uploads/${filename}`
}
