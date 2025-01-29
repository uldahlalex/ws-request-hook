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
    indexHtmlFile: "cypress/support/component-index.html",
    requestTimeout: 10000,
    pageLoadTimeout: 10000,
    taskTimeout: 10000,
    execTimeout: 10000,
    responseTimeout: 10000,
    defaultCommandTimeout: 10000
  }
});