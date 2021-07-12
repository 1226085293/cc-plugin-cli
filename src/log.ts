module _log {
    /*---------enum_private */
    /*---------enum_public */
    /**打印等级代表值 */
    export enum level_value {
        debug = 0x01,
        info = 0x02,
        warn = 0x04,
        error = 0x08,
    }
    /**打印等级颜色 */
    export enum level_color {
        debug = "",
        info = "",
        warn = "\x1B[33m",
        error = "\x1B[31m",
    }
    /**打印等级 */
    export enum level {
        debug = level_value.debug | level_value.error | level_value.info | level_value.warn,
        info = level_value.error | level_value.info | level_value.warn,
        warn = level_value.error | level_value.warn,
        error = level_value.error,
    }
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    /**计时日志 */
    export class time_log {
        constructor(init_?: time_log) {
            Object.assign(this, init_);
        }
        /**开始时间 */
        start_time_ms_n: number;
        /**上次毫秒 */
        last_time_ms_n: number;
        /**打印等级 */
        level_n: level_value;
    }
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

class log {
    constructor(name_s_: string) {
        this._name_s = name_s_;
    }
    /* ***************private*************** */
    /**参数列表 */
    private _args_as: any[] = [];
    /**打印名 */
    private _name_s: string;
    /**计时map */
    private _time_map: Map<string, _log.time_log> = new Map;
    /* ***************public*************** */
    /**打印等级 */
    public static level_n: number = _log.level.debug;
    /**展示时间 */
    public static show_time_b ?= true;
    /**展示名 */
    public static show_name_b ?= true;
    /* ***************功能函数*************** */
    /**获取打印头 */
    private _log_head(level_n_: _log.level_value) {
        let date_a = new Date;
        /**当前日期时间 */
        let time_s = `${date_a.getFullYear()}-${date_a.getMonth()}-${date_a.getDate()} ${date_a.getHours()}:${date_a.getMinutes()}:${date_a.getSeconds()}.${date_a.getMilliseconds()}`;
        /**内容数组 */
        let content_ss: string[] = [];
        /**等级头 */
        let level_head_s = _log.level_value[level_n_];
        // 打印时间
        if (log.show_time_b) {
            content_ss.push(`[${time_s}]`);
        } 
        // 打印等级头
        content_ss.push(`<${level_head_s}>`);
        // 打印名
        if (log.show_name_b) {
            content_ss.push(`${this._name_s}:`);
        }
        if (!content_ss.length) {
            return;
        }
        /**内容 */ 
        let content_s = "";
        content_ss.forEach(v1_s=> {
            content_s += content_s ? ` ${v1_s}` : v1_s;
        });
        //@ts-ignore
        return `${_log.level_color[level_head_s]}${content_s}\x1B[39m`;
    }
    /**日志 */
    private _log(level_n: _log.level_value, ...args_as_: any[]): boolean {
        // 安检
        if (!(log.level_n & level_n)) {
            return false;
        }
        // 打印日志列表
        if (this._args_as.length) {
            let args_as = this._args_as.splice(0, this._args_as.length);
            while (args_as.length) {
                this._log(level_n, args_as.shift());
            }
            if (!args_as_) {
                return true;
            }
        }
        // 打印当前日志
        if (args_as_ && args_as_.length) {
            let content_ss: string[] = [];
            // 日志头
            let head_s = this._log_head(level_n);
            if (head_s) {
                content_ss.push(head_s);
            }
            // 打印内容
            content_ss.push(...args_as_);
            console.log(...content_ss);
            return true;
        }
        return false;
    }
    /**加入打印队列，下次调用 log，warn，error 时一起打印，可用打印函数返回值判断打印队列是否为空 */
    private _push(v_: any): log {
        if (v_) {
            this._args_as.push(v_);
        }
        return this;
    }
    /**调试 */
    public d(...args_as_: any[]): boolean {
        return this._log(_log.level_value.debug, ...args_as_);
    }
    /**调试 */
    public debug(...args_as_: any[]): boolean {
        return this._log(_log.level_value.debug, ...args_as_);
    }
    /**信息 */
    public i(...args_as_: any[]): boolean {
        return this._log(_log.level_value.info, ...args_as_);
    }
    /**信息 */
    public info(...args_as_: any[]): boolean {
        return this._log(_log.level_value.info, ...args_as_);
    }
    /**警告 */
    public w(...args_as_: any[]): boolean {
        return this._log(_log.level_value.warn, ...args_as_);
    }
    /**警告 */
    public warn(...args_as_: any[]): boolean {
        return this._log(_log.level_value.warn, ...args_as_);
    }
    /**错误 */
    public e(...args_as_: any[]): boolean {
        let result_b = this._log(_log.level_value.error, ...args_as_);
        if (result_b) {
            this.trace();
        }
        return result_b;
    }
    /**错误 */
    public error(...args_as_: any[]): boolean {
        let result_b = this._log(_log.level_value.error, ...args_as_);
        if (result_b) {
            this.trace();
        }
        return result_b;
    }
    /**加入打印队列，下次调用 log，warn，error 时一起打印，可用打印函数返回值判断打印队列是否为空 */
    public p(v_: any): log {
        return this._push(v_);
    }
    /**加入打印队列，下次调用 log，warn，error 时一起打印，可用打印函数返回值判断打印队列是否为空 */
    public push(v_: any): log {
        return this._push(v_);
    }
    /**动画 */
    public async anim(cb_f_: (index_n: number)=> string, speed_ms_n_ = 100): Promise<void> {
        return new Promise(v1_f=> {
            /**执行下标 */
            let index_n = 0;
            /**当前内容 */
            let content_s: string;
            /**打印定时器 */
            let print_timer = setInterval(()=> {
                if (!(content_s = cb_f_(index_n))) {
                    process.stdout.write("\r");
                    clearInterval(print_timer);
                    v1_f();
                    return;
                }
                if (index_n) {
                    process.stdout.write("\r");
                }
                process.stdout.write(content_s);
                ++index_n;
            }, speed_ms_n_);
        });
    }
    /**调用跟踪 */
    public trace = console.trace;
    /**计时开始 */
    public time_start(name_s_: string, level_n_ = _log.level_value.info): void {
        if (!name_s_) {
            this.error("参数错误");
            return;
        }
        let time_log = new _log.time_log;
        time_log.start_time_ms_n = time_log.last_time_ms_n = Date.now();
        time_log.level_n = level_n_;
        this._time_map.set(name_s_, time_log);
    }
    /**打印耗时 */
    public time_log(name_s_: string, ...args_as_: any[]): void {
        if (!this._time_map.has(name_s_)) {
            this.error("参数错误");
            return;
        }
        let curr_time_ms_n = Date.now();
        let time_log = this._time_map.get(name_s_);
        this._log(time_log.level_n, name_s_, ...args_as_, `耗时：${(curr_time_ms_n - time_log.last_time_ms_n) / 1000}s`);
        time_log.last_time_ms_n = curr_time_ms_n;
    }
    /**总耗时 */
    public time_end(name_s_: string, ...args_as_: any[]): void {
        if (!this._time_map.has(name_s_)) {
            this.error("参数错误");
            return;
        }
        let time_log = this._time_map.get(name_s_);
        this._log(time_log.level_n, name_s_, ...args_as_, `总耗时：${(Date.now() - time_log.start_time_ms_n) / 1000}s`);
        this._time_map.delete(name_s_);
    }
}

module log {
    /*---------enum_private */
    /*---------enum_public */
    /*---------var_private */
    /*---------var_public */
    /**打印等级代表值 */
    export const level_value = _log.level_value;
    /**打印等级 */
    export const level = _log.level;
    /*---------class_private */
    /*---------class_public */
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

export default Object.assign(new log("default"), log);