class log {
    /* ***************private*************** */
    /**参数列表 */
    private _args_as: any[] = [];
    /* ***************功能函数*************** */
    /**log */
    public l(...args_as_: any[]): boolean {
        // 打印日志列表
        if (this._args_as.length) {
            let args_as = this._args_as.splice(0, this._args_as.length);
            while (args_as.length) {
                this.l(args_as.shift());
            }
            if (!args_as_) {
                return true;
            }
        }
        // 打印当前日志
        if (args_as_ && args_as_.length) {
            console.log(...args_as_);
            return true;
        }
        return false;
    }
    /**warn */
    public w(...args_as_: any[]): boolean {
        // 打印日志列表
        if (this._args_as.length) {
            let args_as = this._args_as.splice(0, this._args_as.length);
            while (args_as.length) {
                this.w(args_as.shift());
            }
            if (!args_as_) {
                return true;
            }
        }
        // 打印当前日志
        if (args_as_ && args_as_.length) {
            if (args_as_.length > 1) {
                let args_ss = [...args_as_];
                let head_s = args_ss.shift();
                let tail_s = args_ss.pop();
                // console.log("\033[33m" + head_s, ...args_ss, tail_s + "\033[39m");
            } else {
                // console.log("\033[33m" + args_as_[0] + "\033[39m");
            }
            return true;
        }
        return false;
    }
    /**error */
    public e(...args_as_: any[]): boolean {
        // 打印日志列表
        if (this._args_as.length) {
            let args_as = this._args_as.splice(0, this._args_as.length);
            while (args_as.length) {
                this.w(args_as.shift());
            }
            if (!args_as_) {
                return true;
            }
        }
        // 打印当前日志
        if (args_as_ && args_as_.length) {
            if (args_as_.length > 1) {
                let args_ss = [...args_as_];
                let head_s = args_ss.shift();
                let tail_s = args_ss.pop();
                // console.log("\033[31m" + head_s, ...args_ss, tail_s + "\033[39m");
            } else {
                // console.log("\033[31m" + args_as_[0] + "\033[39m");
            }
            return true;
        }
        return false;
    }
    public push(v_: any): log {
        if (v_) {
            this._args_as.push(v_);
        }
        return this;
    }
}

export default new log;