# 🚀 Quick Start - View Local Preview

## Easiest Method (macOS):

**Just double-click:** `launch-preview.command`

This will:
- Start a local web server
- Open your browser automatically
- Show the dashboard preview

---

## Manual Method:

### Step 1: Open Terminal
Press `Cmd + Space`, type "Terminal", press Enter

### Step 2: Navigate to preview folder
Copy and paste this command:
```bash
cd "/Users/ramin/Desktop/Ramin Github/identiti/preview"
```

### Step 3: Start the server
Copy and paste this command:
```bash
python3 -m http.server 8000
```

### Step 4: Open your browser
Go to: **http://localhost:8000**

---

## Alternative: Open HTML Directly

1. Open Finder
2. Go to: `/Users/ramin/Desktop/Ramin Github/identiti/preview/`
3. Double-click `index.html`

---

## Troubleshooting

**If Python doesn't work:**
```bash
# Try Python 2
python -m SimpleHTTPServer 8000
```

**If port 8000 is busy:**
```bash
# Use a different port (e.g., 8080)
python3 -m http.server 8080
# Then go to: http://localhost:8080
```

**To stop the server:**
Press `Ctrl + C` in the terminal



