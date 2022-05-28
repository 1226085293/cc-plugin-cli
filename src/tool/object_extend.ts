/**对象扩展 */
module object_extend {
	/*---------enum_private */
	/*---------enum_public */
	/*---------var_private */
	/*---------var_public */
	/*---------class_private */
	/*---------class_public */
	/*---------function_private */
	function _traverse(
		target_: any,
		cb_f_: (value: any, key_s: string, path_s: string) => void,
		path_s_ = "",
		record_set = new Set()
	): void {
		let path_s = "";
		switch (typeof target_) {
			case "object":
				{
					// 数组：遍历
					if (Array.isArray(target_)) {
						if (record_set.has(target_)) {
							return;
						}
						record_set.add(target_);
						for (let k1_s in target_) {
							// 递归数组中的每一项
							path_s = `${path_s_}/${k1_s}`;
							cb_f_(target_[k1_s], k1_s, path_s);
							_traverse(target_[k1_s], cb_f_, path_s, record_set);
						}
					}
					// 普通对象：循环递归赋值对象的所有值
					else {
						if (record_set.has(target_)) {
							return;
						}
						record_set.add(target_);
						for (var k1_s in target_) {
							path_s = `${path_s_}/${k1_s}`;
							cb_f_(target_[k1_s], k1_s, path_s);
							_traverse(target_[k1_s], cb_f_, path_s, record_set);
						}
					}
				}
				break;
		}
	}
	/*---------function_public */
	/**遍历对象 */
	export function traverse(
		target_: any,
		cb_f_: (value: any, key_s: string, path_s: string) => void
	): void {
		return _traverse(target_, cb_f_);
	}
}

export default object_extend;
