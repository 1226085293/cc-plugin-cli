# cc-plugin-cli

cocos creator 插件编译包，此包仅用于 typescript 插件的编译

## # 3.x 功能简述

-   引用插件公共代码库后的 package.json 内的路径自动替换及 i18n 位置更新
-   编译时拷贝 package,json 内的 dependencies 模块
-   输出 zip：[可选]

## # 2.x 功能简述

-   修复 panel.main 入口脚本内容 import node_modules 模块失败
-   `$panel$`：宏标记，编译时自动替换为面板入口脚本所在目录字符串
-   引用插件公共代码库后的 package.json 内的路径自动替换及 i18n 位置更新
-   编译时拷贝 package,json 内的 dependencies 模块
-   输出 zip：[可选]

> 示例

-   package_path: 插件开发目录的绝对路径
-   zip_path：tsconfig.outDir 相对路径

```
// 编译插件
cc-plugin-cli c -p [package_path]

// 编译并输出 zip
cc-plugin-cli c -p [package_path] -z [tsconfig.outDir相对路径]
```

qq 交流群：200351945
