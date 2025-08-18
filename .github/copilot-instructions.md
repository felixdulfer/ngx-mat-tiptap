# ngx-mat-tiptap Angular Library

Angular library providing a rich text editor component based on TipTap with Angular Material integration. The library includes a main TipTap editor component, form field directive, content renderer, and utility functions for converting between TipTap JSON and HTML formats.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Dependencies
- Clone repository: `git clone https://github.com/felixdulfer/ngx-mat-tiptap.git`
- Install dependencies: `PUPPETEER_SKIP_DOWNLOAD=true npm install` -- takes 10 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
  - **CRITICAL**: Must use `PUPPETEER_SKIP_DOWNLOAD=true` due to network restrictions in many environments
  - Puppeteer is used by deployment script but fails to download in restricted environments

### Building the Library
- Build library: `npm run build:lib` -- takes 3 seconds. NEVER CANCEL. Set timeout to 10+ minutes.
  - Builds Angular package to `dist/ngx-mat-tiptap/`
  - Uses ng-packagr for library packaging
  - Output includes compiled TypeScript, FESM bundles, and type definitions

### Testing
- Run unit tests: `npm test` -- takes 5 seconds. NEVER CANCEL. Set timeout to 15+ minutes.
- Run tests with coverage: `npm run test:coverage` -- takes 5 seconds. NEVER CANCEL. Set timeout to 15+ minutes.
  - Jest-based testing with 60 tests across 4 test suites
  - Current coverage: 85% statements, 86% branches, 85% functions, 86% lines
  - Coverage reports generated in `coverage/` directory

### Running the Demo Application
- Start demo development server: `npm run demo` -- takes 5 seconds to start. NEVER CANCEL. Set timeout to 10+ minutes.
  - Serves at `http://localhost:4200`
  - Includes live reload for development
- Build demo for production: `npm run demo:build` -- FAILS in environments with network restrictions due to Google Fonts loading
  - Use development server instead for testing and validation

### Complete Validation Workflow
Always run this complete sequence when making changes:
1. `PUPPETEER_SKIP_DOWNLOAD=true npm install`
2. `npm run build:lib`
3. `npm run test:coverage`
4. `npm run demo` (start in background)
5. Navigate to `http://localhost:4200` and manually test editor functionality

## Validation Scenarios

### MANDATORY Manual Testing Steps
After making any changes to the library, ALWAYS perform these validation steps:

1. **Editor Functionality**:
   - Navigate to demo at `http://localhost:4200`
   - Click in the TipTap editor text area
   - Type new text to verify input works
   - Select text and click Bold button to verify formatting
   - Click Italic button to verify formatting
   - Click Bullet List button to verify list creation

2. **Real-time Updates**:
   - Verify JSON output updates in real-time as you type
   - Verify HTML Output (Raw) section shows correct HTML
   - Verify Plain Text Output extracts text correctly
   - Verify Rendered Preview displays formatted content

3. **Form Integration**:
   - Verify the editor integrates properly with Angular Material form field
   - Check that both TipTap editor and regular textarea update their form values

**CRITICAL**: Simply starting the demo server is NOT sufficient validation. You MUST interact with the editor and verify all functionality works correctly.

## Project Structure

### Repository Layout
```
/
├── projects/
│   ├── ngx-mat-tiptap/          # Main library source
│   │   ├── src/lib/             # Library components
│   │   │   ├── ngx-mat-tiptap.ts                    # Main editor component (391 lines)
│   │   │   ├── ngx-mat-tiptap-form-field.directive.ts # Form field integration (15 lines)
│   │   │   ├── tiptap-renderer.component.ts         # Content renderer (88 lines)
│   │   │   └── tiptap-utils.ts                      # Utility functions (125 lines)
│   │   ├── package.json         # Library package configuration
│   │   └── README.md           # Library documentation
│   └── demo/                   # Demo application
│       ├── src/                # Demo source code
│       └── tsconfig.app.json   # Demo TypeScript config
├── .github/workflows/          # CI/CD pipelines
├── package.json               # Root package configuration
├── angular.json              # Angular workspace configuration
├── jest.config.ts           # Jest testing configuration
└── deploy.sh               # Deployment script
```

### Key Library Components
- **NgxMatTiptapComponent**: Main rich text editor component with Angular Material integration
- **NgxMatTiptapFormFieldDirective**: Directive for proper Material form field integration
- **NgxMatTiptapRendererComponent**: Component for rendering TipTap JSON content as HTML
- **Utility Functions**: `generateHTMLFromTiptap()`, `generateTiptapFromHTML()`, `renderTiptapContent()`, `isTiptapContentEmpty()`

## Common Tasks

### Frequent npm Commands
Available scripts (from `npm run`):
```bash
# Development
npm run demo              # Start demo dev server
npm run build:lib         # Build library
npm run build:lib:watch   # Build library in watch mode
npm run test              # Run unit tests
npm run test:coverage     # Run tests with coverage

# Building
npm run build             # Build default project
npm run build:demo        # Build demo application
npm run demo:build        # Build demo for production (fails in restricted environments)
```

### File Locations Quick Reference
- Main editor component: `projects/ngx-mat-tiptap/src/lib/ngx-mat-tiptap.ts`
- Public API exports: `projects/ngx-mat-tiptap/src/public-api.ts`
- Demo application: `projects/demo/src/app/app.component.ts`
- Test configuration: `jest.config.ts`
- Library styles: `projects/ngx-mat-tiptap/src/styles.css`

### Dependencies and Peer Dependencies
Main dependencies:
- Angular 20.1.0+
- Angular Material 20.1.0+
- TipTap Core 2.26.1+
- TipTap Starter Kit 2.26.1+

Dev dependencies include Jest, ng-packagr, TypeScript 5.8.2

## CI/CD and Deployment

### GitHub Actions Workflows
- **jest.yml**: Runs tests and coverage on PRs and main branch pushes
- **deploy-demo.yml**: Deploys demo to GitHub Pages on main branch pushes
- **pr-preview.yml**: Creates preview deployments for PRs

### Manual Deployment
- Use `./deploy.sh` script for full deployment process
- Script includes: dependency installation, testing, coverage reporting, version bumping, building, and npm publishing
- Requires npm login and clean git state

## Known Issues and Workarounds

### Network Restrictions
- **Puppeteer Download**: Use `PUPPETEER_SKIP_DOWNLOAD=true npm install`
- **Google Fonts**: Demo production build fails due to font loading; use dev server instead
- **googleapis.com blocked**: Expected in restricted environments; does not affect core functionality

### Environment-Specific Notes
- Jest testing works in all environments
- Library building works reliably
- Demo development server works reliably
- Demo production build may fail in restricted network environments

## Development Best Practices

### When Making Changes
1. Always test library build: `npm run build:lib`
2. Always run full test suite: `npm run test:coverage`
3. Always start demo and manually validate: `npm run demo`
4. Always test real user scenarios with the TipTap editor
5. Verify JSON output, HTML rendering, and form integration

### Testing Approach
- Library uses Jest instead of Angular's default testing framework
- 60 tests across 4 test suites with 85%+ coverage
- Tests cover main component, directive, renderer, and utilities
- Coverage reports available in `coverage/` directory

### Code Organization
- Main library code in `projects/ngx-mat-tiptap/src/lib/`
- Demo application demonstrates all library features
- TypeScript configuration optimized for library development
- Angular Material integration for consistent UI/UX