import * as cc_plugin_cli from "../index";
import * as child_process from 'child_process';

// console.log(`\x1B[30m111\x1B[39m`);
// console.log(`\x1B[31m222\x1B[39m`);
// console.log(`\x1B[32m333\x1B[39m`);
// console.log(`\x1B[33m444\x1B[39m`);
// console.log(`\x1B[34m555\x1B[39m`);
// console.log(`\x1B[35m666\x1B[39m`);
// console.log(`\x1B[36m777\x1B[39m`);

// log.debug("1");
// log.info("1", "22");
// log.warn("1", "363");
// log.error("1");

// log.time_start("1");
// log.time_log("1", "22");
// log.time_log("1", "363");
// log.time_end("1");

// cc_plugin_cli.log.register_anim("进度", (index_n: number, desc_s: string)=> {
//     return ["-", "\\\\", "|", "/"][index_n % 4] + desc_s;
// });
// cc_plugin_cli.log.anim("进度", ["测试"], async ()=> {
//     return new Promise<void>(v1=> {
//         setTimeout(() => {
//             v1();
//         }, 3000);
//     });
// })
// .then(()=> {
//     console.log(123);
//     cc_plugin_cli.custom_process.instance().log_anim.send(new cc_plugin_cli.custom_process.event({ "common_id": cc_plugin_cli.custom_process.event_type.exit }));
// });

(async ()=> {
    await cc_plugin_cli.custom_process.instance().process_start_task;
    await cc_plugin_cli.compile.single("../../../../NewProject_5/packages_dev/mk_framework");
    cc_plugin_cli.custom_process.instance().log_anim.send(new cc_plugin_cli.custom_process.event({ "common_id": cc_plugin_cli.custom_process.event_type.exit }));
})();