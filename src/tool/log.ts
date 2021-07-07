module log {
    export function l(): void {
        console.log(...arguments);
    }
    export function w(): void {
        if (arguments.length > 1) {
            let args_ss = [...arguments];
            let head_s = args_ss.shift();
            let tail_s = args_ss.pop();
            console.log("\033[33m" + head_s, ...args_ss, tail_s + "\033[39m");
        } else {
            console.log("\033[33m" + arguments[0] + "\033[39m");
        }
    }
    export function e(): void {
        if (arguments.length > 1) {
            let args_ss = [...arguments];
            let head_s = args_ss.shift();
            let tail_s = args_ss.pop();
            console.log("\033[31m" + head_s, ...args_ss, tail_s + "\033[39m");
        } else {
            console.log("\033[31m" + arguments[0] + "\033[39m");
        }
    }
}

export default log;