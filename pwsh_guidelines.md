# PowerShell (pwsh) Command Guidelines

## Introduction and Purpose

This document serves as a comprehensive guideline for using PowerShell Core (pwsh) commands correctly. It ensures consistency, adherence to best practices, and proper syntax when working with PowerShell in the context of the "Dusk and Dawn" project.

## PowerShell Core vs Windows PowerShell

PowerShell Core (pwsh) is the cross-platform version of PowerShell built on .NET Core, while Windows PowerShell is the original Windows-only version built on .NET Framework.

Key differences:
- PowerShell Core uses the `pwsh` command to launch, Windows PowerShell uses `powershell`
- PowerShell Core is cross-platform (Windows, macOS, Linux)
- PowerShell Core may lack some Windows-specific modules available in Windows PowerShell
- PowerShell Core has newer features and improvements not available in Windows PowerShell

When specifying commands, always use PowerShell Core (pwsh) syntax unless explicitly required otherwise.

## Command Naming Conventions

PowerShell commands follow a strict Verb-Noun naming convention:

- **Verb**: Describes the action the command performs
- **Noun**: Describes the resource the command acts upon
- Example: `Get-Process`, `New-Item`, `Set-Content`

Always use PascalCase for both the verb and noun components.

## Approved Verbs

PowerShell has a specific set of approved verbs. Use `Get-Verb` to see the full list. Common approved verbs include:

| Verb Group | Verbs |
|------------|-------|
| Common     | Add, Clear, Close, Copy, Enter, Exit, Find, Format, Get, Hide, Join, Lock, Move, New, Open, Optimize, Pop, Push, Redo, Remove, Rename, Reset, Resize, Search, Select, Set, Show, Skip, Split, Step, Switch, Undo, Unlock, Watch |
| Data       | Backup, Checkpoint, Compare, Compress, Convert, ConvertFrom, ConvertTo, Dismount, Edit, Expand, Export, Import, Initialize, Limit, Merge, Mount, Out, Publish, Restore, Save, Sync, Unpublish, Update |
| Lifecycle  | Approve, Assert, Build, Complete, Confirm, Deny, Deploy, Disable, Enable, Install, Invoke, Register, Request, Restart, Resume, Start, Stop, Submit, Suspend, Uninstall, Unregister |
| Security   | Block, Grant, Protect, Revoke, Unblock, Unprotect |
| Other      | Use, Debug, Measure, Ping, Repair, Resolve, Test, Trace |

## Parameter Conventions

Parameters in PowerShell follow these conventions:

- Use PascalCase for parameter names
- Parameters can be specified with a dash prefix: `-ParameterName`
- Many parameters have aliases for shorter typing
- Parameters can be positional or named
- Use tab completion to discover available parameters

Example:
```powershell
Get-ChildItem -Path C:\Temp -Recurse -Filter *.txt
```

## Syntax Best Practices

1. **Use full command names** in scripts for readability (avoid aliases in scripts)
2. **Use proper casing** for commands and parameters (PascalCase)
3. **Use splatting** for commands with many parameters:
   ```powershell
   $params = @{
       Path = "C:\Temp"
       Recurse = $true
       Filter = "*.txt"
   }
   Get-ChildItem @params
   ```
4. **Use proper quoting**:
   - Single quotes (`'`) for literal strings
   - Double quotes (`"`) for strings with variable expansion
5. **Use proper comparison operators**:
   - `-eq`, `-ne`, `-gt`, `-lt`, `-ge`, `-le` (not `==`, `!=`, `>`, `<`, `>=`, `<=`)
   - `-like`, `-notlike` for wildcard matching
   - `-match`, `-notmatch` for regex matching
6. **Use proper logical operators**:
   - `-and`, `-or`, `-not` (not `&&`, `||`, `!`)

## Common PowerShell Core Commands

### File System Operations
- `Get-ChildItem` (alias: `dir`, `ls`) - List files and directories
- `New-Item` - Create new files or directories
- `Copy-Item` - Copy files or directories
- `Move-Item` - Move files or directories
- `Remove-Item` - Delete files or directories
- `Set-Location` (alias: `cd`) - Change directory
- `Get-Content` (alias: `cat`) - Read file content
- `Set-Content` - Write content to a file

### Process Management
- `Get-Process` (alias: `ps`) - List processes
- `Start-Process` - Start a new process
- `Stop-Process` - Stop a process

### Network Operations
- `Test-Connection` (alias: `ping`) - Test network connection
- `Invoke-WebRequest` (alias: `curl`, `wget`) - Make web requests
- `Test-NetConnection` - Test network connectivity

### System Information
- `Get-ComputerInfo` - Get computer information
- `Get-Service` - List services
- `Get-EventLog` - Get event logs

### Package Management
- `Find-Package` - Find packages
- `Install-Package` - Install packages
- `Uninstall-Package` - Uninstall packages

## Platform-Specific Considerations

When writing cross-platform PowerShell scripts:

1. **Use forward slashes** (`/`) for paths when possible (works on all platforms)
2. **Use `Join-Path`** for path construction instead of string concatenation
3. **Check `$IsWindows`, `$IsLinux`, `$IsMacOS`** for platform-specific code
4. **Avoid Windows-specific cmdlets** on non-Windows platforms
5. **Use `Start-Process`** instead of calling executables directly for better cross-platform support

## Error Handling

Proper error handling in PowerShell:

```powershell
try {
    # Code that might throw an error
    Get-Content -Path "nonexistent.txt" -ErrorAction Stop
}
catch {
    # Handle the error
    Write-Error "An error occurred: $_"
}
finally {
    # Code that runs regardless of error
    Write-Output "Operation completed"
}
```

Use `-ErrorAction` parameter to control how errors are handled:
- `Stop` - Throws a terminating error that can be caught
- `Continue` - Reports the error and continues (default)
- `SilentlyContinue` - Suppresses the error and continues
- `Ignore` - Completely ignores the error

## Examples of Correct vs Incorrect Commands

### Correct:
```powershell
# File operations
Get-ChildItem -Path ./src -Recurse -Filter *.js
New-Item -Path ./logs -ItemType Directory
Copy-Item -Path ./src/file.txt -Destination ./backup/

# Process management
Get-Process | Where-Object { $_.CPU -gt 50 }
Start-Process -FilePath "node" -ArgumentList "server.js"

# String operations
"Hello $name" | Out-File -FilePath ./greeting.txt
$content = Get-Content -Path ./data.json | ConvertFrom-Json

# Error handling
try { 
    $result = Invoke-RestMethod -Uri "https://api.example.com" -ErrorAction Stop 
} 
catch { 
    Write-Error "API call failed: $_" 
}
```

### Incorrect:
```powershell
# Don't use cmd/bash syntax
dir /s *.js                # Incorrect
ls -la                     # Incorrect
type file.txt              # Incorrect
del file.txt               # Incorrect

# Don't use incorrect operators
if ($count == 5) {}        # Incorrect
if ($name != "John") {}    # Incorrect

# Don't use incorrect logical operators
if ($a && $b) {}           # Incorrect
if (!$condition) {}        # Incorrect

# Don't use string concatenation for paths
$path = $dir + "\file.txt" # Incorrect
```

## References

- [PowerShell Documentation](https://learn.microsoft.com/en-us/powershell/)
- [Approved Verbs for PowerShell Commands](https://learn.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands)
- [PowerShell Practice and Style Guide](https://poshcode.gitbook.io/powershell-practice-and-style/)
