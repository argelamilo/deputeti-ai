# 🚀 Step-by-Step: Deploy to Vercel (FREE - No Domain Needed!)

Vercel is **FREE** and gives you a permanent URL like `https://your-app.vercel.app`. Perfect for showing your boss!

---

## Step 1: Create a GitHub Account (If you don't have one)

1. Go to **https://github.com**
2. Click **"Sign up"**
3. Choose username, email, password
4. Verify your email

**⏱️ Time: 2 minutes**

---

## Step 2: Push Your Code to GitHub

### 2.1. Open Terminal/Command Prompt

- **Windows**: Press `Win + R`, type `cmd`, press Enter
- Or open PowerShell

### 2.2. Navigate to Your Project

```bash
cd "C:\Users\User\Documents\SHFA-AI\Frontend\deputeti-frontend"
```

### 2.3. Initialize Git (if not done)

```bash
git init
```

### 2.4. Create GitHub Repository

1. Go to **https://github.com/new**
2. Repository name: `deputeti-ai` (or any name)
3. Make it **Public** (free accounts need public for free hosting)
4. Click **"Create repository"** (don't add README or .gitignore)

### 2.5. Connect and Push Code

GitHub will show you commands. Use these:

```bash
git add .
git commit -m "Initial commit - Deputeti AI Chat"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/deputeti-ai.git
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

**⏱️ Time: 5 minutes**

---

## Step 3: Deploy to Vercel

### 3.1. Go to Vercel

1. Open **https://vercel.com**
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"** (use your GitHub account)
4. Authorize Vercel to access GitHub

### 3.2. Import Your Project

1. After signing in, you'll see **"Add New..."** → Click it
2. Click **"Project"**
3. You'll see your GitHub repositories
4. Find `deputeti-ai` (or whatever you named it)
5. Click **"Import"**

### 3.3. Configure Project

You'll see configuration options:

1. **Project Name**: Keep default or change to `deputeti-ai`
2. **Root Directory**: 
   - If your repo is JUST the deputeti-frontend folder → Set to `./`
   - If repo has multiple folders → Click "Edit" and set to `deputeti-frontend`

3. **Framework Preset**: Should auto-detect "Next.js" ✅

4. **Build Command**: Leave as default (`npm run build`) ✅

5. **Output Directory**: Leave as default (`.next`) ✅

### 3.4. Add Environment Variables

**IMPORTANT!** Before clicking "Deploy":

1. Click **"Environment Variables"** section
2. Click **"Add"** button
3. Add these TWO variables:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://asistenti.deputeti.ai`
   - Click "Add"

   **Variable 2:**
   - Name: `NEXT_PUBLIC_CHAT_MODEL`
   - Value: `eu-law-rag`
   - Click "Add"

### 3.5. Deploy!

1. Scroll down and click **"Deploy"** button
2. Wait 2-3 minutes while it builds
3. You'll see progress logs - just wait!

**⏱️ Time: 3 minutes**

---

## Step 4: Get Your URL!

After deployment finishes:

1. You'll see **"Congratulations!"** message
2. Your URL will be shown like: `https://deputeti-ai-abc123.vercel.app`
3. **Click on the URL** or **copy it**

**🎉 That's your permanent URL!**

---

## Step 5: Test It Yourself

1. Open the URL in your browser
2. You should see the login page
3. Enter API key: `sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`
4. Click "Sign in"
5. You should see the chat interface!

**✅ If it works, you're ready to share!**

---

## Step 6: Share with Your Boss!

Send them:
- **URL**: Your Vercel URL (like `https://deputeti-ai-abc123.vercel.app`)
- **API Key**: `sk-KnCx-6j3M7uukpWXw8G32Vq110tqtu0xrowrxEHhP_4`

They can:
1. Open the URL in any browser
2. Enter the API key
3. Start chatting!

---

## 🆘 Troubleshooting

### "Build Failed" Error?

**Solution:**
1. Check the build logs on Vercel
2. Make sure environment variables are set correctly
3. Try clicking "Redeploy"

### Can't Find My Repository on Vercel?

**Solution:**
1. Make sure you clicked "Continue with GitHub" on Vercel
2. Check if your GitHub repo is set to Public
3. Try refreshing the Vercel page

### Environment Variables Not Working?

**Solution:**
1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Make sure both variables are there
4. Redeploy (click "Deployments" → "Redeploy")

### "Module not found" Errors?

**Solution:**
1. Make sure you ran `npm install` locally first
2. Check that `package.json` has all dependencies
3. Try deleting `node_modules` and pushing again

---

## ✅ What You Get

- ✅ **Free hosting** (forever!)
- ✅ **Permanent URL** (like `your-app.vercel.app`)
- ✅ **Auto-updates** (push to GitHub = auto-deploy)
- ✅ **HTTPS** (secure connection)
- ✅ **Fast** (CDN worldwide)
- ✅ **No credit card** needed

---

## 🔄 Making Updates Later

When you want to update the site:

1. Make changes to your code
2. Run:
   ```bash
   git add .
   git commit -m "Updated chat interface"
   git push
   ```
3. Vercel automatically redeploys! ✨

---

## 📝 Quick Checklist

- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] Vercel account created (with GitHub)
- [ ] Project imported from GitHub
- [ ] Environment variables added (2 of them!)
- [ ] Deployed successfully
- [ ] Tested the URL yourself
- [ ] Shared URL with boss!

---

**Total Time: ~15 minutes**
**Cost: $0 (FREE!)**

Good luck! 🚀

