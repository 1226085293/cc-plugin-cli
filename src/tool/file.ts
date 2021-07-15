import fs from "fs";
import path from "path";
import byte from "./byte";

class file {
    /**保证目录存在 */
    private _ensure_path_exists(path_s_: string): void {
        let path_ss = path.resolve(path_s_).split(path.sep);
        let curr_path_s = "";
        path_ss.forEach(v1_s=> {
            curr_path_s += v1_s + path.sep;
            if (!fs.existsSync(curr_path_s)) {
                fs.mkdirSync(curr_path_s);
            }
        });
    }
    /**删除文件/目录 */
    public del(path_s_: string): void {
        // 安检
        if (!fs.existsSync(path_s_)) {
            return;
        }
        if (fs.statSync(path_s_).isDirectory()) {
            /**当前路径 */
            let curr_path_s: string;
            // 遍历文件夹
            fs.readdirSync(path_s_).forEach(v1_s=> {
                curr_path_s = path.resolve(path_s_, v1_s);
                this.del(curr_path_s);
            })
            // 删除空文件夹
            fs.rmdirSync(path_s_);
        } else {
            fs.unlinkSync(path_s_);
        }
    }
    /**拷贝文件/目录 */
    public copy(input_s_: string, output_s_: string) {
        // 安检
        if (!fs.existsSync(input_s_)) {
            return;
        }
        if (fs.statSync(input_s_).isDirectory()) {
            if (!fs.existsSync(output_s_)) {
                this._ensure_path_exists(output_s_);
            }
            fs.readdirSync(input_s_).forEach(v1_s=> {
                this.copy(path.resolve(input_s_, v1_s), path.resolve(output_s_, v1_s));
            });
        } else {
            let output_dir_s = output_s_.slice(0, output_s_.lastIndexOf(path.sep));
            if (!fs.existsSync(output_dir_s)) {
                this._ensure_path_exists(output_dir_s);
            }
            fs.copyFileSync(input_s_, output_s_);
        }
    }
    /**搜索文件/目录 */
    private _search(path_s_: string, match_: RegExp, config_: file_.search_config, result_ss_: string[]): string[] {
        if (!fs.existsSync(path_s_)) {
            return result_ss_;
        }
        if (fs.statSync(path_s_).isDirectory()) {
            // 排除路径
            if (config_.exclude_ss.includes(path_s_)) {
                return result_ss_;
            }
            // 匹配规则
            {
                if (byte.getbit(config_.type_n, file_.file_type.dir)) {
                    if (path_s_.match(match_)) {
                        result_ss_.push(path_s_);
                    }
                }
            }
            fs.readdirSync(path_s_).forEach(v1_s=> {
                this._search(path.resolve(path_s_, v1_s), match_, config_, result_ss_);
            });
        } else if (byte.getbit(config_.type_n, file_.file_type.file)) {
            // 排除路径
            if (config_.exclude_ss.includes(path_s_)) {
                return result_ss_;
            }
            // 匹配规则
            if (path_s_.match(match_)) {
                result_ss_.push(path_s_);
            }
        }
        return result_ss_;
    }
    /**搜索文件/目录 */
    public search(root_s_: string, match_: RegExp, config_ = new file_.search_config): string[] {
        let config = new file_.search_config(config_);
        config.exclude_ss = config.exclude_ss.map(v1_s=> path.resolve(v1_s));
        return this._search(path.resolve(root_s_), match_, config_, []);
    }
}

module file_ {
    /*---------enum_private */
    /*---------enum_public */
    export enum file_type {
        dir = 0x01,
        file = 0x02,
    }
    /*---------var_private */
    /*---------var_public */
    /**导出类型 */
    export const type = file;
    export type type = file;
    /*---------class_private */
    /*---------class_public */
    export class search_config {
        constructor(init_?: search_config) {
            Object.assign(this, init_);
        }
        /**搜索类型 */
        type_n ?= file_.file_type.dir | file_.file_type.file;
        /**排除路径 */
        exclude_ss?: string[] = [];
    }
    /*---------function_private */
    /*---------function_public */
    /*---------logic */
}

export default Object.assign(new file, file_);