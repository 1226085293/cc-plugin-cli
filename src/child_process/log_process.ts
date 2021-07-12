import log from "../log";

log.anim((index_n)=> {
    return ["-", "\\", "|", "/"][index_n % 4] + "正在编译";
});

process.on("message", (...args_as: any[])=> {
    process.stdout.write("\r");
    process.exit(0);
});