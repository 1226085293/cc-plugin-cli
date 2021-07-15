/**次方 */
class power {
    /**获取2n次方 */
    public get_power(v_n_: number): number {
        return 1 << (v_n_ - 1);
    }
    /**是否2n次方 */
    public is_power(v_n_: number): boolean {
		return (v_n_ > 0) && ((v_n_ & (v_n_ - 1)) == 0);
    }
    /**相近2n次方 */
    public similar_power(v_n_: number): number {
        let count_n = 0;
        for (; v_n_; ++count_n, v_n_ >>= 1);
        return count_n;
    }
}

export default new power;