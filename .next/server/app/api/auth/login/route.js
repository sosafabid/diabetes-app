"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/login/route";
exports.ids = ["app/api/auth/login/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_fabiola_Downloads_diabetes_app_app_api_auth_login_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/auth/login/route.ts */ \"(rsc)/./app/api/auth/login/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/login/route\",\n        pathname: \"/api/auth/login\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/login/route\"\n    },\n    resolvedPagePath: \"/Users/fabiola/Downloads/diabetes-app/app/api/auth/login/route.ts\",\n    nextConfigOutput,\n    userland: _Users_fabiola_Downloads_diabetes_app_app_api_auth_login_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/login/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGbG9naW4lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmF1dGglMkZsb2dpbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmF1dGglMkZsb2dpbiUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRmZhYmlvbGElMkZEb3dubG9hZHMlMkZkaWFiZXRlcy1hcHAlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGZmFiaW9sYSUyRkRvd25sb2FkcyUyRmRpYWJldGVzLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDaUI7QUFDOUY7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kaWFiZXRlcy1jb21wYW5pb24tbXZwLz9mMWRjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9mYWJpb2xhL0Rvd25sb2Fkcy9kaWFiZXRlcy1hcHAvYXBwL2FwaS9hdXRoL2xvZ2luL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdXRoL2xvZ2luL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9sb2dpblwiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvYXV0aC9sb2dpbi9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9mYWJpb2xhL0Rvd25sb2Fkcy9kaWFiZXRlcy1hcHAvYXBwL2FwaS9hdXRoL2xvZ2luL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9hdXRoL2xvZ2luL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/auth/login/route.ts":
/*!*************************************!*\
  !*** ./app/api/auth/login/route.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _src_lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../src/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var _src_lib_session__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../src/lib/session */ \"(rsc)/./src/lib/session.ts\");\n\n\n\n\nasync function POST(request) {\n    let body;\n    try {\n        body = await request.json();\n    } catch  {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Solicitud inv\\xe1lida.\"\n        }, {\n            status: 400\n        });\n    }\n    const email = body.email?.trim().toLowerCase();\n    const password = body.password;\n    if (!email || !password) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Correo y contrase\\xf1a son obligatorios.\"\n        }, {\n            status: 400\n        });\n    }\n    const user = await _src_lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n        where: {\n            email\n        }\n    });\n    // Mensaje genérico a propósito: no revelar si el correo existe o no.\n    const genericError = {\n        error: \"Correo o contrase\\xf1a incorrectos.\"\n    };\n    if (!user) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(genericError, {\n            status: 401\n        });\n    }\n    const valid = await bcryptjs__WEBPACK_IMPORTED_MODULE_1___default().compare(password, user.passwordHash);\n    if (!valid) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(genericError, {\n            status: 401\n        });\n    }\n    await _src_lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.auditLog.create({\n        data: {\n            userId: user.id,\n            action: \"LOGIN\"\n        }\n    });\n    await (0,_src_lib_session__WEBPACK_IMPORTED_MODULE_3__.createSessionCookie)({\n        userId: user.id,\n        email: user.email\n    });\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        ok: true\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2F1dGgvbG9naW4vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQTJDO0FBQ2I7QUFDc0I7QUFDYztBQUUzRCxlQUFlSSxLQUFLQyxPQUFnQjtJQUN6QyxJQUFJQztJQUNKLElBQUk7UUFDRkEsT0FBTyxNQUFNRCxRQUFRRSxJQUFJO0lBQzNCLEVBQUUsT0FBTTtRQUNOLE9BQU9QLHFEQUFZQSxDQUFDTyxJQUFJLENBQ3RCO1lBQUVDLE9BQU87UUFBc0IsR0FDL0I7WUFBRUMsUUFBUTtRQUFJO0lBRWxCO0lBRUEsTUFBTUMsUUFBUUosS0FBS0ksS0FBSyxFQUFFQyxPQUFPQztJQUNqQyxNQUFNQyxXQUFXUCxLQUFLTyxRQUFRO0lBRTlCLElBQUksQ0FBQ0gsU0FBUyxDQUFDRyxVQUFVO1FBQ3ZCLE9BQU9iLHFEQUFZQSxDQUFDTyxJQUFJLENBQ3RCO1lBQUVDLE9BQU87UUFBd0MsR0FDakQ7WUFBRUMsUUFBUTtRQUFJO0lBRWxCO0lBRUEsTUFBTUssT0FBTyxNQUFNWixtREFBTUEsQ0FBQ1ksSUFBSSxDQUFDQyxVQUFVLENBQUM7UUFBRUMsT0FBTztZQUFFTjtRQUFNO0lBQUU7SUFDN0QscUVBQXFFO0lBQ3JFLE1BQU1PLGVBQWU7UUFBRVQsT0FBTztJQUFtQztJQUVqRSxJQUFJLENBQUNNLE1BQU07UUFDVCxPQUFPZCxxREFBWUEsQ0FBQ08sSUFBSSxDQUFDVSxjQUFjO1lBQUVSLFFBQVE7UUFBSTtJQUN2RDtJQUVBLE1BQU1TLFFBQVEsTUFBTWpCLHVEQUFjLENBQUNZLFVBQVVDLEtBQUtNLFlBQVk7SUFDOUQsSUFBSSxDQUFDRixPQUFPO1FBQ1YsT0FBT2xCLHFEQUFZQSxDQUFDTyxJQUFJLENBQUNVLGNBQWM7WUFBRVIsUUFBUTtRQUFJO0lBQ3ZEO0lBRUEsTUFBTVAsbURBQU1BLENBQUNtQixRQUFRLENBQUNDLE1BQU0sQ0FBQztRQUMzQkMsTUFBTTtZQUFFQyxRQUFRVixLQUFLVyxFQUFFO1lBQUVDLFFBQVE7UUFBUTtJQUMzQztJQUVBLE1BQU12QixxRUFBbUJBLENBQUM7UUFBRXFCLFFBQVFWLEtBQUtXLEVBQUU7UUFBRWYsT0FBT0ksS0FBS0osS0FBSztJQUFDO0lBRS9ELE9BQU9WLHFEQUFZQSxDQUFDTyxJQUFJLENBQUM7UUFBRW9CLElBQUk7SUFBSztBQUN0QyIsInNvdXJjZXMiOlsid2VicGFjazovL2RpYWJldGVzLWNvbXBhbmlvbi1tdnAvLi9hcHAvYXBpL2F1dGgvbG9naW4vcm91dGUudHM/NGYyNCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tIFwibmV4dC9zZXJ2ZXJcIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5pbXBvcnQgeyBwcmlzbWEgfSBmcm9tIFwiLi4vLi4vLi4vLi4vc3JjL2xpYi9wcmlzbWFcIjtcbmltcG9ydCB7IGNyZWF0ZVNlc3Npb25Db29raWUgfSBmcm9tIFwiLi4vLi4vLi4vLi4vc3JjL2xpYi9zZXNzaW9uXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcXVlc3Q6IFJlcXVlc3QpIHtcbiAgbGV0IGJvZHk6IHsgZW1haWw/OiBzdHJpbmc7IHBhc3N3b3JkPzogc3RyaW5nIH07XG4gIHRyeSB7XG4gICAgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXG4gICAgICB7IGVycm9yOiBcIlNvbGljaXR1ZCBpbnbDoWxpZGEuXCIgfSxcbiAgICAgIHsgc3RhdHVzOiA0MDAgfSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZW1haWwgPSBib2R5LmVtYWlsPy50cmltKCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgcGFzc3dvcmQgPSBib2R5LnBhc3N3b3JkO1xuXG4gIGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgeyBlcnJvcjogXCJDb3JyZW8geSBjb250cmFzZcOxYSBzb24gb2JsaWdhdG9yaW9zLlwiIH0sXG4gICAgICB7IHN0YXR1czogNDAwIH0sXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHsgd2hlcmU6IHsgZW1haWwgfSB9KTtcbiAgLy8gTWVuc2FqZSBnZW7DqXJpY28gYSBwcm9ww7NzaXRvOiBubyByZXZlbGFyIHNpIGVsIGNvcnJlbyBleGlzdGUgbyBuby5cbiAgY29uc3QgZ2VuZXJpY0Vycm9yID0geyBlcnJvcjogXCJDb3JyZW8gbyBjb250cmFzZcOxYSBpbmNvcnJlY3Rvcy5cIiB9O1xuXG4gIGlmICghdXNlcikge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihnZW5lcmljRXJyb3IsIHsgc3RhdHVzOiA0MDEgfSk7XG4gIH1cblxuICBjb25zdCB2YWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKHBhc3N3b3JkLCB1c2VyLnBhc3N3b3JkSGFzaCk7XG4gIGlmICghdmFsaWQpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oZ2VuZXJpY0Vycm9yLCB7IHN0YXR1czogNDAxIH0pO1xuICB9XG5cbiAgYXdhaXQgcHJpc21hLmF1ZGl0TG9nLmNyZWF0ZSh7XG4gICAgZGF0YTogeyB1c2VySWQ6IHVzZXIuaWQsIGFjdGlvbjogXCJMT0dJTlwiIH0sXG4gIH0pO1xuXG4gIGF3YWl0IGNyZWF0ZVNlc3Npb25Db29raWUoeyB1c2VySWQ6IHVzZXIuaWQsIGVtYWlsOiB1c2VyLmVtYWlsIH0pO1xuXG4gIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IG9rOiB0cnVlIH0pO1xufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImJjcnlwdCIsInByaXNtYSIsImNyZWF0ZVNlc3Npb25Db29raWUiLCJQT1NUIiwicmVxdWVzdCIsImJvZHkiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJlbWFpbCIsInRyaW0iLCJ0b0xvd2VyQ2FzZSIsInBhc3N3b3JkIiwidXNlciIsImZpbmRVbmlxdWUiLCJ3aGVyZSIsImdlbmVyaWNFcnJvciIsInZhbGlkIiwiY29tcGFyZSIsInBhc3N3b3JkSGFzaCIsImF1ZGl0TG9nIiwiY3JlYXRlIiwiZGF0YSIsInVzZXJJZCIsImlkIiwiYWN0aW9uIiwib2siXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/auth/login/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n// Cliente de Prisma como singleton — necesario en Next.js para no crear una\n// conexión nueva en cada hot-reload durante desarrollo.\n\nconst globalForPrisma = globalThis;\nconst prisma = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) {\n    globalForPrisma.prisma = prisma;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw0RUFBNEU7QUFDNUUsd0RBQXdEO0FBQ1Y7QUFFOUMsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUFTRixnQkFBZ0JFLE1BQU0sSUFBSSxJQUFJSCx3REFBWUEsR0FBRztBQUVuRSxJQUFJSSxJQUFxQyxFQUFFO0lBQ3pDSCxnQkFBZ0JFLE1BQU0sR0FBR0E7QUFDM0IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9kaWFiZXRlcy1jb21wYW5pb24tbXZwLy4vc3JjL2xpYi9wcmlzbWEudHM/MDFkNyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDbGllbnRlIGRlIFByaXNtYSBjb21vIHNpbmdsZXRvbiDigJQgbmVjZXNhcmlvIGVuIE5leHQuanMgcGFyYSBubyBjcmVhciB1bmFcbi8vIGNvbmV4acOzbiBudWV2YSBlbiBjYWRhIGhvdC1yZWxvYWQgZHVyYW50ZSBkZXNhcnJvbGxvLlxuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSBcIkBwcmlzbWEvY2xpZW50XCI7XG5cbmNvbnN0IGdsb2JhbEZvclByaXNtYSA9IGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7IHByaXNtYT86IFByaXNtYUNsaWVudCB9O1xuXG5leHBvcnQgY29uc3QgcHJpc21hID0gZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA/PyBuZXcgUHJpc21hQ2xpZW50KCk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIHtcbiAgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSA9IHByaXNtYTtcbn1cbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwicHJpc21hIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/session.ts":
/*!****************************!*\
  !*** ./src/lib/session.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   clearSessionCookie: () => (/* binding */ clearSessionCookie),\n/* harmony export */   createSessionCookie: () => (/* binding */ createSessionCookie),\n/* harmony export */   getSession: () => (/* binding */ getSession)\n/* harmony export */ });\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/sign.js\");\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/verify.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n// ============================================================================\n// Sesión de usuario — JWT firmado en cookie httpOnly.\n// ============================================================================\n// No usamos un framework de auth completo (NextAuth, etc.) para mantener el\n// MVP simple y auditable: el flujo entero (login, verificación, logout) cabe\n// en este archivo y en las 3 rutas de app/api/auth/*.\n// ============================================================================\n\n\nconst SESSION_COOKIE = \"session\";\nconst SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 días\nfunction getSecretKey() {\n    const secret = process.env.SESSION_SECRET;\n    if (!secret) {\n        throw new Error(\"Falta la variable de entorno SESSION_SECRET (necesaria para firmar la sesi\\xf3n).\");\n    }\n    return new TextEncoder().encode(secret);\n}\nasync function createSessionCookie(payload) {\n    const token = await new jose__WEBPACK_IMPORTED_MODULE_1__.SignJWT({\n        ...payload\n    }).setProtectedHeader({\n        alg: \"HS256\"\n    }).setIssuedAt().setExpirationTime(`${SESSION_DURATION_SECONDS}s`).sign(getSecretKey());\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n    cookieStore.set(SESSION_COOKIE, token, {\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"lax\",\n        path: \"/\",\n        maxAge: SESSION_DURATION_SECONDS\n    });\n}\nasync function clearSessionCookie() {\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n    cookieStore.delete(SESSION_COOKIE);\n}\n/** Lee y valida la sesión actual. Devuelve null si no hay sesión o es inválida. */ async function getSession() {\n    const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n    const token = cookieStore.get(SESSION_COOKIE)?.value;\n    if (!token) return null;\n    try {\n        const { payload } = await (0,jose__WEBPACK_IMPORTED_MODULE_2__.jwtVerify)(token, getSecretKey());\n        if (typeof payload.userId !== \"string\" || typeof payload.email !== \"string\") {\n            return null;\n        }\n        return {\n            userId: payload.userId,\n            email: payload.email\n        };\n    } catch  {\n        return null;\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3Nlc3Npb24udHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsK0VBQStFO0FBQy9FLHNEQUFzRDtBQUN0RCwrRUFBK0U7QUFDL0UsNEVBQTRFO0FBQzVFLDZFQUE2RTtBQUM3RSxzREFBc0Q7QUFDdEQsK0VBQStFO0FBQ3JDO0FBQ0g7QUFFdkMsTUFBTUcsaUJBQWlCO0FBQ3ZCLE1BQU1DLDJCQUEyQixLQUFLLEtBQUssS0FBSyxJQUFJLFVBQVU7QUFFOUQsU0FBU0M7SUFDUCxNQUFNQyxTQUFTQyxRQUFRQyxHQUFHLENBQUNDLGNBQWM7SUFDekMsSUFBSSxDQUFDSCxRQUFRO1FBQ1gsTUFBTSxJQUFJSSxNQUNSO0lBRUo7SUFDQSxPQUFPLElBQUlDLGNBQWNDLE1BQU0sQ0FBQ047QUFDbEM7QUFPTyxlQUFlTyxvQkFBb0JDLE9BQXVCO0lBQy9ELE1BQU1DLFFBQVEsTUFBTSxJQUFJZix5Q0FBT0EsQ0FBQztRQUFFLEdBQUdjLE9BQU87SUFBQyxHQUMxQ0Usa0JBQWtCLENBQUM7UUFBRUMsS0FBSztJQUFRLEdBQ2xDQyxXQUFXLEdBQ1hDLGlCQUFpQixDQUFDLENBQUMsRUFBRWYseUJBQXlCLENBQUMsQ0FBQyxFQUNoRGdCLElBQUksQ0FBQ2Y7SUFFUixNQUFNZ0IsY0FBYyxNQUFNbkIscURBQU9BO0lBQ2pDbUIsWUFBWUMsR0FBRyxDQUFDbkIsZ0JBQWdCWSxPQUFPO1FBQ3JDUSxVQUFVO1FBQ1ZDLFFBQVFqQixrQkFBeUI7UUFDakNrQixVQUFVO1FBQ1ZDLE1BQU07UUFDTkMsUUFBUXZCO0lBQ1Y7QUFDRjtBQUVPLGVBQWV3QjtJQUNwQixNQUFNUCxjQUFjLE1BQU1uQixxREFBT0E7SUFDakNtQixZQUFZUSxNQUFNLENBQUMxQjtBQUNyQjtBQUVBLGlGQUFpRixHQUMxRSxlQUFlMkI7SUFDcEIsTUFBTVQsY0FBYyxNQUFNbkIscURBQU9BO0lBQ2pDLE1BQU1hLFFBQVFNLFlBQVlVLEdBQUcsQ0FBQzVCLGlCQUFpQjZCO0lBQy9DLElBQUksQ0FBQ2pCLE9BQU8sT0FBTztJQUVuQixJQUFJO1FBQ0YsTUFBTSxFQUFFRCxPQUFPLEVBQUUsR0FBRyxNQUFNYiwrQ0FBU0EsQ0FBQ2MsT0FBT1Y7UUFDM0MsSUFBSSxPQUFPUyxRQUFRbUIsTUFBTSxLQUFLLFlBQVksT0FBT25CLFFBQVFvQixLQUFLLEtBQUssVUFBVTtZQUMzRSxPQUFPO1FBQ1Q7UUFDQSxPQUFPO1lBQUVELFFBQVFuQixRQUFRbUIsTUFBTTtZQUFFQyxPQUFPcEIsUUFBUW9CLEtBQUs7UUFBQztJQUN4RCxFQUFFLE9BQU07UUFDTixPQUFPO0lBQ1Q7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL2RpYWJldGVzLWNvbXBhbmlvbi1tdnAvLi9zcmMvbGliL3Nlc3Npb24udHM/OGRmOSJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBTZXNpw7NuIGRlIHVzdWFyaW8g4oCUIEpXVCBmaXJtYWRvIGVuIGNvb2tpZSBodHRwT25seS5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIE5vIHVzYW1vcyB1biBmcmFtZXdvcmsgZGUgYXV0aCBjb21wbGV0byAoTmV4dEF1dGgsIGV0Yy4pIHBhcmEgbWFudGVuZXIgZWxcbi8vIE1WUCBzaW1wbGUgeSBhdWRpdGFibGU6IGVsIGZsdWpvIGVudGVybyAobG9naW4sIHZlcmlmaWNhY2nDs24sIGxvZ291dCkgY2FiZVxuLy8gZW4gZXN0ZSBhcmNoaXZvIHkgZW4gbGFzIDMgcnV0YXMgZGUgYXBwL2FwaS9hdXRoLyouXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pbXBvcnQgeyBTaWduSldULCBqd3RWZXJpZnkgfSBmcm9tIFwiam9zZVwiO1xuaW1wb3J0IHsgY29va2llcyB9IGZyb20gXCJuZXh0L2hlYWRlcnNcIjtcblxuY29uc3QgU0VTU0lPTl9DT09LSUUgPSBcInNlc3Npb25cIjtcbmNvbnN0IFNFU1NJT05fRFVSQVRJT05fU0VDT05EUyA9IDYwICogNjAgKiAyNCAqIDMwOyAvLyAzMCBkw61hc1xuXG5mdW5jdGlvbiBnZXRTZWNyZXRLZXkoKSB7XG4gIGNvbnN0IHNlY3JldCA9IHByb2Nlc3MuZW52LlNFU1NJT05fU0VDUkVUO1xuICBpZiAoIXNlY3JldCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIFwiRmFsdGEgbGEgdmFyaWFibGUgZGUgZW50b3JubyBTRVNTSU9OX1NFQ1JFVCAobmVjZXNhcmlhIHBhcmEgZmlybWFyIGxhIHNlc2nDs24pLlwiLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzZWNyZXQpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25QYXlsb2FkIHtcbiAgdXNlcklkOiBzdHJpbmc7XG4gIGVtYWlsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVTZXNzaW9uQ29va2llKHBheWxvYWQ6IFNlc3Npb25QYXlsb2FkKSB7XG4gIGNvbnN0IHRva2VuID0gYXdhaXQgbmV3IFNpZ25KV1QoeyAuLi5wYXlsb2FkIH0pXG4gICAgLnNldFByb3RlY3RlZEhlYWRlcih7IGFsZzogXCJIUzI1NlwiIH0pXG4gICAgLnNldElzc3VlZEF0KClcbiAgICAuc2V0RXhwaXJhdGlvblRpbWUoYCR7U0VTU0lPTl9EVVJBVElPTl9TRUNPTkRTfXNgKVxuICAgIC5zaWduKGdldFNlY3JldEtleSgpKTtcblxuICBjb25zdCBjb29raWVTdG9yZSA9IGF3YWl0IGNvb2tpZXMoKTtcbiAgY29va2llU3RvcmUuc2V0KFNFU1NJT05fQ09PS0lFLCB0b2tlbiwge1xuICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIHNhbWVTaXRlOiBcImxheFwiLFxuICAgIHBhdGg6IFwiL1wiLFxuICAgIG1heEFnZTogU0VTU0lPTl9EVVJBVElPTl9TRUNPTkRTLFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyU2Vzc2lvbkNvb2tpZSgpIHtcbiAgY29uc3QgY29va2llU3RvcmUgPSBhd2FpdCBjb29raWVzKCk7XG4gIGNvb2tpZVN0b3JlLmRlbGV0ZShTRVNTSU9OX0NPT0tJRSk7XG59XG5cbi8qKiBMZWUgeSB2YWxpZGEgbGEgc2VzacOzbiBhY3R1YWwuIERldnVlbHZlIG51bGwgc2kgbm8gaGF5IHNlc2nDs24gbyBlcyBpbnbDoWxpZGEuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2Vzc2lvbigpOiBQcm9taXNlPFNlc3Npb25QYXlsb2FkIHwgbnVsbD4ge1xuICBjb25zdCBjb29raWVTdG9yZSA9IGF3YWl0IGNvb2tpZXMoKTtcbiAgY29uc3QgdG9rZW4gPSBjb29raWVTdG9yZS5nZXQoU0VTU0lPTl9DT09LSUUpPy52YWx1ZTtcbiAgaWYgKCF0b2tlbikgcmV0dXJuIG51bGw7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IHBheWxvYWQgfSA9IGF3YWl0IGp3dFZlcmlmeSh0b2tlbiwgZ2V0U2VjcmV0S2V5KCkpO1xuICAgIGlmICh0eXBlb2YgcGF5bG9hZC51c2VySWQgIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHBheWxvYWQuZW1haWwgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4geyB1c2VySWQ6IHBheWxvYWQudXNlcklkLCBlbWFpbDogcGF5bG9hZC5lbWFpbCB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIlNpZ25KV1QiLCJqd3RWZXJpZnkiLCJjb29raWVzIiwiU0VTU0lPTl9DT09LSUUiLCJTRVNTSU9OX0RVUkFUSU9OX1NFQ09ORFMiLCJnZXRTZWNyZXRLZXkiLCJzZWNyZXQiLCJwcm9jZXNzIiwiZW52IiwiU0VTU0lPTl9TRUNSRVQiLCJFcnJvciIsIlRleHRFbmNvZGVyIiwiZW5jb2RlIiwiY3JlYXRlU2Vzc2lvbkNvb2tpZSIsInBheWxvYWQiLCJ0b2tlbiIsInNldFByb3RlY3RlZEhlYWRlciIsImFsZyIsInNldElzc3VlZEF0Iiwic2V0RXhwaXJhdGlvblRpbWUiLCJzaWduIiwiY29va2llU3RvcmUiLCJzZXQiLCJodHRwT25seSIsInNlY3VyZSIsInNhbWVTaXRlIiwicGF0aCIsIm1heEFnZSIsImNsZWFyU2Vzc2lvbkNvb2tpZSIsImRlbGV0ZSIsImdldFNlc3Npb24iLCJnZXQiLCJ2YWx1ZSIsInVzZXJJZCIsImVtYWlsIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/session.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/jose","vendor-chunks/bcryptjs"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogin%2Froute&page=%2Fapi%2Fauth%2Flogin%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogin%2Froute.ts&appDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Ffabiola%2FDownloads%2Fdiabetes-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();