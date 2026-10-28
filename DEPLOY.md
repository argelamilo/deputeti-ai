# Deployment Guide for Deputeti AI Frontend

## Quick Deploy to Vercel (Recommended - FREE)

Vercel is the easiest way to deploy Next.js apps and it's FREE for personal projects.

### Option 1: Deploy via Vercel Website (Easiest)

1. **Push your code to GitHub**:
   ```bash
   cd deputeti-frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `deputeti-frontend` (if not at root)
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` = `https://asistenti.deputeti.ai`
     - `NEXT_PUBLIC_CHAT_MODEL` = `eu-law-rag`
   - Click "Deploy"

3. **Your site will be live in 2-3 minutes!**
   - You'll get a URL like: `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project
cd deputeti-frontend

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? deputeti-ai (or any name)
# - Directory? ./
# - Override settings? No
# - Environment variables? Add:
#   NEXT_PUBLIC_API_URL = https://asistenti.deputeti.ai
#   NEXT_PUBLIC_CHAT_MODEL = eu-law-rag

# Production deploy
vercel --prod
```

## Other Deployment Options

### Netlify (Also FREE)

1. Push to GitHub (same as above)
2. Go to https://www.netlify.com
3. Click "New site from Git"
4. Connect GitHub and select your repo
5. Build settings:
   - Build command: `cd deputeti-frontend && npm run build`
   - Publish directory: `deputeti-frontend/.next`
   - Add environment variables in Site settings

### Render

1. Go to https://render.com
2. New > Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `cd deputeti-frontend && npm install && npm run build`
   - Start Command: `cd deputeti-frontend && npm start`
   - Add environment variables

## Environment Variables

Make sure to set these in your hosting platform:

```env
NEXT_PUBLIC_API_URL=https://asistenti.deputeti.ai
NEXT_PUBLIC_CHAT_MODEL=eu-law-rag
```

## Build Locally First (Test Before Deploy)

```bash
cd deputeti-frontend
npm install
npm run build
npm start
```

Then visit `http://localhost:3000` to test.

## Share with Your Boss

Once deployed, you'll get a public URL like:
- `https://deputeti-ai.vercel.app` (Vercel)
- `https://your-site.netlify.app` (Netlify)

Just send them the URL! They can:
1. Visit the link
2. Enter API key: `sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`
3. Start chatting

## Troubleshooting

### Build fails?
- Check that all dependencies are in `package.json`
- Make sure environment variables are set
- Check build logs for errors

### API errors?
- Verify API URL is correct
- Check API key is valid
- Check CORS settings on API server

### Need to update?
- Just push to GitHub
- Vercel/Netlify auto-deploys on push!

