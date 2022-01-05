import * as cc_plugin_cli from "../index";
import * as fs from "fs";

(async () => {
	try {
		await cc_plugin_cli.custom_process.instance().process_start_task;
		// 生成 zip
		{
			// cc_plugin_cli.compile.generate_zip(
			// 	"../../../../NewProject_5/packages/mk_framework",
			// 	"../../../../NewProject_5/packages/mk_framework.zip"
			// );
		}
		// 编译单包
		// await cc_plugin_cli.compile.single("D:/work/plugin_test/extensions_dev/script-manage");
		await cc_plugin_cli.compile.single("D:/work/billiard3/extensions_dev/mk-nodes");

		cc_plugin_cli.custom_process.instance().log_anim.send(
			new cc_plugin_cli.custom_process.event({
				common_id: cc_plugin_cli.custom_process.event_type.exit,
			})
		);
	} catch (e) {
		cc_plugin_cli.custom_process.instance().log_anim.send(
			new cc_plugin_cli.custom_process.event({
				common_id: cc_plugin_cli.custom_process.event_type.exit,
			})
		);
	}
})();
