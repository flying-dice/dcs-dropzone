#ifndef MyAppVersion
  #define MyAppVersion "0.0.0"
#endif

[Setup]
AppId={{561d4505-556e-4198-8f35-99c6e08d475d}
AppName=DCS Dropzone
AppVersion={#MyAppVersion}
AppPublisher=Flying Dice
AppPublisherURL=https://github.com/flying-dice/dcs-dropzone
DefaultDirName={localappdata}\DCSDropzone
DefaultGroupName=DCS Dropzone
OutputDir=dist
OutputBaseFilename=Dropzone_Setup
SetupIconFile=icon.ico
Compression=lzma
SolidCompression=yes
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "dist\Dropzone_Launcher.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "uninstall.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\DCS Dropzone"; Filename: "{app}\Dropzone_Launcher.exe"; WorkingDir: "{app}"; IconFilename: "{app}\Dropzone_Launcher.exe"
Name: "{userdesktop}\DCS Dropzone"; Filename: "{app}\Dropzone_Launcher.exe"; WorkingDir: "{app}"; IconFilename: "{app}\Dropzone_Launcher.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\Dropzone_Launcher.exe"; Description: "Launch DCS Dropzone"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\*"
Type: dirifempty; Name: "{app}"

[UninstallRun]
Filename: "{cmd}"; Parameters: "/c ""{app}\uninstall.bat"" ""{app}"""; WorkingDir: "{%TEMP}"; Flags: runhidden waituntilterminated; RunOnceId: "CleanupAppData"; Check: UninstallBatExists

[Code]
function UninstallBatExists(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\uninstall.bat'));
end;
