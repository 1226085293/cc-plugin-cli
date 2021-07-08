import fs from 'fs';
import child_process from 'child_process';
import path from 'path';
import ts from "typescript";
import log from './tool/log';

class compile {
	/* ***************private*************** */
    /**项目路径 */
    private project_path_s = path.resolve(__dirname.slice(0, __dirname.indexOf("node_modules")));
	/* ***************功能函数*************** */
	/**获取包含文件 */
	private _get_include_file(ts_config_parse_: ts.ParsedCommandLine): string[] {
		let option = ts_config_parse_.options;
		let file_name_ss = ts_config_parse_.fileNames;
		/**根目录 */
		let root_dir_ss: string[] = [];
		// 获取所有根目录
		{
			if (option.rootDirs) {
				option.rootDirs.forEach(v1_s=> {
					root_dir_ss.push(path.resolve(v1_s));
				});
			} else {
				root_dir_ss.push(path.resolve(option.rootDir || option.project || <string>option.baseDir));
			}
		}
		/**包含文件 */
		let include_file_ss: string[] = [];
		// 更新包含文件
		{
			let temp1_s: string;
			root_dir_ss.forEach(v1_s=> {
				include_file_ss.push(...file_name_ss.map((v2_s)=> {
					temp1_s = path.resolve(v2_s);
					if (temp1_s.indexOf(v1_s) === 0) {
						return temp1_s;
					}
					return path.resolve(v1_s, v2_s);
				}));
			});
		}
		return include_file_ss;
	}
	/**编译项目 */
	private _complier (fileNames: string[], options: ts.CompilerOptions): void {
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
	// 编译单包
    public single(path_s_: string): void {
        // 路径转换
		path_s_ = path.resolve(path_s_);
		/**package.json路径 */
		let package_config_path_s = path.resolve(path_s_, "package.json");
		/**tsconfig.json路径 */
        let ts_config_path_s = path.resolve(path_s_, "tsconfig.json");
		// 安检
		{
			if (!fs.existsSync(package_config_path_s)) {
				log.push("未找到package.json");
			}
			if (!fs.existsSync(ts_config_path_s)) {
				log.push("未找到tsconfig.json");
			}
			if (log.e()) {
				return;
			}
		}
		/**package.json */
		let package_config: any;
		/**tsconfig.json */
		let ts_config: ts.CompilerOptions;
		// 读取配置文件
		{
			let temp1 = ts.readConfigFile(package_config_path_s, ts.sys.readFile);
			let temp2 = ts.readConfigFile(ts_config_path_s, ts.sys.readFile);
			log.push(temp1.error);
			log.push(temp2.error);
			if (log.e()) {
				return;
			}
			package_config = temp1.config;
			ts_config = temp2.config;
		}
		// 解析配置文件
		let ts_config_parse: ts.ParsedCommandLine;
		{
			ts_config_parse = ts.parseJsonConfigFileContent(ts_config, ts.sys, path.dirname(ts_config_path_s));
			if (ts_config_parse.errors && ts_config_parse.errors.length) {
				throw ts_config_parse.errors;
			}
		}
		// 获取包含文件
		let include_file_ss = this._get_include_file(ts_config_parse);
		// 编译
        this._complier(include_file_ss, ts_config_parse.options);
    }
}

export default new compile;