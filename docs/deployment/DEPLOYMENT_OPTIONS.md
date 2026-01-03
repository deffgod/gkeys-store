# Deployment Options: GKEYS Store

This document describes the available deployment architecture options for deploying the GKEYS Store application to Vercel. Each option has different characteristics, trade-offs, and use cases.

## Overview

The GKEYS Store application can be deployed to Vercel using two main architectures:

1. **Monolithic Deployment** - Single Vercel project containing both frontend and backend
2. **Separate Deployment** - Two independent Vercel projects (one for frontend, one for backend)

## Option 1: Monolithic Deployment

### Architecture

In monolithic deployment, both frontend and backend are deployed in a single Vercel project:

```
Vercel Project (Single)
├── Frontend (Static Files)
│   ├── dist/index.html
│   ├── dist/assets/*.js
│   └── dist/assets/*.css
│
└── Backend (Serverless Function)
    └── api/index.ts → Express App
        ├── /api/auth/*
        ├── /api/games/*
        ├── /api/orders/*
        └── ... (all API routes)
```

### Structure

- **Frontend**: Static files served from `dist/` directory
- **Backend**: Serverless function at `api/index.ts` that wraps the Express application
- **Routing**: `vercel.json` rewrites `/api/*` to serverless function, all other routes to `index.html` (SPA routing)

### Pros

- ✅ **Simple Setup**: Single project to configure and manage
- ✅ **Lower Operational Overhead**: One deployment pipeline, one set of environment variables
- ✅ **Cost-Effective**: Single Vercel project (lower cost for small to medium scale)
- ✅ **Automatic CORS**: Same domain eliminates CORS configuration needs
- ✅ **Easier Environment Variable Management**: All variables in one place
- ✅ **Single Deployment Pipeline**: Changes to frontend or backend deploy together
- ✅ **Simplified Monitoring**: One project to monitor in Vercel dashboard

### Cons

- ❌ **Coupled Scaling**: Frontend and backend scale together (cannot scale independently)
- ❌ **Single Point of Deployment**: Changes to one service affect both
- ❌ **Limited Flexibility**: Cannot update frontend and backend independently
- ❌ **Shared Function Limits**: All serverless function invocations count against single project limits

### Use Cases

**Recommended for:**
- Initial deployment and MVP
- Small to medium scale applications
- Projects where simplicity is prioritized
- Cost-conscious deployments
- Projects with tightly coupled frontend/backend
- Teams with limited DevOps resources

**Not recommended for:**
- Large scale applications requiring independent scaling
- Projects with separate frontend/backend teams
- Applications with different update frequencies for frontend and backend

### Setup Complexity

**Rating**: Low

- Configure single Vercel project
- Set all environment variables in one place
- Single build command: `npm run vercel-build`
- No CORS configuration needed

### Operational Overhead

**Rating**: Low

- One project to monitor
- One deployment pipeline
- One set of logs to review
- Single point of configuration

### Cost Implications

- **Vercel Hobby Plan**: Free tier available
- **Vercel Pro Plan**: Single project pricing
- **Function Invocations**: Shared between frontend and backend
- **Bandwidth**: Shared between frontend and backend

---

## Option 2: Separate Frontend/Backend Deployment

### Architecture

In separate deployment, frontend and backend are deployed as independent Vercel projects:

```
Vercel Project 1: Frontend
└── Static Files
    ├── dist/index.html
    ├── dist/assets/*.js
    └── dist/assets/*.css

Vercel Project 2: Backend
└── Serverless Function
    └── api/index.ts → Express App
        ├── /api/auth/*
        ├── /api/games/*
        ├── /api/orders/*
        └── ... (all API routes)
```

### Structure

- **Frontend Project**: Only static files from `dist/` directory, no `api/` directory
- **Backend Project**: Only `api/index.ts` serverless function, no frontend build
- **Communication**: Frontend makes API calls to backend project URL

### Pros

- ✅ **Independent Scaling**: Frontend and backend can scale independently
- ✅ **Independent Deployment Pipelines**: Update one service without affecting the other
- ✅ **Better Resource Allocation**: Separate function limits for each project
- ✅ **Clear Separation of Concerns**: Frontend and backend are completely independent
- ✅ **Team Autonomy**: Different teams can manage different projects
- ✅ **Flexible Update Frequency**: Update frontend and backend on different schedules
- ✅ **Better Monitoring**: Separate metrics and logs for each service

### Cons

- ❌ **More Complex Setup**: Two projects to configure and manage
- ❌ **CORS Configuration Required**: Different domains require explicit CORS setup
- ❌ **Two Sets of Environment Variables**: Must manage variables for both projects
- ❌ **Higher Operational Overhead**: Two deployment pipelines, two sets of logs
- ❌ **Potential Configuration Drift**: Risk of inconsistent configuration between projects
- ❌ **More Complex Troubleshooting**: Two deployment logs to review
- ❌ **Higher Cost**: Two Vercel projects (may require Pro plan for both)

### Use Cases

**Recommended for:**
- Large scale applications with different scaling needs
- Projects with separate frontend/backend teams
- Applications requiring independent scaling
- Projects where frontend and backend have different update frequencies
- Enterprise deployments with strict separation requirements
- Applications with high traffic requiring independent resource allocation

**Not recommended for:**
- Small to medium scale applications
- Projects prioritizing simplicity
- Cost-conscious deployments
- Teams with limited DevOps resources
- Initial deployment and MVP

### Setup Complexity

**Rating**: Medium

- Configure two Vercel projects
- Set environment variables for each project separately
- Configure CORS in backend project
- Set `VITE_API_BASE_URL` in frontend project
- Coordinate deployment of both projects

### Operational Overhead

**Rating**: Medium

- Two projects to monitor
- Two deployment pipelines
- Two sets of logs to review
- Two sets of environment variables to manage
- CORS configuration to maintain

### Cost Implications

- **Vercel Hobby Plan**: May require Pro plan for both projects
- **Vercel Pro Plan**: Two project pricing
- **Function Invocations**: Separate limits for each project
- **Bandwidth**: Separate limits for each project

---

## Decision Matrix

| Criterion | Monolithic | Separate |
|-----------|-----------|----------|
| **Setup Complexity** | Low | Medium |
| **Operational Overhead** | Low | Medium |
| **Cost** | Lower | Higher |
| **Scaling Flexibility** | Limited | High |
| **Deployment Independence** | No | Yes |
| **CORS Configuration** | Automatic | Manual |
| **Team Separation** | Difficult | Easy |
| **Monitoring Complexity** | Low | Medium |
| **Best for Small Projects** | ✅ Yes | ❌ No |
| **Best for Large Projects** | ❌ No | ✅ Yes |
| **Best for MVP** | ✅ Yes | ❌ No |
| **Best for Enterprise** | ❌ No | ✅ Yes |

---

## Selection Guidance

### Choose Monolithic Deployment If:

- ✅ You're deploying an MVP or initial version
- ✅ Your application is small to medium scale
- ✅ You prioritize simplicity and ease of management
- ✅ You have limited DevOps resources
- ✅ You want to minimize costs
- ✅ Frontend and backend are tightly coupled
- ✅ You don't need independent scaling

### Choose Separate Deployment If:

- ✅ You have a large scale application
- ✅ You have separate frontend and backend teams
- ✅ You need independent scaling for frontend and backend
- ✅ Frontend and backend have different update frequencies
- ✅ You require strict separation of concerns
- ✅ You have enterprise requirements
- ✅ You need better resource allocation

---

## Migration Path

### From Monolithic to Separate

If you start with monolithic deployment and later need separate deployment:

1. Create new Vercel project for backend
2. Configure backend project with all backend environment variables
3. Deploy backend to new project
4. Create new Vercel project for frontend
5. Set `VITE_API_BASE_URL` to backend project URL
6. Configure CORS in backend project to allow frontend origin
7. Deploy frontend to new project
8. Update DNS/custom domains if needed

### From Separate to Monolithic

If you start with separate deployment and want to consolidate:

1. Merge environment variables from both projects
2. Configure single Vercel project
3. Deploy to monolithic project
4. Update frontend `VITE_API_BASE_URL` if needed
5. Remove CORS configuration (no longer needed)
6. Archive or delete separate projects

---

## Next Steps

After selecting a deployment option:

- **Monolithic**: See [MONOLITHIC_DEPLOYMENT.md](./MONOLITHIC_DEPLOYMENT.md) for step-by-step instructions
- **Separate**: See [SEPARATE_DEPLOYMENT.md](./SEPARATE_DEPLOYMENT.md) for step-by-step instructions

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Pricing](https://vercel.com/pricing)
- [CORS Configuration Guide](./SEPARATE_DEPLOYMENT.md#cors-configuration)
