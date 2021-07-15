import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import ts from "typescript";
import log from './log';
import custom_process from "./custom_process";
import tool from './tool';

class compile {
	constructor() {
		log.register_anim("旋转跳跃", (index_n: number, desc_s: string)=> {
			return ["▁", "▂", "▃", "▅", "▆", "▇"][index_n % 6] + "  " + desc_s;
		});
	}
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
	private _complier(file_ss_: string[], option_: ts.CompilerOptions): boolean {
		let program = ts.createProgram(file_ss_, option_);
		let emit_result = program.emit();
		/**诊断信息 */
		let all_diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
		all_diagnostics.forEach(diagnostics => {
			if (diagnostics.file) {
				let { line, character } = diagnostics.file.getLineAndCharacterOfPosition(diagnostics.start!)
				let message = ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n');
				log.w(`${diagnostics.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
			} else {
				log.w(ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n'))
			}
		});
		return !emit_result.emitSkipped;
	}
	// 编译单包
    public async single(path_s_: string): Promise<void> {
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
			if (log.error()) {
				return;
			}
		}
		log.time_start("compile");
		/**package.json */
		let package_config: any;
		/**tsconfig.json */
		let ts_config: { compilerOptions: ts.CompilerOptions };
		/**tsconfig解析 */
		let ts_config_parse: ts.ParsedCommandLine;
		// 读取配置文件
		{
			let temp1 = ts.readConfigFile(package_config_path_s, ts.sys.readFile);
			let temp2 = ts.readConfigFile(ts_config_path_s, ts.sys.readFile);
			log.push(temp1.error);
			log.push(temp2.error);
			if (log.error()) {
				return;
			}
			package_config = temp1.config;
			ts_config = temp2.config;
			// 解析配置文件
			{
				ts_config_parse = ts.parseJsonConfigFileContent(ts_config, ts.sys, path.dirname(ts_config_path_s));
				if (ts_config_parse.errors && ts_config_parse.errors.length) {
					throw ts_config_parse.errors;
				}
			}
			log.time_log("compile", "读取配置文件");
		}
		// 清理输出目录
		{
			tool.file.del(ts_config_parse.options.outDir);
			log.time_log("compile", "清理输出目录");
		}
		// 编译
		{
			/**包含文件 */
			let include_file_ss = this._get_include_file(ts_config_parse);
			// 添加依赖npm包
			{
				
			}
			await log.anim("旋转跳跃", ["正在编译"], ()=> {
				this._complier(include_file_ss, ts_config_parse.options);
			});
			log.time_log("compile", "编译");
		}
		log.time_end("compile");
    }
}

export default new compile;