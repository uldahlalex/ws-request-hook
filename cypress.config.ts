import { defineConfig } from "cypress";
import webpackConfig from './webpack.config';

export default defineConfig({
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig
    },
    specPattern: "cypress/component/**/*.cy.tsx",
    supportFile: "cypress/support/component.ts",
    indexHtmlFile: "cypress/support/component-index.html"
  }
});