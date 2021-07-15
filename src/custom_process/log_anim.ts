import custom_process from "../custom_process";

module _log_anim {
    /*---------enum_private */
    /*---------enum_public */
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    export class log_task {
        /**结束状态 */
        over_b: boolean;
        /**执行回调 */
        cb_f: Function;
    }
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

class log_anim_ {
    constructor() {
        // 消息监听
        process.on("message", (mess_: custom_process.event)=> {
            switch (mess_.common_id) {
                case custom_process.event_type.exit: {
                    process.stdout.write("\r");
                    process.exit(0);
                } break;
            }
            switch (mess_.child_id) {
                case log_anim_.event_type.log: {
                    this.log_task[mess_.index_n] = {
                        "over_b": false,
                        "cb_f": new Function(...mess_.args_as[0])
                    };
                    /**执行下标 */
                    let index_n = 0;
                    /**打印定时器 */
                    let print_timer = setInterval(()=> {
                        if (this.log_task[mess_.index_n].over_b) {
                            process.stdout.write("\r");
                            process.stdout.clearLine(0);
                            clearInterval(print_timer);
                            // 通知停止
                            process.send(new custom_process.event({
                                "child_id": log_anim_.event_type.stop,
                            }));
                            return;
                        }
                        if (index_n) {
                            process.stdout.write("\r");
                        }
                        process.stdout.write(this.log_task[mess_.index_n].cb_f(index_n, ...mess_.args_as[1]));
                        ++index_n;
                    }, 100);
                } break;
                case log_anim_.event_type.stop: {
                    this.log_task[mess_.args_as[0]].over_b = true;
                } break;
            }
        });
        // 通知初始化
        process.send(new custom_process.event({
            "common_id": custom_process.event_type.init,
        }));
    }
    public log_task: { [k: number]: _log_anim.log_task } = Object.create(null);
}

module log_anim_ {
    /*---------enum_private */
    /*---------enum_public */
    export enum event_type {
        log,
        stop,
    }
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
    process.once("message", (mess: any)=> {
        if (mess === "instance") {
            new log_anim_;
        }
    });
}

export default log_anim_;