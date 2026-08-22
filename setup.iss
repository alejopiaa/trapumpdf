; Script de Instalación Oficial para TrapümPDF - Modo Express 1-Clic
#define MyAppName "TrapümPDF"
#define MyAppDirName "TrapumPDF"
#define MyAppVersion "1.2.0"
#define MyAppPublisher "Ilustre Municipalidad de Maipú"
#define MyAppURL "https://github.com/alejopiaa/trapumpdf"
#define MyAppExeName "index.html"

[Setup]
AppId={{D3CE1264-341C-4650-8807-8992EFDDA793}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={localappdata}\{#MyAppDirName}
DefaultGroupName={#MyAppDirName}
UsePreviousAppDir=no
UsePreviousGroup=no
DisableWelcomePage=no
DisableDirPage=yes
DisableProgramGroupPage=yes
DisableReadyPage=yes
DisableFinishedPage=no
PrivilegesRequired=lowest
OutputDir=dist
OutputBaseFilename=TrapumPDF_Setup_v{#MyAppVersion}
SetupIconFile=dist\TrapumPDF_v1.2.0\app.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Files]
Source: "dist\TrapumPDF_v1.2.0\index.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\TrapumPDF_v1.2.0\app.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\app.ico"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Abrir {#MyAppName} ahora"; Flags: shellexec postinstall unchecked

[Code]
procedure InitializeWizard;
var
  IsInstalled: Boolean;
begin
  IsInstalled := FileExists(ExpandConstant('{localappdata}\{#MyAppDirName}\index.html'));

  if IsInstalled then
  begin
    WizardForm.WelcomeLabel1.Caption := 'Actualizar / Reinstalar {#MyAppName}';
    WizardForm.WelcomeLabel2.Caption := '{#MyAppName} ya se encuentra instalado en este equipo.' + #13#10#13#10 +
      'Haga clic en el botón de abajo para actualizar o reinstalar los archivos de la aplicación.';
    WizardForm.NextButton.Caption := 'Actualizar / Reinstalar';
  end
  else
  begin
    WizardForm.WelcomeLabel1.Caption := 'Instalación de {#MyAppName}';
    WizardForm.WelcomeLabel2.Caption := 'Bienvenido al instalador de {#MyAppName} versión {#MyAppVersion}.' + #13#10#13#10 +
      'Haga clic en el botón de abajo para instalar la aplicación y crear automáticamente el acceso directo en su Escritorio.';
    WizardForm.NextButton.Caption := 'Instalar {#MyAppName}';
  end;
end;
