"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awaitErrorHandlerWrapper = function (wrappedPromise, errorCB) {
    return wrappedPromise.catch(errorCB);
};
