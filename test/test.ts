import * as cc_plugin_cli from "../index";
import * as child_process from 'child_process';
let log = cc_plugin_cli.log;

// log.debug("1");
// log.info("1", "22");
// log.warn("1", "363");
// log.error("1");
// log.time_start("1");
// log.time_log("1", "22");
// log.time_log("1", "363");
// log.time_end("1");
// cc_plugin_cli.compile.single("../../packages_dev/mk_framework");

let log_process = child_process.fork("dist/src/child_process/log_process", ["1", "2"]);
setTimeout(() => {
    log_process.send("SIGTERM");
    log.i("test 1");
}, 1000);