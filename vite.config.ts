import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'

// Leer version dinamicamente desde package.json
const baseDir = fileURLToPath(new URL('.', import.meta.url))
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
powershell -NoProfile -ExecutionPolicy Bypass -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut(\\"$desktop\\TrapumPDF.lnk\\"); $sc.TargetPath = \\"$env:LocalAppData\\TrapumPDF\\index.html\\"; if (Test-Path \\"$env:LocalAppData\\TrapumPDF\\app.ico\\") { $sc.IconLocation = \\"$env:LocalAppData\\TrapumPDF\\app.ico\\" }; $sc.Save()"

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

      // Generar Instalador Autónomo .CMD con GUI Moderna Nativa (WPF / .NET)
      const indexPath = path.join(targetDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        const indexB64 = fs.readFileSync(indexPath).toString('base64')
        const icoB64 = icoBuf.toString('base64')

        const cmdContent = `<# :
@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$f=[IO.File]::ReadAllText('%~f0', [Text.Encoding]::UTF8); Invoke-Expression $f"
exit /b
#>

Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$appVersion = "${appVersion}"
$destFolder = "$env:LocalAppData\\TrapumPDF"
$indexPath = "$destFolder\\index.html"
$isInstalled = Test-Path $indexPath

$initialDesc = if ($isInstalled) { "TrapümPDF ya se encuentra instalado. Haga clic abajo para actualizar los archivos." } else { "Haga clic en el botón de abajo para instalar TrapümPDF y crear el acceso directo en el Escritorio." }
$initialBtnText = if ($isInstalled) { "Actualizar TrapümPDF" } else { "Instalar TrapümPDF" }

$indexPayload = @"
${indexB64}
"@

$icoPayload = @"
${icoB64}
"@

$xaml = @"
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="TrapümPDF v$appVersion"
    Width="430" Height="360"
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="#F8FAFC"
    FontFamily="Segoe UI">
    <Grid Margin="20">
        <Border Background="White" BorderBrush="#E2E8F0" BorderThickness="1" CornerRadius="16" Padding="20">
            <Border.Effect>
                <DropShadowEffect BlurRadius="20" ShadowDepth="4" Opacity="0.06" Color="#0F172A"/>
            </Border.Effect>
            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center" Width="330">
                <Border Width="48" Height="48" CornerRadius="12" Background="#6366F1" HorizontalAlignment="Center" Margin="0,0,0,8">
                    <TextBlock Text="T" Foreground="White" FontSize="24" FontWeight="ExtraBold" HorizontalAlignment="Center" VerticalAlignment="Center"/>
                </Border>
                
                <StackPanel Orientation="Horizontal" HorizontalAlignment="Center" Margin="0,0,0,4">
                    <TextBlock Text="TRAPÜM" FontSize="18" FontWeight="ExtraBold" Foreground="#0F172A"/>
                    <TextBlock Text="PDF" FontSize="18" FontWeight="ExtraBold" Foreground="#6366F1"/>
                </StackPanel>
                
                <Border Background="#EDE9FE" BorderBrush="#DDD6FE" BorderThickness="1" CornerRadius="10" Padding="8,2" HorizontalAlignment="Center" Margin="0,0,0,12">
                    <TextBlock Text="Versión $appVersion" FontSize="11" FontWeight="Bold" Foreground="#6D28D9"/>
                </Border>
                
                <TextBlock Name="txtDesc" Text="$initialDesc" FontSize="12" Foreground="#64748B" TextWrapping="Wrap" TextAlignment="Center" Margin="0,0,0,16" LineHeight="18"/>
                
                <ProgressBar Name="pBar" Height="7" Foreground="#6366F1" Background="#E2E8F0" BorderThickness="0" Margin="0,0,0,8" Visibility="Collapsed"/>
                <TextBlock Name="txtStatus" Text="Instalando..." FontSize="11" FontWeight="SemiBold" Foreground="#6366F1" HorizontalAlignment="Center" Margin="0,0,0,12" Visibility="Collapsed"/>

                <Button Name="btnAction" Content="$initialBtnText" Height="40" Background="#6366F1" Foreground="White" FontWeight="Bold" FontSize="13" Cursor="Hand" BorderThickness="0">
                    <Button.Resources>
                        <Style TargetType="Border">
                            <Setter Property="CornerRadius" Value="10"/>
                        </Style>
                    </Button.Resources>
                </Button>
            </StackPanel>
        </Border>
    </Grid>
</Window>
"@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window = [System.Windows.Markup.XamlReader]::Load($reader)

$btnAction = $window.FindName("btnAction")
$txtDesc = $window.FindName("txtDesc")
$pBar = $window.FindName("pBar")
$txtStatus = $window.FindName("txtStatus")

$script:step = "install"

$btnAction.Add_Click({
    if ($script:step -eq "install") {
        $btnAction.IsEnabled = $false
        $btnAction.Visibility = [System.Windows.Visibility]::Collapsed
        $pBar.Visibility = [System.Windows.Visibility]::Visible
        $txtStatus.Visibility = [System.Windows.Visibility]::Visible
        $pBar.Value = 30

        if (-not (Test-Path $destFolder)) {
            New-Item -ItemType Directory -Path $destFolder -Force | Out-Null
        }
        
        $pBar.Value = 60
        [IO.File]::WriteAllBytes("$destFolder\\index.html", [Convert]::FromBase64String($indexPayload))
        [IO.File]::WriteAllBytes("$destFolder\\app.ico", [Convert]::FromBase64String($icoPayload))
        
        $pBar.Value = 85
        $ws = New-Object -ComObject WScript.Shell
        $desktop = [Environment]::GetFolderPath('Desktop')
        $sc = $ws.CreateShortcut("$desktop\\TrapümPDF.lnk")
        $sc.TargetPath = "$destFolder\\index.html"
        $sc.IconLocation = "$destFolder\\app.ico"
        $sc.Save()

        $pBar.Value = 100
        $pBar.Visibility = [System.Windows.Visibility]::Collapsed
        $txtStatus.Visibility = [System.Windows.Visibility]::Collapsed

        $txtDesc.Text = "¡TrapümPDF se instaló con éxito en su equipo!"
        $btnAction.Content = "Abrir TrapümPDF"
        $btnAction.Background = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#10B981")
        $btnAction.Visibility = [System.Windows.Visibility]::Visible
        $btnAction.IsEnabled = $true
        $script:step = "open"
    }
    elseif ($script:step -eq "open") {
        Start-Process "$destFolder\\index.html"
        $window.Close()
    }
})

$window.ShowDialog() | Out-Null
`

        fs.writeFileSync(path.join(targetDir, 'Instalar_TrapumPDF.cmd'), cmdContent, 'utf-8')
        const distRoot = path.resolve(baseDir, 'dist')
        fs.writeFileSync(path.join(distRoot, 'Instalar_TrapumPDF.cmd'), cmdContent, 'utf-8')
      }

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
