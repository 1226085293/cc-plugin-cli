/**继承单例 */
abstract class instance_base {
    /**单例方法 */
    public static instance<T extends {}>(this: new () => T, ...args_as_: any[]): T {
        if (!(<any>this)._instance_o) {
            (<any>this)._instance_o = new (<any>this)(...arguments);
        }
        return (<any>this)._instance_o;
    }
}

export default instance_base;