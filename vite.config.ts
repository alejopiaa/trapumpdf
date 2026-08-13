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
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut(\\"$desktop\\TrapümPDF.lnk\\"); $sc.TargetPath = \\"$env:LocalAppData\\TrapumPDF\\index.html\\"; if (Test-Path \\"$env:LocalAppData\\TrapumPDF\\favicon.ico\\") { $sc.IconLocation = \\"$env:LocalAppData\\TrapumPDF\\favicon.ico\\" }; $sc.Save()"

echo.
echo ¡Instalacion completada con exito! Acceso directo creado en el Escritorio.
echo.
pause
`
      const targetDir = path.resolve(baseDir, `dist/${outputFolderName}`)
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
      }
      fs.writeFileSync(path.join(targetDir, 'Instalar_TrapumPDF.bat'), batContent, 'utf-8')
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
