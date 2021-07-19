import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import ts from "typescript";
import tool from './tool';
import log from './log';
import instance_base from './instance_base';

module _compile {
    /*---------enum_private */
    /*---------enum_public */
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
	class tsconfig {
		include?: string[];
		exclude?: string[];
		compilerOptions: ts.CompilerOptions;
	}
    /*---------class_public */
	export class task_info {
		constructor(init_?: task_info) {
			Object.assign(this, init_);
		}
		/**包路径 */
		public package_dir_s: string;
		/**package.json */
		public package_config: any;
		/**tsconfig */
		public tsconfig: tsconfig;
		/**tsconfig解析 */
		public tsconfig_parse: ts.ParsedCommandLine;
	}
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

class compile extends instance_base {
	constructor() {
		super();
		log.instance().register_anim("旋转跳跃", (index_n: number, desc_s: string)=> {
			return ["▁", "▂", "▃", "▅", "▆", "▇"][index_n % 6] + "  " + desc_s;
		});
		if (fs.existsSync(path.resolve(this.project_path_s, "project.json"))) {
			this.project_version_s = JSON.parse(fs.readFileSync(path.resolve(this.project_path_s, "project.json"), "utf8")).version;
		} else if (fs.existsSync(path.resolve(this.project_path_s, "package.json"))) {
			this.project_version_s = JSON.parse(fs.readFileSync(path.resolve(this.project_path_s, "package.json"), "utf8")).version;
		}
	}
	/* ***************private*************** */
	/**当前任务信息 */
	private _task_info: _compile.task_info;
	/**项目路径 */
	public project_path_s = path.normalize(__dirname.slice(0, __dirname.indexOf("node_modules")));
	/**项目版本 */
	public project_version_s: string;
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
					log.instance().w(`${diagnostics.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
				} else {
					// log.instance().w(ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n'))
				}
			});
		}
		return !emit_result.emitSkipped;
	}
	/**拷贝依赖模块 */
	private _copy_dependent_module(input_s_: string, output_s_: string): void {
		// 添加依赖包路径
		{
			let stdout_s = "";
			try {
				stdout_s = child_process.execSync("npm ls --production --parseable", {
					"cwd": input_s_,
					"stdio": "pipe"
				}).toString();
			} catch (e) {
				log.instance().w("获取依赖模块失败");
			}
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
						tool.file.copy(v2_s, v2_s.replace(input_s_, output_s_));
					});
				});
			}
		}
	}
	/**拷贝其他文件 */
	private _copy_other_file(path_s_: string, output_s_: string, output_src_s_: string) {
		/**拷贝文件 */
		let copy_file_ss = tool.file.search(path_s_, /(.*(?<!(\.ts)|(\.js))$)/g, {
			"type_n": tool.file.file_type.file,
			"exclude_ss": [
				path.resolve(path_s_, "node_modules"),
			]
		});
		/**输出文件 */
		copy_file_ss.forEach(v1_s=> {
			tool.file.copy(v1_s, v1_s.replace(path_s_, output_src_s_));
		});
		// 拷贝项目配置文件至包根目录
		let config_file_ss = [
			path.resolve(path_s_, "tsconfig.json"),
			path.resolve(path_s_, "jsconfig.json"),
			path.resolve(path_s_, "package.json"),
			path.resolve(path_s_, "package-lock.json"),
		];
		config_file_ss.forEach(v1_s=> {
			tool.file.copy(v1_s, v1_s.replace(path_s_, output_s_));
		});
	}
	/**更新当前任务信息 */
	private _update_task_info(path_s_: string): boolean {
		let task_info = new _compile.task_info;
		task_info.package_dir_s = path.resolve(path_s_);
		/**package.json路径 */
		let package_config_path_s = path.resolve(task_info.package_dir_s, "package.json");
		/**tsconfig.json路径 */
        let ts_config_path_s = path.resolve(task_info.package_dir_s, "tsconfig.json");
		// 安检
		{
			if (!fs.existsSync(package_config_path_s)) {
				log.instance().push("未找到package.json");
			}
			if (!fs.existsSync(ts_config_path_s)) {
				log.instance().push("未找到tsconfig.json");
			}
			if (log.instance().e()) {
				return false;
			}
		}
		// 读取配置文件
		{
			let temp1 = ts.readConfigFile(package_config_path_s, ts.sys.readFile);
			let temp2 = ts.readConfigFile(ts_config_path_s, ts.sys.readFile);
			log.instance().push(temp1.error);
			log.instance().push(temp2.error);
			if (log.instance().e()) {
				return false;
			}
			task_info.package_config = temp1.config;
			task_info.tsconfig = <any>temp2.config;
			// 解析配置文件
			{
				task_info.tsconfig_parse = ts.parseJsonConfigFileContent(task_info.tsconfig, ts.sys, path.dirname(ts_config_path_s));
				if (task_info.tsconfig_parse.errors && task_info.tsconfig_parse.errors.length) {
					log.instance().e("解析配置文件错误", task_info.tsconfig_parse.errors);
					return false;
				}
			}
		}
		this._task_info = task_info;
		return true;
	}
	/**处理面板入口脚本 */
	private _panel_entry_process(): void {
		/**输出目录 */
		let output_dir_s_ = path.normalize(this._task_info.tsconfig_parse.options.outDir);
		/**输出目录名 */
		let output_dir_name_s = path.basename(output_dir_s_);
		/**package.json */
		let package_config_s = fs.readFileSync(path.resolve(output_dir_s_, "package.json"), "utf8");
		// 更新入口脚本路径
		{
			/**修改状态 */
			let modify_b = false;
			let main_s = path.resolve(output_dir_s_, this._task_info.package_config.main);
			if (!fs.existsSync(main_s)) {
				let reg = new RegExp(`${path.normalize(this._task_info.package_config.main).replace(/\\/g, "\\\\").replace(/\./g, "\\.")}$`);
				main_s = tool.file.search(
					output_dir_s_,
					reg,
					{
						"type_n": tool.file.file_type.file,
						"exclude_ss": [path.resolve(output_dir_s_, "node_modules")]
					}
				)[0];
				let wirter_s = main_s.replace(output_dir_s_ + path.sep, "").replace(/\\/g, `/`);
				package_config_s = package_config_s.replace(this._task_info.package_config.main, wirter_s);
				this._task_info.package_config.main = main_s;
				modify_b = true;
			}
			let panel_main_s = path.resolve(output_dir_s_, this._task_info.package_config.panel.main);
			if (!fs.existsSync(panel_main_s)) {
				let reg = new RegExp(`${path.normalize(this._task_info.package_config.panel.main).replace(/\\/g, "\\\\").replace(/\./g, "\\.")}$`);
				panel_main_s = tool.file.search(
					output_dir_s_,
					reg,
					{
						"type_n": tool.file.file_type.file,
						"exclude_ss": [path.resolve(output_dir_s_, "node_modules")]
					}
				)[0];
				let wirter_s = panel_main_s.replace(output_dir_s_ + path.sep, "").replace(/\\/g, `/`);
				package_config_s = package_config_s.replace(this._task_info.package_config.panel.main, wirter_s);
				this._task_info.package_config.panel.main = panel_main_s;
				modify_b = true;
			}
			if (modify_b) {
				fs.writeFileSync(path.resolve(output_dir_s_, "package.json"), package_config_s);
			}
		}
		// 处理面板入口脚本
		{
			/**包目录 */
			let package_dir_s = path.join("${Editor.Project.path}", "packages", output_dir_name_s);
			/**面板入口脚本所在目录 */
			let panel_dir_s: string;
			{
				let temp1_s = this._task_info.package_config.panel.main.slice(this._task_info.package_config.panel.main.indexOf("packages") + "packages".length, this._task_info.package_config.panel.main.length);
				panel_dir_s = (path.join("${Editor.Project.path}", "packages", path.dirname(temp1_s)) + path.sep).replace(/\\/g, "/");;
			}
			/**面板入口脚本 */
			let panel_main_s = fs.readFileSync(this._task_info.package_config.panel.main, "utf8");
			panel_main_s = panel_main_s.replace("Object.defineProperty(exports", "Object.defineProperty(module.exports");
			/**node_modules路径 */
			let node_module_dir_s = path.resolve(package_dir_s, "node_modules");
			panel_main_s = panel_main_s.replace(/(?<=(require\())[^)]*/g, function (v_s) {
				let content_s = v_s.slice(1, v_s.length - 1);
				// 局部模块
				if (content_s.startsWith(".")) {
					return `__dirname + ${v_s}`;
				}
				// 全局模块/npm模块
				else if (fs.existsSync(path.resolve(node_module_dir_s, content_s))) {
					return `\`${path.join(package_dir_s, "node_modules", content_s).replace(/\\/g, "/")}\``;
				}
				return v_s;
			});
			// 更新脚本
			fs.writeFileSync(this._task_info.package_config.panel.main, panel_main_s, "utf8");
		}
	}
	// 编译单包
    public async single(path_s_: string): Promise<void> {
        // 路径转换
		path_s_ = path.resolve(path_s_);
		log.instance().time_start("compile");
		// 更新任务信息
		{
			if (!this._update_task_info(path_s_)) {
				return;
			}
			log.instance().time_log("compile", "更新任务信息");
		}
		/**tsconfig解析 */
		let tsconfig_parse = this._task_info.tsconfig_parse;
		/**输出目录 */
		let output_dir_s_ = path.normalize(this._task_info.tsconfig_parse.options.outDir);
		/**包源目录 */
		let package_src_dir_s = path.basename(path_s_);
		// 清理输出目录
		{
			tool.file.del(output_dir_s_);
			log.instance().time_log("compile", "清理输出目录");
		}
		// 编译
		{
			/**包含文件 */
			await log.instance().anim("旋转跳跃", ["编译"], ()=> {
				if (!this._complier(tsconfig_parse)) {
					log.instance().p("编译错误");
				}
			});
			if (log.instance().e()) {
				log.instance().time_end("compile");
				return;
			}
			log.instance().time_log("compile", "编译");
		}
		// 拷贝依赖文件
		{
			/**包源输出目录 */
			let package_out_src_dir_s = tool.file.search(
				output_dir_s_,
				new RegExp(`${package_src_dir_s}$`),
				{
					"type_n": tool.file.file_type.dir,
					"exclude_ss": [path.resolve(output_dir_s_, "node_modules")]
				}
			)[1];
			await log.instance().anim("旋转跳跃", ["拷贝依赖文件"], ()=> {
				this._copy_dependent_module(path_s_, output_dir_s_);
				this._copy_other_file(path_s_, output_dir_s_, package_out_src_dir_s);
			});
			log.instance().time_log("compile", "拷贝依赖文件");
		}
		// 处理入口脚本
		if (this.project_version_s.startsWith("2")) {
			this._panel_entry_process();
			log.instance().time_log("compile", "处理入口脚本");
		}
		log.instance().time_end("compile");
    }
}

export default new compile;