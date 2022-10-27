"use strict"; // é
(function () {
    // ----------------------------------------------------------------
    if (window.aa !== undefined) { throw new Error("'aaJS' should be called before every other 'aa' modules."); }
    // ----------------------------------------------------------------
    window.aa = {};
    const versioning = {
        aaJS: {
            version: {
                version: "2.0",
                dependencies: {}
            }
        }
    };
    // ----------------------------------------------------------------
    const cease = (message) => {
        console.warn(message);
        return undefined;
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
                    aa.arg.test(null, isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");

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
                    aa.arg.test(null, isObject(spec) && spec.verify({
                        center: v => (isArray(v) && v.length === 2),
                        point: v => (isArray(v) && v.length === 2),
                        radius: isStrictlyPositiveNumber,
                        three: v => (isArray(v) && v.length === 3),
                        two: v => (isArray(v) && v.length === 2)
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
                    aa.arg.test(null, isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

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
                    aa.arg.test(null, isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

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
                    aa.arg.test(null, isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

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
                    aa.arg.test(null, isArrayOfNumbers(a) && a.length === 2, 0, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(b) && b.length === 2, 1, "must be an Array of two Numbers");
                    aa.arg.test(null, isArrayOfNumbers(c) && c.length === 2, 2, "must be an Array of two Numbers");

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
            optional:    function (args, i, defaultValue /*, condition */) {
                const condition = arguments && arguments.length > 3 ? arguments[3] : () => true;

                if (!isArrayLike(args)) { throw new TypeError("First argument must be an Array."); }
                if (!isPositiveInt(i)) { throw new TypeError("Second argument must be a positive Integer."); }
                if (!isFunction(condition)) { throw new TypeError("Fourth argument must be a Function."); }

                return (args.length > i && condition(args[i]) ?
                    args[i]
                    : defaultValue
                );
            },
            test:   function (arg, tester /* [, position [, message]] */) {
                if (!isFunction(tester) && !isBool(tester)) { throw new TypeError("Second argument must be a Function."); }

                let i;
                const argv = [];
                for (i=2; i<arguments.length; i++) {
                    argv.push(arguments[i]);
                }
                const position = argv.find(isPositiveInt);
                const message = argv.find(nonEmptyString) || "invalid";

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

                if (isBool(tester) && !tester) {
                    throw new TypeError(writeMessage(position, message));
                } else if (isFunction(tester) && !tester(arg)) {
                    const testers = {
                        'must be an Object': isObject,
                        'must be an Array': isArray,
                        'must be an Array of Strings': isArrayOfStrings,
                        'must be an Array of Functions': isArrayOfFunctions,
                        'must be a Function': isFunction,
                        'must be a String': isString,
                        'must be a non-empty String': nonEmptyString,
                        'must be an Integer': isInt,
                        'must be a Number': isNumber,
                        'must be a positive Integer': isPositiveInt,
                    };
                    const text = testers.reduce((acc, func, key) => {
                        if (tester === func) {
                            acc = key;
                        }
                        return acc;
                    }, null);
                    if (text) {
                        throw new TypeError(writeMessage(position, text));
                    } else {
                        throw new TypeError(writeMessage(position, message));
                    }
                }
            }
        })
    }, {
        force: true
    });
    // ----------------------------------------------------------------
    // Mixed functions:
    const functions = {
        addHTML:                    function (identifiant, html) {
            el(identifiant, node => {
                node.innerHTML += html;
            });
        },
        addScriptToDOM:             function (path) {
            if (path && nonEmptyString(path)) {
                path = path.trim();
                const script = document.createElement("script");
                script.setAttribute("charset", "utf-8");
                script.src = path;
                document.head.appendChild(script);
            }
        },
        addStyleToScript:           function (scriptFilename, styleFilename) {
            const path = findPathOf(scriptFilename);
            if (path) {
                var css = document.createElement("link");
                css.rel  = "stylesheet";
                css.type = "text/css";
                css.href = path+'/'+styleFilename;
                document.head.appendChild(css);
            }
        },
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

            alert('debug');
        },
        deprecated:                 function (name) {
            /**
             * @param String name
             *
             * @return void
             */
            if (!nonEmptyString(name)) { throw new TypeError("Argument must be a non-empty String."); }
            console.warn("Deprecated: '"+name.trim()+"'. This feature is no longer recommended. Avoid using it, and update existing code if possible.");
        },
        digit:                      function (param,digits) {
            var i;
            if (!isInt(digits) || !isInt(digits)) {
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
            const resolve = (arguments && arguments.length>1 && isFunction(arguments[1]) ? arguments[1] : undefined);
            const reject = (arguments && arguments.length>2 && isFunction(arguments[2]) ? arguments[2] : undefined);
            const thisArg = (arguments.length > 1 && !isFunction(arguments[1]) ?
                arguments[1]
                : (arguments.length > 2 && !isFunction(arguments[2]) ?
                    arguments[2]
                    : (arguments.length > 3 && !isFunction(arguments[3]) ?
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
        findPathOf:                 function (filename) {
            const folder = document
                .getElementsByTagName("script")
                .reduce(function (folder, script) {
                    if (script && isObject(script) && script.src) {
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
            if (isString(param)) {
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
                if (script && isObject(script) && script.src) {
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
                if (link && isObject(link) && link.href) {
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
        inbetween:                  function (value, min, max){
            return (
                isNumber(value)
                && isNumber(min)
                && isNumber(max)
                && value >= min && value <= max
            );
        },
        inbetweenStrict:            function (value, min, max){

            return (
                isNumber(value)
                && isNumber(min)
                && isNumber(max)
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

                // if (isNode(insertNode)) {
                //     doc.execCommand('insertHTML',false,insertNode.outerHTML+' ');
                // } else if (isString(insertNode)) {
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
        isArrayLike:                function(item) {
            return (
                Array.isArray(item) || 
                (!!item &&
                    typeof item === "object" &&
                    typeof (item.length) === "number" && 
                    (item.length === 0 ||
                        (item.length > 0 && 
                        (item.length - 1) in item)
                    )
                )
            );
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
        isArrayOfFunctions:         function (a){

            return (isArray(a) && a.reduce((ok, v)=>{ return (!isFunction(v) ? false : ok); }, true));
        },
        isArrayOfNumbers:           function (a){

            return (isArray(a) && a.every(v => isNumber(v)));
        },
        isArrayOfStrings:           function (a){
            
            return (isArray(a) && a.reduce((ok, v)=>{ return (!isString(v) ? false : ok); }, true));
        },
        isNullOrNonEmptyString:     v => (v === null || aa.nonEmptyString(v)),
        isObjectOfFunctions:        function (o){
            return (
                isObject(o)
                && o.reduce((ok, v)=>{ return (!isFunction(v) ? false : ok); }, true)
            );
        },
        isObjectOfObjects:          function (param) {
            let ok = true;
            if (isObject(param)) {
                ok = param.reduce((acc,data,key)=>{
                    if (!isObject(data)) {
                        acc = false;
                    }
                    return acc;
                },ok);
            }
            return ok;
        },
        isPositiveInt:              v => (isInt(v) && v >= 0),
        isPositiveNumber:           v => (isNumber(v) && v >= 0),
        isStrictlyPositiveInt:      v => (isInt(v) && v > 0),
        isStrictlyPositiveNumber:   v => (isNumber(v) && v > 0),
        isRegExp:                   function (param){
            return (
                typeof param === "object"
                && param.__proto__.constructor.name === "RegExp"
            );
        },
        isString:                   function (parametre) {

            if (typeof(parametre) === 'string') {
                return true;
            }
            else {
                return false;
            }
        },
        log:                        function (){
            console.log.apply(this, arguments);
        },
        nonEmptyString:             function (s){
            return (isString(s) && s.trim());
        },
        purgeEventHandlers:         function (node) {
            walkTheDOM(node, function (elt) {
                for (let key in elt) {
                    if (typeof elt[key] === "function") {
                        elt[key] = null;
                    }
                }
            });
        },
        removeDOM:                  function (elt){

            elt.parentNode.removeChild(elt);
        },
        replace:                    function (car1,car2,param){

            var car1;
            var car2;
            var param;
            
            return param.split(car1).join(car2);
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
                a = isNumber(a) ? a.toString() : a;
                b = isNumber(b) ? b.toString() : b;

                if (isString(a) && isString(b)) {
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
                    return (
                        a < b
                        ? -1
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
                    x = "__testStorage__";
                storage.setItem(x,x);
                storage.getItem(x);
                return true;
            }
            catch(e) {
                return false;
            }
        },
        todo:                       function (param) {
            if (isString(param)) {
                var tab     = 32,
                    method  = '';
                if (arguments && arguments.length >= 2 && isString(arguments[1]) && arguments[1].trim()) {
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
        verifyObject:               function (spec /*, strict=false */) {
            aa.arg.test(spec, isObject, `'spec'`);
            const strict = arguments.length > 1 && isBool(arguments[1]) ? arguments[1] : false;
            return arg => isObject(arg) && arg.verify(spec, strict);
        },
        walkTheDOM:                 function (node,func){
            /**
             *  Author: Douglas Crockford
             */
            func(node);
            node = node.firstChild;
            while(node){
                walkTheDOM(node, func);
                node = node.nextSibling;
            }
        },
        walkChildrenElements:       function (node, func) {
            var o = {};
            var except = [];
            if (arguments && arguments.length > 2) {
                if (arguments[2] !== null && !isArray(arguments[2]) && isObject(arguments[2])) {
                    o = arguments[2];
                }
            }
            o.forEach(function (value,key) {
                switch(key.toLowerCase()) {
                    case 'except':
                        if (isArray(value)) {
                            value.forEach(function (s) {
                                if (isString(s) && s.trim()) {
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
                if (isElement(node) && !except.has(node.nodeName.toLowerCase())) {
                    func(node);
                }
                node = node.nextSibling;
            }
        },
        warn:                       function (){
            console.warn.apply(this, arguments);
        },
    };
    aa.deploy(window, functions, {force: true});
    aa.deploy(aa, functions, {force: true});
    aa.deploy(aa, {
        defineAccessors: function (accessors /*, spec */) {
            const spec = arguments && arguments.length > 1 ? arguments[1] : {};

            aa.arg.test(accessors, isObject, `'accessors'`);
            aa.arg.test(spec, isObject, `'spec'`);

            aa.verify.call(accessors, {
                execute: aa.isObject,
                privates: aa.isObject,
                publics: aa.isObject,
                read: aa.isObject,
                write: aa.isObject
            });
            aa.verify.call(spec, {
                getter: aa.isFunction,
                setter: aa.isFunction,
            });

            const getter = spec.getter || get;
            const setter = spec.setter || set;

            accessors.forEach((keyValues, accessor) => {
                keyValues.forEach((value, key) => {
                    const thisSetter = 'set'+key.firstToUpper();
                    setter(this, key, value);
                    switch (accessor) {
                        case 'publics':
                            Object.defineProperty(this, key, {
                                get: () => {
                                    return getter(this, key);
                                },
                                set: (value) => {
                                    if (typeof this[thisSetter] === 'function') {
                                        this[thisSetter].call(this, value);
                                    } else {
                                        console.warn("Setter '"+key+"' not implemented.");
                                    }
                                }
                            });
                            break;
                        case 'read':
                            Object.defineProperty(this, key, {
                                get: () => {
                                    return getter(this, key);
                                }
                            });
                            break;
                        case 'write':
                            Object.defineProperty(this, key, {
                                set: (value) => {
                                    if (typeof this[thisSetter] === 'function') {
                                        this[thisSetter].call(this, value);
                                    } else {
                                        console.warn("Setter '"+key+"' not implemented.");
                                    }
                                }
                            });
                            break;
                        case 'execute':
                            Object.defineProperty(this, key, {
                                get: () => {
                                    return getter(this, key).call(this);
                                }
                            });
                            break;
                    }
                });
            });
        },
        getFilesFromDataTransfer: function (dataTransfer) {
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
        mapFactory: function () {
            const privates = new WeakMap();
            return Object.freeze({
                /**
                 * @param {any} that;
                 * @param {any} key;
                 *
                 * @return {any}
                 */
                get: function (that, key) {
                    aa.arg.test(key, nonEmptyString, `'key'`);

                    const results = privates.get(that, "data");
                    if (!results) {
                        return undefined;
                    }
                    return results[key];
                },

                /**
                 * @param {any} that;
                 * @param {String} key;
                 * @param {any} value;
                 *
                 * @return {void}
                 */
                set: function (that, key, value) {
                    aa.arg.test(key, nonEmptyString, `'key'`);

                    let data = privates.get(that, "data");
                    if (!data) {
                        data = {};
                    }
                    data[key] = value;
                    privates.set(that, data);
                }
            });
        },
        wait: function (delay, callback) {
            aa.arg.test(delay, isStrictlyPositiveInt, `'delay'`);
            aa.arg.test(callback, isFunction, `'callback'`);

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
        }
    });
    aa.deploy(Number.prototype, {
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

            const strict = aa.arg.optional(arguments, 2, false, isBool);
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
            if (isObject(regex) && regex.constructor && regex.constructor.name === 'RegExp') {
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
            if (!isString(str)) { throw new TypeError("Argument must be a String."); }

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
        isEqual:                function (str) {
            if (!isString(str)) { throw new TypeError("Argument must be a String."); }

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
            if (!isInt(max)) { throw new TypeError("Argument must be an Integer."); }

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
            
            if (isInt(pad) && pad >= 0) {
            } else {
                throw new TypeError('First argument must a number.');
            }
            if (arguments && arguments.length > 1) {
                if (isNumber(arguments[1]) || (isString(arguments[1]) && arguments[1].trim())) {
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
            
            if (isInt(pad) && pad >= 0) {
            } else {
                throw new TypeError('First argument must a number.');
            }
            if (arguments && arguments.length > 1) {
                if (isNumber(arguments[1]) || (isString(arguments[1]) && arguments[1].trim())) {
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
        // ----------------------------------------------------------------
        filter: function (callback /*, thisArg */) {
            if (!isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
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
        find: function (callback /*, thisArg */) {
            if (!isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
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
        clear:          function () {
            // const that = Object(this);
            // that.splice(0, that.length);
            while (this.length) {
                this.pop();
            }
        },
        getFirst:       function () {
            if (this.length) {
                return this[0];
            }
            else {
                throw new TypeError("Array.getFirst can not be called on empty Array.");
                return null;
            }
        },
        getLast:        function () {
            if (this.length) {
                return this[this.length-1];
            }
            else {
                return undefined;
            }
        },
        has:            function (p) {
            /**
             * @param {any} 
             */
            
            // Warning: returns false if given parameter is an object with indexes in a different order!

            if (isObject(p)) {
                var found = this.find(function (v) {
                    return (JSON.stringify(v) === JSON.stringify(p) && v.constructor === p.constructor);
                },this);
                return found ? true : false;
            } else if (isFunction(p)) {
                var found = this.find(function (v) {
                    return (v.toString() === p.toString());
                },this);
                return found ? true : false;
            } else {
                return this.indexOf(p) >= 0;
            }
        },
        hasKey:         function (param) {

            return (this[param] !== undefined);
        },
        hasKeyString:   function (param){
            return (typeof this[param] !== 'undefined' && isString(this[param]));
        },
        hasKeyInt:      function (param){
            return (typeof this[param] !== 'undefined' && isInt(this[param]));
        },
        hasKeyArray:    function (param){
            return (typeof this[param] !== 'undefined' && isArray(this[param]));
        },
        hasKeyObject:   function (param){
            return (typeof this[param] !== 'undefined' && isObject(this[param]));
        },
        removeElement:  function (element) {
            var i = this.indexOf(element);
            if (i > -1) {
                this.splice(i, 1);
            }
        },
        sortFloat:      function () {
            
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
        sortNatural:    function (){
            this.sort(sortNatural);
            return this;
        },
        remove:         function (item /*, removeAll=false */) {
            /**
             * Removes first or all item(s) matching the argument from the Array. Returns the first found item or undefined.
             *
             * @param {any} item
             * @param {bool} removeAll=false
             *
             * @return {any|undefined}
             */
            const removeAll = aa.arg.optional(arguments, 1, false, isBool);

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
        verify:         function (callback){
            if (!isFunction(callback)) { throw new TypeError("Argument must be a Function."); }

            return (this.filter((item)=>{
                return !callback(item);
            }).length !== 0);
        },

        // from MDN:
        every:          function (callback /*, thisArg */) {
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
        filter:         function (callback /*, thisArg */) {
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
        find:           function (callback) {
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
        findReverse:    function (callback) {
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
        forEach:        function (callback, thisArg) {
            var T, k;
            var kValue;

            if (this === null) { throw new TypeError("Array.forEach called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError("First argument must be a Function."); }

            var that = Object(this);
            var len = that.length >>> 0;

            if (arguments.length > 1) {
                T = thisArg;
            }

            k = 0;
            while(k < len) {
                if (k in that) {
                    kValue = that[k];
                    callback.call(T, kValue, k, that);
                }
                k++;
            }
        },
        // based on Array.forEach
        forEachReverse: function (callback, thisArg) {
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
        map:            function (callback, thisArg) {

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
        reduce:         function (callback /*, initialValue */) {
            "use strict";
            
            if (this === null) {
                throw new TypeError('Array.reduce called on null or undefined');
            }
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a fonction');
            }
            var t = Object(this),
                len = t.length >>> 0,
                k = 0,
                value;
            if (arguments.length == 2) {
                value = arguments[1];
            }
            else {
                while(k < len && !(k in t)) {
                    k++;
                }
                if (k >= len) {
                    throw new TypeError('Réduction de tableau vide sans valeur initiale');
                }
                value = t[k++];
            }
            for(; k < len; k++) {
                if (k in t) {
                    value = callback(value, t[k], k, t);
                }
            }
            return value;
        },
        // Production steps, ECMA-262, Edition 5, 15.4.4.21
        // Référence : http://es5.github.io/#x15.4.4.21
        reduceReverse:  function (callback /*, initialValue */) {
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
        some:           function (func /*, thisArg */) {
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
        reduceRight:    function (callback /*, initialValue */) {
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
        })()
    });
    aa.deploy(Object.prototype, {
        // ----------------------------------------------------------------
        // Object functions:
        cancel:             function (eventName, callback) {
            var bubble = (arguments && arguments.length > 2 && isBool(arguments[2]) ? arguments[2] : false);

            if (!isString(eventName) || !eventName.trim()) {
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
                || isString(this)
            ) {
                o = this;
            } else if (isArray(this)) {
                o = this.concat([]);
            } else if (isRegExp(this)) {
                o = this;
            } else if (isObject(this)) {
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

            return (this[param] !== undefined && isString(this[param]));
        },
        hasKeyInt:          function (param){

            return (this[param] !== undefined && isInt(this[param]));
        },
        hasKeyArray:        function (param){

            return (this[param] !== undefined && isArray(this[param]));
        },
        hasKeyObject:       function (param){
            return (this[param] !== undefined && isObject(this[param]));
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
        /*
         * How to use:
            obj.map(function (value, key[, item]) {
                return newValue;
            });
        */
        map:                function (callback /*, thisArg*/) {
            if (this == null) { throw new TypeError("Object.map called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError(callback + " is not a fonction"); }

            const that = Object(this);
            const o = new Object();
            const thisArg = arguments && arguments.length > 1 ? arguments[1] : undefined;

            that.keys().forEach((k)=>{
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
            var bubble = (arguments && arguments.length>2 && arguments[2] === true);

            if (isObject(eventName)) {
                eventName.forEach((callback, eventName) => {
                    this.on(eventName, callback);
                });
                return this;
            }

            if (!isString(eventName) || !eventName.trim()) {
                throw TypeError("Event name is not a valid string.");
            }
            if (!isFunction(callback) && !isObject(callback)) {
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
        some:               function (callback /*, thisArg */) {
            if (this == null) { throw new TypeError("Object.some called on null or undefined"); }
            if (typeof callback !== "function") { throw new TypeError(callback + " is not a fonction"); }
            
            const that = Object(this);
            const thisArg = arguments.length > 1 ? arguments[1] : undefined;

            that.keys().forEach((k)=>{
                if (callback.call(thisArg, that[k], k, that)) {
                    return true;
                }
            });
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

            aa.arg.test(seasoning, isObject);
            const options = aa.arg.optional(arguments, 1, {}, options => isObject(options) && options.verify({
                forceType: isBool
            }));

            seasoning.forEach((value, key) => {
                if (!this.hasOwnProperty(key)) {
                    this[key] = value;
                } else if (isObject(this[key]) && isObject(value)) {
                    this[key].sprinkle(value, options);
                } else if (this.hasOwnProperty(key)) {
                    if (options.forceType) {
                        [
                            // arg => arg === null,
                            // arg => arg === undefined,
                            isArray,
                            isBool,
                            isNumber,
                            isObject,
                            // isRegExp,
                            isString
                        ].forEach(func => {
                            if (func(this[key]) !== func(value)) {
                                this[key] = value;
                            }
                        });
                    }
                }
            });
        },
        verify:             function (dict /*, strict */) {
            /**
             * @param {object} dict
             * @param {bool} strict (optional)
             *
             * @return {boolean}
             */
            const strict = aa.arg.optional(arguments, 1, false, isBool);
            if (strict) {
                const found = dict.reduce((acc, v, k) => {
                    if (!this.hasOwnProperty(k)) {
                        acc.push(k);
                    }
                    return acc;
                }, []);
                if (found.length) {
                    cease(`Object must have ${found.length == 1 ? 'a ' : ''}'${found.join("', '")}' key${found.length > 1 ? 's' : ''}.`);
                }
            }
            aa.arg.test(dict, dict.every((v, k) => isFunction(v)), 0, "must be an Object of Functions only");

            const err = this.reduce((err, v, k)=>{
                if (!dict.hasOwnProperty(k) || !dict[k](v)) {
                    err.push(k);
                }
                return err;
            },[]);
            if (err.length) {
                console.warn("The Object contains invalid key"+(err.length>1?'s':'')+" ("+err.join(", ")+").");
            }
            
            return err.length === 0;
        },

        // ----------------------------------------------------------------
        // DOM functions:
        clear:              function () {
            while (this.children.length) {
                this.firstChild.removeNode();
            }
        },
        diveByClass:        function (className,func) {
            /**
             */
            if (isString(className) && className.trim()) {}
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
            if (isDom(that)) {
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
            if (isNode(that)) {
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
        insertAtFirst:      function (newNode) {
            /**
             * parentNode.insertAtFirst(newNode);
             */
            if (isDom(this) && isElement(newNode)) {
                if (this.childNodes.length) {
                    this.insertBefore(newNode,this.childNodes[0]);
                } else {
                    this.appendChild(newNode);
                }
            }
        },
        insertAfter:        function (newNode) {
            /**
             * thisNode.insertAfter(newNode);
             */
            if (isDom(this)) {
                if (this.nextSibling === null) {
                    this.parentNode.appendChild(newNode);
                } else {
                    this.parentNode.insertBefore(newNode, this.nextSibling);
                }
            }
        },
        removeChildren:     function () {
            if (isDom(this)) {
                while(this.hasChildNodes()) {
                    this.removeChild(this.firstChild);
                }
                return true;
            }
            return false;
        },
        removeNode:         function () {
            /**
             * thisNode.removeNode();
             */
            if (isDom(this)) {
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
            if (that && isNode(that)) {
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
             * @param 
             */
            if (!isArrayOfStrings(keys)) { throw new TypeError("Argument must be an Array."); }


            return this.filter((v, k)=>{ return !keys.has(k); });
        }
    }, {force: true});

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
                && isNumber(arguments[1])
                && inbetween(arguments[1], 0, 1)
                
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
            const resolve = (arguments && arguments.length>1 && isFunction(arguments[1]) ? arguments[1] : undefined);
            const reject = (arguments && arguments.length>2 && isFunction(arguments[2]) ? arguments[2] : undefined);
            // ----------------------------------------------------------------
            // Compliance:
            if (!isObject(spec)) { throw new TypeError("First argument must be an Object."); }
            if (!spec.verify({
                width: isStrictlyPositiveInt,
                height: isStrictlyPositiveInt,
                maxHeight: isStrictlyPositiveInt,
                maxWidth: isStrictlyPositiveInt,
                minHeight: isStrictlyPositiveInt,
                minWidth: isStrictlyPositiveInt
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

            if (!isObject(options)) { throw new TypeError("First argument must be an Object."); }
            if (resolve && !isFunction(resolve)) { throw new TypeError("Second argument must be a Function."); }
            if (reject && !isFunction(reject)) { throw new TypeError("Third argument must be a Function."); }
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

            if (resolve && !isFunction(resolve)) { throw new TypeError("First argument must be a Function."); }
            if (reject && !isFunction(reject)) { throw new TypeError("Second argument must be a Function."); }

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

            if (resolve !== undefined && !isFunction(resolve)) { throw new TypeError("First argument must be a Function."); }
            if (reject !== undefined && !isFunction(reject)) { throw new TypeError("Second argument must be a Function."); }

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
            if (isObject(o)) {
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
    aa.debounce = Object.freeze(function (callback, delay=20, spec={}) {
        /**
         * @param {Function} callback
         * @param {Integer} delay=20
         * @param {Object} spec={}
         *
         * @return {void}
         */
        if (!isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
        if (!isNumber(delay) || delay < 0) { throw new TypeError("Second argument must be an Integer greater than 0."); }
        if (!isObject(spec)) { throw new TypeError("Third argument must be an Object."); }

        let timer;
        return Object.freeze(function () {
            const that = this;
            const args = arguments;

            window.clearTimeout(timer);
            timer = window.setTimeout(()=>{
                callback.apply(that, args);
            }, delay);
        });
    });
    aa.throttle = Object.freeze(function (callback, spec={}) {
        /**
         * @param {Function} callback
         * @param {Object|Int} spec={delay: 20, end: true, start: true} (optional) If Integer is given: assign value to spec.delay
         *
         * @return {void}
         */
        if (!isFunction(callback)) { throw new TypeError("First argument must be a Function."); }
        if (!isObject(spec) && !isInt(spec)) { throw new TypeError("Second argument must be an Object or a positive Integer."); }
        if (isInt(spec)) {
            spec = { delay: spec };
        }
        const defaultSpec = {
            delay: 20,
            end: true,
            start: true
        };
        spec = Object.assign(defaultSpec, spec);
        spec.verify({
            delay: (n)=>{ return isInt(n) && n >= 0; },
            end: isBool,
            start: isBool
        });

        let timer;
        let last;
        return Object.freeze(function () {
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
        });
    });
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
            const message = (arguments && arguments.length > 1 && nonEmptyString(arguments[1]) ? arguments[1] : undefined);

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
                    if (arguments && arguments.length && isObject(arguments[0])) {
                        arguments[0].forEach(function (v,k) {
                            if (this.__self.hasOwnProperty(k)) {
                                if (typeof v === typeof this.__self[k]) {
                                    if (isString(v)) {
                                        this.__self[k] = v;
                                    } else if (isArray(v)) {
                                        v.forEach(function (txt,j) {
                                            if (isString(txt)) {
                                                this.__self[k].push(txt);
                                            } else {
                                                this.__private.valid = false;
                                                console.warn("Given '"+k+"' argument should be an Array of Strings.");
                                            }
                                        },this);
                                    } else if (isObject(v)) {
                                        v.forEach(function (version,lib) {
                                            if (nonEmptyString(version)) {
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
                    const callback = (arguments && arguments.length > 2 && isFunction(arguments[2]) ? arguments[2] : null);
                    const that = (arguments && arguments.length > 3 ? arguments[3] : undefined);

                    let ok          = true;
                    let tsuzuku     = true;
                    let expectedNew = expected;
                    let o = {expected:expected, version:version};
                    let extract = function (v) {
                        if (!nonEmptyString(v)) {
                            throw new TypeError("Given argument must be a non-empty String.");
                        }
                        if (nonEmptyString(v)) {
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

                        return isObject(o) ? (o.major*1000000)+(o.minor*1000)+(o.patch) : null;
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
                    const callback = (arguments && arguments.length > 0 && isFunction(arguments[0]) ? arguments[0] : null);

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
                    if (!nonEmptyString(lib)) {
                        throw new TypeError("First argument should be a non-empty String.")
                    }
                    if (isArray(o)) {
                        o.forEachReverse(function (v) {
                            this.set(lib,v);
                        },this);
                        return;
                    }
                    if (!isObject(o)) {
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
                    if (!nonEmptyString(lib)) {
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
                if (!isObject(spec)) { throw new TypeError("First argument must be an Object."); }
                let {name, version, dependencies} = spec;

                if (!nonEmptyString(name)) { throw new TypeError("'name' key not found in first argument."); }
                if (!nonEmptyString(version)) { throw new TypeError("'version' key not found in first argument."); }
                if (!isObject(dependencies)) { throw new TypeError("'version' key not found in first argument."); }
                
                const resolve = (arguments && arguments.length > 1 && isFunction(arguments[1]) ? arguments[1] : undefined);
                const reject = (arguments && arguments.length > 2 && isFunction(arguments[2]) ? arguments[2] : undefined);
                
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
})();
