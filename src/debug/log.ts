import chalk from "chalk";

class log {
    /* ***************private*************** */
    /**参数列表 */
    private _args_as: any[] = [];
    /**chalk示例 */
    private _chalk = new chalk.Instance({ "level": 1 });
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
            console.log(this._chalk.yellow(...args_as_));
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
            console.log(this._chalk.red(...args_as_));
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