import fs from "fs";
import child_process from "child_process";
import path from "path";
import archiver from "archiver";
import ts from "typescript";
import tool from "./tool";
import log from "./log";
import instance_base from "./instance_base";

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
		/**项目路径 */
		public project_path_s: string;
		/**项目版本 */
		public project_version_s: string;
	}
	/*---------function_private */
	/*---------function_public */
	/*---------logic */
}

class compile extends instance_base {
	constructor() {
		super();
		this._log.register_anim("旋转跳跃", (index_n: number, desc_s: string) => {
			return ["▁", "▂", "▃", "▅", "▆", "▇"][index_n % 6] + "  " + desc_s;
		});
	}
	/* ***************private*************** */
	private _log = log.instance();
	/* ***************public*************** */
	/**当前任务信息 */
	public task_info: _compile.task_info;
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
					option.rootDirs.forEach(v1_s => {
						root_dir_ss.push(path.resolve(v1_s));
					});
				} else {
					root_dir_ss.push(
						path.resolve(option.rootDir || option.project || <string>option.baseDir)
					);
				}
			}
			// 更新包含文件
			{
				let temp1_s: string;
				root_dir_ss.forEach(v1_s => {
					include_file_ss.push(
						...file_name_ss.map(v2_s => {
							temp1_s = path.resolve(v2_s);
							if (temp1_s.indexOf(v1_s) === 0) {
								return temp1_s;
							}
							return path.resolve(v1_s, v2_s);
						})
					);
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
					let { line, character } = diagnostics.file.getLineAndCharacterOfPosition(
						diagnostics.start!
					);
					let message = ts.flattenDiagnosticMessageText(diagnostics.messageText, "\n");
					this._log.w(
						`${diagnostics.file.fileName} (${line + 1}, ${character + 1}): ${message}`
					);
				} else {
					// this._log.w(ts.flattenDiagnosticMessageText(diagnostics.messageText, '\n'))
				}
			});
		}
		return !emit_result.emitSkipped;
	}
	/**获取依赖模块列表 */
	private _get_depend_module(depend_ss_: string[], result_ = Object.create(null)): any {
		let module_root_path_s = path.join(this.task_info.package_dir_s, "node_modules");
		let module_path_s: string;
		let package_config: any;
		depend_ss_.forEach(v1_s => {
			result_[v1_s] = true;
			if (
				!fs.existsSync(
					(module_path_s = path.join(module_root_path_s, v1_s, "package.json"))
				)
			) {
				return;
			}
			package_config = JSON.parse(fs.readFileSync(module_path_s, "utf-8"));
			// 递归获取依赖模块
			if (package_config.dependencies) {
				this._get_depend_module(
					Object.keys(package_config.dependencies).filter(v2_s => !result_[v2_s]),
					result_
				);
			}
		});
		return result_;
	}
	/**拷贝依赖模块 */
	private _copy_dependent_module(input_s_: string, output_s_: string): void {
		/**依赖模块 */
		let depend_module_ss = Object.keys(
			this._get_depend_module(Object.keys(this.task_info.package_config.dependencies))
		);
		// 补齐目录头
		{
			let module_root_path_s = path.join(this.task_info.package_dir_s, "node_modules");
			depend_module_ss.forEach((v1_s, k1_n) => {
				depend_module_ss[k1_n] = path.join(module_root_path_s, depend_module_ss[k1_n]);
			});
		}
		// 拷贝依赖包
		depend_module_ss.forEach(v1_s => {
			// 排除以 .d.ts | .md | LICENSE 结尾的文件
			tool.file
				.search(v1_s, /(.*(?<!(\.d\.ts)|(\.md)|(LICENSE))$)/g, {
					type_n: tool.file.file_type.file,
				})
				.forEach(v2_s => {
					tool.file.copy(v2_s, v2_s.replace(input_s_, output_s_));
				});
		});
	}
	/**拷贝其他文件 */
	private _copy_other_file(path_s_: string, output_s_: string, output_src_s_: string) {
		/**拷贝文件 */
		let copy_file_ss = tool.file.search(path_s_, /(.*(?<!(\.ts)|(\.js))$)/g, {
			type_n: tool.file.file_type.file,
			exclude_ss: [path.resolve(path_s_, "node_modules")],
		});
		/**输出文件 */
		copy_file_ss.forEach(v1_s => {
			tool.file.copy(v1_s, v1_s.replace(path_s_, output_src_s_));
		});
		// 拷贝项目配置文件至包根目录
		let config_file_ss = [
			path.resolve(path_s_, "package.json"),
			path.resolve(path_s_, "package-lock.json"),
		];
		config_file_ss.forEach(v1_s => {
			tool.file.copy(v1_s, v1_s.replace(path_s_, output_s_));
		});
	}
	/**更新当前任务信息 */
	private _update_task_info(path_s_: string): boolean {
		let task_info = new _compile.task_info();
		task_info.package_dir_s = path.resolve(path_s_);
		/**package.json路径 */
		let package_config_path_s = path.resolve(task_info.package_dir_s, "package.json");
		/**tsconfig.json路径 */
		let ts_config_path_s = path.resolve(task_info.package_dir_s, "tsconfig.json");
		// 安检
		{
			if (!fs.existsSync(package_config_path_s)) {
				this._log.push("未找到package.json");
			}
			if (!fs.existsSync(ts_config_path_s)) {
				this._log.push("未找到tsconfig.json");
			}
			if (this._log.e()) {
				return false;
			}
		}
		// 读取配置文件
		{
			let temp1 = ts.readConfigFile(package_config_path_s, ts.sys.readFile);
			let temp2 = ts.readConfigFile(ts_config_path_s, ts.sys.readFile);
			this._log.push(temp1.error);
			this._log.push(temp2.error);
			if (this._log.e()) {
				return false;
			}
			task_info.package_config = temp1.config;
			task_info.tsconfig = <any>temp2.config;
			// 去除 include 外部目录，防止包含未引用脚本
			{
				task_info.tsconfig.include.filter((v1, k1_n) => {
					if (v1.indexOf("..") !== -1) {
						task_info.tsconfig.include.splice(k1_n, 1);
					}
				});
			}
			// 解析配置文件
			{
				task_info.tsconfig_parse = ts.parseJsonConfigFileContent(
					task_info.tsconfig,
					ts.sys,
					path.dirname(ts_config_path_s)
				);
				if (task_info.tsconfig_parse.errors && task_info.tsconfig_parse.errors.length) {
					this._log.e("解析配置文件错误", task_info.tsconfig_parse.errors);
					return false;
				}
			}
			// 更新项目信息
			{
				task_info.project_path_s = path.dirname(
					path.dirname(task_info.tsconfig_parse.options.outDir)
				);
				if (fs.existsSync(path.resolve(task_info.project_path_s, "project.json"))) {
					task_info.project_version_s = JSON.parse(
						fs.readFileSync(
							path.resolve(task_info.project_path_s, "project.json"),
							"utf8"
						)
					).version;
				} else if (fs.existsSync(path.resolve(task_info.project_path_s, "package.json"))) {
					task_info.project_version_s = JSON.parse(
						fs.readFileSync(
							path.resolve(task_info.project_path_s, "package.json"),
							"utf8"
						)
					).version;
				}
			}
		}
		this.task_info = task_info;
		return true;
	}
	/**2.x面板入口脚本处理 */
	private _2x_panel_entry_process(): void {
		/**输出目录 */
		let output_dir_s_ = path.normalize(this.task_info.tsconfig_parse.options.outDir);
		/**输出目录名 */
		let output_dir_name_s = path.basename(output_dir_s_);
		/**package.json */
		let package_config_s = fs.readFileSync(path.resolve(output_dir_s_, "package.json"), "utf8");
		/**面板入口路径 */
		let panel_main_dir_s = this.task_info.package_config.panel.main;
		// 更新入口脚本路径
		{
			/**修改状态 */
			let modify_b = false;
			// 检查入口
			{
				let main_path_s = path.resolve(output_dir_s_, this.task_info.package_config.main);
				if (!fs.existsSync(main_path_s)) {
					let reg = new RegExp(
						`${path
							.normalize(this.task_info.package_config.main)
							.replace(/\\/g, "\\\\")
							.replace(/\./g, "\\.")}$`
					);
					let main_s = tool.file.search(output_dir_s_, reg, {
						type_n: tool.file.file_type.file,
						exclude_ss: [path.resolve(output_dir_s_, "node_modules")],
					})[0];
					if (!main_s) {
						this._log.e("未找到入口文件", this.task_info.package_config.main);
						return;
					}
					let wirter_s = main_s.replace(output_dir_s_ + path.sep, "").replace(/\\/g, `/`);
					package_config_s = package_config_s.replace(
						this.task_info.package_config.main,
						wirter_s
					);
					this.task_info.package_config.main = wirter_s;
					modify_b = true;
				}
			}
			// 检查面板入口
			{
				let panel_main_path_s = path.resolve(output_dir_s_, panel_main_dir_s);
				if (!fs.existsSync(panel_main_path_s)) {
					let reg = new RegExp(
						`${path
							.normalize(panel_main_dir_s)
							.replace(/\\/g, "\\\\")
							.replace(/\./g, "\\.")}$`
					);
					panel_main_path_s = tool.file.search(output_dir_s_, reg, {
						type_n: tool.file.file_type.file,
						exclude_ss: [path.resolve(output_dir_s_, "node_modules")],
					})[0];
					if (!panel_main_path_s) {
						this._log.e("未找到面板入口文件", panel_main_dir_s);
						return;
					}
					let wirter_s = panel_main_path_s
						.replace(output_dir_s_ + path.sep, "")
						.replace(/\\/g, `/`);
					package_config_s = package_config_s.replace(panel_main_dir_s, wirter_s);
					this.task_info.package_config.panel.main = wirter_s;
					panel_main_dir_s = panel_main_path_s;
					modify_b = true;
				} else {
					panel_main_dir_s = panel_main_path_s;
				}
			}
			// 检查场景脚本
			{
				let scene_scr_path_s = path.resolve(
					output_dir_s_,
					this.task_info.package_config["scene-script"] || ""
				);
				if (
					this.task_info.package_config["scene-script"] &&
					!fs.existsSync(scene_scr_path_s)
				) {
					let reg = new RegExp(
						`${path
							.normalize(this.task_info.package_config["scene-script"])
							.replace(/\\/g, "\\\\")
							.replace(/\./g, "\\.")}$`
					);
					scene_scr_path_s = tool.file.search(output_dir_s_, reg, {
						type_n: tool.file.file_type.file,
						exclude_ss: [path.resolve(output_dir_s_, "node_modules")],
					})[0];
					if (!scene_scr_path_s) {
						this._log.e(
							"未找到场景脚本",
							this.task_info.package_config["scene-script"]
						);
						return;
					}
					let wirter_s = scene_scr_path_s
						.replace(output_dir_s_ + path.sep, "")
						.replace(/\\/g, `/`);
					package_config_s = package_config_s.replace(
						this.task_info.package_config["scene-script"],
						wirter_s
					);
					this.task_info.package_config["scene-script"] = wirter_s;
					modify_b = true;
				}
			}
			if (modify_b) {
				fs.writeFileSync(path.resolve(output_dir_s_, "package.json"), package_config_s);
			}
		}
		// 处理面板入口脚本
		{
			/**包目录 */
			let package_dir_s = path.join("${Editor.Project.path}", "packages", output_dir_name_s);
			/**面板入口脚本 */
			let panel_main_s = fs.readFileSync(panel_main_dir_s, "utf8");
			/**面板入口脚本所在目录 */
			let panel_dir_s: string;
			{
				let temp1_s = panel_main_dir_s.slice(
					panel_main_dir_s.indexOf("packages") + "packages".length,
					panel_main_dir_s.length
				);
				panel_dir_s = (
					path.join("${Editor.Project.path}", "packages", path.dirname(temp1_s)) +
					path.sep
				).replace(/\\/g, "/");
			}
			panel_main_s = panel_main_s.replace(
				"Object.defineProperty(exports",
				"Object.defineProperty(module.exports"
			);
			/**node_modules路径 */
			let node_module_dir_s = path.resolve(package_dir_s, "node_modules");
			panel_main_s = panel_main_s.replace(/(?<=(require\())[^)]*/g, function (v_s) {
				let content_s = v_s.slice(1, v_s.length - 1);
				// 局部模块
				if (content_s.startsWith(".")) {
					return `\`${panel_dir_s}${content_s}\``;
				}
				// 全局模块/npm模块
				else if (fs.existsSync(path.resolve(node_module_dir_s, content_s))) {
					return `\`${path
						.join(package_dir_s, "node_modules", content_s)
						.replace(/\\/g, "/")}\``;
				}
				return v_s;
			});
			// 替换面板宏
			panel_main_s = panel_main_s.replace(/\$panel\$/g, panel_dir_s);
			// 更新脚本
			fs.writeFileSync(panel_main_dir_s, panel_main_s, "utf8");
		}
	}
	/**移动i18n */
	private _move_i18n(): void {
		/**输出目录 */
		let output_dir_s = path.normalize(this.task_info.tsconfig_parse.options.outDir);
		/**输入路径 */
		let input_path_s = "i18n";
		/**输出路径 */
		let ouput_path_s = path.resolve(output_dir_s, input_path_s);
		if (fs.existsSync(ouput_path_s)) {
			return;
		}
		// 查找i18n路径
		{
			let reg = new RegExp(`${input_path_s}`);
			ouput_path_s = tool.file.search(output_dir_s, reg, {
				type_n: tool.file.file_type.dir,
				exclude_ss: [path.resolve(output_dir_s, "node_modules")],
			})[0];
			if (!ouput_path_s) {
				return;
			}
		}
		// 移动i18n
		fs.renameSync(ouput_path_s, path.resolve(output_dir_s, input_path_s));
	}
	/**3.x包信息路径转换 */
	private _3x_package_path_conversion(): void {
		/**输出目录 */
		let output_dir_s = path.normalize(this.task_info.tsconfig_parse.options.outDir);
		/**package.json路径 */
		let package_path_s = path.resolve(output_dir_s, "package.json");
		/**package.json */
		let package_s = fs.readFileSync(package_path_s, "utf-8");
		tool.object.traverse(this.task_info.package_config, (value, key_s, path_s) => {
			// 路径安检
			{
				if (typeof value !== "string") {
					return;
				}
				if (!value.startsWith("./")) {
					return;
				}
			}
			// 替换路径
			{
				/**输入路径 */
				let input_path_s = value;
				/**输出路径 */
				let ouput_path_s = path.resolve(output_dir_s, input_path_s);
				if (fs.existsSync(ouput_path_s)) {
					return;
				}
				// 查找路径
				{
					let reg = new RegExp(
						path
							.normalize(`${input_path_s.slice(2, input_path_s.length)}`)
							.replace(new RegExp(path.sep + path.sep, "g"), path.sep + path.sep)
					);
					ouput_path_s = tool.file.search(output_dir_s, reg, {
						type_n: tool.file.file_type.file | tool.file.file_type.dir,
						exclude_ss: [path.resolve(output_dir_s, "node_modules")],
					})[0];
					if (!ouput_path_s) {
						return;
					}
				}
				// 替换无效路径
				ouput_path_s = "." + ouput_path_s.replace(output_dir_s, "").replace(/\\/g, "/");
				package_s = package_s.replace(value, ouput_path_s);
			}
		});
		// 更新package.json
		fs.writeFileSync(package_path_s, package_s, "utf-8");
	}
	/**压缩 */
	public generate_zip(src_path_s_: string, output_path_s_: string): void {
		this._log.time_start("zip");
		src_path_s_ = path.resolve(src_path_s_);
		output_path_s_ = path.resolve(output_path_s_);
		if (!fs.existsSync(src_path_s_)) {
			this._log.e("压缩路径不存在");
			return;
		}
		let archiver_zip = archiver("zip");
		archiver_zip.pipe(fs.createWriteStream(output_path_s_));
		archiver_zip.on("error", error => {
			throw error;
		});
		archiver_zip.directory(src_path_s_, false);
		archiver_zip.finalize();
		this._log.time_end("zip");
	}
	// 编译单包
	public async single(path_s_: string): Promise<void> {
		// 路径转换
		path_s_ = path.resolve(path_s_);
		if (!fs.existsSync(path_s_)) {
			this._log.e("路径不存在", path_s_);
			return;
		}
		this._log.time_start("compile", path_s_);
		// 更新任务信息
		{
			if (!this._update_task_info(path_s_)) {
				return;
			}
			this._log.time_log("compile", "更新任务信息");
		}
		/**tsconfig解析 */
		let tsconfig_parse = this.task_info.tsconfig_parse;
		/**输出目录 */
		let output_dir_s_ = path.normalize(this.task_info.tsconfig_parse.options.outDir);
		/**包源目录 */
		let package_src_dir_s = path.basename(path_s_);
		// 清理输出目录
		{
			tool.file.del(output_dir_s_);
			this._log.time_log("compile", "清理输出目录");
		}
		// 编译
		{
			/**包含文件 */
			await this._log.anim("旋转跳跃", ["编译"], () => {
				if (!this._complier(tsconfig_parse)) {
					this._log.p("编译错误");
				}
			});
			if (this._log.e()) {
				this._log.time_end("compile");
				return;
			}
			this._log.time_log("compile", "编译");
		}
		// 拷贝依赖文件
		{
			/**包源输出目录 */
			let package_out_src_dir_s = tool.file.search(
				output_dir_s_,
				new RegExp(`${package_src_dir_s}$`),
				{
					type_n: tool.file.file_type.dir,
					exclude_ss: [path.resolve(output_dir_s_, "node_modules")],
				}
			)[1];
			await this._log.anim("旋转跳跃", ["拷贝依赖文件"], () => {
				this._copy_dependent_module(path_s_, output_dir_s_);
				this._copy_other_file(path_s_, output_dir_s_, package_out_src_dir_s);
			});
			this._log.time_log("compile", "拷贝依赖文件");
		}
		// 移动i18n
		{
			await this._log.anim("旋转跳跃", ["移动i18n"], () => {
				this._move_i18n();
			});
			this._log.time_log("compile", "移动i18n");
		}
		// 后处理
		{
			if (this.task_info.project_version_s) {
				let version_s = this.task_info.project_version_s;
				if (version_s.startsWith("2")) {
					this._2x_panel_entry_process();
					this._log.time_log("compile", "处理入口脚本");
				} else if (version_s.startsWith("3")) {
					this._3x_package_path_conversion();
					this._log.time_log("compile", "package路径转换");
				}
			} else {
				this._log.w("未获取到项目配置信息，无法进行后处理");
			}
		}
		this._log.time_end("compile");
	}
}

export default new compile();
