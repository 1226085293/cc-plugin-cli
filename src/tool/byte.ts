/**位运算 */
module byte {
    /*---------enum_private */
    /*---------enum_public */
    /*---------var_private */
    /*---------var_public */
    /*---------class_private */
    /*---------class_public */
    /*---------function_private */
    /*---------function_public */
    /**指定位设1 */
    export function setbit(v_n_: number, index_n_: number): number {
        return v_n_ |= index_n_;
    }
    /**指定位清0 */
    export function clrbit(v_n_: number, index_n_: number): number {
        return v_n_ &= ~index_n_;
    }
    /**返回指定位 */
    export function getbit(v_n_: number, index_n_: number): number {
        return v_n_ & index_n_;
    }
    /**获取0的包含数量 */
    export function zero_count(v_n_: number): number {
        let count_n = 0;
        while (v_n_ + 1) {
            count_n++;
            v_n_ |= (v_n_ + 1);
        }
        return count_n;
    }
    /**获取1的包含数量 */
    export function one_count(v_n_: number): number {
        let count_n = 0;
        while (v_n_) {
            count_n++;
            v_n_ &= (v_n_ - 1);
        }
        return count_n;
    }
    /*---------logic */
}

export default byte;