import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import ts from "typescript";
import log from './log';
import tool from './tool';

class compile {
	constructor() {
		log.register_anim("旋转跳跃", (index_n: number, desc_s: string)=> {
			return ["▁", "▂", "▃", "▅", "▆", "▇"][index_n % 6] + "  " + desc_s;
		});
	}
	/* ***************private*************** */
    /**项目路径 */
    private _project_path_s = path.resolve(__dirname.slice(0, __dirname.indexOf("node_modules")));
	/* ***************功能函数*************** */
	/**编译项目 */
	private _complier(ts_config_parse_: ts.ParsedCommandLine): boolean {
		/**包含文件 */
		let include_file_ss: string[] = [];
		// 获取包含目录
		{
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
		}
		let emit_result: ts.EmitResult;
		// 编译
		{
			let program = ts.createProgram(include_file_ss, ts_config_parse_.options);
			emit_result = program.emit();
			/**诊断信息 */
			let all_diagnostics = ts.getPreEmitDiagnostics(program).concat(emit_result.diagnostics);
			all_diagnostics.forEach(diagnostics => {
				if (diagnostics.file) {
					let { line, character } = diagnostics.file.getLineAndCharacterOfPosition(diagnostics.start!)
					let message = ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n');
					log.w(`${diagnostics.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
				} else {
					// log.w(ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n'))
				}
			});
		}
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
		let ts_config: {
			include: string[];
			compilerOptions: ts.CompilerOptions;
		};
		/**tsconfig解析 */
		let ts_config_parse: ts.ParsedCommandLine;
		/**包文件夹名 */
		let package_dir_name_s: string;
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
				ts_config_parse.options.outDir = path.normalize(ts_config_parse.options.outDir);
				if (ts_config_parse.errors && ts_config_parse.errors.length) {
					throw ts_config_parse.errors;
				}
			}
			// 获取文件夹名
			package_dir_name_s = path.basename(ts_config.compilerOptions.outDir);
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
			await log.anim("旋转跳跃", ["编译"], ()=> {
				if (!this._complier(ts_config_parse)) {
					log.p("编译错误");
				}
			});
			if (log.e()) {
				log.time_end("compile");
				return;
			}
			log.time_log("compile", "编译");
		}
		/**项目脚本路径 */
		let package_scr_dir_s = tool.file.search(
			ts_config_parse.options.outDir,
			new RegExp(package_dir_name_s),
			{
				"type_n": tool.file.file_type.dir,
				"exclude_ss": [path.resolve(ts_config_parse.options.outDir, "node_modules")]
			}
		)[1];
		// 拷贝依赖文件
		{
			await log.anim("旋转跳跃", ["拷贝依赖文件"], ()=> {
				// 添加依赖包路径
				{
					let stdout_s: string = child_process.execSync("npm ls --production --parseable", {
						"cwd": path_s_,
						"stdio": "pipe"
					}).toString();
					/**依赖包 */
					let include_package_ss = stdout_s.split("\n");
					// 清除无用参数
					{
						include_package_ss.shift();
						include_package_ss = include_package_ss.filter(v1_s=> v1_s);
					}
					if (include_package_ss.length) {
						// 去除目录尾
						{
							let temp1_s = `node_modules${path.sep}`;
							let end_n: number;
							include_package_ss = include_package_ss.map(v1_s=> {
								if (~(end_n = v1_s.indexOf(path.sep, v1_s.indexOf(temp1_s) + temp1_s.length))) {
									return v1_s.slice(0, end_n + path.sep.length);
								} else {
									return v1_s;
								}
							});
						}
						// 去重
						include_package_ss = [...new Set(include_package_ss)];
						// 拷贝依赖包
						include_package_ss.forEach(v1_s=> {
							tool.file.search(v1_s, /(\.js$)|(package\.json$)/g).forEach(v2_s=> {
								tool.file.copy(v2_s, v2_s.replace(path_s_, ts_config_parse.options.outDir));
							});
						});
					}
				}
				// 拷贝包配置
				{
					tool.file.copy(path.resolve(path_s_, "package.json"), path.resolve(ts_config_parse.options.outDir, "package.json"));
					tool.file.copy(path.resolve(path_s_, "package-lock.json"), path.resolve(ts_config_parse.options.outDir, "package-lock.json"));
				}
				// 拷贝web文件
				{
					let web_file_ss = tool.file.search(path_s_, /(\.css$)|(\.html$)/g, {
						"type_n": tool.file.file_type.file,
						"exclude_ss": [path.resolve(path_s_, "node_modules")]
					});
					let web_file_output_ss = web_file_ss.map(v1_s=> v1_s.replace(path.resolve(path_s_), ts_config_parse.options.outDir));
					web_file_ss.forEach((v1_s, k1_n)=> {
						tool.file.copy(v1_s, path.resolve(path.dirname(web_file_output_ss[k1_n]).replace(ts_config_parse.options.outDir, package_scr_dir_s), path.basename(web_file_output_ss[k1_n])));
					});
				}
			});
			log.time_log("compile", "拷贝依赖文件");
		}
		// 处理入口脚本
		{
			/**package.json */
			let package_config_s = fs.readFileSync(path.resolve(ts_config_parse.options.outDir, "package.json"), "utf8");
			// 更新入口脚本路径
			{
				/**修改状态 */
				let modify_b = false;
				let main_s = path.resolve(ts_config_parse.options.outDir, package_config.main);
				if (!fs.existsSync(main_s)) {
					let reg = new RegExp(`${path.normalize(package_config.main).replace(/\\/g, "\\\\").replace(/\./g, "\\.")}$`);
					main_s = tool.file.search(
						ts_config_parse.options.outDir,
						reg,
						{
							"type_n": tool.file.file_type.file,
							"exclude_ss": [path.resolve(ts_config_parse.options.outDir, "node_modules")]
						}
					)[0];
					let wirter_s = main_s.replace(ts_config_parse.options.outDir + path.sep, "").replace(/\\/g, `/`);
					package_config_s = package_config_s.replace(package_config.main, wirter_s);
					package_config.main = main_s;
					modify_b = true;
				}
				let panel_main_s = path.resolve(ts_config_parse.options.outDir, package_config.panel.main);
				if (!fs.existsSync(panel_main_s)) {
					let reg = new RegExp(`${path.normalize(package_config.panel.main).replace(/\\/g, "\\\\").replace(/\./g, "\\.")}$`);
					panel_main_s = tool.file.search(
						ts_config_parse.options.outDir,
						reg,
						{
							"type_n": tool.file.file_type.file,
							"exclude_ss": [path.resolve(ts_config_parse.options.outDir, "node_modules")]
						}
					)[0];
					let wirter_s = panel_main_s.replace(ts_config_parse.options.outDir + path.sep, "").replace(/\\/g, `/`);
					package_config_s = package_config_s.replace(package_config.panel.main, wirter_s);
					package_config.panel.main = panel_main_s;
					modify_b = true;
				}
				if (modify_b) {
					fs.writeFileSync(path.resolve(ts_config_parse.options.outDir, "package.json"), package_config_s);
				}
			}
			// 处理面板入口脚本
			{
				/**包目录 */
				let package_dir_s = path.join("${Editor.Project.path}", "packages", package_dir_name_s);
				/**面板入口脚本所在目录 */
				let panel_dir_s: string;
				{
					let temp1_s = package_config.panel.main.slice(package_config.panel.main.indexOf("packages") + "packages".length, package_config.panel.main.length);
					panel_dir_s = (path.join("${Editor.Project.path}", "packages", path.dirname(temp1_s)) + path.sep).replace(/\\/g, "/");;
				}
				/**面板入口脚本 */
				let panel_main_s = fs.readFileSync(package_config.panel.main, "utf8");
				panel_main_s = panel_main_s.replace("Object.defineProperty(exports", "Object.defineProperty(module.exports");
				/**node_modules路径 */
				let node_module_dir_s = path.resolve(ts_config_parse.options.outDir, "node_modules");
				panel_main_s = panel_main_s.replace(/(?<=(require\())[^)]*/g, function (v_s) {
					let content_s = v_s.slice(1, v_s.length - 1);
					// 局部模块
					if (content_s.startsWith(".")) {
						return `\`${panel_dir_s}${content_s}\``;
					}
					// 全局模块/npm模块
					else if (fs.existsSync(path.resolve(node_module_dir_s, content_s))) {
						return `\`${path.join(package_dir_s, "node_modules", content_s).replace(/\\/g, "/")}\``;
					}
					return v_s;
				});
				// 替换面板宏
				panel_main_s = panel_main_s.replace(/\$panel\$/g, panel_dir_s);
				// 更新脚本
				fs.writeFileSync(package_config.panel.main, panel_main_s, "utf8");
			}
			log.time_log("compile", "检查入口脚本");
		}
		log.time_end("compile");
    }
}

export default new compile;