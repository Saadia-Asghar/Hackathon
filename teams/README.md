# SignBridge for Microsoft Teams (D3)

Runs the deployed web app inside Teams: personal tabs (Conversation, Learn) and a **meeting side panel**.

## Make the package
1. Deploy the web app (see `.github/workflows/azure-static-web-apps.yml`) and note its URL.
2. In `manifest.json` replace every `YOUR-APP.azurestaticapps.net` with your URL and set `id` to a new GUID
   (PowerShell: `[guid]::NewGuid()`).
3. Add two icons in this folder: `color.png` (192x192) and `outline.png` (32x32, white on transparent).
4. Zip the three files (manifest.json, color.png, outline.png) - not the folder.
5. Teams > Apps > Manage your apps > Upload an app > Upload a custom app (needs a Microsoft 365 developer tenant
   or admin permission).

Camera works in Teams because `devicePermissions` includes `media`.
