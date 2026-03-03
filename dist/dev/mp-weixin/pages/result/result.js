"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "result",
  setup(__props) {
    const batchId = common_vendor.ref(0);
    const unlocked = common_vendor.ref(false);
    const names = common_vendor.ref([]);
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const cur = pages[pages.length - 1];
      const options = cur.options || {};
      batchId.value = parseInt(options.batch_id || "0", 10);
      unlocked.value = options.unlocked === "1";
      loadResult();
    });
    async function loadResult() {
      if (!batchId.value)
        return;
      try {
        const r = await utils_request.request({ url: `/api/names/batches/${batchId.value}` });
        names.value = r.names || [];
        unlocked.value = !!r.is_unlocked;
      } catch (_) {
        names.value = [];
      }
    }
    async function onUnlock() {
      try {
        await utils_request.request({
          url: "/api/payments/orders",
          method: "POST",
          data: { batch_id: batchId.value }
        });
        await utils_request.request({
          url: "/api/payments/mock/pay",
          method: "POST",
          data: { batch_id: batchId.value, amount: 0.5 }
        });
        common_vendor.index.showToast({ title: "已解锁" });
        await loadResult();
      } catch (e) {
        common_vendor.index.showToast({ title: e.message || "解锁失败", icon: "none" });
      }
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: names.value.length
      }, names.value.length ? {
        b: common_vendor.f(names.value, (item, i, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.name),
            b: common_vendor.t(item.teaser),
            c: unlocked.value && item.reason
          }, unlocked.value && item.reason ? {
            d: common_vendor.t(item.reason)
          } : !unlocked.value ? {} : {}, {
            e: i
          });
        }),
        c: !unlocked.value
      } : {}, {
        d: !unlocked.value && batchId.value
      }, !unlocked.value && batchId.value ? {
        e: common_vendor.o(onUnlock)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-d38065ce"]]);
wx.createPage(MiniProgramPage);
