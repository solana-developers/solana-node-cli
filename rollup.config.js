import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/index.ts",
  output: {
    dir: "bin",
    format: "esm",
    entryFileNames: "[name].mjs",
  },
  plugins: [
    commonjs(),
    nodeResolve({
      exportConditions: ["node"], // add node option here,
      preferBuiltins: true,
    }),
    json(),
    typescript(),
    terser({
      format: {
        comments: "some",
        beautify: true,
        // ecma: "2022",
      },
      compress: false,
      mangle: false,
      module: true,
    }),
  ],
};
