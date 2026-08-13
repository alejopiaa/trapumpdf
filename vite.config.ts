import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'
import path from 'path'

function generateInstallerPlugin() {
  return {
    name: 'generate-installer-bat',
    closeBundle() {
      const batContent = `@echo off
title Instalador TrapumPDF
echo Instalando TrapumPDF en tu equipo...

:: 1. Crear carpeta destino en AppData/Local
set DESTINO=%LocalAppData%\\TrapumPDF
if not exist "%DESTINO%" mkdir "%DESTINO%"

:: 2. Copiar archivos desde la ubicacion del instalador
xcopy "%~dp0*" "%DESTINO%\\" /E /Y /Q

:: 3. Crear Acceso Directo en el Escritorio del usuario
powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\TrapumPDF.lnk'); $s.TargetPath='%DESTINO%\\index.html'; $s.Save()"

echo.
echo ¡Instalacion completada con exito! Acceso directo creado en el Escritorio.
echo.
pause
`
      const baseDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : __dirname
      const distDir = path.resolve(baseDir, 'dist')
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true })
      }
      fs.writeFileSync(path.join(distDir, 'Instalar_TrapumPDF.bat'), batContent, 'utf-8')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), viteSingleFile(), generateInstallerPlugin()],
})
