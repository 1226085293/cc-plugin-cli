import fs from 'fs';
import child_process from 'child_process';
import path from 'path';
import ts from "typescript";

module compile {
    /**项目路径 */
    let project_path_s = path.resolve(__dirname.slice(0, __dirname.indexOf("node_modules")));
//    export function all(): void {
//     // 打印选项
//     let project_path_s = __dirname.slice(0, __dirname.indexOf("node_modules"));
//     let package_path_s = path.resolve(project_path_s, "packages");
//     fs.readdirSync(package_path_s).forEach(v1_s=> {
//         let path_s = `${package_path_s}/${v1_s}`;
//         if (fs.existsSync(`${path_s}/tsconfig.json`)) {
//             console.warn(`tsc -p ${path_s}/tsconfig.json`);
//             child_process.exec(`tsc -p ${path_s}/tsconfig.json`, (error, stdout, stderr)=> {
//                 if (stdout) {
//                     console.error(stdout);
//                 }
//             });
//         }
//     });
//    }
function getTSConfig(fileName: string): [string[], ts.CompilerOptions] {
	// TODO this needs a better design than merging stuff into options.
	// the trouble is what to do when no tsconfig is specified...

	const configText = fs.readFileSync(fileName, { encoding: 'utf8' });
	const result = ts.parseConfigFileTextToJson(fileName, configText);
	if (result.error) {
		throw result.error;
	}
	const configObject = result.config;
	const configParseResult = ts.parseJsonConfigFileContent(configObject, ts.sys, path.dirname(fileName));
	if (configParseResult.errors && configParseResult.errors.length) {
		throw configParseResult.errors;
	}

	return [
		configParseResult.fileNames,
		configParseResult.options
	];
}
function getFilenames(baseDir: string, files: string[]): string[] {
	return files.map(function (filename) {
		const resolvedFilename = path.resolve(filename);
		if (resolvedFilename.indexOf(baseDir) === 0) {
			return resolvedFilename;
		}

		return path.resolve(baseDir, filename);
	});
}
function complier (fileNames: string[], options: ts.CompilerOptions): void {
    let program = ts.createProgram(fileNames, options)
    let emitResult = program.emit()
  
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
  
    allDiagnostics.forEach(diagnostics => {
      if (diagnostics.file) {
        let { line, character } = diagnostics.file.getLineAndCharacterOfPosition(diagnostics.start!)
        let message = ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n');
        console.log(`${diagnostics.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
      } else {
        console.log(ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n'))
      }
    })
  
    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code ${exitCode}.`);
    process.exit(exitCode)
  }

    export function single(path_s_: string): void {
        path_s_ = path.resolve(path_s_);
        debugger
        let package_name_s = path_s_.slice(path_s_.lastIndexOf("\\") + 2, path_s_.length);
        const config_path_s = ts.findConfigFile(path_s_, ts.sys.fileExists);
        const config_file_a: ts.CompilerOptions = ts.readConfigFile(config_path_s, ts.sys.readFile).config;
        let [files, compilerOptions] = getTSConfig(config_path_s);
        let filenames: string[] = [];
        if (compilerOptions.rootDirs) {
            compilerOptions.rootDirs.forEach(v1_s=> {
                filenames.push(...getFilenames(v1_s, files));
            });
        } else {
            const baseDir = path.resolve(compilerOptions.rootDir || compilerOptions.project || <string>compilerOptions.baseDir);
            filenames = getFilenames(baseDir, files);
        }
        complier(filenames, compilerOptions);
    }
}




// complier(process.argv.slice(2), {
//   noEmitOnError: true,
//   noImplicitAny: true,
//   target: ts.ScriptTarget.ES5,
//   module: ts.ModuleKind.CommonJS
// })

export default compile;