/**
 * 流式数据处理：
 *      @example
 *      // 生成返回值处理聚合函数函数
 *      const pipeline = pipe({ canDoNext: data => data.id !== 100 ? false : data }, ...middlewares)
 *
 *      // 生成处理函数的聚合函数
 *      const processGroup = pipeline(
 *      data => {
 *        // DO: some things
 *
 *        return {...data, otherKeys}
 *      },
 *      () => {
 *          console.log('Hello second Func');
 *
 *          return {
 *              ...data, otherKeys
 *          }
 *      }
 *      ...otherProcessFunc
 *      )
 *
 *      // 触发上面生成的聚合函数 【参数可选】 该方法最终返回一个Promise 对象，Promise 对象的then 方法中接收处理函数最终得到的结果
 *      processGroup({ type: 'test' })
 *        .then(( result ) => {
 *          //DO: Do some things
 *
 *          .....
 *        })
 *
 *    附注：
 *      如果你想要对每一次返回的结果添加自己的中间件处理，你可以在创建管道流的时候添加处理中间件
 *      @example
 *        pipeline = pipe(( canDoNext, resolve, reject ) => next => data => {
 *          //TODO: Do some things
 *
 *          return canDoNext(data) ? next(data) : resolve(data)
 *        })
 *
 *      @receives
 *      canDoNext => 是否继续执行的处理函数，return true/false;
 *      resolve => 返回Promise 的 resolve;
 *      reject => 返回Promise 的reject;
 *
 *      next 下一个处理函数
 *      data 上一次处理函数返回的结果
 *
 *  @author Dennis
 *  @time 2018/04/12 22:47
 */

function compose(...funcs) {
    if (funcs.length === 0) {
        return arg => arg
    }

    if (funcs.length === 1) {
        return funcs[0]
    }

    return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

function composePipe(funcs, connectedMids = t => t) {
    if (funcs.length === 0) {
        return arg => arg
    }

    if (funcs.length === 1) {
        return funcs[0]
    }

    return funcs.reduceRight((a, b) => (...args) => connectedMids(a)(b(...args)))
}

const canDoNextDefault = result => result != null && typeof result === 'object'
const theEndPipe = resolve => data => resolve(data)

module.expors['default'] = function pipe(opts, ...mids) {
    let canDoNext = canDoNextDefault
    if (typeof opts === 'object') {
        typeof opts.canDoNext === 'function' && (canDoNext = opts.canDoNext)
    } else if (typeof opts === 'function') {
        mids = [opts].concat(mids)
    }

    // We need a middleware to decide whether to continue the next process.
    mids.length === 0 && mids.push(defaultMid)

    return (...funcs) => (...args) => {
        let
            endFunc = () => {
                throw (new Error('ERROR: The "endFunc" unused ! Then the promise returned will never be "fulfilled"'))
            },
            chainMids = [],
            promise = new Promise(
                (resolve, reject) => {
                    endFunc = theEndPipe(resolve)
                    chainMids = mids.map(it => it(canDoNext, resolve, reject))
                }
            )

        composePipe([...funcs, endFunc], compose(...chainMids))(...args)

        return promise
    }
}

/**
 * The default process data middlewares exports
 */
const defaultMid = (canDoNext, resolve) => next => data => canDoNext(data) ? next(data) : resolve(data)
const isPromise = t => t != null && typeof t === 'object' && typeof t.then === 'function'
module.expors.promiseMid = (canDoNext, resolve) => next => data => {
    if (isPromise(data)) {
        data.then(result => canDoNext(result) ? next(result) : resolve(result))
    } else {
        return canDoNext(data) ? next(data) : resolve(data)
    }
}
