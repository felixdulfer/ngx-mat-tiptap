export default {
  displayName: 'ngx-mat-tiptap',
  setupFilesAfterEnv: ['<rootDir>/projects/ngx-mat-tiptap/src/test-setup.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/projects/ngx-mat-tiptap/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|lodash-es|ng2-charts|@angular/.*))',
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/projects/ngx-mat-tiptap/src/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'projects/ngx-mat-tiptap/src/**/*.ts',
    '!projects/ngx-mat-tiptap/src/**/*.spec.ts',
    '!projects/ngx-mat-tiptap/src/**/*.d.ts',
    '!projects/ngx-mat-tiptap/src/public-api.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
