# How to View the Local Preview

## Option 1: Open HTML File Directly (Easiest)

1. Navigate to: `/Users/ramin/Desktop/Ramin Github/identiti/preview/`
2. Double-click `index.html` to open it in your default browser

OR

Right-click `index.html` → Open With → Your Browser

## Option 2: Start a Local Server (Recommended)

### On macOS/Linux:

1. Open Terminal
2. Run:
   ```bash
   cd "/Users/ramin/Desktop/Ramin Github/identiti/preview"
   ./start-preview.sh
   ```
   
   OR manually:
   ```bash
   cd "/Users/ramin/Desktop/Ramin Github/identiti/preview"
   python3 -m http.server 8000
   ```

3. Open your browser and go to: **http://localhost:8000**

### On Windows:

1. Open Command Prompt or PowerShell
2. Run:
   ```cmd
   cd "C:\Users\ramin\Desktop\Ramin Github\identiti\preview"
   start-preview.bat
   ```
   
   OR manually:
   ```cmd
   cd "C:\Users\ramin\Desktop\Ramin Github\identiti\preview"
   python -m http.server 8000
   ```

3. Open your browser and go to: **http://localhost:8000**

## Option 3: VS Code Live Server

If you have VS Code with the Live Server extension:

1. Right-click on `index.html` in VS Code
2. Select "Open with Live Server"
3. The preview will open automatically

## Option 4: Drag and Drop

Simply drag the `index.html` file from Finder (macOS) or File Explorer (Windows) into any browser window.

---

**Note:** The preview shows the visual design. For full LWC functionality, you'll need to deploy to Salesforce or use the LWC Dev Server (see main README.md).



