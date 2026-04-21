with open('c:/Users/redbe/Documents/Coding Local/pluely/src-tauri/src/shortcuts.rs', 'r') as f:  
     content = f.read()  
lines = content.split('\n')  
# Skip LicenseState struct (lines 33-53, 0-indexed 32-52)  
lines = lines[:32] + lines[54:] 
