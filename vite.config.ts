import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'
import path from 'path'

// Leer version dinamicamente desde package.json
const baseDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : __dirname
const pkgPath = path.resolve(baseDir, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
const appVersion = pkg.version || '1.1.0'
const outputFolderName = `TrapumPDF_v${appVersion}`

function createAppIcoBuffer(): Buffer {
  const width = 32
  const height = 32
  const bpp = 32
  const imageSize = width * height * 4 + 40 + (width * height / 8)
  const headerSize = 6 + 16
  const totalSize = headerSize + imageSize
  const buf = Buffer.alloc(totalSize)

  // ICO Header
  buf.writeUInt16LE(0, 0)
  buf.writeUInt16LE(1, 2)
  buf.writeUInt16LE(1, 4)

  // Directory Entry
  buf.writeUInt8(width, 6)
  buf.writeUInt8(height, 7)
  buf.writeUInt8(0, 8)
  buf.writeUInt8(0, 9)
  buf.writeUInt16LE(1, 10)
  buf.writeUInt16LE(bpp, 12)
  buf.writeUInt32LE(imageSize, 14)
  buf.writeUInt32LE(headerSize, 18)

  // BITMAPINFOHEADER (40 bytes)
  let offset = headerSize
  buf.writeUInt32LE(40, offset)
  buf.writeInt32LE(width, offset + 4)
  buf.writeInt32LE(height * 2, offset + 8)
  buf.writeUInt16LE(1, offset + 12)
  buf.writeUInt16LE(bpp, offset + 14)
  buf.writeUInt32LE(0, offset + 16)
  buf.writeUInt32LE(imageSize - 40, offset + 20)

  offset += 40

  // Pixel Data (32x32 BGRA, stored bottom-to-top)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Rounded corners check
      let isCorner = false
      if ((x < 5 && y < 5 && (x - 5) ** 2 + (y - 5) ** 2 > 25) ||
          (x > 26 && y < 5 && (x - 26) ** 2 + (y - 5) ** 2 > 25) ||
          (x < 5 && y > 26 && (x - 5) ** 2 + (y - 26) ** 2 > 25) ||
          (x > 26 && y > 26 && (x - 26) ** 2 + (y - 26) ** 2 > 25)) {
        isCorner = true
      }

      // Check if inside "T" Monogram
      const isTopBar = (y >= 21 && y <= 24 && x >= 7 && x <= 24)
      const isStem = (y >= 7 && y <= 20 && x >= 13 && x <= 18)
      const isT = isTopBar || isStem

      if (isCorner) {
        buf.writeUInt8(0, offset)
        buf.writeUInt8(0, offset + 1)
        buf.writeUInt8(0, offset + 2)
        buf.writeUInt8(0, offset + 3)
      } else if (isT) {
        buf.writeUInt8(255, offset)
        buf.writeUInt8(255, offset + 1)
        buf.writeUInt8(255, offset + 2)
        buf.writeUInt8(255, offset + 3)
      } else {
        // Cyan #0284C7 -> B: 0xC7 (199), G: 0x84 (132), R: 0x02 (2)
        buf.writeUInt8(0xc7, offset)
        buf.writeUInt8(0x84, offset + 1)
        buf.writeUInt8(0x02, offset + 2)
        buf.writeUInt8(255, offset + 3)
      }
      offset += 4
    }
  }

  return buf
}

function generateInstallerPlugin() {
  return {
    name: 'generate-installer-bat',
    closeBundle() {
      const batContent = `@echo off
title Instalador TrapumPDF v${appVersion}
echo Instalando TrapumPDF v${appVersion} en tu equipo...

:: 1. Definir rutas
set "DESTINO=%LocalAppData%\\TrapumPDF"
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: 2. Copiar archivos excluyendo el propio instalador .bat
robocopy "%~dp0." "%DESTINO%" /E /XF "Instalar_TrapumPDF.bat" /NJH /NJS /NDL /NC /NS >nul 2>&1

:: 3. Crear Acceso Directo oficial en el Escritorio con icono
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut(\\"$desktop\\TrapumPDF.lnk\\"); $sc.TargetPath = \\"$env:LocalAppData\\TrapumPDF\\index.html\\"; if (Test-Path \\"$env:LocalAppData\\TrapumPDF\\app.ico\\") { $sc.IconLocation = \\"$env:LocalAppData\\TrapumPDF\\app.ico\\" } else if (Test-Path \\"$env:LocalAppData\\TrapumPDF\\favicon.ico\\") { $sc.IconLocation = \\"$env:LocalAppData\\TrapumPDF\\favicon.ico\\" }; $sc.Save()"

echo.
echo ¡Instalacion completada con exito! Acceso directo creado en el Escritorio.
echo.
pause
`
      const targetDir = path.resolve(baseDir, `dist/${outputFolderName}`)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      const icoBuf = createAppIcoBuffer()
      fs.writeFileSync(path.join(targetDir, 'app.ico'), icoBuf)
      fs.writeFileSync(path.join(targetDir, 'favicon.ico'), icoBuf)
      fs.writeFileSync(path.join(targetDir, 'Instalar_TrapumPDF.bat'), batContent, 'utf-8')

      // Guardar también en public para desarrollo
      const publicDir = path.resolve(baseDir, 'public')
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(path.join(publicDir, 'app.ico'), icoBuf)
        fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), viteSingleFile(), generateInstallerPlugin()],
  build: {
    outDir: `dist/${outputFolderName}`,
    emptyOutDir: true,
  },
})
