## DCS World Scripting Sandbox

### Overview

DCS World uses a **Lua scripting sandbox** to restrict what mission and mod scripts are allowed to access at runtime. This sandbox is intended to prevent scripts from performing unsafe actions such as unrestricted file access, operating system calls, or network operations.

This mod includes **Lua scripts that execute before the DCS scripting sandbox is applied**.

### What This Means

Because these scripts run **prior to sandbox enforcement**, they may have access to Lua standard libraries and functions that are normally restricted once the sandbox is active. This can include (but is not limited to):

* File system access
* Operating system functions
* Lua module loading
* Broader interaction with the DCS scripting environment

This behavior is not inherently malicious, but it **bypasses the protections normally provided by the DCS sandbox**.

### Security Considerations

Installing any mod that executes unsandboxed scripts carries inherent risk. You should only install this mod if you:

* Trust the source of the mod
* Understand the implications of unsandboxed script execution
* Are comfortable reviewing Lua scripts yourself

Neither Eagle Dynamics nor the DCS sandbox can restrict scripts that execute before sandbox initialization.

### Disclaimer

Use this mod at your own risk. The authors make no guarantees regarding security, system integrity, or compatibility. By installing this mod, you acknowledge that it contains scripts that execute outside the standard DCS scripting sandbox.
