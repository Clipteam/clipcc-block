/**
 * @fileoverview Build script to build blocky, Made by SteveXMH in ClipTeam.
 * @copyright ClipTeam
 */
'use strict'
const child_process = require('child_process')
const path = require('path')
const closureComplier = require('google-closure-compiler')
const { promises: fs, exists: fsExists } = require('fs')

const nodeModulePath = path.join(__dirname, 'node_modules')
const nodeModuleBinPath = path.join(nodeModulePath, '.bin')
const closureCompilerNpm = 'google-closure-compiler'
const closureLibraryNpm = 'google-closure-library'
const closureCompilerPath = process.env.closure || path.join(nodeModulePath, closureCompilerNpm)
const closureCompilerBinPath = path.join(nodeModuleBinPath, `${closureCompilerNpm}.${process.platform === 'win32' ? 'cmd' : ''}`)
const closureLibraryPath = process.env.closure || path.join(nodeModulePath, closureLibraryNpm)
const parallel = process.env.parallel || true

/**
 * Short for console.log, output message.
 * @param  {...any} args Any message to output.
 */
function log(...args) { console.log(...args) }

/**
 * Short for console.error, output error message.
 * @param  {...any} args Any error message to output.
 */
function err(...args) { console.error('[ERR]', ...args) }

/**
 * Check file is exists, promise version.
 * @param {string} pathLike File path
 * @returns {Promise<boolean>} Is file exists.
 */
function exists(pathLike) {
    return new Promise((resolve, reject) => {
        try {
            fsExists(pathLike, e => resolve(e))
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * Package of ChildProcess, add some promise function
 */
class ChildProc {
    /**
     * Create a child process.
     * @param {string} execFile 
     * @param {string[]=} args 
     */
    constructor(execFile, args) {
        this.proc = child_process.spawn(execFile, args)
        this.stdout = ''
        this.code = null
        this.proc.stdout.on('data', (chunk) => { this.stdout += chunk })
        this.proc.once('close', (code) => this.code = code)
    }

    waitForClose() {
        return new Promise((resolve, reject) => {
            if (this.proc.killed) return resolve(this)
            this.proc.once('close', (code) => { resolve(this) })
        })
    }
}

/**
 * Check build environment.
 */
async function checkEnv() {
    const errs = []
    function checkErrors() {
        if (errs.length > 0) {
            err(`Check failed, please follow these step${errs.length > 1 ? 's' : ''} to setup build environment:`)
            for (const advice of errs) {
                log('-', advice)
            }
            return false
        }
        return true
    }
    // Check npm
    if (!process.env.NPM_CLI_JS) {
        errs.push(`Can't detect npm environment, make sure you are run this script by npm.`)
    }
    // Check Closure
    if (!(await exists(closureLibraryPath)) ||
        !(await exists(closureCompilerPath)) ||
        !(await exists(closureCompilerBinPath))) {
        errs.push(`Can't detect closure library or closure compiler. Make sure you have installed these by npm, or use python build script for remote compile.`)
    }
    const lnkPath = path.join(__dirname, '../closure-library')
    if (!(await fs.stat(lnkPath)).isDirectory()) {
        // Try to create junction link
        try {
            await fs.symlink(closureLibraryPath, lnkPath, 'junction')
        } catch (error) {
            const errText = "Can't create juction link for closure-library, please create juction link manually by this command:\n"
            let command = `ln `
            errs.push(errText)
            return checkErrors()
        }
    }
    return checkErrors()
}

const buildCachePath = path.join(__dirname, 'build', 'cache.json')
/**
 * Test local closure compiler, result will be cached if has checked.
 */
async function testBuild() {
    async function testMain() {
        const testFile = path.join(__dirname, 'build', 'test_input.js')
        const testExpect = path.join(__dirname, 'build', 'test_expect.js')
        const testArgs = [testFile]
        const proc = new ChildProc(closureCompilerBinPath, testArgs)
        const [expectsData] = await Promise.all([fs.readFile(testExpect), proc.waitForClose()])
        const outData = proc.stdout.trim()
        if (outData === expectsData.toString().trim()) {
            log('Compile finished, updating cache data...')
            const closureStat = await fs.stat(closureLibraryPath)
            const cache = {}
            for (const key of ['ctimeMs', 'birthtimeMs', 'atimeMs', 'mtimeMs']) {
                cache[key] = closureStat[key]
            }
            await fs.writeFile(buildCachePath, JSON.stringify(cache))
            return true
        }
        err('Compile failed, expects:\n' + expectsData.toString().trim() + '\nGets:\n' + outData)
        return false
    }
    if (await exists(buildCachePath)) {
        try {
            const [cacheData, closureStat] = await Promise.all([await fs.readFile(buildCachePath), await fs.stat(closureLibraryPath)])
            const cache = JSON.parse(cacheData)
            for (const key of ['ctimeMs', 'birthtimeMs', 'atimeMs', 'mtimeMs']) {
                if (cache[key] !== closureStat[key]) {
                    log('Closure compiler updated, restarting test...')
                    return testMain()
                }
            }
        } catch (error) {
            log('[WARN]', 'Build cache file load failed, restarting test...')
            return testMain()
        }
    } else {
        log('Testing Build...')
        return testMain()
    }
    log('Closure compiler has tested, test ignored.')
    return true
}

/**
 * Main function to build blocky.
 */
async function build() {
    const header =  "// Do not edit this file; automatically generated by build.js.\n" +
                    "'use strict';\n"
}

/**
 * Where script starts.
 */
async function main() {
    log('Checking build environment...')
    if (!(await checkEnv())) return
    log('Checking closure compiler status...')
    if (!(await testBuild())) return
    log('Start building...')
    await build()
}

main()
