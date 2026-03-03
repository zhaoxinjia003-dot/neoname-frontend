"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const trustItems = [
      { icon: "◆", title: "顶尖 AI 大模型", desc: "AI 深度分析汉字音形义" },
      { icon: "◇", title: "各地民俗融合", desc: "覆盖30+省市起名习俗" },
      { icon: "◆", title: "国学命理精研", desc: "八字五行+周易卦象" },
      { icon: "◇", title: "智能精准推荐", desc: "亿级语料多维评分" }
    ];
    const form = common_vendor.reactive({
      surname: "",
      gender: "male",
      birth_date: "",
      name_length: "double",
      avoided_chars: ""
    });
    function onDateChange(e) {
      form.birth_date = e.detail.value;
    }
    async function onSubmit() {
      if (!form.surname.trim()) {
        common_vendor.index.showToast({ title: "请填写姓氏", icon: "none" });
        return;
      }
      if (!form.birth_date) {
        common_vendor.index.showToast({ title: "请选择出生日期", icon: "none" });
        return;
      }
      common_vendor.index.showLoading({ title: "请先授权登录" });
      try {
        const { request, setToken } = await "../../utils/request.js";
        let token = common_vendor.index.getStorageSync("access_token");
        if (!token) {
          const loginRes = await request({
            url: "/api/auth/wechat/login",
            method: "POST",
            data: { code: "mock-code" }
          });
          token = loginRes.access_token;
          setToken(token);
        }
        const newbornRes = await request({
          url: "/api/newborns",
          method: "POST",
          data: {
            surname: form.surname.trim(),
            gender: form.gender,
            birth_date: form.birth_date,
            name_length: form.name_length,
            avoided_chars: form.avoided_chars || void 0
          }
        });
        const genRes = await request({
          url: "/api/names/generate",
          method: "POST",
          data: { newborn_id: newbornRes.newborn_id }
        });
        common_vendor.index.hideLoading();
        common_vendor.index.navigateTo({
          url: `/pages/result/result?batch_id=${genRes.batch_id}&unlocked=${genRes.is_unlocked ? 1 : 0}`
        });
      } catch (e) {
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({ title: e.message || "失败", icon: "none" });
      }
    }
    return (_ctx, _cache) => {
      return {
        a: common_assets._imports_0,
        b: common_vendor.f(trustItems, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.icon),
            b: common_vendor.t(item.title),
            c: common_vendor.t(item.desc),
            d: item.title
          };
        }),
        c: form.surname,
        d: common_vendor.o(($event) => form.surname = $event.detail.value),
        e: common_vendor.n(form.gender === "male" && "form-option--active"),
        f: common_vendor.o(($event) => form.gender = "male"),
        g: common_vendor.n(form.gender === "female" && "form-option--active"),
        h: common_vendor.o(($event) => form.gender = "female"),
        i: common_vendor.t(form.birth_date || "请选择出生日期"),
        j: common_vendor.n(!form.birth_date && "form-picker--placeholder"),
        k: form.birth_date,
        l: common_vendor.o(onDateChange),
        m: common_vendor.n(form.name_length === "single" && "form-option--active"),
        n: common_vendor.o(($event) => form.name_length = "single"),
        o: common_vendor.n(form.name_length === "double" && "form-option--active"),
        p: common_vendor.o(($event) => form.name_length = "double"),
        q: form.avoided_chars,
        r: common_vendor.o(($event) => form.avoided_chars = $event.detail.value),
        s: common_vendor.o(onSubmit)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
