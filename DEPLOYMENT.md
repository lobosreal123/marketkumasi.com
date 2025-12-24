# Deployment Guide - Fixing Page Refresh 404 Errors

## Problem
When you refresh a page (like `/marketplace/create`), you get a 404 error because the server is trying to find a file at that path, but React Router handles routing client-side.

## Solution
Your server needs to be configured to serve `index.html` for all routes (catch-all redirect).

## Files Created
I've created configuration files for different hosting platforms:

### 1. **Netlify / Cloudflare Pages**
File: `public/_redirects`
- Automatically used by Netlify and Cloudflare Pages
- Redirects all routes to `index.html`

### 2. **Apache Servers (cPanel, Hostinger, etc.)**
File: `public/.htaccess`
- Used by Apache web servers
- Rewrites all requests to `index.html`
- **Important**: After building, make sure `.htaccess` is in your `dist` folder root

### 3. **Vercel**
File: `vercel.json`
- Configuration for Vercel hosting
- Rewrites all routes to `index.html`

### 4. **Nginx**
For Nginx servers, add this to your server configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/your/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Development Mode
The Vite dev server should handle this automatically. If you're still seeing 404s in development:
1. Make sure you're running `npm run dev`
2. The dev server should handle routing correctly

## Production Build & Deploy

### Step 1: Build
```bash
npm run build
```

### Step 2: Deploy
Upload the contents of the `dist` folder to your hosting platform.

### Step 3: Verify Configuration Files
Make sure the appropriate config file is included in your `dist` folder:

- **Netlify/Cloudflare**: `dist/_redirects` should exist
- **Apache**: `dist/.htaccess` should exist  
- **Vercel**: `vercel.json` in project root (not in dist)

## Testing
After deployment:
1. Navigate to any route (e.g., `/marketplace/create`)
2. Refresh the page
3. It should load correctly instead of showing 404

## Troubleshooting

### If still getting 404s after deployment:

1. **Check if config file exists in dist folder**
   ```bash
   ls dist/
   # Should see .htaccess or _redirects
   ```

2. **For Apache servers:**
   - Make sure mod_rewrite is enabled
   - Check that `.htaccess` file is not blocked
   - Verify file is named exactly `.htaccess` (with the dot)

3. **For Netlify:**
   - Go to Site settings → Build & deploy → Post processing
   - Make sure "Asset optimization" isn't breaking redirects

4. **For Vercel:**
   - `vercel.json` should be in project root
   - Redeploy after adding the file

5. **Check browser console:**
   - Open DevTools → Network tab
   - Refresh the page
   - See what request is failing

## Quick Fix for Common Hosting

### Hostinger / cPanel (Apache)
1. Build: `npm run build`
2. Upload `dist` folder contents to `public_html`
3. Make sure `.htaccess` is uploaded (it should be copied from `public/.htaccess` to `dist/.htaccess`)

### Firebase Hosting
1. Run: `firebase init hosting`
2. When asked "Configure as a single-page app", select **Yes**
3. Deploy: `firebase deploy`

### GitHub Pages
If using GitHub Pages, you'll need to set `base` in `vite.config.js`:
```js
base: '/your-repo-name/'
```

