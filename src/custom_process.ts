import * as child_process from 'child_process';
import instance_base from './instance_base';
import log from './log';

class custom_process extends instance_base {
    constructor() {
        super();
        // 初始化
        {
            this.log_anim = child_process.fork("dist/src/custom_process/log_anim");
            this.process_start_task = new Promise<void>(v1_f=> {
                let process_as = [this.log_anim];
                let process_start_n = 0;
                process_as.forEach(v1=> {
                    v1.send("instance");
                    v1.on("message", (mess: custom_process.event)=> {
                        switch (mess.common_id) {
                            case custom_process.event_type.init: {
                                if (++process_start_n === process_as.length) {
                                    log.i("初始化子进程完成");
                                    v1_f();
                                }
                            } break;
                        }
                    });
                });
            });
        }
    }
    /**进程初始化任务 */
    public process_start_task: Promise<void>;
    public log_anim: child_process.ChildProcess;
}

module custom_process {
    /*---------enum_private */
    /*---------enum_public */
    export enum event_type {
        init,
        exit,
    }
    /*---------var_private */
    let event_index_n = 0;
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    export class event {
        constructor(init_?: event) {
            Object.assign(this, init_);
        }
        public readonly index_n ?= event_index_n++;
        /**通用进程事件id */
        public common_id?: number | string;
        /**子进程事件id */
        public child_id?: number | string;
        /**附带参数 */
        public args_as?: any[];
    }
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

export default custom_process;