# 🚀 Start the Preview Server

## Method 1: Using Python (Recommended)

Open **Terminal** and run these commands one by one:

```bash
cd "/Users/ramin/Desktop/Ramin Github/identiti/preview"
python3 -m http.server 8000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

Then open your browser and go to: **http://localhost:8000**

**To stop:** Press `Ctrl + C`

---

## Method 2: Using Node.js

If you have Node.js installed:

```bash
cd "/Users/ramin/Desktop/Ramin Github/identiti/preview"
node server.js
```

Then open: **http://localhost:8000**

---

## Method 3: Double-Click (macOS)

1. Open Finder
2. Go to: `/Users/ramin/Desktop/Ramin Github/identiti/preview/`
3. Double-click `launch-preview.command`

---

## Troubleshooting

**Port 8000 already in use?**
Try a different port:
```bash
python3 -m http.server 8080
# Then go to: http://localhost:8080
```

**Python not found?**
Try:
```bash
python -m SimpleHTTPServer 8000
```

**Still not working?**
Just open `index.html` directly in your browser:
- Double-click the file in Finder
- Or drag it into your browser window


