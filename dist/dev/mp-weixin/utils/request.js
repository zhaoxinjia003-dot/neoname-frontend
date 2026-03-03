"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("../common/vendor.js");
const BASE_URL = "http://localhost:8000";
function getToken() {
  return common_vendor.index.getStorageSync("access_token") || "";
}
function request(options) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...token ? { Authorization: "Bearer " + token } : {},
        ...options.header
      },
      success: (res) => {
        var _a;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(((_a = res.data) == null ? void 0 : _a.detail) || "请求失败"));
        }
      },
      fail: reject
    });
  });
}
function setToken(token) {
  common_vendor.index.setStorageSync("access_token", token);
}
exports.request = request;
exports.setToken = setToken;
