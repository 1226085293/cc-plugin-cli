/**数学相关扩展 */
module base {
    /*---------enum_private */
    /*---------enum_public */
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    /*---------function_private */
    /*---------function_public */
    /**获取随机数 */
    export function random(min_n_: number, max_n_: number): number {
        return Math.floor(Math.random() * ((max_n_ + 1) - min_n_) + min_n_);
    }
    /*---------logic */
}

export default base;