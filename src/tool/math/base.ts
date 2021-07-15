/**数学相关扩展 */
class base {
    /**获取随机数 */
    public random(min_n_: number, max_n_: number): number {
        return Math.floor(Math.random() * ((max_n_ + 1) - min_n_) + min_n_);
    }
}

export default new base;