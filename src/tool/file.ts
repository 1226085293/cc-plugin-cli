import fs from "fs";
import path from "path";
import byte from "./byte";

module file {
	/*---------enum_private */
	/*---------enum_public */
	export enum file_type {
		dir = 0x01,
		file = 0x02,
	}
	/*---------var_private */
	/*---------var_public */
	/*---------class_private */
	/*---------class_public */
	export class search_config {
		constructor(init_?: search_config) {
			Object.assign(this, init_);
		}
		/**搜索类型 */
		type_n? = file.file_type.dir | file.file_type.file;
		/**排除路径 */
		exclude_ss?: string[] = [];
	}
	export class del_config {
		constructor(init_?: del_config) {
			Object.assign(this, init_);
		}
		/**排除路径 */
		exclude_ss?: string[] = [];
	}
	/*---------function_private */
	/**保证目录存在 */
	function _ensure_path_exists(path_s_: string): void {
		let path_ss = path.resolve(path_s_).split(path.sep);
		let curr_path_s = "";
		path_ss.forEach(v1_s => {
			curr_path_s += v1_s + path.sep;
			if (!fs.existsSync(curr_path_s)) {
				fs.mkdirSync(curr_path_s);
			}
		});
	}
	/**搜索文件/目录 */
	function _search(
		path_s_: string,
		match_: RegExp,
		config_: file.search_config,
		result_ss_: string[]
	): string[] {
		if (!fs.existsSync(path_s_)) {
			return result_ss_;
		}
		if (fs.statSync(path_s_).isDirectory()) {
			// 排除路径
			if (config_.exclude_ss.includes(path_s_)) {
				return result_ss_;
			}
			// 匹配规则
			if (byte.getbit(config_.type_n, file.file_type.dir)) {
				if (path_s_.match(match_)) {
					result_ss_.push(path_s_);
				}
			}
			// 遍历文件夹
			fs.readdirSync(path_s_).forEach(v1_s => {
				_search(path.resolve(path_s_, v1_s), match_, config_, result_ss_);
			});
		} else if (byte.getbit(config_.type_n, file.file_type.file)) {
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
	/**删除文件/目录 */
	function _del(path_s_: string, config_: del_config): void {
		// 如果是排除目录和不存在的目录则退出
		if (config_.exclude_ss.includes(path_s_) || !fs.existsSync(path_s_)) {
			return;
		}
		if (fs.statSync(path_s_).isDirectory()) {
			/**当前路径 */
			let curr_path_s: string;
			// 遍历文件夹
			fs.readdirSync(path_s_).forEach(v1_s => {
				curr_path_s = path.resolve(path_s_, v1_s);
				_del(curr_path_s, config_);
			});
			// 删除空文件夹
			if (!config_.exclude_ss.filter(v_s => v_s.startsWith(path_s_)).length) {
				fs.rmdirSync(path_s_);
			}
		} else {
			fs.unlinkSync(path_s_);
		}
	}
	/*---------function_public */
	/**搜索文件/目录 */
	export function search(
		root_s_: string,
		match_: RegExp,
		config_ = new file.search_config()
	): string[] {
		let config = new file.search_config(config_);
		config.exclude_ss = config.exclude_ss.map(v1_s => path.resolve(v1_s));
		return _search(path.resolve(root_s_), match_, config, []);
	}
	/**拷贝文件/目录 */
	export function copy(input_s_: string, output_s_: string) {
		// 安检
		if (!fs.existsSync(input_s_)) {
			return;
		}
		if (fs.statSync(input_s_).isDirectory()) {
			if (!fs.existsSync(output_s_)) {
				_ensure_path_exists(output_s_);
			}
			fs.readdirSync(input_s_).forEach(v1_s => {
				copy(path.resolve(input_s_, v1_s), path.resolve(output_s_, v1_s));
			});
		} else {
			let output_dir_s = output_s_.slice(0, output_s_.lastIndexOf(path.sep));
			if (!fs.existsSync(output_dir_s)) {
				_ensure_path_exists(output_dir_s);
			}
			fs.copyFileSync(input_s_, output_s_);
		}
	}
	/**删除文件/目录 */
	export function del(path_s_: string, config_ = new del_config()): void {
		let config = new file.del_config(config_);
		config.exclude_ss = config.exclude_ss.map(v1_s => path.resolve(v1_s));
		return _del(path.resolve(path_s_), config);
	}
}

export default file;
