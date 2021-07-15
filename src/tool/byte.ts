/**位运算 */
class byte {
    /**指定位设1 */
    public setbit(v_n_: number, index_n_: number): number {
        return v_n_ |= index_n_;
    }
    /**指定位清0 */
    public clrbit(v_n_: number, index_n_: number): number {
        return v_n_ &= ~index_n_;
    }
    /**返回指定位 */
    public getbit(v_n_: number, index_n_: number): number {
        return v_n_ & index_n_;
    }
    /**获取0的包含数量 */
    public zero_count(v_n_: number): number {
        let count_n = 0;
        while (v_n_ + 1) {
            count_n++;
            v_n_ |= (v_n_ + 1);
        }
        return count_n;
    }
    /**获取1的包含数量 */
    public one_count(v_n_: number): number {
        let count_n = 0;
        while (v_n_) {
            count_n++;
            v_n_ &= (v_n_ - 1);
        }
        return count_n;
    }
}

export default byte;