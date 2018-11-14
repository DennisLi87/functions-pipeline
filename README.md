### 关于pipeline流
> 按照流的方式依次处理装载进去的处理函数，返回一个Promise 对象，当流程执行到结束或者中断时，返回的promise的状态会转成 `fulfilled` 状态；
pipeline 是一个装载一批处理函数（接收参数，返回处理后的结果或者返回终止流程的判定值）的管道；
pipeline 可以预先装载处理模块功能的中间件（比如返回Promise 对象的函数，处理返回函数的函数中间件）

* 创建一个数据处理模块
```js
    const promiseMid = (canDoNext, resolve, reject) => next => data => {
        if (isPromise(data)) {
          data.then(result => canDoNext(result) ? next(result) : resolve(result))
        } else {
          return canDoNext(data) ? next(data) : resolve(data)
        }
    }
```js

处理模块第一级接收三个参数：
canDoNext: Function 是否继续执行的判断函数
resolve: Function  触发pipeline 返回Promise对象
reject: Function   拒绝pipeline 返回Promise对象

第二级接收下一流程的处理函数：
next: Function

上一次处理函数返回的结果：
data: any

* 生成一个管道
```js
    const pipeline = pipe(promiseMid, ...otherMids);
```js

pipeline 默认会预置一个终止函数（canDoNext），判断条件是当函数返回的参数不是一个对象则终止,可以配置自定义的终止函数
```js
const pipeline = pipe({
    canDoNext: function ( data ) {
        // 你可以指定任何你想判断的逻辑，该函数返回false 则流程不再继续下去； 返回true 则继续执行；
        if ( data ===  false ) {
            return false;
        }
        return true;
    }
}, promiseMid, ...otherMids);
```js

* 装载处理函数
```js
    const doSomethingsPipeline = pipeline(
        function step1 ( arg ) {
            console.log('the argument is：', arg);
            arg.name = 'Dennis';

            return arg;
        },
        function step2 ( arg ) {
            if ( arg.id != 100 ) {
                return false;
            }
            // do somethings....

            return arg;
        },
        otherProcessFunc
    );
```js

* 启动管道流
```js
    doSomethingsPipeline({ say: 'hello', name: 'Test', id: 1 })
        .then(d => {
            console.log('The line finished!');
        });
}
```js
