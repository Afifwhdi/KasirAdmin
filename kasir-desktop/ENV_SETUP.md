# Environment Configuration Guide

## 📋 Environment Files

Proyek ini menggunakan 3 file environment yang berbeda:

```
kasir-desktop/
├── .env.development      # Development mode (localhost)
├── .env.production       # Production mode (VPS)
└── .env.example          # Template & documentation
```

## 🚀 Usage

### Development (Local API)

```bash
# Run web development server (uses .env.development)
npm run dev

# Run Electron app in development mode (uses .env.development)
npm run electron:dev
```

**Environment**: `.env.development`
```
VITE_API_BASE_URL=http://127.0.0.1:3000
```

### Production Build (VPS API)

```bash
# Build for production Windows installer (uses .env.production)
npm run electron:build:win
```

**Environment**: `.env.production`
```
VITE_API_BASE_URL=http://154.19.37.167:3000
```

### Development Build (Test installer with localhost)

```bash
# Build Windows installer with development config
npm run electron:build:dev
```

## 📝 Commands Summary

| Command | Mode | Environment File | Usage |
|---------|------|------------------|-------|
| `npm run dev` | Development | `.env.development` | Web dev server with HMR |
| `npm run electron:dev` | Development | `.env.development` | Electron app (dev mode) |
| `npm run build` | Production | `.env.production` | Build web app only |
| `npm run build:dev` | Development | `.env.development` | Build with dev config |
| `npm run electron:build:win` | Production | `.env.production` | **Final Windows installer** |
| `npm run electron:build:dev` | Development | `.env.development` | Test installer (localhost) |

## ⚙️ Manual Override

If you need to manually override the API URL, edit `.env` file:

```env
VITE_API_BASE_URL=http://custom-api-url:3000
```

> **Note**: Manual `.env` is git-ignored. Template files (`.env.development`, `.env.production`, `.env.example`) are tracked in git.

## 🔒 Git Configuration

**Tracked files** (committed to git):
- ✅ `.env.example`
- ✅ `.env.development`
- ✅ `.env.production`

**Ignored files** (local only):
- ❌ `.env`
- ❌ `.env.local`

## 🎯 Best Practices

1. **Development**: Always use `npm run dev` or `npm run electron:dev`
2. **Testing Installer**: Use `npm run electron:build:dev` to test with localhost
3. **Production Release**: Only use `npm run electron:build:win` when API is accessible
4. **Before Production Build**: Verify VPS API is running at `http://154.19.37.167:3000`

## 🐛 Troubleshooting

### Issue: API not connecting in development
- Make sure local API is running: `cd ../api && npm run start:dev`
- Verify API URL in `.env.development` is `http://127.0.0.1:3000`

### Issue: Production build not connecting
- Check VPS API accessibility: `curl http://154.19.37.167:3000`
- Verify firewall/nginx configuration on VPS
- Make sure API service is running on VPS

### Issue: Wrong API URL after build
- Check which command you used (production vs development)
- Verify correct `.env.*` file is being loaded
- Clear `dist/` folder and rebuild

## 📦 Production Deployment Checklist

Before building production installer:

- [ ] VPS API is running at `http://154.19.37.167:3000`
- [ ] Test API endpoint: `curl http://154.19.37.167:3000`
- [ ] `.env.production` has correct VPS IP
- [ ] Run: `npm run electron:build:win`
- [ ] Test installer on clean Windows machine
- [ ] Verify app connects to production API

---

**Last Updated**: October 2025
