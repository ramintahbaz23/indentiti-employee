# Local Preview Guide

## Quick Preview (Static HTML)

Simply open `index.html` in your browser:

```bash
# macOS
open preview/index.html

# Linux
xdg-open preview/index.html

# Windows
start preview/index.html
```

Or double-click the `index.html` file in the `preview` folder.

## Using Salesforce LWC Dev Server (Recommended)

For a full preview with actual LWC components, use the Salesforce LWC Dev Server:

### Prerequisites

1. Install Salesforce CLI:
   ```bash
   npm install -g @salesforce/cli
   ```

2. Authenticate with your Salesforce org:
   ```bash
   sfdx auth:web:login -a myorg
   ```

### Start the Dev Server

```bash
# Navigate to your project root
cd "/Users/ramin/Desktop/Ramin Github/identiti"

# Start the LWC Dev Server
sfdx force:lightning:lwc:start
```

The server will start on `http://localhost:3333` and you can preview your components.

### Preview Specific Component

To preview the dashboardContainer component:

1. Create a test HTML file (e.g., `preview/dashboard.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <script src="http://localhost:3333/lightning/lightning.out.js"></script>
   </head>
   <body>
       <div id="app"></div>
       <script>
           $Lightning.use("c:dashboardContainer", function() {
               $Lightning.createComponent(
                   "c:dashboardContainer",
                   {},
                   "app",
                   function(cmp) {
                       console.log("Component created");
                   }
               );
           });
       </script>
   </body>
   </html>
   ```

2. Open the HTML file in your browser

## Alternative: VS Code Live Server

If you have VS Code with the Live Server extension:

1. Right-click on `preview/index.html`
2. Select "Open with Live Server"
3. The page will open in your browser with auto-reload

## Notes

- The static HTML preview (`index.html`) shows the visual design but doesn't have LWC functionality
- For full functionality, you need to deploy to a Salesforce org or use the LWC Dev Server
- The LWC Dev Server requires an authenticated Salesforce org connection



