# ARA Bid Studio - Linear Project Setup Guide

This guide provides instructions for setting up the ARA Bid Studio improvement project in Linear with all prioritized tasks from our codebase analysis.

## Project Overview

**Project Name:** ARA Bid Studio - Codebase Improvements  
**Description:** Comprehensive improvements to the ara-bidstudio codebase based on detailed analysis report. Includes critical security fixes, performance optimizations, accessibility compliance, and testing infrastructure.  
**Priority:** Urgent  
**Team:** Development Team

---

## Linear Import Structure

### 🔴 CRITICAL PRIORITY Issues (Sprint 1 - Week 1-2)

#### 1. Add Error Boundaries
**Priority:** Urgent (1)  
**Estimate:** 2 points  
**Labels:** critical, frontend, error-handling  
**Description:**
```markdown
Create and implement React error boundaries to prevent app crashes.

## Tasks:
- [ ] Create ErrorBoundary component with proper error UI fallback
- [ ] Wrap major UI sections (KanbanBoard, ProjectContainer, CopilotSidebar)
- [ ] Add error logging and user-friendly error messages
- [ ] Test error scenarios and boundary recovery

## Acceptance Criteria:
- App doesn't crash when component errors occur
- Users see helpful error messages instead of white screen
- Error details logged for debugging
- Error boundaries tested in development

## Files to modify:
- Create: `src/components/ErrorBoundary.tsx`
- Update: `src/app/page.tsx`, `src/app/layout.tsx`
```

#### 2. Fix Security Vulnerabilities
**Priority:** Urgent (1)  
**Estimate:** 5 points  
**Labels:** critical, security, backend  
**Description:**
```markdown
Implement essential security measures for production readiness.

## Tasks:
- [ ] Create environment variable validation with Zod schema
- [ ] Add input validation for all API routes and tools
- [ ] Implement basic rate limiting for API endpoints
- [ ] Add CSRF protection and origin validation
- [ ] Sanitize user inputs in Mastra tools

## Acceptance Criteria:
- All environment variables validated at startup
- API routes have proper input validation
- Rate limiting prevents abuse
- CSRF attacks prevented
- User inputs sanitized in agent tools

## Files to modify:
- Create: `src/lib/env.ts`, `src/lib/security.ts`
- Update: `src/app/api/*/route.ts`, `src/mastra/tools/bid.ts`
```

#### 3. Set Up Testing Infrastructure
**Priority:** Urgent (1)  
**Estimate:** 8 points  
**Labels:** critical, testing, infrastructure  
**Description:**
```markdown
Establish testing framework and write initial tests.

## Tasks:
- [ ] Install and configure Jest + React Testing Library
- [ ] Set up test scripts in package.json
- [ ] Write unit tests for core utilities (store, persistence, state)
- [ ] Create component tests for KanbanBoard, ProjectContainer
- [ ] Add integration tests for agent tools
- [ ] Set up test coverage reporting

## Acceptance Criteria:
- Testing framework properly configured
- At least 60% test coverage for critical paths
- CI/CD integration ready
- All tests pass consistently

## Files to modify:
- Create: `jest.config.js`, `__tests__/` directory structure
- Update: `package.json`, `tsconfig.json`
```

### 🟡 HIGH PRIORITY Issues (Sprint 2 - Week 3-5)

#### 4. Optimize Performance - Images & Memoization
**Priority:** High (2)  
**Estimate:** 5 points  
**Labels:** performance, frontend, optimization  
**Description:**
```markdown
Address critical performance bottlenecks.

## Tasks:
- [ ] Replace all <img> tags with Next.js Image components
- [ ] Add React.memo to KanbanBoard, TeamSection, UsersModal
- [ ] Implement useMemo for filtered tasks and expensive calculations
- [ ] Add proper width/height to images for CLS prevention
- [ ] Configure next.config.ts for image optimization

## Acceptance Criteria:
- Bundle size reduced by at least 20%
- Core Web Vitals scores improved
- No more Next.js image optimization warnings
- Components properly memoized

## Files to modify:
- Update: `src/app/components/*.tsx`, `next.config.ts`
```

#### 5. Accessibility Compliance - Phase 1
**Priority:** High (2)  
**Estimate:** 8 points  
**Labels:** accessibility, frontend, compliance  
**Description:**
```markdown
Fix critical accessibility issues for WCAG compliance.

## Tasks:
- [ ] Convert modal divs to semantic <dialog> elements
- [ ] Add proper ARIA labels and roles to all interactive elements
- [ ] Implement keyboard navigation for task cards and modals
- [ ] Add focus management and focus trapping for modals
- [ ] Ensure proper heading hierarchy and semantic structure
- [ ] Test with screen readers

## Acceptance Criteria:
- WCAG AA compliance achieved for critical user flows
- All interactive elements keyboard accessible
- Screen reader compatibility verified
- Focus management working correctly

## Files to modify:
- Update: `src/app/components/UsersModal.tsx`, `src/app/components/KanbanBoard.tsx`
```

#### 6. Bundle Size Optimization
**Priority:** High (2)  
**Estimate:** 5 points  
**Labels:** performance, optimization, build  
**Description:**
```markdown
Reduce bundle size for better loading performance.

## Tasks:
- [ ] Implement dynamic imports for CopilotKit and Clerk providers
- [ ] Configure webpack for proper code splitting of agent modules
- [ ] Add tree-shaking optimization for Mastra packages
- [ ] Analyze and remove unused dependencies
- [ ] Configure next.config.ts with bundle analyzer

## Acceptance Criteria:
- Main bundle size under 400kB (currently 584kB)
- First Load JS under 400kB
- Unused dependencies removed
- Code splitting working correctly

## Files to modify:
- Update: `next.config.ts`, `src/app/layout.tsx`
```

#### 7. Error Handling & Validation
**Priority:** High (2)  
**Estimate:** 5 points  
**Labels:** error-handling, validation, backend  
**Description:**
```markdown
Improve error handling throughout the application.

## Tasks:
- [ ] Add try-catch blocks to all async agent tool functions
- [ ] Implement proper error responses in API routes
- [ ] Add client-side error handling for agent failures
- [ ] Create user-friendly error messages and toast notifications
- [ ] Add validation for all form inputs and tool parameters

## Acceptance Criteria:
- No unhandled promise rejections
- All API routes return proper error responses
- User-friendly error messages displayed
- Input validation prevents bad data

## Files to modify:
- Update: `src/mastra/tools/bid.ts`, `src/app/api/*/route.ts`
- Create: `src/components/ErrorToast.tsx`
```

### 🟢 MEDIUM PRIORITY Issues (Sprint 3 - Month 2)

#### 8. Code Quality Improvements
**Priority:** Normal (3)  
**Estimate:** 3 points  
**Labels:** code-quality, maintenance  

#### 9. Next.js Optimization & Metadata
**Priority:** Normal (3)  
**Estimate:** 2 points  
**Labels:** seo, optimization, metadata  

#### 10. Monitoring & Observability Setup
**Priority:** Normal (3)  
**Estimate:** 5 points  
**Labels:** monitoring, observability, production  

#### 11. Accessibility Compliance - Phase 2
**Priority:** Normal (3)  
**Estimate:** 5 points  
**Labels:** accessibility, advanced  

#### 12. Documentation & Developer Experience
**Priority:** Normal (3)  
**Estimate:** 3 points  
**Labels:** documentation, developer-experience  

### 🔵 LOW PRIORITY Issues (Future Sprints)

#### 13. CI/CD Pipeline Implementation
**Priority:** Low (4)  
**Estimate:** 5 points  
**Labels:** cicd, automation, infrastructure  

#### 14. Advanced Performance Features
**Priority:** Low (4)  
**Estimate:** 8 points  
**Labels:** performance, pwa, advanced  

#### 15. Enhanced Agent Features
**Priority:** Low (4)  
**Estimate:** 8 points  
**Labels:** ai, agents, advanced  

---

## Linear API Import Commands

If you want to create this project programmatically using Linear's API, here are the exact GraphQL mutations:

### 1. Create Project

```bash
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: YOUR_LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation projectCreate($input: ProjectCreateInput!) { projectCreate(input: $input) { success project { id name } } }",
    "variables": {
      "input": {
        "name": "ARA Bid Studio - Codebase Improvements",
        "description": "Comprehensive improvements to the ara-bidstudio codebase based on detailed analysis report. Includes critical security fixes, performance optimizations, accessibility compliance, and testing infrastructure.",
        "priority": 1,
        "teamIds": ["YOUR_TEAM_ID"]
      }
    }
  }'
```

### 2. Create Issues (Example for first critical issue)

```bash
curl -X POST https://api.linear.app/graphql \
  -H "Authorization: YOUR_LINEAR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation issueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id title } } }",
    "variables": {
      "input": {
        "title": "🔴 CRITICAL: Add Error Boundaries",
        "description": "Create and implement React error boundaries to prevent app crashes...",
        "priority": 1,
        "estimate": 2,
        "teamId": "YOUR_TEAM_ID",
        "projectId": "YOUR_PROJECT_ID"
      }
    }
  }'
```

---

## Manual Import Instructions

### Step 1: Create Project in Linear
1. Go to Linear workspace
2. Click "New Project" 
3. Use the project details above
4. Set priority to "Urgent"

### Step 2: Create Issues
1. Copy each issue description from above
2. Create new issues with corresponding:
   - Priority levels (🔴=1, 🟡=2, 🟢=3, 🔵=4)
   - Estimates (story points)
   - Labels
   - Assign to project created in Step 1

### Step 3: Set Up Sprints
- **Sprint 1 (Week 1-2):** Critical issues (#1-3)
- **Sprint 2 (Week 3-5):** High priority issues (#4-7)
- **Sprint 3 (Month 2):** Medium priority issues (#8-12)
- **Backlog:** Low priority issues (#13-15)

---

## Success Metrics

**Sprint 1 Completion Criteria:**
- [ ] 0% error crash rate
- [ ] Security vulnerabilities resolved
- [ ] >60% test coverage

**Sprint 2 Completion Criteria:**
- [ ] Bundle size <400kB
- [ ] WCAG AA compliance for core flows
- [ ] Core Web Vitals >90

**Overall Project Success:**
- [ ] Production-ready codebase
- [ ] Security score: A-
- [ ] Performance score: >90
- [ ] Accessibility score: AA
- [ ] Test coverage: >80%

---

*This project setup is based on the comprehensive codebase analysis report generated for ara-bidstudio. Each task includes specific implementation details, acceptance criteria, and file paths to ensure clear execution.*
