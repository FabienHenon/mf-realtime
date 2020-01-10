// rollup.config.js
import babel from 'rollup-plugin-babel';
import clean from 'rollup-plugin-clean';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import { terser } from 'rollup-plugin-terser';

const NODE_ENV = process.env.NODE_ENV || "development";
const outputFile = "./dist/realtime.js";


const plugins = [
  clean(),
  replace({
    "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
  }),
  babel({
    exclude: ["node_modules/**"],
  }),
  nodeResolve(),
  commonjs({
    include: [
      'node_modules/**',
    ],
    exclude: [
      'node_modules/process-es6/**',
    ],
    namedExports: {
      "node_modules/phoenix/priv/static/phoenix.js": ["Socket"]
    }
  })
];


if (process.env.NODE_ENV === 'production') {
  plugins.push(terser({ sourcemap: true }));
}


export default {
  input: 'src/realtime.js',
  output: {
    file: outputFile,
    format: 'iife',
    sourcemap: true,
  },
  plugins,
}
