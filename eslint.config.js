import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', '.codex/**', 'test-results/**', 'playwright-report/**', 'src/locales/generated/**'] },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    rules: {
      // Introduce correctness checks first; unused-code cleanup is separate.
      'no-unused-vars': 'off',
      'vue/no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      // Form components edit fields of a parent-owned reactive model, never replace it.
      'vue/no-mutating-props': ['error', { shallowOnly: true }],
    },
  },
  { files: ['src/**/*.{js,vue}'], languageOptions: { globals: globals.browser } },
  { files: ['scripts/**/*.{js,mjs,cjs}', 'test/**/*.js', '*.config.js'], languageOptions: { globals: globals.node } },
  { files: ['e2e/**/*.js'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['src/utils/raidExport.js'], rules: { 'no-control-regex': 'off' } }, // Strip invalid filename characters.
]
