import fs from "fs";
import path from "path";

class file {
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
            if (fs.existsSync(output_s_)) {
                fs.readdirSync(input_s_).forEach(v1_s=> {
                    this.copy(path.resolve(input_s_, v1_s), path.resolve(output_s_, v1_s));
                });
            } else {
                fs.mkdirSync(output_s_);
                this.copy(input_s_, output_s_);
            }
        } else {
            fs.copyFileSync(input_s_, output_s_);
        }
    }
}

export default new file;