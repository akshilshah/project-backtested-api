import run from '@rollup/plugin-run'
import babel from 'rollup-plugin-babel'
import localResolve from 'rollup-plugin-local-resolve'
import typescript from '@rollup/plugin-typescript'

const dev =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'build'

export default {
  input: 'src/server.js',
  output: {
    file: 'run.js',
    format: 'cjs'
  },
  plugins: [
    typescript({
      include: ['prisma/generated/**/*.ts'],
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'node',
        declaration: false
      }
    }),
    babel({
      exclude: ['prisma/generated/**']
    }),
    localResolve(),
    dev &&
      run({
        execArgv: ['-r', 'dotenv/config']
      })
  ],
  external: [
    /prisma\/generated/,
    '@sentry/node',
    '@sentry/profiling-node',
    '@sentry/tracing',
    'cors',
    'dotenv/config',
    'express',
    'compression',
    'helmet',
    'body-parser',
    'morgan',
    '@prisma/client',
    '@prisma/client/runtime/client',
    '@prisma/adapter-pg',
    'moment',
    'moment-timezone',
    'jsonwebtoken',
    'lodash',
    'axios',
    '@langchain/core/prompts',
    '@langchain/core/runnables',
    '@langchain/openai',
    'zod',
    '@langchain/community/vectorstores/azure_aisearch',
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-ses',
    '@aws-sdk/credential-provider-imds',
    '@aws-sdk/credential-provider-ini',
    '@aws-sdk/credential-provider-node',
    '@aws-sdk/credential-provider-sso',
    '@aws-sdk/credential-provider-web-identity',
    '@aws-sdk/client-s3',
    'langsmith/wrappers',
    'langsmith/trace',
    'langsmith/traceable',
    'langchain/llms/azure',
    'openai',
    'node:fs',
    'fs',
    'fs/promises',
    'crypto',
    'node:crypto',
    'path',
    'node:path',
    'node:url',
    'url',
    'langsmith',
    'langsmith/evaluation',
    'node-fetch',
    '@azure/search-documents',
    'ssh2-sftp-client',
    'xlsx',
    'uuid'
  ]
}

// https://hoangvvo.com/blog/node-es6-without-nodemon-and-babel/

// package.json
//   > scripts
// "start": "node bundle.js",
// "build": "NODE_ENV=production rollup -c",cls
// "dev": "rollup -c -w"
