"use strict"; // é
(() => {
    // ----------------------------------------------------------------
    if (window.aa !== undefined) { throw new Error("'aaJS' should be called before every other 'aa' modules."); }
    // ----------------------------------------------------------------
    window.aa = {};
    const versioning = {
        aaJS: {
            version: {
                version: "3.2.0",
                dependencies: {}
            }
        }
    };
    // ----------------------------------------------------------------
    const cease = (message) => {
        console.warn(message);
        return undefined;
    };
    function addReadonlyProperties (func, spec) {
        aa.arg.test(func, aa.isFunction, "'func'");
        aa.arg.test(spec, aa.isObject, "'spec'");

        Object.keys(spec)
        .filter(key => spec.hasOwnProperty(key))
        .forEach(key => {
            Object.defineProperty(func, key, {
                get: () => spec[key]
            });
        });

        return func;
    }
    const JS = {
        accessors: {
            id: null,
            getKeys:    function (spec={}) {
                aa.arg.test(spec, aa.verifyObject({
                    get: aa.isFunction,
                    set: aa.isFunction,
                }), `'spec'`);
                spec.sprinkle({get, set});

                const id = `accessors-${JS.accessors.id}`;
                const keys = spec.get(this, id);

                return keys ? keys.slice() : [];
            },
            saveKey:    function (key, spec={}) {
                aa.arg.test(spec, aa.verifyObject({
                    get: aa.isFunction,
                    set: aa.isFunction,
                }), `'spec'`);
                spec.sprinkle({get, set});

                const id = `accessors-${JS.accessors.id}`;
                if (!spec.get(this, id)) {
                    spec.set(this, id, []);
                }
                spec.get(this, id).pushUnique(key);
            }
        }
    };
    // ----------------------------------------------------------------
    aa.deploy = Object.freeze(function (context, collection /*, spec */) {
        /**
         * @param {any} context
         * @param {object} collection (Object of Functions)
         * @param {boolean} spec (optional)
         *      @key {boolean} condition
         *      @key {boolean} force
         *
         * @return {void}
         */
        let spec = arguments.length > 2 ? arguments[2] : {};
        if (typeof spec !== "object") { throw new TypeError("Third argument must be an Object."); }
        spec = Object.assign({
            condition: true,
            force: false
        }, spec);
        if (spec.condition !== undefined && typeof spec.condition !== "boolean") { throw new TypeError("Spec 'condition' key must be a Boolean."); }
        if (spec.force !== undefined && typeof spec.force !== "boolean") { throw new TypeError("Spec 'force' key must be a Boolean."); }

        if (spec.condition) {
            let i;
            const keys = Object.keys(collection);
            for (i=0; i<keys.length; i++) {
                const key = keys[i];
                if (collection.hasOwnProperty(key)) {
                    const func = collection[key];
                    if (typeof context[key] !== "function" || spec.force) {
                        context[key] = func;
                    }
                }
            }
        }
    });
    aa.deploy(window, {
        els: (function () {
            return function (selector) {
                /**
                 * Usage:
                 *      el(selector1, selector2, selector3..., resolve() {});
                 *      el(selector1, selector2, selector3..., null|undefined, reject() {});
                 *      el(selector1, selector2, selector3..., resolve() {}, reject() {});
                 *      el(selector1, selector2, selector3..., resolve() {}, reject() {}, thisArg);
                 *      el(selector1, selector2..., resolve() {}, selector3..., reject() {}, thisArg);
                 * 
                 * This function takes as many arguments as needed.
                 * Every selector must be a string formatted like 'tag#id.class1.class2...' or 'tag.class1.class2...#id'.
                 * Every type is optional, but at least one type is required.
                 * 
                 * If given, the first functions will be considered as 'resolve' and 'reject' callbacks.
                 * 
                 * Once a a 'resolve' function is given, the last given argument will be considered as context for execution for both 'resolve' and 'reject'.
                 * 
                 * @param <string> selector1
                 * @param <string> selector2
                 * @param <string> selector3...
                 * @param <function> resolve
                 * @param <function> reject
                 * @param <any> thisArg
                 * 
                 * @return <nodes[]>
                 */
                const functions = [];
                const nodes     = [];
                const results   = [];
                let thisArg     = undefined;

                Array.from(arguments)
                .forEach((arg, i) => {
                    if (aa.isString(arg)) {
                        const {id, tag, classes} = aa.selectorSplit(arg);

                        if (id !== null) {
                            const node = document.getElementById(id);
                            if (node && (classes.length > 0 ? (classes.every(cls => node.classList.contains(cls))) : true)) {
                                results.push(node);
                            } else {
                                results.push(null);
                            }
                        } else if (tag !== null) {
                            const nodes = [];
                            Array.from(document.getElementsByTagName(tag))
                            .forEach(node => {
                                if ((id ? (id && node.id && node.id === id) : true)
                                    && (classes.length > 0 ? (classes.every(cls => node.classList.contains(cls))) : true)
                                ) {
                                    nodes.push(node);
                                }
                            });
                            results.push(nodes);
                        } else if (classes.length > 0) {
                            const nodes = [];
                            document.body.diveTheDOM(node => {
                                if (classes.every(cls => node.classList.contains(cls))) {
                                    nodes.push(node);
                                }
                            });
                            results.push(nodes);
                        }
                    } else if (functions.length > 0 && i === arguments.length - 1) {
                        if (functions.length === 1) {
                            functions.push(arg); // 'reject' function
                        } else {
                            thisArg = arg;
                        }
                    } else if (aa.isFunction(arg)) {
                        functions.push(arg);
                    } else if ((arg === null || arg === undefined) && functions.length === 0) {
                        functions.push(null);
                    } else {
                        throw new TypeError("Unauthorized argument");
                    }
                });
                aa.throwErrorIf( functions.length > 2, "Arguments must not have more than two functions to define 'resolve' and 'reject' functions. A third function may be considered as context for execution, only if given as last argument." );

                const resolve = functions.length > 0 ? functions[0] : null;
                const reject = functions.length > 1 ? functions[1] : null;

                if (results.every(node => node !== null)) {
                    if (resolve) {
                        resolve.apply(thisArg, results);
                    }
                } else {
                    if (reject) {
                        reject.apply(thisArg, results);
                    }
                }
                return results;
            }
        })(),
        el:                         function (id) {
            /**
             * How to call:
             *      el(id)
             *      el(id, this)
             *      el(id, resolve() {})
             *      el(id, resolve() {}, this)
             *      el(id, resolve() {}, reject() {})
             *      el(id, resolve() {}, reject() {}, this)
             *
             * @param {string} id
             * @param {function} resolve (optional)
             * @param {function} reject (optional)
             * @param {object} that (optional)
             *
             * #return {DOM element}
             */

            const resolve = (arguments && arguments.length>1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined);
            const reject = (arguments && arguments.length>2 && aa.isFunction(arguments[2]) ? arguments[2] : undefined);
            const thisArg = (arguments.length > 1 && !aa.isFunction(arguments[1]) ?
                arguments[1]
                : (arguments.length > 2 && !aa.isFunction(arguments[2]) ?
                    arguments[2]
                    : (arguments.length > 3 && !aa.isFunction(arguments[3]) ?
                        arguments[3]
                        : undefined
                    )
                )
            );

            if (document.getElementById) {
                let node = document.getElementById(id);
                if (!node && reject) {
                        reject.call(thisArg, "DOM element not found.", "warning");
                }
                node = document.getElementById(id);
                if (node) {
                    if (resolve) {
                        resolve.call(thisArg, node);
                    }
                    return node;
                }
                return undefined;
            }
            if (reject) {
                reject.call(thisArg, "DOM element not found.", "warning");
            }
            return undefined;
        },
        error:                      console.error,
        log:                        console.log,
        warn:                       console.warn,
    });
    // ----------------------------------------------------------------
    aa.deploy(aa, {
        geometry: Object.freeze({
            affine: {
                byTwo:          function (a, b) {
                    /**
                     * Generate an affine function by two points given.
                     *
                     * @param {object} a
                     * @param {object} b
                     *
                     * @return {undefined | object}
                     */
                    aa.arg.test(null, aa.isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");

                    const x1 = a[0];
                    const y1 = a[1];
                    const x2 = b[0];
                    const y2 = b[1];

                    if (x1 === x2) {
                        cease("The two points must have different abscissa.");
                    } else {
                        
                        // f(x) = ax + b
                        const a = (y2 - y1) / (x2 - x1);
                        const b = y1 - (a * x1);

                        return x => (a * x) + b;
                    }
                }
            },
            circle: {
                getBy:          function (spec) {
                    aa.arg.test(null, aa.isObject(spec) && spec.verify({
                        center: v => (aa.isArray(v) && v.length === 2),
                        point: v => (aa.isArray(v) && v.length === 2),
                        radius: aa.isStrictlyPositiveNumber,
                        three: v => (aa.isArray(v) && v.length === 3),
                        two: v => (aa.isArray(v) && v.length === 2)
                    }));
                    if (spec.three) {
                        return aa.geometry.circle.functionByThree.apply(this, spec.three);
                    } else if (spec.center) {
                    }
                    return undefined;
                },
                byThree:        function (a, b, c) {
                    /**
                     * Generate a circle's function by three given points.
                     *
                     * @param {object} a
                     * @param {object} b
                     * @param {object} c
                     *
                     * @return {undefined | object}
                     */

                    const center = aa.geometry.circle.centerByThree(a, b, c);
                    
                    const ax = a[0];
                    const ay = a[1];
                    const ox = center.x;
                    const oy = center.y;
                    
                    return {
                        center: center,
                        functions: {
                            upper: x => oy + Math.sqrt(((ay - oy)**2) + ((ax - ox)**2) - ((x - ox)**2)),
                            lower: x => oy - Math.sqrt(((ay - oy)**2) + ((ax - ox)**2) - ((x - ox)**2))
                        }
                    };
                },
                centerByThree:  function (a, b, c) {
                    /**
                     * Calculates the center coordinates of a circle by three given points.
                     *
                     * @param {object} a
                     * @param {object} b
                     * @param {object} c
                     *
                     * @return {undefined | object}
                     */
                    aa.arg.test(null, aa.isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

                    if (JSON.stringify(a) === JSON.stringify(b) || JSON.stringify(a) === JSON.stringify(c) || JSON.stringify(b) === JSON.stringify(c)) {
                        cease("All three given points must have different coordinates.");
                    }

                    const ax = a[0];
                    const ay = a[1];
                    const bx = b[0];
                    const by = b[1];
                    const cx = c[0];
                    const cy = c[1];

                    // Let I and J, respectively the middle points of AB and BC:
                    const ix = (ax + bx) / 2;
                    const iy = (ay + by) / 2;
                    const jx = (bx + cx) / 2;
                    const jy = (by + cy) / 2;


                    // If two points are on the same vertical:
                    if (by - ay === 0 || cy - by === 0) {
                    } else {
                        // Let m be the slope of medians:
                        const im = -1 * (bx - ax) / (by - ay);
                        const jm = -1 * (cx - bx) / (cy - by);

                        if (im === jm) {
                            cease("The three given points are aligned; a circle can not be found.")
                        }

                        // Let g(x) and h(x) be the affine functions of the median by I and J:
                        const g = (x) => im * (x - ix) + iy;
                        const h = (x) => jm * (x - jx) + jy;

                        // Intersection:
                        const ox = ((im * ix) - (jm * jx) + jy - iy) / (im - jm);
                        return {
                            x: ox,
                            y: g(ox)
                        };
                    }
                    return undefined;
                },
            },
            curve: {
                byThree:        function (a, b, c) {
                    /**
                     * Generate a exponential, logarythm or affine function by three points given in ascending order.
                     *
                     * @param {object} a
                     * @param {object} b
                     * @param {object} c
                     *
                     * @return {undefined | object}
                     */
                    aa.arg.test(null, aa.isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

                    const x1 = a[0];
                    const y1 = a[1];
                    const x2 = b[0];
                    const y2 = b[1];
                    const x3 = c[0];
                    const y3 = c[1];

                    // Slopes in A and B:
                    const sA = (y2 - y1) / (x2 - x1);
                    const sB = (y3 - y2) / (x3 - x2);

                    if (sB > sA) {
                        return aa.geometry.exp.byThree(a, b, c);
                    } else if (sB < sA) {
                        return aa.geometry.log.byThree(a, b, c);
                    } else {
                        return aa.geometry.affine.byTwo(a, c);
                    }
                }
            },
            exp: {
                byThree:        function (a, b, c) {
                    /**
                     * Generate a exponential function by three points given in ascending order.
                     *
                     * @param {object} a
                     * @param {object} b
                     * @param {object} c
                     *
                     * @return {undefined | object}
                     */
                    aa.arg.test(null, aa.isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

                    const x1 = a[0];
                    const y1 = a[1];
                    const x2 = b[0];
                    const y2 = b[1];
                    const x3 = c[0];
                    const y3 = c[1];

                    // Slopes in A and B:
                    const sA = (y2 - y1) / (x2 - x1);
                    const sB = (y3 - y2) / (x3 - x2);


                    if ((x2 - x1) * (x3 - x2) === 0) {  cease("The three points must have different abscissa."); }
                    else if (sA * sB <= 0) {            cease("The three points must be monotonic"); }
                    else if (x3 - x2 !== x2 - x1) {     cease("Cx - Bx ≠ Bx - Ax Not implemented yet..."); }
                    else { // exponential...

                        // f(x)=a·e^(bx) + c
                        const r = (y3 - y2) / (y2 - y1);
                        const d = x2 - x1;

                        const b = Math.log(r) / d;
                        const a = (y2 - y1) / ((Math.exp(x2 / d * Math.log(r))) - (Math.exp(x1 / d * Math.log(r))));
                        const c = y1 - (a * Math.exp(b * x1));

                        return x => (a * Math.exp(b * x)) + c;
                    }
                    return undefined;
                }
            },
            log: {
                byThree:        function (a, b, c) {
                    /**
                     * Generate a logarithm function by three points given in ascending order.
                     *
                     * @param {object} a
                     * @param {object} b
                     * @param {object} c
                     *
                     * @return {undefined | object}
                     */
                    aa.arg.test(null, aa.isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, aa.isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

                    const x1 = a[0];
                    const y1 = a[1];
                    const x2 = b[0];
                    const y2 = b[1];
                    const x3 = c[0];
                    const y3 = c[1];

                    // Slopes in A and B:
                    const sA = (y2 - y1) / (x2 - x1);
                    const sB = (y3 - y2) / (x3 - x2);

                    if ((x2 - x1) * (x3 - x2) === 0) {  cease("The three points must have different abscissa."); }
                    else if (sA * sB <= 0) {            cease("The three points must be monotonic"); }
                    else if (y3 - y2 !== y2 - y1) {     cease("Cy - By ≠ By - Ay Not implemented yet..."); }
                    else { // logarythm...

                        // f(x)=a·ln(x + b) + c
                        const b = ((x1 * x2) - (x2 * x2)) / ((2 * x2) - x1 - x3);
                        const a = (y2 - y1) / (Math.log((b + x2) / (b + x1)));
                        const c = y1 - (a * Math.log(b + x1));

                        return x => (a * Math.log(b + x)) + c;
                    }
                    return undefined;
                }
            }
        }),
        arg: Object.freeze({
            optional:    function (args, index, defaultValue /*, condition=()=>true, strict=false */) {

                const condition = arguments && arguments.length > 3 ? arguments[3] : () => true;
                const strict = arguments && arguments.length > 4 ? arguments[4] : false;

                if (!aa.isArrayLike(args)) {        throw new TypeError("First argument (args) must be an Array-like."); }
                if (!aa.isPositiveInt(index)) {         throw new TypeError("Second argument (index) must be a positive Integer."); }
                if (!aa.isFunction(condition)) {    throw new TypeError("Fourth argument (condition) must be a Function."); }
                if (!aa.isBool(strict)) {           throw new TypeError("Fifth argument (strict) must be a Boolean."); }

                const isVerified = args.length > index ? condition(args[index]) : false;
                if (!aa.isBool(isVerified)) { throw new TypeError("Fourth argument (condition) must be Function that must return a Boolean."); }

                return (isVerified ?
                    args[index]
                    : defaultValue
                );
            },
            test:   function (arg, tester /* [, position [, message]] */) {
                if (!aa.isFunction(tester) && !aa.isBool(tester)) { throw new TypeError("Second argument must be a Function."); }

                let i;
                // const argv = [];
                // for (i=2; i<arguments.length; i++) {
                //     argv.push(arguments[i]);
                // }
                const argv = Array.from(arguments).slice(2);
                const position = argv.find(aa.isPositiveInt);
                const message = argv.find(aa.nonEmptyString) || "invalid";

                const writeMessage = function (position, str) {
                    const positions = [
                        "First argument",
                        "Second argument",
                        "Third argument",
                        "Fourth argument",
                        "Fifth argument",
                        "Sixth argument",
                        "Seventh argument",
                        "Heighth argument",
                        "Ninth argument",
                        "Tenth argument",
                    ];
                    const parts = [];
                    parts.push(position !== undefined && position < positions.length ? positions[position] : "Argument");
                    parts.push(str.trim());
                    return (parts.join(' ')+'.').replace(/\.+$/, '.');
                };

                if (aa.isBool(tester) && !tester) {
                    throw new TypeError(writeMessage(position, message));
                    return false;
                } else if (aa.isFunction(tester) && !tester(arg)) {
                    const text = tester.label ? `must be ${tester.label}`: null;
                    if (text) {
                        throw new TypeError(writeMessage(position, text));
                    } else {
                        throw new TypeError(writeMessage(position, message));
                    }
                    return false;
                }
                return true;
            }
        })
    }, {force: true});
    aa.deploy(aa, {
        addHTML:                    function (identifiant, html) {
            el(identifiant, node => {
                node.innerHTML += html;
            });
        },
        addScriptToDOM:             (function () {
            const charsets = ['utf-8']; // First item will be used by default

            return function (path, options={}) {
                aa.arg.test(path, aa.nonEmptyString, "'path'");
                aa.arg.test(options, aa.verifyObject({
                    charset: aa.inArray(charsets),
                }), "'options'");

                // Default options:
                options.sprinkle({
                    charset: charsets.first
                });

                // Main:
                path = path.trim();
                const script = document.createElement("script");
                script.setAttribute("charset", options.charset);
                script.src = path;
                document.head?.appendChild(script);
            };
        })(),
        addStyleToScript:           function (scriptFilename, styleFilename) {
            const path = aa.findPathOf(scriptFilename);
            if (path) {
                var css = document.createElement("link");
                css.rel  = "stylesheet";
                css.type = "text/css";
                css.href = path+'/'+styleFilename;
                document.head.appendChild(css);
            }
        },
        any:                        () => true,
        b64_to_utf8:                function (param){

            return decodeURIComponent(escape(window.atob(param)));
        },
        bodyWrite:                  function (param){
            var div = document.createElement('div');
            div.innerHTML = param;
            
            document.body.appendChild(div);
        },
        copySelectionToClipboard:   function (){

            document.execCommand('copy', true);
            return;
        },
        copyTextToClipboard:        function (parametre){

            var textareaDOM = document.createElement('textarea');
            
            // textareaDOM.setAttribute('style','display: none;');
            textareaDOM.text = parametre;
            document.body.appendChild(textareaDOM);
            // $('body').append(textareaDOM);
            textareaDOM.select();
            document.execCommand('copy', true);
            textareaDOM.remove();
        },
        dataURItoBlob:              function (dataURI, callback){
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            var byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

            // write the bytes of the string to an ArrayBuffer
            var i;
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (i=0; i<byteString.length; i++){
                ia[i] = byteString.charCodeAt(i);
            }

            // write the ArrayBuffer to a blob, and you're done
            var bb = new Blob([ab]);
            return bb;
        },
        debug:                      function (){

            alert('aa.debug');
        },
        deprecated:                 function (name) {
            /**
             * @param String name
             *
             * @return void
             */
            if (!aa.nonEmptyString(name)) { throw new TypeError("Argument must be a non-empty String."); }
            console.warn("Deprecated: '"+name.trim()+"'. This feature is no longer recommended. Avoid using it, and update existing code if possible.");
        },
        digit:                      function (param, digits) {
            var i;
            if (!aa.isInt(digits)) {
                return param;
            }
            param += '';
            for(i=param.length; i<digits; i++) {
                param = '0'+param;
            }
            return param;
        },
        dir:                        function () {
            if (console && console.dir && arguments && arguments.length) {
                if (arguments.length > 1) {
                    console.group();
                    arguments.forEach(function (o) {
                        console.dir(o);
                    });
                    console.groupEnd();
                    return true;
                } else {
                    console.dir(arguments[0]);
                    return true;
                }
            }
            console.log(undefined);
            return false;
        },
        findPathOf:                 function (filename) {
            const folder = document
                .getElementsByTagName("script")
                .reduce(function (folder, script) {
                    if (script && aa.isObject(script) && script.src) {
                        const re = new RegExp('^(.+)'+filename+'$','');
                        const result = script.src.match(re);
                        if (result && result.length>=2) {
                            folder = result[1];
                            if (folder.match(/[^\/](\/)$/)) {
                                folder = folder.replace(/\/$/, '');
                            }
                        }
                    }
                    return folder;
                }, undefined)
            ;
            return folder;
        },
        getCookie:                  function (sName) {
            //if (navigator.cookieEnabled)test('navigator.cookieEnabled','enabled');
            if (!document.cookie) {
                //test('document.cookie','undefined');
            }
            
            var oRegex = new RegExp("(?:; )?" + sName + "=([^;]*);?");

            if (oRegex.test(document.cookie)) {
                return decodeURIComponent(RegExp["$1"]);
            }
            else {
                return null;
            }
        },
        getFilename:                function (param) {
            if (aa.isString(param)) {
                var temp = param.split('/');
                if (temp && temp.length) {
                    return temp[-1+temp.length];
                }
                return param;
            }
            return '???';
        },
        getScriptFolder:            function (file) {
            var res = undefined;
            var scripts = document.getElementsByTagName('script');
            scripts.forEach(function (script) {
                if (script && aa.isObject(script) && script.src) {
                    var re = new RegExp('^(.+)'+file+'$','');
                    var result = script.src.match(re);
                    if (result && result.length>=2) {
                        res = result[1];
                    }
                }
            });
            return res;
        },
        getStyleFolder:             function (file) {
            var res = undefined;
            var links = document.getElementsByTagName('link');
            links.forEach(function (link) {
                if (link && aa.isObject(link) && link.href) {
                    var re = new RegExp('^(.+)'+file+'$','');
                    var result = link.href.match(re);
                    if (result && result.length>=2) {
                        res = result[1];
                    }
                }
            });
            return res;
        },
        hasOption:                  function (list, option) {

            return list.indexOf(option) > -1;
        },
        htmlEncode:                 function (str) {
            var i = str.length,
                aRet = [];

            while(i--) {
                var iC = str[i].charCodeAt();
                if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
                    aRet[i] = '&#'+iC+';';
                } else {
                    aRet[i] = str[i];
                }
            }
            return aRet.join('');    
        },
        inArray:                    function (list) {
            aa.arg.test(list, aa.isArray, "'list'");

            return addReadonlyProperties(
                function (item) {
                    return (list.indexOf(item) > -1);
                },
                {
                    label: `an item in the given Array`
                },
            );
        },
        inEnum:                     function (...items) {
            aa.arg.test(items, aa.isArrayOfNonEmptyStrings, "'items'");

            return addReadonlyProperties(
                function (item) {
                    return (items.indexOf(item) > -1);
                },
                {
                    label: `a String in the given enumerated list`
                },
            );
        },
        instanceof:                 function (Instancer) {
            aa.arg.test(Instancer, aa.isFunction, "'Instancer'");

            return addReadonlyProperties(
                function (arg) {
                    return arg instanceof Instancer
                },
                {
                    label: `an instance of ${Instancer.name ?? "the given Function"}`
                },
            );
        },
        inbetween:                  function (value, min, max){
            return (
                aa.isNumber(value)
                && aa.isNumber(min)
                && aa.isNumber(max)
                && value >= min && value <= max
            );
        },
        inbetweenStrict:            function (value, min, max){

            return (
                aa.isNumber(value)
                && aa.isNumber(min)
                && aa.isNumber(max)
                && value > min && value < max
            );
        },
        insertBrAtSelection:        function (win) {
            var doc;
            var sel = win.getSelection();
            var range = sel.getRangeAt(0);
            sel.removeAllRanges();
            sel.addRange(range);

            var n = sel.anchorNode;
            while(n) {
                // log({sel:sel,range:range,collapsed:range.collapsed,node:n});
                if (n.designMode && n.designMode.toLowerCase() === 'on') {
                    doc = n;
                    n = null;
                } else {
                    n = n.parentNode;
                }
            }
            /**/
            if (doc) {
                var br = aa.html("br");
                if (range.collapsed) {
                    if (range.startContainer.nodeType === 3) {
                        // log(3);
                        if (range.startOffset === sel.anchorNode.length && sel.anchorNode.nextSibling.tagName.toLowerCase() === "br") {
                            doc.execCommand('insertHTML',false,'<br><br>');
                            return;
                        }
                        let pos = range.startOffset;
                        let textNode = range.startContainer;
                        let container = textNode.parentNode;
                        let text = textNode.nodeValue;
                        let textBefore = text.substr(0,pos);
                        let textAfter = text.substr(pos);
                        // range.setStartBefore(container.firstChild);
                        // range.setEndAfter(container.firstChild);
                        range.selectNode(range.startContainer);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        let list = [];
                        n = range.startContainer.firstChild;
                        while(n) {
                            if (n.nodeType === 3) {
                                list.push(n.nodeValue);
                            } else {
                                list.push(n.outerHTML);
                            }
                            n = n.nextSibling;
                        }
                        // return;
                        // log({textBefore:textBefore},{br:br},{textAfter:textAfter});
                        doc.execCommand('insertHTML',false,textBefore+'<br>'+textAfter);
                        // sel.removeAllRanges();
                        // range.setStartAfter(container.firstChild.nextSibling);
                        // range.setEndAfter(container.firstChild.nextSibling);
                        // sel.addRange(range);
                        return;
                    } else {
                        throw new Error(">>> todo: nodeType !== 3");
                        doc.execCommand('insertHTML',false,br.outerHTML);
                    }
                } else {
                    doc.execCommand('insertHTML',false,'<br>');
                }
                return false;

                // doc.execCommand('insertHTML',false,br.outerHTML);
                // return;
            }
        },
        insertNodeAtSelection:      function (win, insertNode) { //, editableNode=null
            var doc;
            var sel = win.getSelection();
            var range = sel.getRangeAt(0);
            sel.removeAllRanges();
            sel.addRange(range);

            var n = sel.anchorNode;
            while(n) {
                // log({sel:sel,range:range,collapsed:range.collapsed,node:n});
                if (n.designMode && n.designMode.toLowerCase() === 'on') {
                    doc = n;
                    n = null;
                } else {
                    n = n.parentNode;
                }
            }
            /**/
            if (doc) {
                log('editable Node');
                if (range.collapsed) {
                    if (range.startContainer.nodeType === 3) {
                        // log(3);
                        let pos = range.startOffset;
                        let textNode = range.startContainer;
                        let container = textNode.parentNode;
                        let text = textNode.nodeValue;
                        let textBefore = text.substr(0,pos);
                        let textAfter = text.substr(pos);
                        // range.setStartBefore(container.firstChild);
                        // range.setEndAfter(container.firstChild);
                        range.selectNode(container.firstChild);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        // log({textBefore:textBefore},{insertNode:insertNode},{textAfter:textAfter});
                        doc.execCommand('insertHTML',false,textBefore+insertNode.outerHTML+textAfter);
                        sel.removeAllRanges();
                        range.setStartAfter(container.firstChild.nextSibling);
                        range.setEndAfter(container.firstChild.nextSibling);
                        sel.addRange(range);
                        return;
                    } else {
                        // throw new Error(">>> todo: nodeType !== 3");
                        doc.execCommand('insertHTML',false,insertNode.outerHTML);
                    }
                } else {
                    doc.execCommand('insertHTML',false,'<br>');
                }
                return false;

                // if (aa.isNode(insertNode)) {
                //     doc.execCommand('insertHTML',false,insertNode.outerHTML+' ');
                // } else if (aa.isString(insertNode)) {
                //     doc.execCommand('insertHTML',false,insertNode);
                // }
                // return;
            } else {
                // get the first range of the selection
                // (there's almost always only one range)
                var range = sel.getRangeAt(0);
                
                // deselect everything
                sel.removeAllRanges();

                // remove content of current selection from document
                range.deleteContents();
                
                // get location of current selection
                var container = range.startContainer;
                var pos = range.startOffset;
                
                // make a new range for the new selection
                range = document.createRange();
                
                if (container.nodeType==3 && insertNode.nodeType==3) {
                    // if we insert text in a textnode, do optimized insertion
                    container.insertData(pos, insertNode.nodeValue);
                
                    // put cursor after inserted text
                    range.setEnd(container, pos+insertNode.length);
                    range.setStart(container, pos+insertNode.length);
                } else {
                    var afterNode;
                    if (container.nodeType==3) {
                        // when inserting into a textnode
                        // we create 2 new textnodes
                        // and put the insertNode in between
                    
                        var textNode = container;
                        container = textNode.parentNode;
                        var text = textNode.nodeValue;
                    
                        // text before the split
                        var textBefore = text.substr(0,pos);
                        // text after the split
                        var textAfter = text.substr(pos);
                    
                        var beforeNode = document.createTextNode(textBefore);
                        afterNode = document.createTextNode(textAfter);
                        
                        // insert the 3 new nodes before the old one
                        container.insertBefore(afterNode, textNode);
                        container.insertBefore(insertNode, afterNode);
                        container.insertBefore(beforeNode, insertNode);
                    
                        // remove the old node
                        container.removeChild(textNode);
                    } else {
                        // else simply insert the node
                        afterNode = container.childNodes[pos];
                        container.insertBefore(insertNode, afterNode);
                    }
                
                    range.setEnd(afterNode, 0);
                    range.setStart(afterNode, 0);
                }
                sel.addRange(range);
            }
        },
        isArray:                    function (param){
            return Array.isArray(param);
        },
        isArrayLike:                function (list) {
            return (
                Array.isArray(list) || 
                typeof list === "string" || 
                (
                    typeof list === "object"
                    && typeof (list.length) === "number"
                    && (list.length === 0
                        || (
                            list.length > 0
                            && list.hasOwnProperty(list.length - 1)
                            // && (list.length - 1) in list
                        )
                    )
                )
            );
        },
        isArrayLikeOf:              function (verifierFunction) {
            aa.arg.test(verifierFunction, aa.isFunction, "'verifierFunction'");

            return addReadonlyProperties(
                function (list) {
                    return aa.isArrayLike(list) && list.every(verifierFunction);
                },
                {
                    label: `an Array-like in which every item must ${verifierFunction.label ? `be ${verifierFunction.label}` : (verifierFunction.name ? `verify <${verifierFunction.name}>` : "verify the given Function")}`
                },
            );
        },
        isArrayOf:                  function (verifierFunction) {
            aa.arg.test(verifierFunction, aa.isFunction, "'verifierFunction'");

            return addReadonlyProperties(
                function (list) {
                    return aa.isArray(list) && list.every(verifierFunction);
                },
                {
                    label: `an Array in which every item must ${verifierFunction.label ? `be ${verifierFunction.label}` : (verifierFunction.name ? `verify <${verifierFunction.name}>` : "verify the given Function")}`
                },
            );
        },
        isArrayOfFunctions:         function (a){

            return (aa.isArray(a) && a.reduce((ok, v)=>{ return (!aa.isFunction(v) ? false : ok); }, true));
        },
        isArrayOfNonEmptyStrings:   function (list) {
            return aa.isArray(list) && list.every(aa.nonEmptyString);
        },
        isArrayOfNumbers:           function (a){

            return (aa.isArray(a) && a.every(v => aa.isNumber(v)));
        },
        isArrayOfStrings:           function (a){
            
            return (aa.isArray(a) && a.reduce((ok, v)=>{ return (!aa.isString(v) ? false : ok); }, true));
        },
        isBool:                     function (o){
            return (o === true || o === false);
        },
        isDom:                      function (o) {
            if (typeof window['HTMLElement'] !== 'undefined') {
               return (!!o && o instanceof HTMLElement);
            }
            return (!!o && typeof o === 'object' && o.nodeType === 1 && !!o.nodeName);
        },
        isElement:                  function (o){
            return (
                typeof HTMLElement === "object"
                ? o instanceof HTMLElement
                : o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName === "string"
            );
        },
        isFile:                     function (file) {
            return (
                File !== undefined
                && file instanceof File
            );
        },
        isFloat:                    function (n){
            return Number(n) === n && n % 1 !== 0;
        },
        isFunction:                 function (p){
            return (typeof p === 'function');
        },
        isInt:                      function (p){
            return Number.isInteger(p);
            // return typeof(p) === 'number' && p === parseInt(p);
        },
        isNode:                     function (o){
            return (
                typeof Node === "object"
                ? o instanceof Node
                : o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
            );
        },
        isNullOrNonEmptyString:     v => (v === null || aa.nonEmptyString(v)),
        isNullOrInt:                v => (v === null || Number.isInteger(v)),
        isNumber:                   function (param){
            return (
                typeof param === "number"
                && !Number.isNaN(param)
            );
        },
        isNumeric:                  function (param){

            return !isNaN(parseFloat(param)) && isFinite(param);
        },
        isObject:                   function (param){
            return (typeof param === 'object' && param !== null && !Array.isArray(param));
        },
        isObjectOf:                 function (verifierFunction) {
            return addReadonlyProperties(
                function (collection) {
                    return aa.isObject(collection) && collection.every(verifierFunction);
                },
                {
                    label: `an Object whose every property must ${verifierFunction.label ? `be ${verifierFunction.label}` : (verifierFunction.name ? `verify <${verifierFunction.name}>` : "verify the given Function")}`
                },
            );
        },
        isObjectOfFunctions:        function (o){
            return (
                aa.isObject(o)
                && o.reduce((ok, v)=>{ return (!aa.isFunction(v) ? false : ok); }, true)
            );
        },
        isObjectOfStrings:          function (o){
            return (
                aa.isObject(o)
                && o.reduce((ok, v) => (!aa.isString(v) ? false : ok), true)
            );
        },
        isObjectOfObjects:          function (param) {
            let ok = true;
            if (aa.isObject(param)) {
                ok = param.reduce((acc,data,key)=>{
                    if (!aa.isObject(data)) {
                        acc = false;
                    }
                    return acc;
                },ok);
            }
            return ok;
        },
        isPositiveInt:              v => (aa.isInt(v) && v >= 0),
        isPositiveNumber:           v => (aa.isNumber(v) && v >= 0),
        isStrictlyPositiveInt:      v => (aa.isInt(v) && v > 0),
        isStrictlyPositiveNumber:   v => (aa.isNumber(v) && v > 0),
        isRegExp:                   function (param){
            return (
                typeof param === "object"
                && param.__proto__.constructor.name === "RegExp"
            );
        },
        isString:                   function (value) {
            return (
                typeof(value) === 'string'
            );
        },
        isStringMatch:              function (pattern) {
            return addReadonlyProperties(
                function (str) {
                    return aa.isString(str) && !!str.match(pattern);
                },
                {
                    label: `a String that match the given pattern`
                },
            );
        },
        nonEmptyString:             function (str) {
            return (
                aa.isString(str)
                && str.trim().length > 0
            );
        },
        purgeEventHandlers:         function (node) {
            aa.walkTheDOM(node, function (elt) {
                for (let key in elt) {
                    if (typeof elt[key] === "function") {
                        elt[key] = null;
                    }
                }
            });
        },
        selectorSplit:              (function () {
            function addToken (type, token, tokens) {
                token = token.trim();
                if (token.length) {
                    tokens[type].push(token);
                }
            }
            return function (selector) {
                /**
                 * Extract tagName, id and classes from given selector.
                 * 
                 * @param <string> selector
                 * Every selector must be a string formatted like 'tag#id.class1.class2...' or 'tag.class1.class2...#id'.
                 * 
                 * @return <object>
                 *      {classes, id, tag}
                 */
                
                const tokens    = {
                    classes:    [],
                    ids:        [], // must not contain more than one item
                    tags:       []  // must not contain more than one item
                };
                const result = {
                    classes: [],
                    id: null,
                    tag: null
                };

                let type = 'tags';
                let currToken = '';
                
                selector = selector.trim();
                selector.forEach(char => {
                    switch (char) {

                    // ID:
                    case '#': (() => {
                        addToken(type, currToken, tokens);
                        type = 'ids';
                        currToken = ''
                    })(); break;

                    // Classes:
                    case '.': (() => {
                        addToken(type, currToken, tokens);
                        type = 'classes';
                        currToken = ''
                    })(); break;

                    // parse characters:
                    default: (() => {
                        currToken += char;
                    })(); break;
                    }
                });
                addToken(type, currToken, tokens);
                
                aa.throwErrorIf( tokens.ids.length > 1, "Selector must not have more than one ID." );
                aa.throwErrorIf( tokens.tags.length > 1, "Selector must not have more than one tag name." );

                if (tokens.ids.length > 0) {
                    result.id = tokens.ids.first;
                }
                if (tokens.tags.length > 0) {
                    result.tag = tokens.tags.first;
                }
                if (tokens.classes.length > 0) {
                    result.classes = tokens.classes;
                }
                return result;
            };
        })(),
        removeDOM:                  function (elt){

            elt.parentNode.removeChild(elt);
        },
        repeat:                     function (times, callback /*, thisArg */) {
            /**
             * Repeat an execution a given number of times.
             * 
             * @param <int> times:          A number of times to repeat the execution.
             * @param <function> callback:  A Function to repeat. The function may return a Boolean; if false is returned repetition will stop.
             * 
             * @return <obj>
             *      <boolean> done:         true if every repetition succeeded, false if repetition stopped before the end.
             *      <int> index:            The index where the repetition stopped.
             * 
             * Usage:
             *  aa.repeat(5, i => {
                * if (somethingWrong) { return false; }
             *  });
             */
            
            aa.arg.test(times, aa.isPositiveInt, "'times'");
            aa.arg.test(callback, aa.isFunction, "'callback'");

            const result = {
                done: true,
                index: null
            };

            const thisArg = aa.arg.optional(arguments, 2, null);

            for (let i=0; i<times; i++) {
                const iResult = callback.call(thisArg, i);
                aa.throwErrorIf(iResult !== undefined && !aa.isBool(iResult), "The callback Function must return a Boolean.");

                result.index = i;
                if (iResult === false) {
                    i = times;
                    result.done = false;
                }
            }
            return Object.freeze(result);
        },
        replace:                    function (car1,car2,param){

            var car1;
            var car2;
            var param;
            
            return param.split(car1).join(car2);
        },
        resizeTextarea:             function (textarea) {
            aa.arg.test(textarea, arg => aa.isElement(arg) && arg?.tagName?.toLowerCase?.() === 'textarea', "'textarea'");

            textarea.style.height = '0px';
            textarea.style.height = `${textarea.scrollHeight}px`;
        },
        setCookie:                  function (sName, sValue){
            var today = new Date();
            var expires = new Date();
            
            expires.setTime(today.getTime() + (365*24*60*60*1000));
            
            document.cookie = sName + "=" + encodeURIComponent(sValue) + ";expires=" + expires.toGMTString(); //  + "; path=/"
            //test('set.'+sName,sValue);
        },
        setHTML:                    function (identifiant,html) {
            var html;
            var identifiant;

            if (el(identifiant)) {
                el(identifiant).innerHTML = html;
            }
        },
        sortNatural:                function (a, b) {
            if (a === b) {
                return 0;
            } else {
                a = aa.isNumber(a) ? a.toString() : a;
                b = aa.isNumber(b) ? b.toString() : b;

                if (aa.isString(a) && aa.isString(b)) {
                    a = a.toLowerCase().noAccent();
                    b = b.toLowerCase().noAccent();

                    if (a === b) {
                        return 0;
                    }

                    const re = /[0-9０-９]+|[^0-9０-９]+/gi;
                    const digits = /^[0-9０-９]+$/;
                    const aParts = a.match(re);
                    const bParts = b.match(re);
                    const len = aParts.length > bParts.length ? bParts.length : aParts.length;

                    // If first parts are from different types:
                    if (!!aParts[0].match(digits) !== !!bParts[0].match(digits)) {
                        return (
                            a < b
                            ? -1
                            : 1
                        );
                    
                    // If first parts are from same type:
                    } else {
                        let i, res;
                        for(i=0; i<len; i++) {
                            let _a = aParts[i];
                            let _b = bParts[i];

                            if (_a !== _b) {
                                if (_a.match(digits) && !!_a.match(digits) && !!_b.match(digits)) {
                                    const hiraganas = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
                                    hiraganas.forEach((kana, i)=>{
                                        _a = _a.replace(new RegExp(kana, "g"), i);
                                        _b = _b.replace(new RegExp(kana, "g"), i);
                                    });
                                    _a = parseInt(_a);
                                    _b = parseInt(_b);
                                    if (_a !== _b) {
                                        res = (
                                            _a < _b
                                            ? -1
                                            : 1
                                        );
                                        i=len;
                                        break;
                                    }
                                } else {
                                    res = _a.localeCompare(_b);
                                    i=len;
                                    break;
                                }
                            }
                        }
                        if (res === undefined) {
                            res = (
                                aParts.length < bParts.length
                                ? -1
                                : 1
                            );
                        }
                        return res;
                    }
                } else {
                    return (a < b ?
                        -1
                        : 1
                    );
                }
                return undefined;
            }
        },
        testStorage:                function (type) {
            if (type !== "local" && type !== "session") {
                throw new Error("Invalid parameter.");
            }
            try{
                const storage = window[type+"Storage"],
                    x = "__aa.testStorage__";
                storage.setItem(x,x);
                storage.getItem(x);
                return true;
            }
            catch(e) {
                return false;
            }
        },
        todo:                       function (param) {
            if (aa.isString(param)) {
                var tab     = 32,
                    method  = '';
                if (arguments && arguments.length >= 2 && aa.isString(arguments[1]) && arguments[1].trim()) {
                    method = '('+arguments[1].trim()+')';
                }
                log('todo:'+(method).padStart(tab)+' - '+param);
            }
        },
        toFloat:                    function (parametre) {

            // var i;
            // var decimales = 6;
            
            // parametre = ''+parametre;
            // result = parametre.split('.');
            // if (result && result.length > 1) {
            
                // parametre = result[0]+'.';
                
                // for(i=0; i<decimales; i++) {
                    // parametre += result[1][i];
                // }
            // }
            parametre = parseFloat(parametre);
            return parametre;
        },
        unsetCookie:                function (sName){

            createCookie(sName,"",-1);
        },
        utf8_to_b64:                function (param){
            // return param;
            return window.btoa(unescape(encodeURIComponent(param)));
        },
        /**
         * A factory that returns a Function to verify if the future given argument's properties will match each property of a model.
         * 
         * Usage:
         * // simple call, with no option:
         * aa.verifyObject({
         *      aPropertyName: aFunctionThatMustReturnABoolean
         * })(theObjectToVerify);
         * 
         * // call with 'strict' option:
         * aa.verifyObject({
         *      aPropertyName: aFunctionThatMustReturnABoolean
         *      anotherPropertyName: anotherFunctionThatMustReturnABoolean
         * }, true)(theObjectToVerify);
         * 
         * // call with options:
         * aa.verifyObject({
         *      aPropertyName: aFunctionThatMustReturnABoolean
         *      anotherPropertyName: anotherFunctionThatMustReturnABoolean
         * }, {
         *      silent: true,
         *      strict: true,
         * })(theObjectToVerify);
         * 
         * @param      {object} model - An Object of Functions that will be used to verify every property of the future given argument passed to the returned Function.
         * @param {bool|ojbect} [strict=false|options] - If a Boolean is passed, executes in strict mode (true) or not (false by default). If an Object is passed, it will be used as options.
         * @param        {bool} [options.silent] - Executes in silent mode (true) or not (false by default).
         * @param        {bool} [options.strict] - Executes in strict mode (true) or not (false by default).
         * 
         * @return {function}
         */
        verifyObject:               function (model /*, strict=false */) {
            aa.arg.test(model, aa.isObject, `'model'`);
            const strict = aa.arg.optional(arguments, 1, false, aa.isBool);
            const options = aa.arg.optional(arguments, 1, {}, arg =>
                aa.isObject(arg)
                && Object.keys(arg).every(key => ['strict', 'silent'].has(key) && aa.isBool(arg[key]))
            );
            options.strict ??= false;
            options.silent ??= false;
            if (strict) {
                options.strict = strict;
            }

            return addReadonlyProperties(
                arg => aa.isObject(arg) && arg.verify(model, options),
                {
                    label: `an Object which every properties match the given model Object`
                },
            );
        },
        walkTheDOM:                 function (node,func){
            /**
             *  Author: Douglas Crockford
             */
            func(node);
            node = node.firstChild;
            while(node){
                aa.walkTheDOM(node, func);
                node = node.nextSibling;
            }
        },
        walkChildrenElements:       function (node, func) {
            var o = {};
            var except = [];
            if (arguments && arguments.length > 2) {
                if (arguments[2] !== null && !aa.isArray(arguments[2]) && aa.isObject(arguments[2])) {
                    o = arguments[2];
                }
            }
            o.forEach(function (value,key) {
                switch(key.toLowerCase()) {
                    case 'except':
                        if (aa.isArray(value)) {
                            value.forEach(function (s) {
                                if (aa.isString(s) && s.trim()) {
                                    except.push(s.trim().toLowerCase());
                                }
                            });
                        }
                        break;
                    default:
                        break;
                }
            });
            
            node = node.firstChild;
            while(node) {
                if (aa.isElement(node) && !except.has(node.nodeName.toLowerCase())) {
                    func(node);
                }
                node = node.nextSibling;
            }
        },
    }, {force: true});
    aa.deploy(aa, {
        defineAccessors:            function (accessors /*, spec */) {
            aa.arg.test(accessors, aa.verifyObject({
                execute:    aa.isObject,
                privates:   aa.isObject,
                publics:    aa.isObject,
                read:       aa.isObject,
                write:      aa.isObject
            }), `'accessors'`);
            const spec = aa.arg.optional(arguments, 1, {}, aa.verifyObject({
                getter: aa.isFunction,
                setter: aa.isFunction,
                verifiers: aa.isObjectOfFunctions
            }));
            spec.sprinkle({
                getter: get,
                setter: set
            });

            accessors.forEach((keyValues, accessor) => {
                keyValues.forEach((value, key) => {
                    // Save key:
                    JS.accessors.saveKey.call(this, key, {get: spec.getter, set: spec.setter});

                    // Initialize value:
                    spec.setter(this, key, value);
                    
                    // Initialize getters and setters:
                    const getter = () => {
                        return spec.getter(this, key);
                    };
                    Object.defineProperty(getter, 'name', {get: () => `get${key.firstToUpper()}`});
                    const setter = value => {
                        const setterName = 'set'+key.firstToUpper();
                        if (typeof this[setterName] === 'function') {
                            this[setterName].call(this, value);
                        } else {
                            console.warn("Setter '"+key+"' not implemented.");
                        }
                    };
                    Object.defineProperty(setter, 'name', {get: () => `set${key.firstToUpper()}`});

                    switch (accessor) {
                        case 'publics':
                            Object.defineProperty(this, key, {
                                get: getter,
                                set: setter
                            });
                            break;
                        case 'read':
                            Object.defineProperty(this, key, {
                                get: getter
                            });
                            break;
                        case 'write':
                            Object.defineProperty(this, key, {
                                set: setter
                            });
                            break;
                        case 'execute':
                            Object.defineProperty(this, key, {
                                get: () => spec.getter(this, key).call(this)
                            });
                            break;
                    }
                });
            });
        },
        definePrivateMethods:       function (methods, spec={}) {
            aa.arg.test(methods, aa.isObjectOfFunctions, "'methods'");
            aa.arg.test(spec, aa.verifyObject({
                get: aa.isFunction,
                set: aa.isFunction,
            }), "'spec'");
            spec.sprinkle({
                get,
                set
            });

            methods.forEach((callback, name) => {
                // Save key:
                JS.accessors.saveKey.call(this, name, {get: spec.get, set: spec.set});

                // Initialize value:
                spec.set(this, name, callback.bind(this));
            });
        },
        getAccessor:                function (/* spec */) {
            const spec = aa.arg.optional(arguments, 0, {}, aa.verifyObject({
                get: aa.isFunction,
                set: aa.isFunction
            }));
            const {get, set} = aa.mapFactory();
            spec.sprinkle({get, set});
            
            const that = {};
            const keys = JS.accessors.getKeys.call(this, {get: spec.get, set: spec.set});
            const emit = (aa.event.getEmitter.call(this, spec.get, 'listeners')).bind(this);
            keys.forEach(key => {
                Object.defineProperty(that, key, {
                    get: () => spec.get(this, key),
                    set: value => {
                        spec.set(this, key, value);
                    }
                });
            });
            return Object.freeze(that);
        },
        getFilesFromDataTransfer:   function (dataTransfer) {
            const files = [];
            if (dataTransfer.items) {
                Array.from(dataTransfer.items)
                .filter(item => item.kind === `file`)
                .forEach(item => {
                    const file = item.getAsFile();
                    files.push(file);
                });
            } else {
                Array.from(dataTransfer.files).forEach(file => {
                    files.push(file);
                });
            }
            return files;
        },
        hash: {
            md5: (() => {
                /*
                * JavaScript MD5
                * https://github.com/blueimp/JavaScript-MD5
                *
                * Copyright 2011, Sebastian Tschan
                * https://blueimp.net
                *
                * Licensed under the MIT license:
                * https://opensource.org/licenses/MIT
                *
                * Based on
                * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
                * Digest Algorithm, as defined in RFC 1321.
                * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
                * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
                * Distributed under the BSD License
                * See http://pajhome.org.uk/crypt/md5 for more info.
                */
            
                /* global define */
            
                /* eslint-disable strict */
        
                'use strict'
        
                /**
                * Add integers, wrapping at 2^32.
                * This uses 16-bit operations internally to work around bugs in interpreters.
                *
                * @param {number} x First integer
                * @param {number} y Second integer
                * @returns {number} Sum
                */
                function safeAdd(x, y) {
                    var lsw = (x & 0xffff) + (y & 0xffff)
                    var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
                    return (msw << 16) | (lsw & 0xffff)
                }
        
                /**
                * Bitwise rotate a 32-bit number to the left.
                *
                * @param {number} num 32-bit number
                * @param {number} cnt Rotation count
                * @returns {number} Rotated number
                */
                function bitRotateLeft(num, cnt) {
                    return (num << cnt) | (num >>> (32 - cnt))
                }
        
                /**
                * Basic operation the algorithm uses.
                *
                * @param {number} q q
                * @param {number} a a
                * @param {number} b b
                * @param {number} x x
                * @param {number} s s
                * @param {number} t t
                * @returns {number} Result
                */
                function md5cmn(q, a, b, x, s, t) {
                    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
                }
                /**
                * Basic operation the algorithm uses.
                *
                * @param {number} a a
                * @param {number} b b
                * @param {number} c c
                * @param {number} d d
                * @param {number} x x
                * @param {number} s s
                * @param {number} t t
                * @returns {number} Result
                */
                function md5ff(a, b, c, d, x, s, t) {
                    return md5cmn((b & c) | (~b & d), a, b, x, s, t)
                }
                /**
                * Basic operation the algorithm uses.
                *
                * @param {number} a a
                * @param {number} b b
                * @param {number} c c
                * @param {number} d d
                * @param {number} x x
                * @param {number} s s
                * @param {number} t t
                * @returns {number} Result
                */
                function md5gg(a, b, c, d, x, s, t) {
                    return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
                }
                /**
                * Basic operation the algorithm uses.
                *
                * @param {number} a a
                * @param {number} b b
                * @param {number} c c
                * @param {number} d d
                * @param {number} x x
                * @param {number} s s
                * @param {number} t t
                * @returns {number} Result
                */
                function md5hh(a, b, c, d, x, s, t) {
                    return md5cmn(b ^ c ^ d, a, b, x, s, t)
                }
                /**
                * Basic operation the algorithm uses.
                *
                * @param {number} a a
                * @param {number} b b
                * @param {number} c c
                * @param {number} d d
                * @param {number} x x
                * @param {number} s s
                * @param {number} t t
                * @returns {number} Result
                */
                function md5ii(a, b, c, d, x, s, t) {
                    return md5cmn(c ^ (b | ~d), a, b, x, s, t)
                }
        
                /**
                * Calculate the MD5 of an array of little-endian words, and a bit length.
                *
                * @param {Array} x Array of little-endian words
                * @param {number} len Bit length
                * @returns {Array<number>} MD5 Array
                */
                function binlMD5(x, len) {
                    /* append padding */
                    x[len >> 5] |= 0x80 << len % 32
                    x[(((len + 64) >>> 9) << 4) + 14] = len
            
                    var i
                    var olda
                    var oldb
                    var oldc
                    var oldd
                    var a = 1732584193
                    var b = -271733879
                    var c = -1732584194
                    var d = 271733878
            
                    for (i = 0; i < x.length; i += 16) {
                        olda = a
                        oldb = b
                        oldc = c
                        oldd = d
            
                        a = md5ff(a, b, c, d, x[i], 7, -680876936)
                        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
                        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
                        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
                        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
                        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
                        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
                        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
                        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
                        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
                        c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
                        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
                        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
                        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
                        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
                        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)
            
                        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
                        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
                        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
                        b = md5gg(b, c, d, a, x[i], 20, -373897302)
                        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
                        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
                        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
                        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
                        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
                        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
                        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
                        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
                        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
                        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
                        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
                        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)
            
                        a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
                        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
                        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
                        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
                        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
                        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
                        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
                        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
                        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
                        d = md5hh(d, a, b, c, x[i], 11, -358537222)
                        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
                        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
                        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
                        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
                        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
                        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)
            
                        a = md5ii(a, b, c, d, x[i], 6, -198630844)
                        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
                        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
                        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
                        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
                        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
                        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
                        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
                        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
                        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
                        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
                        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
                        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
                        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
                        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
                        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)
            
                        a = safeAdd(a, olda)
                        b = safeAdd(b, oldb)
                        c = safeAdd(c, oldc)
                        d = safeAdd(d, oldd)
                    }
                    return [a, b, c, d]
                }
        
                /**
                * Convert an array of little-endian words to a string
                *
                * @param {Array<number>} input MD5 Array
                * @returns {string} MD5 string
                */
                function binl2rstr(input) {
                    var i
                    var output = ''
                    var length32 = input.length * 32
                    for (i = 0; i < length32; i += 8) {
                        output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
                    }
                    return output
                }
        
                /**
                * Convert a raw string to an array of little-endian words
                * Characters >255 have their high-byte silently ignored.
                *
                * @param {string} input Raw input string
                * @returns {Array<number>} Array of little-endian words
                */
                function rstr2binl(input) {
                    var i
                    var output = []
                    output[(input.length >> 2) - 1] = undefined
                    for (i = 0; i < output.length; i += 1) {
                        output[i] = 0
                    }
                    var length8 = input.length * 8
                    for (i = 0; i < length8; i += 8) {
                        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
                    }
                    return output
                }
        
                /**
                * Calculate the MD5 of a raw string
                *
                * @param {string} s Input string
                * @returns {string} Raw MD5 string
                */
                function rstrMD5(s) {
                    return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
                }
        
                /**
                * Calculates the HMAC-MD5 of a key and some data (raw strings)
                *
                * @param {string} key HMAC key
                * @param {string} data Raw input string
                * @returns {string} Raw MD5 string
                */
                function rstrHMACMD5(key, data) {
                    var i
                    var bkey = rstr2binl(key)
                    var ipad = []
                    var opad = []
                    var hash
                    ipad[15] = opad[15] = undefined
                    if (bkey.length > 16) {
                        bkey = binlMD5(bkey, key.length * 8)
                    }
                    for (i = 0; i < 16; i += 1) {
                        ipad[i] = bkey[i] ^ 0x36363636
                        opad[i] = bkey[i] ^ 0x5c5c5c5c
                    }
                    hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
                    return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
                }
        
                /**
                * Convert a raw string to a hex string
                *
                * @param {string} input Raw input string
                * @returns {string} Hex encoded string
                */
                function rstr2hex(input) {
                    var hexTab = '0123456789abcdef'
                    var output = ''
                    var x
                    var i
                    for (i = 0; i < input.length; i += 1) {
                        x = input.charCodeAt(i)
                        output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
                    }
                    return output
                }
        
                /**
                * Encode a string as UTF-8
                *
                * @param {string} input Input string
                * @returns {string} UTF8 string
                */
                function str2rstrUTF8(input) {
                    return unescape(encodeURIComponent(input))
                }
        
                /**
                * Encodes input string as raw MD5 string
                *
                * @param {string} s Input string
                * @returns {string} Raw MD5 string
                */
                function rawMD5(s) {
                    return rstrMD5(str2rstrUTF8(s))
                }
                /**
                * Encodes input string as Hex encoded string
                *
                * @param {string} s Input string
                * @returns {string} Hex encoded string
                */
                function hexMD5(s) {
                    return rstr2hex(rawMD5(s))
                }
                /**
                * Calculates the raw HMAC-MD5 for the given key and data
                *
                * @param {string} k HMAC key
                * @param {string} d Input string
                * @returns {string} Raw MD5 string
                */
                function rawHMACMD5(k, d) {
                    return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
                }
                /**
                * Calculates the Hex encoded HMAC-MD5 for the given key and data
                *
                * @param {string} k HMAC key
                * @param {string} d Input string
                * @returns {string} Raw MD5 string
                */
                function hexHMACMD5(k, d) {
                    return rstr2hex(rawHMACMD5(k, d))
                }
        
                /**
                * Calculates MD5 value for a given string.
                * If a key is provided, calculates the HMAC-MD5 value.
                * Returns a Hex encoded string unless the raw argument is given.
                *
                * @param {string} string Input string
                * @param {string} [key] HMAC key
                * @param {boolean} [raw] Raw output switch
                * @returns {string} MD5 output
                */
                function md5(string, key, raw) {
                    if (!key) {
                        if (!raw) {
                        return hexMD5(string)
                        }
                        return rawMD5(string)
                    }
                    if (!raw) {
                        return hexHMACMD5(key, string)
                    }
                    return rawHMACMD5(key, string)
                }
        
                // if (typeof define === 'function' && define.amd) {
                //     define(function () {
                //         return md5
                //     })
                // } else if (typeof module === 'object' && module.exports) {
                //     module.exports = md5
                // } else {
                //     that.md5 = md5
                // }
                return md5;
            })(),
            sha1: (() => {
                /**
                *
                *  Secure Hash Algorithm (sha1)
                *  http://www.webtoolkit.info/
                *
                **/
                        
                function sha1 (msg) {
                    function rotate_left(n,s) {
                        var t4 = ( n<<s ) | (n>>>(32-s));
                        return t4;
                    };
                            
                  
                    function lsb_hex(val) {
                        var str="";
                        var i;
                        var vh;
                        var vl;
                  
                        for( i=0; i<=6; i+=2 ) {
                            vh = (val>>>(i*4+4))&0x0f;
                            vl = (val>>>(i*4))&0x0f;
                            str += vh.toString(16) + vl.toString(16);
                        }
                        return str;
                    };
                  
                    function cvt_hex(val) {
                        var str="";
                        var i;
                        var v;
                  
                        for( i=7; i>=0; i-- ) {
                            v = (val>>>(i*4))&0x0f;
                            str += v.toString(16);
                        }
                        return str;
                    };
                  
                    function Utf8Encode(string) {
                        string = string.replace(/\r\n/g,"\n");
                        var utftext = "";
                  
                        for (var n = 0; n < string.length; n++) {
                            var c = string.charCodeAt(n);
                  
                            if (c < 128) {
                                utftext += String.fromCharCode(c);
                            }
                              
                            else if((c > 127) && (c < 2048)) {
                                utftext += String.fromCharCode((c >> 6) | 192);
                                utftext += String.fromCharCode((c & 63) | 128);
                            }
                              
                            else {
                                utftext += String.fromCharCode((c >> 12) | 224);
                                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                utftext += String.fromCharCode((c & 63) | 128);
                                }
                        }
                        return utftext;
                    };
                  
                    var blockstart;
                    var i, j;
                    var W = new Array(80);
                    var H0 = 0x67452301;
                    var H1 = 0xEFCDAB89;
                    var H2 = 0x98BADCFE;
                    var H3 = 0x10325476;
                    var H4 = 0xC3D2E1F0;
                    var A, B, C, D, E;
                    var temp;
                      
                    msg = Utf8Encode(msg);
            
                    var msg_len = msg.length;
                    var word_array = new Array();
                      
                    for( i=0; i<msg_len-3; i+=4 ) {
                        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
                        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
                        word_array.push( j );
                    }
            
                    switch( msg_len % 4 ) {
                        case 0:
                            i = 0x080000000;
                        break;
                        case 1:
                            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
                        break;
                        case 2:
                            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
                        break;
                        case 3:
                            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
                        break;
                    }
                    word_array.push( i );
                    while( (word_array.length % 16) != 14 ) word_array.push( 0 );
                    word_array.push( msg_len>>>29 );
                    word_array.push( (msg_len<<3)&0x0ffffffff );
                  
                    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
                        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
                        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
                          
                        A = H0;
                        B = H1;
                        C = H2;
                        D = H3;
                        E = H4;
                          
                        for( i= 0; i<=19; i++ ) {
                            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
                            E = D;
                            D = C;
                            C = rotate_left(B,30);
                            B = A;
                            A = temp;
                        }
                        for( i=20; i<=39; i++ ) {
                            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
                            E = D;
                            D = C;
                            C = rotate_left(B,30);
                            B = A;
                            A = temp;
                        }
                        for( i=40; i<=59; i++ ) {
                            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
                            E = D;
                            D = C;
                            C = rotate_left(B,30);
                            B = A;
                            A = temp;
                        }
                        for( i=60; i<=79; i++ ) {
                            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
                            E = D;
                            D = C;
                            C = rotate_left(B,30);
                            B = A;
                            A = temp;
                        }
                  
                        H0 = (H0 + A) & 0x0ffffffff;
                        H1 = (H1 + B) & 0x0ffffffff;
                        H2 = (H2 + C) & 0x0ffffffff;
                        H3 = (H3 + D) & 0x0ffffffff;
                        H4 = (H4 + E) & 0x0ffffffff;
                    }
            
                    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
                    return temp.toLowerCase();
                }
                return sha1;
            })(),
            sha256: (() => {
                /**
                * Secure Hash Algorithm (SHA256)
                * http://www.webtoolkit.info/
                * Original code by Angel Marin, Paul Johnston
                **/
            
                function sha256(s){
                    var chrsz = 8;
                    var hexcase = 0;
            
                    function safe_add (x, y) {
                    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
                    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                    return (msw << 16) | (lsw & 0xFFFF);
                    }
            
                    function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
                    function R (X, n) { return ( X >>> n ); }
                    function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
                    function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
                    function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
                    function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
                    function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
                    function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
            
                    function core_sha256 (m, l) {
                        var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
                        var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
                        var W = new Array(64);
                        var a, b, c, d, e, f, g, h, i, j;
                        var T1, T2;
                
                        m[l >> 5] |= 0x80 << (24 - l % 32);
                        m[((l + 64 >> 9) << 4) + 15] = l;
                
                        for ( var i = 0; i<m.length; i+=16 ) {
                            a = HASH[0];
                            b = HASH[1];
                            c = HASH[2];
                            d = HASH[3];
                            e = HASH[4];
                            f = HASH[5];
                            g = HASH[6];
                            h = HASH[7];
                
                            for ( var j = 0; j<64; j++) {
                            if (j < 16) W[j] = m[j + i];
                            else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
                
                            T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                            T2 = safe_add(Sigma0256(a), Maj(a, b, c));
                
                            h = g;
                            g = f;
                            f = e;
                            e = safe_add(d, T1);
                            d = c;
                            c = b;
                            b = a;
                            a = safe_add(T1, T2);
                            }
                
                            HASH[0] = safe_add(a, HASH[0]);
                            HASH[1] = safe_add(b, HASH[1]);
                            HASH[2] = safe_add(c, HASH[2]);
                            HASH[3] = safe_add(d, HASH[3]);
                            HASH[4] = safe_add(e, HASH[4]);
                            HASH[5] = safe_add(f, HASH[5]);
                            HASH[6] = safe_add(g, HASH[6]);
                            HASH[7] = safe_add(h, HASH[7]);
                        }
                        return HASH;
                    }
            
                    function str2binb (str) {
                        var bin = Array();
                        var mask = (1 << chrsz) - 1;
                        for(var i = 0; i < str.length * chrsz; i += chrsz) {
                            bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
                        }
                        return bin;
                    }
            
                    function Utf8Encode(string) {
                        string = string.replace(/\r\n/g,'\n');
                        var utftext = '';
                
                        for (var n = 0; n < string.length; n++) {
                
                            var c = string.charCodeAt(n);
                
                            if (c < 128) {
                            utftext += String.fromCharCode(c);
                            }
                            else if((c > 127) && (c < 2048)) {
                            utftext += String.fromCharCode((c >> 6) | 192);
                            utftext += String.fromCharCode((c & 63) | 128);
                            }
                            else {
                            utftext += String.fromCharCode((c >> 12) | 224);
                            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                            utftext += String.fromCharCode((c & 63) | 128);
                            }
                        }
                        return utftext;
                    }
            
                    function binb2hex (binarray) {
                        var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
                        var str = '';
                        for(var i = 0; i < binarray.length * 4; i++) {
                            str += hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8+4)) & 0xF) +
                            hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4)*8 )) & 0xF);
                        }
                        return str;
                    }
            
                    s = Utf8Encode(s);
                    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
                }
                return sha256;
            })(),
            sha512: (() => {
                /*
                * Secure Hash Algorithm (sha512)
                * http://www.happycode.info/
                */
            
                function sha512(str) {
                    function int64(msint_32, lsint_32) {
                        this.highOrder = msint_32;
                        this.lowOrder = lsint_32;
                    }
            
                    var H = [new int64(0x6a09e667, 0xf3bcc908), new int64(0xbb67ae85, 0x84caa73b),
                    new int64(0x3c6ef372, 0xfe94f82b), new int64(0xa54ff53a, 0x5f1d36f1),
                    new int64(0x510e527f, 0xade682d1), new int64(0x9b05688c, 0x2b3e6c1f),
                    new int64(0x1f83d9ab, 0xfb41bd6b), new int64(0x5be0cd19, 0x137e2179)];
            
                    var K = [new int64(0x428a2f98, 0xd728ae22), new int64(0x71374491, 0x23ef65cd),
                    new int64(0xb5c0fbcf, 0xec4d3b2f), new int64(0xe9b5dba5, 0x8189dbbc),
                    new int64(0x3956c25b, 0xf348b538), new int64(0x59f111f1, 0xb605d019),
                    new int64(0x923f82a4, 0xaf194f9b), new int64(0xab1c5ed5, 0xda6d8118),
                    new int64(0xd807aa98, 0xa3030242), new int64(0x12835b01, 0x45706fbe),
                    new int64(0x243185be, 0x4ee4b28c), new int64(0x550c7dc3, 0xd5ffb4e2),
                    new int64(0x72be5d74, 0xf27b896f), new int64(0x80deb1fe, 0x3b1696b1),
                    new int64(0x9bdc06a7, 0x25c71235), new int64(0xc19bf174, 0xcf692694),
                    new int64(0xe49b69c1, 0x9ef14ad2), new int64(0xefbe4786, 0x384f25e3),
                    new int64(0x0fc19dc6, 0x8b8cd5b5), new int64(0x240ca1cc, 0x77ac9c65),
                    new int64(0x2de92c6f, 0x592b0275), new int64(0x4a7484aa, 0x6ea6e483),
                    new int64(0x5cb0a9dc, 0xbd41fbd4), new int64(0x76f988da, 0x831153b5),
                    new int64(0x983e5152, 0xee66dfab), new int64(0xa831c66d, 0x2db43210),
                    new int64(0xb00327c8, 0x98fb213f), new int64(0xbf597fc7, 0xbeef0ee4),
                    new int64(0xc6e00bf3, 0x3da88fc2), new int64(0xd5a79147, 0x930aa725),
                    new int64(0x06ca6351, 0xe003826f), new int64(0x14292967, 0x0a0e6e70),
                    new int64(0x27b70a85, 0x46d22ffc), new int64(0x2e1b2138, 0x5c26c926),
                    new int64(0x4d2c6dfc, 0x5ac42aed), new int64(0x53380d13, 0x9d95b3df),
                    new int64(0x650a7354, 0x8baf63de), new int64(0x766a0abb, 0x3c77b2a8),
                    new int64(0x81c2c92e, 0x47edaee6), new int64(0x92722c85, 0x1482353b),
                    new int64(0xa2bfe8a1, 0x4cf10364), new int64(0xa81a664b, 0xbc423001),
                    new int64(0xc24b8b70, 0xd0f89791), new int64(0xc76c51a3, 0x0654be30),
                    new int64(0xd192e819, 0xd6ef5218), new int64(0xd6990624, 0x5565a910),
                    new int64(0xf40e3585, 0x5771202a), new int64(0x106aa070, 0x32bbd1b8),
                    new int64(0x19a4c116, 0xb8d2d0c8), new int64(0x1e376c08, 0x5141ab53),
                    new int64(0x2748774c, 0xdf8eeb99), new int64(0x34b0bcb5, 0xe19b48a8),
                    new int64(0x391c0cb3, 0xc5c95a63), new int64(0x4ed8aa4a, 0xe3418acb),
                    new int64(0x5b9cca4f, 0x7763e373), new int64(0x682e6ff3, 0xd6b2b8a3),
                    new int64(0x748f82ee, 0x5defb2fc), new int64(0x78a5636f, 0x43172f60),
                    new int64(0x84c87814, 0xa1f0ab72), new int64(0x8cc70208, 0x1a6439ec),
                    new int64(0x90befffa, 0x23631e28), new int64(0xa4506ceb, 0xde82bde9),
                    new int64(0xbef9a3f7, 0xb2c67915), new int64(0xc67178f2, 0xe372532b),
                    new int64(0xca273ece, 0xea26619c), new int64(0xd186b8c7, 0x21c0c207),
                    new int64(0xeada7dd6, 0xcde0eb1e), new int64(0xf57d4f7f, 0xee6ed178),
                    new int64(0x06f067aa, 0x72176fba), new int64(0x0a637dc5, 0xa2c898a6),
                    new int64(0x113f9804, 0xbef90dae), new int64(0x1b710b35, 0x131c471b),
                    new int64(0x28db77f5, 0x23047d84), new int64(0x32caab7b, 0x40c72493),
                    new int64(0x3c9ebe0a, 0x15c9bebc), new int64(0x431d67c4, 0x9c100d4c),
                    new int64(0x4cc5d4be, 0xcb3e42b6), new int64(0x597f299c, 0xfc657e2a),
                    new int64(0x5fcb6fab, 0x3ad6faec), new int64(0x6c44198c, 0x4a475817)];
            
                    var W = new Array(64);
                    var a, b, c, d, e, f, g, h, i, j;
                    var T1, T2;
                    var charsize = 8;
            
                    function utf8_encode(str) {
                        return unescape(encodeURIComponent(str));
                    }
            
                    function str2binb(str) {
                        var bin = [];
                        var mask = (1 << charsize) - 1;
                        var len = str.length * charsize;
                
                        for (var i = 0; i < len; i += charsize) {
                            bin[i >> 5] |= (str.charCodeAt(i / charsize) & mask) << (32 - charsize - (i % 32));
                        }
                
                        return bin;
                    }
            
                    function binb2hex(binarray) {
                        var hex_tab = '0123456789abcdef';
                        var str = '';
                        var length = binarray.length * 4;
                        var srcByte;
                
                        for (var i = 0; i < length; i += 1) {
                            srcByte = binarray[i >> 2] >> ((3 - (i % 4)) * 8);
                            str += hex_tab.charAt((srcByte >> 4) & 0xF) + hex_tab.charAt(srcByte & 0xF);
                        }
                
                        return str;
                    }
            
                    function safe_add_2(x, y) {
                        var lsw, msw, lowOrder, highOrder;
                
                        lsw = (x.lowOrder & 0xFFFF) + (y.lowOrder & 0xFFFF);
                        msw = (x.lowOrder >>> 16) + (y.lowOrder >>> 16) + (lsw >>> 16);
                        lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        lsw = (x.highOrder & 0xFFFF) + (y.highOrder & 0xFFFF) + (msw >>> 16);
                        msw = (x.highOrder >>> 16) + (y.highOrder >>> 16) + (lsw >>> 16);
                        highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        return new int64(highOrder, lowOrder);
                    }
            
                    function safe_add_4(a, b, c, d) {
                        var lsw, msw, lowOrder, highOrder;
                
                        lsw = (a.lowOrder & 0xFFFF) + (b.lowOrder & 0xFFFF) + (c.lowOrder & 0xFFFF) + (d.lowOrder & 0xFFFF);
                        msw = (a.lowOrder >>> 16) + (b.lowOrder >>> 16) + (c.lowOrder >>> 16) + (d.lowOrder >>> 16) + (lsw >>> 16);
                        lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        lsw = (a.highOrder & 0xFFFF) + (b.highOrder & 0xFFFF) + (c.highOrder & 0xFFFF) + (d.highOrder & 0xFFFF) + (msw >>> 16);
                        msw = (a.highOrder >>> 16) + (b.highOrder >>> 16) + (c.highOrder >>> 16) + (d.highOrder >>> 16) + (lsw >>> 16);
                        highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        return new int64(highOrder, lowOrder);
                    }
            
                    function safe_add_5(a, b, c, d, e) {
                        var lsw, msw, lowOrder, highOrder;
                
                        lsw = (a.lowOrder & 0xFFFF) + (b.lowOrder & 0xFFFF) + (c.lowOrder & 0xFFFF) + (d.lowOrder & 0xFFFF) + (e.lowOrder & 0xFFFF);
                        msw = (a.lowOrder >>> 16) + (b.lowOrder >>> 16) + (c.lowOrder >>> 16) + (d.lowOrder >>> 16) + (e.lowOrder >>> 16) + (lsw >>> 16);
                        lowOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        lsw = (a.highOrder & 0xFFFF) + (b.highOrder & 0xFFFF) + (c.highOrder & 0xFFFF) + (d.highOrder & 0xFFFF) + (e.highOrder & 0xFFFF) + (msw >>> 16);
                        msw = (a.highOrder >>> 16) + (b.highOrder >>> 16) + (c.highOrder >>> 16) + (d.highOrder >>> 16) + (e.highOrder >>> 16) + (lsw >>> 16);
                        highOrder = ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
                
                        return new int64(highOrder, lowOrder);
                    }
            
                    function maj(x, y, z) {
                        return new int64(
                            (x.highOrder & y.highOrder) ^ (x.highOrder & z.highOrder) ^ (y.highOrder & z.highOrder),
                            (x.lowOrder & y.lowOrder) ^ (x.lowOrder & z.lowOrder) ^ (y.lowOrder & z.lowOrder)
                        );
                    }
            
                    function ch(x, y, z) {
                        return new int64(
                            (x.highOrder & y.highOrder) ^ (~x.highOrder & z.highOrder),
                            (x.lowOrder & y.lowOrder) ^ (~x.lowOrder & z.lowOrder)
                        );
                    }
            
                    function rotr(x, n) {
                        if (n <= 32) {
                            return new int64(
                            (x.highOrder >>> n) | (x.lowOrder << (32 - n)),
                            (x.lowOrder >>> n) | (x.highOrder << (32 - n))
                            );
                        } else {
                            return new int64(
                            (x.lowOrder >>> n) | (x.highOrder << (32 - n)),
                            (x.highOrder >>> n) | (x.lowOrder << (32 - n))
                            );
                        }
                    }
            
                    function sigma0(x) {
                        var rotr28 = rotr(x, 28);
                        var rotr34 = rotr(x, 34);
                        var rotr39 = rotr(x, 39);
                
                        return new int64(
                            rotr28.highOrder ^ rotr34.highOrder ^ rotr39.highOrder,
                            rotr28.lowOrder ^ rotr34.lowOrder ^ rotr39.lowOrder
                        );
                    }
            
                    function sigma1(x) {
                        var rotr14 = rotr(x, 14);
                        var rotr18 = rotr(x, 18);
                        var rotr41 = rotr(x, 41);
                
                        return new int64(
                            rotr14.highOrder ^ rotr18.highOrder ^ rotr41.highOrder,
                            rotr14.lowOrder ^ rotr18.lowOrder ^ rotr41.lowOrder
                        );
                    }
            
                    function gamma0(x) {
                        var rotr1 = rotr(x, 1), rotr8 = rotr(x, 8), shr7 = shr(x, 7);
                
                        return new int64(
                            rotr1.highOrder ^ rotr8.highOrder ^ shr7.highOrder,
                            rotr1.lowOrder ^ rotr8.lowOrder ^ shr7.lowOrder
                        );
                    }
            
                    function gamma1(x) {
                        var rotr19 = rotr(x, 19);
                        var rotr61 = rotr(x, 61);
                        var shr6 = shr(x, 6);
                
                        return new int64(
                            rotr19.highOrder ^ rotr61.highOrder ^ shr6.highOrder,
                            rotr19.lowOrder ^ rotr61.lowOrder ^ shr6.lowOrder
                        );
                    }
            
                    function shr(x, n) {
                        if (n <= 32) {
                            return new int64(
                            x.highOrder >>> n,
                            x.lowOrder >>> n | (x.highOrder << (32 - n))
                            );
                        } else {
                            return new int64(
                            0,
                            x.highOrder << (32 - n)
                            );
                        }
                    }
            
                    str = utf8_encode(str);
                    strlen = str.length*charsize;
                    str = str2binb(str);
            
                    str[strlen >> 5] |= 0x80 << (24 - strlen % 32);
                    str[(((strlen + 128) >> 10) << 5) + 31] = strlen;
            
                    for (var i = 0; i < str.length; i += 32) {
                        a = H[0];
                        b = H[1];
                        c = H[2];
                        d = H[3];
                        e = H[4];
                        f = H[5];
                        g = H[6];
                        h = H[7];
                
                        for (var j = 0; j < 80; j++) {
                            if (j < 16) {
                                W[j] = new int64(str[j*2 + i], str[j*2 + i + 1]);
                            } else {
                                W[j] = safe_add_4(gamma1(W[j - 2]), W[j - 7], gamma0(W[j - 15]), W[j - 16]);
                            }
                
                            T1 = safe_add_5(h, sigma1(e), ch(e, f, g), K[j], W[j]);
                            T2 = safe_add_2(sigma0(a), maj(a, b, c));
                            h = g;
                            g = f;
                            f = e;
                            e = safe_add_2(d, T1);
                            d = c;
                            c = b;
                            b = a;
                            a = safe_add_2(T1, T2);
                        }
                
                        H[0] = safe_add_2(a, H[0]);
                        H[1] = safe_add_2(b, H[1]);
                        H[2] = safe_add_2(c, H[2]);
                        H[3] = safe_add_2(d, H[3]);
                        H[4] = safe_add_2(e, H[4]);
                        H[5] = safe_add_2(f, H[5]);
                        H[6] = safe_add_2(g, H[6]);
                        H[7] = safe_add_2(h, H[7]);
                    }
            
                    var binarray = [];
                    for (var i = 0; i < H.length; i++) {
                        binarray.push(H[i].highOrder);
                        binarray.push(H[i].lowOrder);
                    }
                    return binb2hex(binarray);
                }
                return sha512;
            })()
        },
        isInArray:                  function (list) {
            aa.arg.test(list, aa.isArray, `'list'`);

            return function (item) {
                return list.has(item);
            };
        },
        // makeSetter:                 function (Instancer) {},
        mapFactory:                 function () {
            const map = new WeakMap();
            const id = aa.uid();
            const methods = {
                /**
                 * @param {any} that;
                 * @param {any} key;
                 *
                 * @return {any}
                 */
                get: function (that, key) {
                    aa.arg.test(key, aa.nonEmptyString, `'key'`);

                    const data = map.get(that, "data");
                    if (!data) {
                        return undefined;
                    }
                    return data[key];
                },

                /**
                 * @param {any} that;
                 *
                 * @return {function}
                 */
                getter: function (that) {
                    /**
                     * @param {any} key;
                     *
                     * @return {any}
                     */
                    return function (key) {
                        aa.arg.test(key, aa.nonEmptyString, `'key'`);

                        const data = map.get(that, "data");
                        if (!data) {
                            return undefined;
                        }
                        return data[key];
                    };
                },

                /**
                 * @param {any} that;
                 * @param {string} key;
                 * @param {any} value;
                 *
                 * @return {void}
                 */
                set: function (that, key, value) {
                    aa.arg.test(key, aa.nonEmptyString, `'key'`);

                    let data = map.get(that, "data");
                    if (!data) {
                        data = {};
                    }
                    data[key] = value;
                    map.set(that, data);
                },

                /**
                 * @param {any} that;
                 *
                 * @return {function}
                 */
                setter: function (that) {
                    /**
                     * @param {string} key;
                     * @param {any} value;
                     *
                     * @return {any}
                     */
                    return function (key, value) {
                        aa.arg.test(key, aa.nonEmptyString, `'key'`);

                        const data = map.get(that, "data") || {};
                        data[key] = value;
                        map.set(that, data);
                    };
                },
            };
            Object.keys(methods).forEach(key => {
                Object.defineProperties(methods[key], {
                    id: {
                        get: () => id
                    }
                });
            });
            return Object.freeze(methods);
        },
        throwErrorIf:               function (condition /*, message, ErrorClass */) {
            aa.arg.test(condition, aa.isBool, `'condition'`);
            const message = aa.arg.optional(arguments, 1, undefined, aa.nonEmptyString);
            const ErrorClass = aa.arg.optional(arguments, 2, Error);
        
            if (condition) {
                throw new ErrorClass(message);
            }
        },
    }, {force: true});
    aa.deploy(aa, {
        uid:                        (function () {
            let x = 0;
            return function (length=null /*, spec={} */) {
                const spec = aa.arg.optional(arguments, 1, {}, aa.verifyObject({
                    hex: aa.isBool
                }));
                // Options:
                if (!spec.hasOwnProperty('hex')) { spec.hex = false; }

                let uid = '';

                if (length === null) {
                    let i;
                    let prefix = '';
                    let now = Date.now().toString(16)+x.toString(16);

                    for (i=0; i<32-now.length; i++) {
                        prefix += Math.floor(16*Math.random()).toString(16);
                    }
                    now = prefix+now;
                    const p = now.match(/^.*([0-9a-f]{8})([0-9a-f]{4})([0-9a-f]{3})([0-9a-f]{4})([0-9a-f]{12})$/);
                    uid = p[1]+'-'+p[2]+'-4'+p[3]+'-'+p[4]+'-'+p[5];

                    x++;
                } else {
                    aa.arg.test(length, aa.isStrictlyPositiveInt, "'length'");

                    let chars = '0123456789abcdef';
                    if (!spec.hex) { chars += 'ghijklmnopqrstuvwxyz'; }

                    for (let i=0; i<length; i++) {
                        const index = Math.floor(chars.length*Math.random());
                        const char = chars[index];
                        uid += char;
                    }
                }
                return uid;
            };
        })(),
        uuidv4:                     function () {
            /**
             * Found at https://stackoverflow.com/a/8809472
             */
            aa.deprecated("aa.uuidv4");
            var dt = new Date().getTime();
            var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = (dt + Math.random()*16)%16 | 0;
                dt = Math.floor(dt/16);
                return (c=='x' ? r :(r&0x3|0x8)).toString(16);
            });
            return uuid;
        },
    }, {force: true});
    aa.deploy(aa, {
        event: (() => {
            const id = aa.uid();
            return {
                getEmitter:     function (accessor /*, key, spec */) {
                    /**
                     *  Usage:
                     *      const emit = getEmitter(get, "listeners");
                     *      const emit = getEmitter({get}, "listeners");
                     *      const emit = getEmitter({get, set}, "listeners");
                     * 
                     * @param {function|object} accessor
                     * @param {string} key (optional)
                     * @param {object} spec (optional)
                     * 
                     * @return {function}
                     */
                    aa.arg.test(accessor, arg => (aa.isFunction(arg) || aa.verifyObject({
                        get: aa.isFunction,
                        set: aa.isFunction,
                    })(arg)), `'accessor'`);
                    const key = aa.arg.optional(arguments, 1, `listeners-${id}`, aa.nonEmptyString);
                    const spec = aa.arg.optional(arguments, 2, {}, aa.verifyObject(aa.event.specs));

                    if (aa.isObject(accessor)) {
                        accessor.sprinkle({get, set});
                    }
                    const getter = aa.isFunction(accessor) ? accessor : accessor.get;
                    const setter = aa.isObject(accessor) ? accessor.set : set;

                    return function emit (eventName, data) {
                        /**
                         *  Usage:
                         *      emit.call(this, "eventname", data);
                         * 
                         * @param {string} eventName
                         * @param {any} data
                         * 
                         * @return {void}
                         */
                        aa.arg.test(eventName, aa.nonEmptyString, `'eventName'`);
                        let listeners = getter(this, key);
                        if (listeners === undefined) {
                            setter(this, key, {});
                            listeners = getter(this, key);
                        }
                        aa.arg.test(listeners, aa.isObject, `'listeners'`);

                        eventName = eventName.trim();
                        if (listeners.hasOwnProperty(eventName)) {
                            listeners[eventName].forEach(callback => {
                                const event = null; // A future event, some day...
                                callback(event, data, this);
                            });
                        }
                    };
                },
                getListener:    function (accessor /*, key, spec */) {
                    /**
                     * Usage:
                     *      MyClass.prototype.on = getListener(get, "listeners");
                     *      MyClass.prototype.on = getListener({get}, "listeners");
                     *      MyClass.prototype.on = getListener({get, set}, "listeners");
                     * 
                     * @param {function|object} accessor (if accessor is a function, accessor defines the getter; else if accessor is an object)
                     * @param {string} key (optional)
                     * @param {object} spec (optional)
                     * 
                     * @return {function}
                     */
                    aa.arg.test(accessor, arg => (aa.isFunction(arg) || aa.verifyObject({
                        get: aa.isFunction,
                        set: aa.isFunction,
                    })(arg)), `'accessor'`);
                    const key = aa.arg.optional(arguments, 1, `listeners-${id}`, aa.nonEmptyString);
                    const spec = aa.arg.optional(arguments, 2, {}, aa.verifyObject(aa.event.specs));

                    if (aa.isObject(accessor)) {
                        accessor.sprinkle({get, set});
                    }
                    const getter = aa.isFunction(accessor) ? accessor : accessor.get;
                    const setter = aa.isObject(accessor) ? accessor.set : set;

                    const on = function (eventName, callback) {
                        /**
                         *  Usage:
                         *      this.on("eventname", (data) => {
                         *          // do stuff with data...
                         *      }));
                         *  or
                         *      this.on({
                         *          eventname: data => {
                         *              // do stuff with data...
                         *          }
                         *      });
                         * 
                         * @param {string} eventName
                         * @param {function} callback
                         * 
                         * @return {object} this, for chaining
                         */

                        // If an object is given, re-call on each entry:
                        if (aa.isObject(eventName)) {
                            aa.arg.test(eventName, aa.isObjectOfFunctions, `'eventName'`);
                            eventName.forEach((callback, name) => {
                                on.call(this, name, callback);
                            });
                            return this;
                        }

                        // Call once:
                        let listeners = getter(this, key);
                        if (listeners === undefined) {
                            setter(this, key, {});
                            listeners = getter(this, key);
                        }
                        aa.arg.test(listeners, aa.isObject, `'listeners'`);
                        aa.arg.test(eventName, aa.nonEmptyString, `'eventName'`);
                        aa.arg.test(callback, aa.isFunction, `'callback'`);

                        eventName = eventName.trim();
                        if (!listeners.hasOwnProperty(eventName)) {
                            listeners[eventName] = [];
                        }
                        listeners[eventName].push(callback);
                        return this;
                    };
                    return on;
                },
                specs: {
                    verbose: value => typeof value === "boolean"
                }
            };
        })(),
        debounce:   function (callback, delay=20) {
            /**
             * @param {Function} callback
             * @param {Integer} delay=20
             *
             * @return {void}
             */
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
            if (!aa.isNumber(delay) || delay < 0) { throw new TypeError("Second argument must be an Integer greater than 0."); }

            let timer;
            return Object.freeze(function () {
                const that = this;
                const args = arguments;

                window.clearTimeout(timer);
                timer = window.setTimeout(()=>{
                    callback.apply(that, args);
                }, delay);
            });
        },
        throttle:   function (callback, spec={}) {
            /**
             * @param {Function} callback
             * @param {Object|Int} spec={delay: 20, end: true, start: true} (optional) If Integer is given: assign value to spec.delay
             *
             * @return {void}
             */
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
            if (!aa.isObject(spec) && !aa.isInt(spec)) { throw new TypeError("Second argument must be an Object or a positive Integer."); }
            if (aa.isInt(spec)) {
                spec = { delay: spec };
            }
            spec.sprinkle({
                delay: 20,
                end: true,
                start: true
            });
            aa.arg.test(spec, aa.verifyObject({
                delay: (n)=>{ return aa.isInt(n) && n >= 0; },
                end: aa.isBool,
                start: aa.isBool
            }), `'spec'`);

            let timer;
            let last;
            return function () {
                const that = this;
                const args = arguments;

                const now = Date.now();
                if (!last || now > last+spec.delay) {
                    if (!last && spec.start) {
                        callback.apply(that, args);
                    }
                    window.clearTimeout(timer);
                    timer = window.setTimeout(()=>{
                        callback.apply(that, args);
                        last = null;
                    }, spec.delay);
                    last = now;
                }
            };
        },
        wait:       function (delay, callback) {
            aa.arg.test(delay, aa.isStrictlyPositiveInt, `'delay'`);
            aa.arg.test(callback, aa.isFunction, `'callback'`);

            window.setTimeout(callback, delay);
        },
    }, {force: true});

    // NUMBER functions:
    aa.deploy(Number, {
        isInteger:      function(p) {
            return (
                typeof p === 'number'
                && isFinite(p)
                && Math.floor(p) === p
            );
        },
        randomRange:    function (min, max) {
            return Math.floor(Math.random() * (1+max - min) + min);
        },
        toOrdinal:      function (num) {
            aa.arg.test(num, aa.isNumber);
            num += '';
            const lastChar = parseInt(num[num.length-1]);
            const ordinals = [
                'st',
                'nd',
                'rd'
            ]
            return `${num}${ordinals[lastChar - 1] || 'th'}`;
        }
    });
    aa.deploy(Number.prototype, {
        /**
         * Return the minimum or maximum of the given boundaries if the actual Number is out of range.
         * 
         * @param {number} min
         * @param {number} max
         * 
         * @return {number}
         */
        bound:          function (min, max) {
            aa.arg.test(min, aa.isNumber, "'min'");
            aa.arg.test(max, aa.isNumber, "'max'");

            const value = this+0;
            return (value < min ?
                min
                : (value > max ?
                    max
                    : value
                )
            );
        },
        normalize:      function (origRange, destRange) {
            const value = this+0;
            const min = origRange[0];
            const max = origRange[1];
            const variation = (destRange[1] - destRange[0]) / (max - min);
            return (destRange[0] + ((value - min) * variation));
        },
        between:        function (min, max /*, strict */) {
            /**
             * @param {Number} min
             * @param {Number} max
             * @param {Boolean} s=false (strict)
             */

            const strict = aa.arg.optional(arguments, 2, false, aa.isBool);
            return (strict ?
                (this > min && this < max)
                : (this >= min && this <= max)
            );
        },
        pow:            function (param){
            return Math.pow(this,param);
        },
        sign:           function (){
            /**
             * return +1 or -1
             */
            return this>=0 ? 1 : -1;
        }
    });

    // STRING functions:
    aa.deploy(String.prototype, {
        aaReplace:              function (regex,value) {
            if (aa.isObject(regex) && regex.constructor && regex.constructor.name === 'RegExp') {
                var res = this.match(regex);
                if (res) {
                    console.log(res);
                }
            }
            return this.toString();
        },
        base64Encode:           function (){
            return window.btoa(unescape(encodeURIComponent(this.valueOf())));
        },
        base64Decode:           function (){
            return decodeURIComponent(escape(window.atob(this.valueOf())));
        },
        compare:                function (str) {
            if (!aa.isString(str)) { throw new TypeError("Argument must be a String."); }

            const that = this.toString()+'';
            const o = {
                start: null
            };
            const len = (
                that.length < str.length
                ? that.length
                : str.length
            );
            let c, i;

            for(i=0; i<len; i++) {
                const c = that[i];
                if (c === str[i]) {
                    if (o.start === null) {
                        o.start = '';
                    }
                    o.start += c;
                } else {
                    i = len;
                }
            }
            return o;
        },
        relativeFromAbsolute:   function (){
            let that = this+'';
            return that;
        },
        firstToLower:           function (){
        
            return this.charAt(0).toLowerCase() + this.slice(1);
        },
        firstToUpper:           function (){
        
            return this.charAt(0).toUpperCase() + this.slice(1);
        },
        getBasename:            function () {
            const parts = this.getFilename().split('.');
            if (parts.length > 1) {
                parts.pop();
            }
            return parts.join('.');
        },
        getDirname:             function () {
            const str = new String(this).replace(/\/+$/, '');
            const parts = str.split('/');
            if (parts.length > 1) {
                parts.pop();
            }
            return parts.join('/');
        },
        getFilename:            function () {
            const str = this.toString();
            const parts = str.split('/');
            if (parts && parts.length) {
                return parts[parts.length-1];
            }
            return str;
        },
        getExtension:           function () {
            const parts = this.toString().split('.');
            if (parts && parts.length >= 2) {
                return parts[parts.length-1];
            }
            return null;
        },
        htmlEncode:             function () {
            return this.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
               return "&#"+i.charCodeAt(0)+';';
            });
            var i = this.length,
                aRet = [];

            while(i--) {
                var iC = this[i].charCodeAt();
                if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
                    aRet[i] = '&#'+iC+';';
                } else {
                    aRet[i] = this[i];
                }
            }
            return aRet.join('');    
        },
        encodeForDOM:           function () {
            return this
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            ;
        },
        isEqual:                function (str) {
            if (!aa.isString(str)) { throw new TypeError("Argument must be a String."); }

            if (str.length !== this.length) {
                return false;
            }

            const dismatch = this.find((c, i)=>{
                return c !== str[i];
            });
            return (dismatch === undefined);
        },
        minimize:               function (max) {
            /**
             * @param {int} max
             *
             * @return {string}
             */
            if (!aa.isInt(max)) { throw new TypeError("Argument must be an Integer."); }

            const src = this.toString();
            const sep = "...";
            const ext = src.getExtension();
            let basename;
            if (ext) {
                basename = src.getBasename();
            } else {
                basename = src;
            }
            if (basename.length > max) {
                const begin  = basename.filter((c, i)=>{ return (0 <= i && i <= (max/2)); }).trim();
                const end = basename.filter((c, i)=>{ return ((basename.length-(max/2)+sep.length) <= i && i <= basename.length); }).trim();
                basename = begin+sep+end;
            }
            return basename+(ext ? '.'+ext : '');
        },
        noAccent:               function (){
            var str = this.toString();
            ({
                A: "ÀÁÂÃÄÅĀ",
                C: "Ç",
                E: "ÈÉÊËĒ",
                I: "ÌÍÎÏĪ",
                N: "Ñ",
                O: "ÒÓÔÕÖŐŌ",
                U: "ÙÚÛÜŰŪ",
                Y: "Ý",

                a: "àáâãäåā",
                c: "ç",
                e: "èéêëē",
                i: "ìíîïī",
                n: "ñ",
                o: "ðòóôõöőō",
                u: "ùúûüűū",
                Y: "Ý",
                y: "ýÿ"
            }).forEach((accents, base)=>{
                str = str.replace(new RegExp("["+accents+"]", "g"), base);
            });
            return str;
        },
        padEnd:                 function (pad) {
            var that = this.toString();
            var str = ' ';
            
            if (aa.isInt(pad) && pad >= 0) {
            } else {
                throw new TypeError('First argument must a number.');
            }
            if (arguments && arguments.length > 1) {
                if (aa.isNumber(arguments[1]) || (aa.isString(arguments[1]) && arguments[1].trim())) {
                    str = ''+arguments[1];
                } else {
                    throw new TypeError('Invalid second argument.');
                }
            }
            if (that.length >= pad) {
                return that
            }
            while(that.length < pad) {
                that += str;
            }
            return that.substr(0,pad);
        },
        padStart:               function (pad) {
            var that = this.toString();
            var str = ' ';
            
            if (aa.isInt(pad) && pad >= 0) {
            } else {
                throw new TypeError('First argument must a number.');
            }
            if (arguments && arguments.length > 1) {
                if (aa.isNumber(arguments[1]) || (aa.isString(arguments[1]) && arguments[1].trim())) {
                    str = ''+arguments[1];
                } else {
                    throw new TypeError('Invalid second argument.');
                }
            }
            if (that.length >= pad) {
                return that
            }
            while(that.length < pad) {
                that = str+that;
            }
            return that.substr(0,pad);
        },
        reverse:                function () {
            let str = '';
            if (this.length > 0) {
                for (let i=this.length-1; i>-1; i--) {
                    str += this[i];
                }
            }
            return str;
        },
        /**
         * Explode it into an Array. Every character other than [a-zA-Z0-9] characters are rejected.
         * @return {String[]}
         */
        splitFromCasing:      function () {
            let currentWord = '';
            const words = [];
            this.forEach(char => {
                if (!char.match(/[a-z0-9]/)) {
                    if (currentWord.length) {
                        words.push(currentWord);
                        currentWord = '';
                    }
                }
                if (char.match(/[a-zA-Z0-9]/)) {
                    currentWord += char;
                }
            });
            if (currentWord.length) {
                words.push(currentWord);
            }
            return words;
        },
        /**
         * Return a variableNameLike String in camel case.
         * 
         * @return {String}
         */
        toCamelCase:            function () {
            return (
                this.splitFromCasing()
                .map(word => word.toLowerCase().firstToUpper())
                .join('')
                .firstToLower()
            );
        },
        /**
         * Return a variable-name-like String in camel case.
         * 
         * @param {Object} [options] - Some options
         * @param {Boolean} [options.upper=false] - If given, turns the output to upper (if true) or lower (if false, by default) case.
         * 
         * @return {String}
         */
        toKebabCase:            function (options={}) {
            aa.arg.test(options, aa.verifyObject({
                upper: aa.isBool,
            }), "'options'");
            options.sprinkle({
                upper: false
            });
            
            return (
                this.splitFromCasing()
                .map(word => word[options.upper ? 'toUpperCase' : 'toLowerCase']())
                .join('-')
            );
        },
        /**
         * Return a VariableNameLike String in camel case.
         * 
         * @return {String}
         */
        toPascalCase:           function () {
            return (
                this.splitFromCasing()
                .map(word => word.toLowerCase().firstToUpper())
                .join('')
            );
        },
        /**
         * Return a variable_name_like String in snake case.
         * 
         * @param {Object} [options] - Some options
         * @param {Boolean} [options.upper=false] - If given, turns the output to upper (if true) or lower (if false, by default) case.
         * 
         * @return {String}
         */
        toSnakeCase:            function (options={}) {
            aa.arg.test(options, aa.verifyObject({
                upper: aa.isBool,
            }), "'options'");
            options.sprinkle({
                upper: false
            });

            return (
                this.splitFromCasing()
                .map(word => word[options.upper ? 'toUpperCase' : 'toLowerCase']())
                .join('_')
            );
        },
        // ----------------------------------------------------------------
        filter: function (callback /*, thisArg */) {
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
            const thisArg = (arguments && arguments.length > 1 ? arguments[1] : this);
            let i;
            let str = '';
            for (i=0; i<this.length; i++) {
                const c = this[i];
                if (callback.call(thisArg, c, i, this)) {
                    str += c;
                }
            }
            return str;
        },
        find:   function (callback /*, thisArg */) {
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
            const thisArg = (arguments && arguments.length > 1 ? arguments[1] : this);
            let i;

            for (i=0; i<this.length; i++) {
                const c = this[i];
                if (callback.call(thisArg, c, i, this)) {
                    return true;
                }
            }
            return undefined;
        },
        reduce: function (callback /*, initialValue*/) {
            let i,
                acc = '',
                str = Object(this);
                ;
            if (arguments && arguments.length>1) {
                acc = arguments[1];
            }
            for(i=0; i<str.length; i++) {
                let c = str[i];
                acc = callback(acc,str[i],i,str.toString());
            }
            return acc;
        }
    });

    // ARRAY functions:
    if (Array.first                             === undefined) { 

        // Array.prototype.first = Array.prototype.getLast;
        Object.defineProperty(Array.prototype,'first',{
            get: function (){
                return (
                    this.length > 0
                    ? this[0]
                    : undefined
                );
            }
        });
    }
    if (Array.last                              === undefined) { 

        // Array.prototype.last = Array.prototype.getLast;
        Object.defineProperty(Array.prototype, "last", {
            get: function (){
                return this.getLast();
            }
        });
    }
    if (Array.aa                                === undefined) {

        Array.aa = {};
    }
    aa.deploy(Array.aa, {
        indexOf:        function (param){
            
            // Warning: returns false if given parameter is an object with indexes in a different order!
            
            var i,table = [];
            for(i=0; i<this.length; i++){
                table.push(JSON.stringify(this[i]));
            }
            return (table.indexOf(JSON.stringify(param)));
        }
    });
    aa.deploy(Array.prototype, {
        clear:              function () {
            // const that = Object(this);
            // that.splice(0, that.length);
            while (this.length) {
                this.pop();
            }
        },
        getFirst:           function () {
            if (this.length) {
                return this[0];
            }
            else {
                throw new TypeError("Array.getFirst can not be called on empty Array.");
                return null;
            }
        },
        getLast:            function () {
            if (this.length) {
                return this[this.length-1];
            }
            else {
                return undefined;
            }
        },
        has:                function (p) {
            /**
             * @param {any} 
             */
            
            // Warning: returns false if given parameter is an object with indexes in a different order!

            if (aa.isObject(p)) {
                var found = this.find(function (v) {
                    return (JSON.stringify(v) === JSON.stringify(p) && v.constructor === p.constructor);
                },this);
                return found ? true : false;
            } else if (aa.isFunction(p)) {
                var found = this.find(function (v) {
                    return (v.toString() === p.toString());
                },this);
                return found ? true : false;
            } else {
                return this.indexOf(p) >= 0;
            }
        },
        hasKey:             function (param) {

            return (this[param] !== undefined);
        },
        hasKeyString:       function (param){
            return (typeof this[param] !== 'undefined' && aa.isString(this[param]));
        },
        hasKeyInt:          function (param){
            return (typeof this[param] !== 'undefined' && aa.isInt(this[param]));
        },
        hasKeyArray:        function (param){
            return (typeof this[param] !== 'undefined' && aa.isArray(this[param]));
        },
        hasKeyObject:       function (param){
            return (typeof this[param] !== 'undefined' && aa.isObject(this[param]));
        },
        /**
         * Return a String joining every elements in a natural way.
         * 
         * Example: 
         *      const list = ['A', 'B', 'C', 'D'];
         *      list.joinNatural(); // A, B, C & D
         *      list.joinNatural({default: ";"}); // A; B; C & D
         *      list.joinNatural({last: "and"}); // A, B, C and D
         *      list.joinNatural({tag: "'"}); // 'A', 'B', 'C' & 'D'
         *      list.joinNatural({tag: "'"}); // 'A', 'B', 'C' & 'D'
         * 
         * @param {object} [options] - An object defining options
         * @param {string} [options.default] - The default delimiter
         * @param {string} [options.last] - The last delimiter. If there are only two words, they will be separated by this value.
         * @param {string} [options.tag] - A String that will be used as both start and end boundaries on each elemnt of the Array on which the method is called.
         * @param {string[]} [options.tags] - An Array containing two String elements that will be used as start and end boundaries on each elemnt of the Array on which the method is called.
         * 
         * @return {string}
         */
        joinNatural:        function (options={}) {
            aa.arg.test(options, aa.verifyObject({
                default:    aa.isString,
                last:       aa.isString,
                tag:        aa.isString,
                tags:       arg => aa.isArrayOfStrings(arg) && arg.length === 2,
            }), "'options'");
            options.sprinkle({
                default: ', ',
                last: ' & ',
                tags: ["", ""]
            });
            if (options.hasOwnProperty('tag')) {
                options.tags = [options.tag, options.tag];
            }

            if (this.length > 1) {
                const last = this.last;
                const firstItems = this.slice(0, -1)
                
                return [
                    firstItems
                    .map(item => `${options.tags[0]}${item}${options.tags[1]}`)
                    .join(options.default),
                    `${options.tags[0]}${last}${options.tags[1]}`
                ].join(options.last);
            }
            return (
                this
                .map(item => `${options.tags[0]}${item}${options.tags[1]}`)
                .join(options.default)
            );
        },
        pushUnique:         function (item) {
            if (this.indexOf(item) < 0) {
                this.push(item);
            }
            return this.length;
        },
        removeElement:      function (element) {
            var i = this.indexOf(element);
            if (i > -1) {
                this.splice(i, 1);
            }
        },
        sortFloat:          function () {
            
            var i;
            var j;
            var chaine;
            var maxlength;
            var multiplicateur = 1;
            
            // Get length of longest decimals:
            for(i=0; i<this.length; i++) {
                
                chaine = ''+this[i];
                // re = /^[0-9]+\.([0-9]+)$/gi;
                // result = re.exec(chaine);
                result = chaine.split('.');
                
                if (result && result.length > 1) {
                    if (multiplicateur < result[1].length) {
                        multiplicateur = result[1].length;
                    }
                }
            }
            multiplicateur = Math.pow(10,multiplicateur);
            
            // Convert Floats into big Integers:
            for(i=0; i<this.length; i++) {
                this[i] = ''+parseInt(multiplicateur*parseFloat(this[i]));
                maxlength = this[i].length;
            }
            
            // Add zeros at the beginning of the String:
            for(i=0; i<this.length; i++) {
            
                for(j=this[i].length; j<=maxlength; j++) {
                
                    this[i] = '0'+this[i];
                }
                // aaPlayer.log(this[i].length);
            }
            
            // Trie :
            this.sort();
            
            // Convert big Integers into Floats:
            for(i=0; i<this.length; i++) {
            
                this[i] = parseFloat((parseInt(this[i]))/multiplicateur);
            }
        },
        sortNatural:        function (){
            this.sort(aa.sortNatural);
            return this;
        },
        remove:             function (item /*, removeAll=false */) {
            /**
             * Removes first or all item(s) matching the argument from the Array. Returns the first found item or undefined.
             *
             * @param {any} item
             * @param {bool} removeAll=false
             *
             * @return {any|undefined}
             */
            const removeAll = aa.arg.optional(arguments, 1, false, aa.isBool);

            let i;
            if (removeAll) {
                let found = undefined;
                for (i = this.length - 1; i >= 0 ; i--) {
                    const value = this[i];
                    if (value === item) {
                        found = value;
                        this.splice(i, 1);
                    }
                }
                return found;
            } else {
                for (i = 0; i < this.length; i++) {
                    const value = this[i];
                    if (value === item) {
                        this.splice(i, 1);
                        return value;
                    }
                }
            }

            return undefined;
        },
        verify:             function (callback){
            if (!aa.isFunction(callback)) { throw new TypeError("Argument must be a Function."); }

            return (this.filter(item => {
                const isVerified = callback(item);
                if (!aa.isBool(isVerified)) {  throw new TypeError("Argument must be a Function that must return a Boolean.");  }
                return !isVerified;
            }).length !== 0);
            // return this.every(callback);
        },

        // from MDN:
        every:              function (callback /*, thisArg */) {
            "use strict";
            var i;
            var value, result;

            if (this == null) { throw new TypeError("this vaut null ou n est pas défini"); }
            if (typeof callback !== "function") { throw new TypeError("First argument must be a Function."); }

            var that = Object(this);
            var len = that.length >>> 0;
            const thisArg = arguments.length > 1 ? arguments[1] : undefined;

            // aa:
            for (i=0; i<len; i++) {
                value = that[i];
                result = callback.call(thisArg, value, i, that);
                if (!result) {
                    return false;
                }
            }

            // from MDN:
            // i = 0;
            // while(i < len) {
            //     if (i in that) {
            //         value = that[i];
            //         result = callback.call(thisArg, value, i, that);
            //         if (!result) {
            //             return false;
            //         }
            //     }
            //     i++;
            // }
            return true;
        },
        filter:             function (callback /*, thisArg */) {
            "use strict";

            if (this === void 0 || this === null) {
              throw new TypeError('Array.reduce called on null or undefined');
            }

            var t = Object(this);
            var len = t.length >>> 0;

            // NOTE : fix to avoid very long loop on negative length value

            if (len > t.length || typeof callback != 'function') {
              throw new TypeError();
            }

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];

                    // NOTE: Techniquement on devrait utiliser Object.defineProperty
                    //       pour le prochain index car push peut être affecté
                    //       par les propriétés d'Object.prototype et d'Array.prototype.
                    //       Cependant cette méthode est récente et les cas de collisions
                    //       devraient rester rares : on préfère donc l'alternative la plus
                    //       compatible.
                    if (callback.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }
            return res;
        },
        find:               function (callback) {
            "use strict";
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }
            var i;
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
        
            for(i=0; i<length; i++) {
                value = list[i];
                if (callback.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        },
        findReverse:        function (callback) {
            'use strict';
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof callback !== "function") {
                throw new TypeError('callback must be a function');
            }
            var i;
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
        
            for(i=length-1; i>=0; i--) {
                value = list[i];
                if (callback.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        },
        // ECMA-262, Edition 5, 15.4.4.18
        // Référence: http://es5.github.io/#x15.4.4.18
        forEach:            function (callback, thisArg) {
            let i, value;

            if (this === null) { throw new TypeError("Array.forEach called on null or undefined"); }
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }

            const that = Object(this);
            const len = that.length ?? 0;

            i = 0;
            while (i < len) {
                if (i in that) {
                    value = that[i];
                    callback.call(thisArg, value, i, that);
                }
                i++;
            }
        },
        loopThrough:        function (callback /*, spec */) {
            /**
             * Loop through every item of an array.
             * 
             * @param <function> callback:  A function to call on every item.
             * @param <object> spec:        Some options:
             *      @key <bool> breakable:  If set to true (default), the loop will stop iterating after the callback argument returns anything else than undefined; if set to false (default), The loop will iterate on every item.
             *      @key <any> context:     The context into which the callback argument may run.
             */
            const spec = aa.arg.optional(arguments, 1, {}, aa.verifyObject({
                breakable:      aa.isBool,
                context:        aa.any
            }));
            spec.sprinkle({
                breakable:      true,
                context:        undefined
            });

            if (this === null) { throw new TypeError("Array.forEach called on null or undefined"); }
            if (!aa.isFunction(callback)) { throw new TypeError("First argument must be a Function."); }

            const that = Object(this);
            let i, value, result;

            for (let i=0; i<that.length; i++) {
                if (i in that) {
                    value = that[i];
                    const result = callback.call(spec.context, value, i, that);
                    if (spec.breakable) {
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            }
            return undefined;
        },
        // based on Array.forEach
        forEachReverse:     function (callback, thisArg) {
            var T, k;
            var kValue;

            if (this === null) { throw new TypeError("Array.forEach called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError("First argument must be a Function."); }

            var that = Object(this);
            var len = that.length >>> 0;

            if (arguments.length > 1) {
                T = thisArg;
            }

            for (k=len-1; k>=0; k--) {
                if (k in that) {
                    kValue = that[k];
                    callback.call(T, kValue, k, that);
                }
            }
        },
        // Production steps / ECMA-262, Edition 5, 15.4.4.19
        // Référence : http://es5.github.io/#x15.4.4.19
        map:                function (callback, thisArg) {

            var T, A, k;
            var kValue, mappedValue;
            var O = Object(this);
            var len = O.length >>> 0;

            if (this == null) {
              throw new TypeError('Array.map called on null or undefined');
            }

            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a fonction');
            }

            if (arguments.length > 1) {
                T = thisArg;
            }

            A = new Array(len);
            k = 0;

            while(k < len) {
              if (k in O) {
                kValue = O[k];
                mappedValue = callback.call(T, kValue, k, O);
                A[k] = mappedValue;
              }
              k++;
            }
            return A;
        },
        // Production steps, ECMA-262, Edition 5, 15.4.4.21
        // Référence : http://es5.github.io/#x15.4.4.21
        reduce:             function (callback /*, accumulator, thisArg */) {
            "use strict";
            
            if (this === null || this === undefined) {  throw new TypeError('Array.reduce called on null or undefined'); }
            if (typeof callback !== "function") {       throw new TypeError('Callback argument must be a Function'); }
            
            let accumulator,
                thisArg,
                value;
            
            const that = Object(this);
            
            if (arguments.length > 1) { accumulator = arguments[1]; }
            if (arguments.length > 2) { thisArg = arguments[2]; }

            for (let i=0; i<that.length; i++) {
                value = that[i];
                accumulator = callback.call(thisArg, accumulator, value, i, that);
            }
            return accumulator;
        },
        // Production steps, ECMA-262, Edition 5, 15.4.4.21
        // Référence : http://es5.github.io/#x15.4.4.21
        reduceReverse:      function (callback /*, initialValue */) {
            "use strict";
            
            if (this === null) {
                throw new TypeError('Array.reduce called on null or undefined');
            }
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a fonction');
            }
            var t = Object(this), len = t.length >>> 0, k = 0, value;
            if (arguments.length == 2) {
                value = arguments[1];
            }
            else {
                while(k < len && ! (k in t)) {
                    k++;
                }
                if (k >= len) {
                    throw new TypeError('Réduction de tableau vide sans valeur initiale');
                }
                value = t[k++];
            }
            for(k=len-1; k>=0; k--) {
            // for(; k < len; k++) {
                if (k in t) {
                    value = callback(value, t[k], k, t);
                }
            }
            return value;
        },
        // Production ECMA-262, Edition 5, 15.4.4.17
        // Référence : http://es5.github.io/#x15.4.4.17
        some:               function (func /*, thisArg */) {
            "use strict";
            if (this == null) { throw new TypeError("Array.prototype.some called on null ou undefined"); }
            if (typeof func !== "function") { throw new TypeError("First argument must be a Function."); }

            let i;
            const that = Object(this);
            const len = that.length >>> 0;

            const thisArg = arguments.length > 1 ? arguments[1] : void 0;
            for (i=0; i<len; i++) {
                if (i in that && func.call(thisArg, that[i], i, that)) {
                    return true;
                }
            }
            return false;
        },
        // Production steps of ECMA-262, Edition 5, 15.4.4.22
        // Reference: http://es5.github.io/#x15.4.4.22
        reduceRight:        function (callback /*, initialValue */) {
            "use strict";
            if (null === this || typeof this === "undefined") { throw new TypeError("Array.reduce called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError(callback + " is not a function"); }

            let that = Object(this), len = that.length >>> 0, k = len - 1, value;
            if (arguments.length > 1) {
                value = arguments[1];
            }
            else {
                while(k >= 0 && !(k in that)) {
                    k--;
                }
                if (k < 0) {
                    throw new TypeError("Reduce of empty Array with no initial value");
                }
                value = that[k--];
            }
            for(; k >= 0; k--) {
                if (k in that) {
                    value = callback(value, that[k], k, that);
                }
            }
            return value;
        },
    }, {force: true});

    // OBJECT functions:
    aa.deploy(Object, {
        // Production steps of ECMA-262, Edition 5, 15.2.3.5
        // Reference: https://es5.github.io/#x15.2.3.5
        create: (function () {
            function Temp() {}
    
            var hasOwn = Object.prototype.hasOwnProperty;
    
            return function (O) {
                if (typeof O != "object") {
                    throw TypeError("Object prototype may only be an Object or null");
                }
        
                Temp.prototype = O;
                var obj = new Temp();
                Temp.prototype = null; // Let's not keep a stray reference to O...
        
                if (arguments.length > 1) {
                    var Properties = Object(arguments[1]);
                    for (var prop in Properties) {
                        if (hasOwn.call(Properties, prop)) {
                            obj[prop] = Properties[prop];
                        }
                    }
                }
        
                return obj;
            };
        })(),
        getAbsolutePositionOf:  function (element) {
            aa.arg.test(element, aa.isElement, "'element'");

            let left = 0,
                top = 0;
            
            do {
                top += element.offsetTop  ?? 0;
                left += element.offsetLeft ?? 0;
                element = element.offsetParent;
            } while (element);

            return {left, top};
        },
        getFixedPositionOf:    function (element) {
            aa.arg.test(element, aa.isElement, "'element'");

            const absolute = Object.getAbsolutePositionOf(element);
            const scroll = Object.getScrollPositionOf(element);

            return {
                left:   absolute.left - scroll.left,
                top:    absolute.top - scroll.top
            };
        },
        getScrollPositionOf:    function (element) {
            aa.arg.test(element, aa.isElement, "'element'");

            let left = 0,
                top = 0;
            
            do {
                left += element.scrollLeft ?? 0;
                top += element.scrollTop ?? 0;
                element = element.parentNode;
            } while (element);

            return {left, top};
        },
    });
    aa.deploy(Object.prototype, {
        // ----------------------------------------------------------------
        // Object functions:
        bind:               function (thisArg) {
            const o = {};
            this.forEach((value, key) => {
                o[key] = ((aa.isFunction(value) || aa.isObject(value)) ?
                    value.bind(thisArg)
                    : value
                );
            });
            return o;
        },
        cancel:             function (eventName, callback) {
            var bubble = (arguments && arguments.length > 2 && aa.isBool(arguments[2]) ? arguments[2] : false);

            if (!aa.isString(eventName) || !eventName.trim()) {
                throw TypeError("Event name is not a valid string.");
            }
            if (typeof callback !== "function") {
                throw TypeError("Callback must be a function.");
            }
            if (this.removeEventListener) {
                this.removeEventListener(eventName, callback, bubble);
            } else if (this.detachEvent) {
                this.detachEvent("on"+eventName, callback);
            }
            return this;
        },
        clone:              function () {
            var o;
            if (
                this === null
                || this === undefined
                || aa.isString(this)
            ) {
                o = this;
            } else if (aa.isArray(this)) {
                o = this.concat([]);
            } else if (aa.isRegExp(this)) {
                o = this;
            } else if (aa.isObject(this)) {
                o = {};
                this.forEach(function (v,k) {
                    o[k] = v;
                });
            } else {
                o = this;
            }
            return o;
        },
        every:              function (callback /*, thisArg */) {
            const thisArg = arguments && arguments.length > 1 ? arguments[1] : undefined;

            let i;
            const that = Object(this);

            const keys = Object.keys(this);
            for (i=0; i<keys.length; i++) {
                const k = keys[i];
                if (this.hasOwnProperty(k)) {
                    if (!callback.call(thisArg, that[k], k, that)) {
                        return false;
                    }
                }
            }
            return true;
        },
        filter:             function (callback /* , thisArg */) {
            const thisArg = arguments && arguments.length > 1 ? arguments[1] : undefined;

            let i;
            const o = {};

            const keys = Object.keys(this);
            for (i=0; i<keys.length; i++) {
                const k = keys[i];
                if (this.hasOwnProperty(k)) {
                    const v = this[k];
                    if (callback.call(thisArg, v, k, this)) {
                        o[k] = v;
                    }
                }
            }
            return o;
        },
        find:               function (func /*, thisArg */) {
            "use strict";
            if (this == null) {
                throw new TypeError("Array.prototype.find called on null or undefined");
            }
            if (typeof func !== "function") {
                throw new TypeError("First argument must be a function");
            }
            var i;
            var list = Object(this);
            var thisArg = (
                arguments && arguments.length > 1
                ? arguments[1]
                : undefined
            );
            
            // aantin version:
            for(i in list) {
                if (list.hasOwnProperty(i)) {
                    if (func.call(thisArg, list[i], i, list)) {
                        return list[i];
                    }
                }
            }
            return undefined;
        },
        findLast:           function (callback /*, thisArg */) {
            /**
             * @param Function callback
             * @param Function thisAarg (optional)
             */
            "use strict";
            if (this == null) {
                throw new TypeError("Array.prototype.find called on null or undefined");
            }
            if (typeof callback !== "function") {
                throw new TypeError("First argument must be a function");
            }
            var i;
            var list = Object(this);
            var thisArg = (
                arguments && arguments.length > 1
                ? arguments[1]
                : undefined
            );
            for(i=list.length-1; i>=0; i--) {
                if (callback.call(thisArg, list[i], i, list)) {
                    return list[i];
                }
            }
            return undefined;
        },
        /*
         * How to use:
            obj.forEach(function (value, key) {
                // Do stuff...
            });
        */
        forEach:            function (callback /*, thisArg */) {
            var i, k, thisArg, value, keys;
            if (this === void 0 || this === null) { throw new TypeError("Array.forEach called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError("First argument must be a Function."); }

            var that = Object(this);

            if (arguments && arguments.length>1) {
                thisArg = arguments[1];
            }

            keys = Object.keys(this);
            for(i=0; i<keys.length; i++) {
                k = keys[i];
                if (this.hasOwnProperty(k)) {
                    value = that[k];
                    callback.call(thisArg, value, k, that);
                }
            }
        },
        /*
         * How to use:
            obj.forEachReverse(function (value, key, DOMCollection) {
                // Do stuff...
            });
        */
        forEachReverse:     function (callback /*, thisArg */) {
            let i, k, thisArg, value, keys;
            if (this === void 0 || this === null) {
                throw new TypeError("Array.forEach called on null or undefined");
            }

            const collection = Object(this);

            if (typeof callback !== "function") {
                throw new TypeError(callback + " is not a fonction");
            }

            if (arguments && arguments.length>1) {
                thisArg = arguments[1];
            }

            keys = Object.keys(this);
            for(i=keys.length-1; i>=0; i--) {
                k = keys[i];
                if (this.hasOwnProperty(k)) {
                    value = collection[k];
                    // callback.call(thisArg, {key: k, value: value}, k, collection);
                    callback.call(thisArg, value, k, collection);
                }
            }
        },
        hasKey:             function (param) {

            return this[param] !== undefined;
        },
        hasKeyString:       function (param){

            return (this[param] !== undefined && aa.isString(this[param]));
        },
        hasKeyInt:          function (param){

            return (this[param] !== undefined && aa.isInt(this[param]));
        },
        hasKeyArray:        function (param){

            return (this[param] !== undefined && aa.isArray(this[param]));
        },
        hasKeyObject:       function (param){
            return (this[param] !== undefined && aa.isObject(this[param]));
        },
        indexOf:            function (p) {
            
            // Warning: returns false if given parameter is an object with indexes in a different order!
            
            var k;
            for(k in this) {
                if (this.hasOwnProperty(k)) {
                    if (JSON.stringify(this[k]) === JSON.stringify(p)) {
                        return k;
                    }
                }
            }
            return null;
        },
        indexesOf:          function (param) {
            
            // Warning: returns false if given parameter is an object with indexes in a different order!
            
            var result = [];
            var field;
            for(field in this) {
                if (this.hasOwnProperty(field)) {
                    if (JSON.stringify(this[field]) === JSON.stringify(param)) {
                        result.push(field);
                    }
                }
            }
            return ((result.length) ? result : null);
        },
        is:                 function (v1, v2) {
            // Algorithme SameValue
            if (v1 === v2) { //Étapes 1-5, 7-10
                //Étapes 6.b-6.b +0 !=-0
                return v1 !== 0 || 1 / v1 === 1 / v2; 
            } else {
                //Étapes 6.a: NaN == NaN
                return v1 !== v1 && v2 !== v2;
            }
        },
        keys:               function () {
            
            return Object.keys(this);
        },
        map:                function (callback /*, thisArg*/) {
            /*
             * How to use:
                obj.map(function (value, key[, item]) {
                    return newValue;
                });
            */
            if (this == null) { throw new TypeError("Object.map called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError(callback + " is not a fonction"); }

            const that = Object(this);
            const o = new Object();
            const thisArg = arguments && arguments.length > 1 ? arguments[1] : undefined;

            that.keys().forEach((k) => {
                if (that.hasOwnProperty(k)) {
                    const value = that[k];
                    const mappedValue = callback.call(thisArg, value, k, that);
                    o[k] = mappedValue;
                }
            });
            return o;
        },
        // See 'Object.cancel' to remove listeners
        on:                 function (eventName, callback) {
            /**
             * Usage:
             * Object
             *      .on(`eventname`, e => {})
             *      .on(`anothereventname`, e => {});
             * Object.on({
             *      eventname: e => {},
             *      anothereventname: e => {},
             * });
             * 
             * @param {string} eventName
             * @param {function} callback
             * 
             * @return {object} this, for chaining
             */
            var bubble = (arguments && arguments.length>2 && arguments[2] === true);

            if (aa.isObject(eventName)) {
                eventName.forEach((callback, eventName) => {
                    this.on(eventName, callback);
                });
                return this;
            }

            if (!aa.isString(eventName) || !eventName.trim()) {
                throw TypeError("Event name is not a valid string.");
            }
            if (!aa.isFunction(callback) && !aa.isObject(callback)) {
                throw TypeError("Callback must be a function.");
            }
            if (this.addEventListener) {
                this.addEventListener(eventName, callback, bubble);
            } else if (this.attachEvent) {
                this.attachEvent("on"+eventName, callback);
            }
            return this;
        },
        reduce:             function (callback) {
            if (typeof callback !== "function") { throw new TypeError("First argument must be a Function."); }

            const that = this;
            let acc = (
                arguments && arguments.length > 1
                ? arguments[1]
                : undefined
            );

            that.forEach((v,k)=>{
                acc = callback(acc,that[k],k,that);
            });
            return acc
        },
        some:               function (callback /*, that */) {
            aa.arg.test(callback, aa.isFunction, `'callback'`);
            const that = aa.arg.optional(arguments, 1, undefined);
        
            if (!this) {
                throw new TypeError(`Object.prototype.find called on null or undefined`);
            }
        
            const keys = Object.keys(this);
            for (let i=0; i<keys.length; i++) {
                const key = keys[i];
                const isVerified = callback.call(that, this[key], key, this);
                if (!aa.isBool(isVerified)) { throw new TypeError(`'callback' Function must return a Boolean.`); }
                if (isVerified) {
                    return true;
                }
            }
            return false;
        },
        sprinkle:           function (seasoning /*, options */) {
            /**
             * Add some key/value pairs to an Object if keys are not defined,
             * or reset a value to a key if the original value's type dosen't match the given value's type.
             * 
             * @param {object} seasoning
             * @param {object} options={} (optional)
             *    @key {boolean} forcetype=false
             * 
             * @return {void}
             */

            aa.arg.test(seasoning, aa.isObject);
            const options = aa.arg.optional(arguments, 1, {}, options => aa.isObject(options) && options.verify({
                forceType: aa.isBool
            }));

            seasoning.forEach((value, key) => {
                if (!this.hasOwnProperty(key)) {
                    this[key] = value;
                } else if (aa.isObject(this[key]) && aa.isObject(value)) {
                    this[key].sprinkle(value, options);
                } else if (this.hasOwnProperty(key)) {
                    if (options.forceType) {
                        [
                            // arg => arg === null,
                            // arg => arg === undefined,
                            aa.isArray,
                            aa.isBool,
                            aa.isNumber,
                            aa.isObject,
                            // aa.isRegExp,
                            aa.isString
                        ].forEach(func => {
                            if (func(this[key]) !== func(value)) {
                                this[key] = value;
                            }
                        });
                    }
                }
            });
            return this;
        },
        toSortedArray:      function () {
            /**
             * Return an array of two arrays. The first array contains the keys, sorted. The second array contains their coresponding values.
             * 
             * @return {array[]}
             */
            return (Object
                .keys(this)
                .sort()
                .reduce((list, key) => {
                    list[0].push(key);
                    list[1].push(this[key]);
                    return list;
                }, [[], []])
            );
        },
        /**
         * Verify if each of this Object properties matches each property of a given model Object.
         * 
         * @param {object} model
         * @param {bool|object} [strict=false|options] - If a Boolean is passed, executes in strict mode (true) or not (false by default). If an Object is passed, it will be used as options.
         * @param        {bool} [options.silent] - Execute in silent mode (true) or not (false by default.
         * @param        {bool} [options.strict] - Execute in strict mode (true) or not (false by default.
         *
         * @return {boolean}
         */
        verify:             function (model /*, strict */) {
            const strict = aa.arg.optional(arguments, 1, false, aa.isBool);
            const options = aa.arg.optional(arguments, 1, {}, arg =>
                aa.isObject(arg)
                && Object.keys(arg).every(key => ['strict', 'silent'].has(key) && aa.isBool(arg[key]))
            );
            options.silent ??= false;
            options.strict ??= strict;

            // Main:
            if (options.strict) {
                const mandatoryKeys = model.reduce((acc, v, k) => {
                    if (!this.hasOwnProperty(k)) {
                        acc.push(k);
                    }
                    return acc;
                }, []);
                if (mandatoryKeys.length && !options.silent) {
                    warn(`The Object must have ${mandatoryKeys.length == 1 ? 'a ' : ''}${mandatoryKeys.joinNatural({tag: "'"})} key${mandatoryKeys.length > 1 ? 's' : ''}.`);
                }
            }
            aa.arg.test(model, model.every(v => aa.isFunction(v)), 0, "must be an Object of Functions only");

            const err = this.reduce((err, v, k)=>{
                if (!model.hasOwnProperty(k) || !model[k](v)) {
                    err.push(k);
                }
                return err;
            },[]);
            if (err.length && !options.silent) {
                warn(`The Object contains invalid key${err.length>1?'s':''} (${err.joinNatural({tag: "'"})})`);
            }
            
            return err.length === 0;
        },

        // ----------------------------------------------------------------
        // DOM functions:
        clear:              function () {
            aa.arg.test(this, aa.isNode, ": 'clear' method can not be called on an Object that is not a DOM Element.");
            
            this.innerHTML = '';
        },
        diveByClass:        function (className,func) {
            /**
             */
            if (aa.isString(className) && className.trim()) {}
            var that = Object(this);
            that.diveTheDOM(function () {
                var classes;
                if (typeof that.getAttribute !== 'undefined' && typeof that.getAttribute('class') === 'string' && that.getAttribute('class')) {
                    if (that.classList.contains(className)) {
                        func(that);
                    }
                }
            });
        },
        diveTheDOM:         function (func) {
            /**
             *  Author: based on Douglas Crockford
             */
            var that = Object(this);
            if (aa.isDom(that)) {
                func(that);
                that = that.firstChild;
                while(that) {
                    that.diveTheDOM(func);
                    that = that.nextSibling;
                }
            } else {
                // console.warn('The Object is not a DOM element.');
            }
        },
        diveTheElements:    function (func) {
            /**
             *  Author: based on Douglas Crockford
             */
            var that = Object(this);
            if (aa.isNode(that)) {
                func(that);
                if (that.nodeType !== 3) {
                    that = that.firstChild;
                }
                while(that) {
                    that.diveTheElements(func);
                    that = that.nextSibling;
                }
            } else {
                console.warn('This Object is not an HTML ELEMENT.');
            }
        },
        getElementsBy:      function (callback /*, thisArg */) {
            /**
             * Dive into the DOM, inside the Element tree, and return an Array of every node that verify a callback filtering Function.
             * 
             * @param <function> callback: A Boolean returning Function that will be used to filter every node inside the Element reference.
             * @param <any> thisArg: Anything that will be used as context for execution.
             * 
             * @return <array>
             */

            aa.arg.test(callback, aa.isFunction, "'callback'");
            const thisArg = aa.arg.optional(arguments, 1);

            const nodes = [];

            let that = Object(this);
            that.diveTheDOM(node => {
                const isVerified = callback.call(thisArg, node);
                aa.throwErrorIf(!aa.isBool(isVerified), "Filter Function must return a Boolean.");
                if (isVerified) {
                    nodes.push(node);
                }
            });
            
            return nodes;
        },
        getFormElements:    function (/* thisArg */) {
            /**
             * Dive into the DOM, inside the Element tree, and return an Array of every form node.
             * 
             * @param <any> thisArg: Anything that will be used as context for execution.
             * 
             * @return <array>
             */

            const thisArg = aa.arg.optional(arguments, 0);

            let that = Object(this);
            return that.getElementsBy(
                node => aa.inEnum(
                    'button',
                    'datalist',
                    'input',
                    'select',
                    'textarea'
                )(node.tagName.toLowerCase())
                , thisArg
            );
            
            return nodes;
        },
        insertAtFirst:      function (newNode) {
            /**
             * parentNode.insertAtFirst(newNode);
             */
            if (aa.isDom(this) && aa.isElement(newNode)) {
                if (this.childNodes.length) {
                    this.insertBefore(newNode,this.childNodes[0]);
                } else {
                    this.appendChild(newNode);
                }
            }
        },
        insertAfter:        function (newNode) {
            /**
             * thaa.isNode.insertAfter(newNode);
             */
            if (aa.isDom(this)) {
                if (this.nextSibling === null) {
                    this.parentNode.appendChild(newNode);
                } else {
                    this.parentNode.insertBefore(newNode, this.nextSibling);
                }
            }
        },
        removeChildren:     function () {
            if (aa.isDom(this)) {
                while(this.hasChildNodes()) {
                    this.removeChild(this.firstChild);
                }
                return true;
            }
            return false;
        },
        removeNode:         function () {
            /**
             * thaa.isNode.removeNode();
             */
            if (aa.isDom(this) && this.parentNode) {
                let o = {reference: this.parentNode.removeChild(this)};
                delete o.reference;
            }
        },
        replace:            function (node) {
            this.parentNode.insertBefore(node, this);
            this.removeNode();
        },
        riseTheDOM:         function (func) {
            var res;
            var that = Object(this);
            if (that && aa.isNode(that)) {
                if (that.nodeType === 3) {
                    res = func(that);
                    if (res !== true) {
                        that = Object(that.parentNode);
                        that.riseTheDOM(func);
                    }
                } else if (that.tagName !== undefined) {
                    switch(that.tagName.toLowerCase()) {
                        case "body":
                        case "html":
                            break;
                        default:
                            res = func(that);
                            if (res !== true) {
                                that = Object(that.parentNode);
                                that.riseTheDOM(func);
                            }
                            break;
                    }
                }
            } else {
                console.warn("not an element.");
            }
        },
        ignoreKeys:        function (...keys) {
            /**
             * @param <string[]> keys
             */
            if (!aa.isArrayOfStrings(keys)) { throw new TypeError("Argument must be an Array of Strings."); }

            return this.filter((v, k)=>{ return !keys.has(k); });
        }
    }, {force: true});

    // Set a label to some functions:
    (() => {
        const labeledFunctions = {
            any: "of any type",
            inArray: "an item in the given Array",
            inEnum: "a value in the enumerated list",
            instanceof: "an instance",
            inbetween: "a Number within the given boundaries",
            inbetweenStrict: "a Number within the given boundaries excluded",
            isArray: "an Array",
            isArrayLike: "an Array-like",
            isArrayOfFunctions: "an Array of Functions",
            isArrayOfNumbers: "an Array of Numbers",
            isArrayOfStrings: "an Array of Strings",
            isBool: "a Boolean",
            isDom: null,
            isElement: "a DOM Element",
            isFile: "a File",
            isFloat: "a float Number",
            isFunction: "a Function",
            isInt: "an Integer",
            isNode: "a node Element",
            isArrayOfNonEmptyStrings: "an Array of non-empty Strings",
            isNullOrNonEmptyString: "null or a non-empty String",
            isNumber: "a Number",
            isNumeric: "numeric",
            isObject: "an Object that is not an Array",
            isObjectOfFunctions: "an Object of Functions",
            isObjectOfStrings: "an Object of Strings",
            isObjectOfObjects: "an Object of Objects",
            isPositiveInt: "a positive Integer",
            isPositiveNumber: "a positive Number",
            isStrictlyPositiveInt: "a strictly positive Integer",
            isStrictlyPositiveNumber: " a strictly positive Number",
            isRegExp: "a Regular Expression",
            isString: "a String",
            nonEmptyString: "a non-empty String",
            verifyObject: null,
        };
        labeledFunctions.forEach((label, functionName) => {
            if (label && aa.hasOwnProperty(functionName) && aa.isFunction(aa[functionName])) {
                addReadonlyProperties(aa[functionName], {label});
            }
        });
    })();

    // IMAGE functions:
    aa.deploy(Image.prototype, {
        toBase64:   function (){
            this.setAttribute("crossOrigin", "anonymous");
            var base64 = this.toDataURL()
                .replace(/^data:image\/(jpe?g|gif|png);base64,/, "")
                .replace(/^.*\,/, "")
                ;
            // log({'Image.base64': base64});
            return base64;
        },
        toDataURL:  function () {
            let dataUrl;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const quality = (
                arguments && arguments.length>1
                && aa.isNumber(arguments[1])
                && aa.inbetween(arguments[1], 0, 1)
                
                ? arguments[1]
                : undefined
            );

            this.setAttribute("crossOrigin", "anonymous");

            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(this, 0, 0);

            if (quality !== undefined) {
                dataUrl = canvas.toDataURL("image/png", quality); // Second argument: optional, quality between 0 and 1
            } else {
                dataUrl = canvas.toDataURL("image/png", 1); // default quality 0.92
            }

            return dataUrl;
        },
        resize:     function (spec) {
            /**
             * @param {object} spec
             * @param {function} resolve (optional)
             * @param {function} reject (optional)
             *
             * return {image}
             */
            // ----------------------------------------------------------------
            const resolve = (arguments && arguments.length>1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined);
            const reject = (arguments && arguments.length>2 && aa.isFunction(arguments[2]) ? arguments[2] : undefined);
            // ----------------------------------------------------------------
            // Compliance:
            if (!aa.isObject(spec)) { throw new TypeError("First argument must be an Object."); }
            if (!spec.verify({
                width: aa.isStrictlyPositiveInt,
                height: aa.isStrictlyPositiveInt,
                maxHeight: aa.isStrictlyPositiveInt,
                maxWidth: aa.isStrictlyPositiveInt,
                minHeight: aa.isStrictlyPositiveInt,
                minWidth: aa.isStrictlyPositiveInt
            })) { throw new TypeError("Given Object is not compliant."); }
            if (spec.minWidth && spec.maxWidth && spec.minWidth > spec.maxWidth) { throw new TypeError("Conflict between 'minWidth' and 'maxWidth'."); }
            if (spec.minHeight && spec.maxHeight && spec.minHeight > spec.maxHeight) { throw new TypeError("Conflict between 'minHeight' and 'maxHeight'."); }
            // ----------------------------------------------------------------
            let doOnce = ()=>{
                // Size:
                let width, height;
                if (spec.width && spec.height) {
                    width = spec.width;
                    height = spec.height;
                } else if (spec.width && !spec.height) {
                    width = spec.width;
                    height = Math.floor(spec.width * this.height / this.width);
                } else if (spec.height && !spec.width) {
                    height = spec.height;
                    width = Math.floor(spec.height * this.width / this.height);
                } else if (!spec.width && !spec.height) {
                    width = this.width;
                    height = this.height;
                }
                // ----------------------------------------------------------------
                // Max size:
                if (spec.maxWidth && width > spec.maxWidth) {
                    height = Math.floor(height * spec.maxWidth / width);
                    width = spec.maxWidth;
                }
                if (spec.maxHeight && height > spec.maxHeight) {
                    width = Math.floor(width * spec.maxHeight / height);
                    height = spec.maxHeight;
                }
                // ----------------------------------------------------------------
                // Min size:
                if (spec.minWidth && width < spec.minWidth) {
                    height = Math.floor(height * spec.minWidth / width);
                    width = spec.minWidth;
                }
                if (spec.minHeight && height < spec.minHeight) {
                    width = Math.floor(width * spec.minHeight / height);
                    height = spec.minHeight;
                }
                // ----------------------------------------------------------------
                this.setAttribute("crossOrigin", "anonymous");
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0, width, height);
                
                const img = new Image();
                img.onload = ()=>{
                    if (resolve) {
                        resolve(img);
                    }
                };
                try{
                    img.src = canvas.toDataURL(this.type, 1); // Second argument: quality between 0 & 1
                }
                catch(e) {
                    const err = {
                        type: "critical",
                        text: "Invalid dataURL"
                    };
                    if (reject) {
                        reject(err.text, err.type)
                    } else {
                        warn(err.text);
                        return undefined;
                    }
                }
            };
            this.onload = ()=>{
                doOnce();
                doOnce = ()=>{};
            };
            if (!resolve) {
                return img;
            }
        }
    });
    aa.deploy(window, {
        resizeImg: function (options) {
            /**
             * @param {Object} options
             * @param {Function} resolve (optional)
             * @param {Function} reject (optional)
             *
             * return {void}
             */
            const resolve = (arguments && arguments.length>1 ? arguments[1] : undefined);
            const reject = (arguments && arguments.length>2 ? arguments[2] : undefined);
            const allowedOptions = [
                ["img", ()=>{}],
                ["file", ()=>{}],
                ["width", ()=>{}],
                ["height", ()=>{}],
                ["maxHeight", ()=>{}],
                ["maxWidth", ()=>{}],
                ["minHeight", ()=>{}],
                ["minWidth", ()=>{}]
            ];

            if (!aa.isObject(options)) { throw new TypeError("First argument must be an Object."); }
            if (resolve && !aa.isFunction(resolve)) { throw new TypeError("Second argument must be a Function."); }
            if (reject && !aa.isFunction(reject)) { throw new TypeError("Third argument must be a Function."); }
            // Todo: verify keys of options...

            const file = options.file;
            const img = options.img;
            const maxHeight = options.maxHeight;
            const maxWidth = options.maxWidth;
            const minHeight = options.minHeight;
            const minWidth = options.minWidth;
            const newHeight = options.height;
            const newWidth = options.width;

            if (!(file instanceof File)) { throw new TypeError("{file} option must be a File."); }

            if (file) {
                let img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = function () {
                    let width = img.width;
                    let height = img.height;
                    if (maxWidth) {
                        width = maxWidth;
                        height = parseInt(width*img.height/img.width);
                        if (height < maxHeight) {
                            height = maxHeight;
                            width = parseInt(height*img.width/img.height);
                        }
                        img.width = width;
                        img.height = height;
                    }

                    if (resolve) {
                        const args = [{
                            width:  width,
                            height: height
                        }, resolve];
                        if (reject) {
                            args.push(reject)
                        }
                        img.resize.aply(null, args);
                    } else {
                        let i = img.resize({
                            width:  width,
                            height: height
                        });
                    }
                };
                let r = new FileReader();
                r.onload = function (e) {
                    if (e.target.result.match(/^data\:image\/(jpg|jpeg|gif|png)\;base64\,/)) {
                        img.src = e.target.result;
                    } else {
                        if (reject) {
                            const err = {
                                type: "warning",
                                text: "Please select an image file."
                            };
                            reject(err.text, err.type);
                        }
                    }
                };
                try{
                    r.readAsDataURL(file);
                }
                catch(e) {
                    if (reject) {
                        const err = {
                            type: "critical",
                            text: "Invalid dataURL."
                        };
                        reject(err.text, err.type);
                    }
                }
            }
        },
    });

    // FILE functions:
    aa.deploy(File.prototype, {
        toBase64: function () {
            /**
             * @param {function} resolve: (img) {}
             * @param {function} reject: (err) {}
             *
             * return {void}
             */
            const resolve = (arguments && arguments.length>0 ? arguments[0] : undefined);
            const reject = (arguments && arguments.length>1 ? arguments[1] : undefined);

            if (resolve && !aa.isFunction(resolve)) { throw new TypeError("First argument must be a Function."); }
            if (reject && !aa.isFunction(reject)) { throw new TypeError("Second argument must be a Function."); }

            const r = new FileReader();
            r.onload = function (e) {
                if (resolve) {
                    resolve(e.target.result);
                }
            };
            try{
                r.readAsDataURL(this);
            }
            catch(e) {
                if (reject) {
                    const err = {
                        type: "critical",
                        text: "Invalid dataURL."
                    };
                    reject(err.text, err.type);
                }
            }
        },
        toImage: function () {
            /**
             * @param {function} resolve: (img) {}
             * @param {function} reject: (err) {}
             *
             * return {void}
             */
            const resolve = (arguments && arguments.length>0 ? arguments[0] : undefined);
            const reject = (arguments && arguments.length>1 ? arguments[1] : undefined);

            if (resolve !== undefined && !aa.isFunction(resolve)) { throw new TypeError("First argument must be a Function."); }
            if (reject !== undefined && !aa.isFunction(reject)) { throw new TypeError("Second argument must be a Function."); }

            const img = new Image();

            const r = new FileReader();
            r.onload = function (e) {
                if (e.target.result.match(/^data\:image\/(jpg|jpeg|gif|png)\;base64\,/)) {
                    img.src = e.target.result;
                    if (resolve) {
                        resolve(img);
                    }
                } else {
                    if (reject) {
                        const err = {
                            type: "warning",
                            text: "The file is not an image file."
                        };
                        reject(err.text, err.type);
                    }
                }
            };
            try {
                r.readAsDataURL(this);
            }
            catch(e) {
                if (reject) {
                    const err = {
                        type: "critical",
                        text: "Invalid dataURL."
                    };
                    reject(err.text, err.type);
                }
            }
        }
    });

    // ANIMATION functions:
    window.requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
    ;
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
    // ----------------------------------------------------------------
    // Prototypes methods:
    aa.prototypes = {
        hydrate: function (o) {
            /**
             * @param {object} o
             *
             * @return {void}
             */
            if (aa.isObject(o)) {
                o.forEach((v,k)=>{
                    const prefix = "set";
                    const method = prefix+k.firstToUpper();
                    if (typeof this[method] === "function") {
                        this[method].call(this, v);
                    }
                });
            } else { throw new TypeError("Argument must be an Object."); }
        }
    };
    // ----------------------------------------------------------------
    aa.versioning = new (function () {
        // Dependencies syntax (https://semver.org/):
        /*
            version             : must match version exactly
            =version            : same as just version
            >version            : must be greater than version
            >=version           : must be greater than or equal to version
            <version            : must be less thanversion
            <=version           : must be less than or equal to version
            ~1.2.4              : same as >=1.2.4-0 && <1.3.0-0 (eng: tilde)
            ^1.2.4              : same as >=1.2.4-0 && <2.0.0-0 (eng: caret)
            1.2.x               : same as >=1.2.0-0 && <1.3.0-0
            *                   : matches any version
            ""                  : (empty string) matches any version (same as *)
            version1 - version2 : same as >=version1 <=version2
            // range1 - range2     : passes if range1 or range2 are satisfied
        */

        // Private attributes:
        const __public = {
        };
        const __private = {
            collection: {},
            errors: [],
            resolves: {},
            rejects: {}
        };

        // Private methods:
        const dependencyError = function (o) {
            /**
             * @param {Object} o
             * @param {String} message=null
             *
             * return {Object}
             */
            const message = (arguments && arguments.length > 1 && aa.nonEmptyString(arguments[1]) ? arguments[1] : undefined);

            if (message) {
                o.message = message;
                return o;
            } else {
                return undefined;
            }
        }

        // Classes:
        const Version = function () {
            /**
             * @param {Object} obj={}
             */
            
            // Attributes:
            this.__self = {
                version:        '0',
                dependencies:   {}
            };
            this.__private = {
                valid: true
            };

            // Private methods:
            const construct = function () {
                this.hydrate.apply(this, arguments);
                getters.call(this);
            };
            const getters = function () {
                // Automatic getters:
                this.__self.keys().forEach((k)=>{
                    Object.defineProperty(this, k, {
                        get: ()=>{ return this.__self[k]; }
                    });
                });
            };

            if (Version.prototype.hydrate === undefined) {

                // Public methods:
                Version.prototype.hydrate   = function () {
                    if (arguments && arguments.length && aa.isObject(arguments[0])) {
                        arguments[0].forEach(function (v,k) {
                            if (this.__self.hasOwnProperty(k)) {
                                if (typeof v === typeof this.__self[k]) {
                                    if (aa.isString(v)) {
                                        this.__self[k] = v;
                                    } else if (aa.isArray(v)) {
                                        v.forEach(function (txt,j) {
                                            if (aa.isString(txt)) {
                                                this.__self[k].push(txt);
                                            } else {
                                                this.__private.valid = false;
                                                console.warn("Given '"+k+"' argument should be an Array of Strings.");
                                            }
                                        },this);
                                    } else if (aa.isObject(v)) {
                                        v.forEach(function (version,lib) {
                                            if (aa.nonEmptyString(version)) {
                                                this.__self[k][lib] = version.trim();
                                            }
                                        },this);
                                    }
                                } else {
                                    console.warn("Invalid type of key '"+k+"'.");
                                }
                            } else {
                                console.warn("Key '"+k+"' not implemented.");
                            }
                        },this);
                    } else {
                        this.__private.valid = false;
                    }
                };
                Version.prototype.isValid   = function () {

                    return this.__private.valid;
                };
            }
            
            // Instanciate:
            construct.apply(this, arguments);
        };
        const aaVersions = new (function () {

            if (true) {
                // Magic:
                this.init                   = function () {
                    this.set("aaJS", [versioning.aaJS.version]);
                    this.getters();
                };
                this.getters                = function () {

                    Object.defineProperty(this, "list", {
                        get: function () { return Object.freeze(__private.collection); }
                    })
                    // Object.defineProperty(this, "verified", {get: function () { return __self.verified; }})
                };
                this.checkDependency        = function (version, expected) {
                    /**
                     * @param {String} version (version to test)
                     * @param {String} expected (version rule)
                     * @param {Function} callback=null (Function to be called if wrong version)
                     * @param {this} that=undefined
                     */
                    const callback = (arguments && arguments.length > 2 && aa.isFunction(arguments[2]) ? arguments[2] : null);
                    const that = (arguments && arguments.length > 3 ? arguments[3] : undefined);

                    let ok          = true;
                    let tsuzuku     = true;
                    let expectedNew = expected;
                    let o = {expected:expected, version:version};
                    let extract = function (v) {
                        if (!aa.nonEmptyString(v)) {
                            throw new TypeError("Given argument must be a non-empty String.");
                        }
                        if (aa.nonEmptyString(v)) {
                            if (v.match(/^([0-9]+)\.([0-9]+)$/)) {
                                v += '.0';
                            }
                            let o;
                            let m = v.match(/^(\<|\>|\<\=|\>\=|\^|\~)?([0-9\*]+)\.([0-9\*]+)(\.([0-9\*]+))?$/);
                            if (m) {
                                o = {
                                    prefix: m[1] ? m[1] : null,
                                    major: m[2] === '*' ? '*' : parseInt(m[2]),
                                    minor: m[3] === '*' ? '*' : parseInt(m[3]),
                                    patch: m[5] === '*' ? '*' : (m[5] ? parseInt(m[5]) : 0)
                                };
                                o.toString = function () {
                                    return (o.prefix ? o.prefix : '')+o.major+'.'+o.minor+'.'+o.patch;
                                };
                                if (o.patch === '*' && (o.major === '*' || o.minor === '*')) {
                                    return false;
                                } else if (o.minor === '*' && o.major === '*') {
                                    return false;
                                }
                            }
                            return m ? o : false;
                        }
                    };
                    let numerify = function (o) {

                        return aa.isObject(o) ? (o.major*1000000)+(o.minor*1000)+(o.patch) : null;
                    };

                    expected = expected.trim();
                    expected = expected.replace(/\s+/,' ');
                    let rules = expected.split(/\s/);

                    // Range:
                    if (rules.length === 3 && rules[1] === '-') {
                        let minO = extract(rules[0]);
                        let maxO = extract(rules[2]);

                        let minN = numerify(minO);
                        let maxN = numerify(maxO);
                        if (minO.prefix || maxO.prefix) {
                            dependencyError(o, "Range syntax shouldn't have flags.");
                            tsuzuku = false;
                        } else {
                            expectedNew = '>='+rules[0]+' '+'<='+rules[2];
                        }
                    }
                    console.log("expected:", expected);
                    // console.log("new:", expectedNew);
                    console.log("running:", version);
                    if (tsuzuku) {
                        rules = expectedNew.split(/\s/);
                        rules.forEach(function (rule) {
                            let ruleO = extract(rule);
                            let ruleN = numerify(ruleO);
                            let runningO = extract(version);
                            let runningN = numerify(runningO);

                            if (!runningO.prefix) {
                                switch(ruleO.prefix) {
                                    case null:
                                        break;
                                    case '<':
                                        if (!(runningN < ruleN)) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    case '>':
                                        if (!(runningN > ruleN)) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    case '>=':
                                        if (!(runningN >= ruleN)) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    case '<=':
                                        if (!(runningN <= ruleN)) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    case '^':
                                        if (!(runningN >= ruleN && runningN < numerify({major: ruleO.major+1, minor: 0, patch: 0}))) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    case '~':
                                        if (!(runningN >= ruleN && runningN < numerify({major: ruleO.major, minor: ruleO.minor+1, patch: 0}))) {
                                            __private.errors.push(dependencyError(o, "Running version is out of range."));
                                            ok = false;
                                        }
                                        break;
                                    default:
                                        dependencyError(o, "???");
                                        break;
                                }
                            } else {
                                dependencyError(o, "Invalid syntax of '"+name+"' dependency.");
                            }
                            // log(__private.errors);
                        });
                    }
                    if (__private.errors.length && callback) {
                        callback.call(that, __private.errors);
                    }
                    return ok;
                };
                this.checkDependencies      = function (/* callback */) {
                    /**
                     * @param {Function} callback=null (Function to be called if error)
                     */
                    const callback = (arguments && arguments.length > 0 && aa.isFunction(arguments[0]) ? arguments[0] : null);

                    let ok = true;

                    console.groupCollapsed("Dependencies check");
                    __private.collection.forEach((v, lib)=>{
                        console.group(lib);
                        v.dependencies.forEach((expected, name)=>{
                            console.group("depends on '"+name+"'");
                            let o = {
                                name:name,
                                expected:expected
                            };
                            let running;
                            if (__private.collection.hasOwnProperty(name)) {
                                running = __private.collection[name].version;
                                o.running = running;
                            } else {
                                dependencyError(o, "");
                            }
                            if (running) {
                                // console.log("expected: "+expected);
                                // console.log("running: "+running);
                                if (!this.checkDependency(running, expected, callback)) {
                                    ok = false;
                                }
                            } else {
                                dependencyError(o, "Running version not found.");
                            }
                            console.groupEnd();
                        });
                        console.groupEnd(lib);
                    });
                    console.groupEnd();
                    if (callback && __private.errors.length) {
                        callback(__private.errors)
                    }
                    return ok;
                };
                this.dependencyErrorCallback = function (errors) {

                    console.error("Dependencies error:", errors);
                };
                this.onbodyload             = function () {
                    this.onbodyload = function () {};
                    // aaVersions.set("aaJS", [versioning.aaJS.version]);
                    const checked = aaVersions.checkDependencies(this.dependencyErrorCallback);
                    if (checked) {
                        __private.resolves.forEach((resolves, lib)=>{
                            resolves.forEach((callback)=>{
                                callback();
                            });
                        });
                    } else {
                        __private.rejects.forEach((rejects, lib)=>{
                            rejects.forEach((callback)=>{
                                callback(__private.errors);
                            });
                        });
                    }
                };

                // Methods:
                this.set                    = function (lib, o) {
                    if (!aa.nonEmptyString(lib)) {
                        throw new TypeError("First argument should be a non-empty String.")
                    }
                    if (aa.isArray(o)) {
                        o.forEachReverse(function (v) {
                            this.set(lib,v);
                        },this);
                        return;
                    }
                    if (!aa.isObject(o)) {
                        throw new TypeError("Second argument should be an Object or an Array of Objects.")
                    }
                    lib = lib.trim();
                    const version = new Version(o);
                    if (version.isValid()) {
                        __private.collection[lib] = version;
                        return true;
                    } else {
                        console.warn("Invalid Version");
                        return false;
                    }
                };
                this.get_X                    = function (lib) {
                    if (!aa.nonEmptyString(lib)) {
                        throw new TypeError("Argument should be a non-empty String.");
                    }
                    lib = lib.trim();
                    if (__private.collection.hasOwnProperty(lib)) {
                        return JSON.parse(JSON.stringify(__private.collection[lib].__self));
                    }
                    return undefined;
                };
            }
            
            // Init:
            this.init();
        })();

        const instance = {
            
            // Public methods:
            onbodyload: function () {

                aaVersions.onbodyload();
            },
            test: function (spec /*, resolve, reject */) {
                if (!aa.isObject(spec)) { throw new TypeError("First argument must be an Object."); }
                let {name, version, dependencies} = spec;

                if (!aa.nonEmptyString(name)) { throw new TypeError("'name' key not found in first argument."); }
                if (!aa.nonEmptyString(version)) { throw new TypeError("'version' key not found in first argument."); }
                if (!aa.isObject(dependencies)) { throw new TypeError("'version' key not found in first argument."); }
                
                const resolve = (arguments && arguments.length > 1 && aa.isFunction(arguments[1]) ? arguments[1] : undefined);
                const reject = (arguments && arguments.length > 2 && aa.isFunction(arguments[2]) ? arguments[2] : undefined);
                
                if (resolve) {
                    if (!__private.resolves.hasOwnProperty(name)) {
                        __private.resolves[name] = [];
                    }
                    __private.resolves[name].push(resolve);
                }
                if (reject) {
                    if (!__private.rejects.hasOwnProperty(name)) {
                        __private.rejects[name] = [];
                    }
                    __private.rejects[name].push(reject);
                }
                const checked = aaVersions.set(name, {
                    version: version,
                    dependencies: dependencies
                });
            }

            // Setters:
            // Getters:
        };
        __public.keys().forEach((key)=>{
            Object.defineProperty(instance, key, {
                get: ()=>{ return __public[key]; }
            });
        });

        return Object.freeze(instance);
    })();
    // ----------------------------------------------------------------
    JS.accessors.id = aa.uid();
    const {get, set} = aa.mapFactory();
})();
