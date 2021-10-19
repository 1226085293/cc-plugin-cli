export { default as power } from "./math_power";

/**获取随机数 */
export function random(min_n_: number, max_n_: number): number {
	return Math.floor(Math.random() * (max_n_ + 1 - min_n_) + min_n_);
}
