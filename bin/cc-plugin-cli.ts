#!/usr/bin/env node
import commander from "commander";
import path from "path";
import custom_process from "../src/custom_process";
import log from "../src/log";
import compile from "../src/compile";

process.chdir("../");

let program = commander.program;
// 头信息
program.version(require("../package.json").version).description(`cc-plugin-cli
输出目录：tsconfig.outDir`);
// 配置
program
	.option("-p, --path <string>", "编译包路径")
	.option("-z, --zip <string>", "压缩包输出路径（outDir相对路径）");
// 命令
{
	// 编译插件
	program
		.command("compile")
		.alias("c")
		.description("编译插件")
		.action(async () => {
			const options = program.opts();
			if (!options.path) {
				program.help();
				return;
			}
			await custom_process.instance().process_start_task;
			try {
				// 编译
				await compile.single(options.path);
				// 压缩
				if (options.zip) {
					let input_s = compile.task_info.tsconfig_parse.options.outDir;
					compile.generate_zip(input_s, path.resolve(input_s, options.zip));
				}
			} catch (e) {
				log.instance().e(e);
			}
			custom_process
				.instance()
				.log_anim.send(
					new custom_process.event({ common_id: custom_process.event_type.exit })
				);
		});
}

program.parse(process.argv);
if (program.args.length === 0) {
	program.help();
}
