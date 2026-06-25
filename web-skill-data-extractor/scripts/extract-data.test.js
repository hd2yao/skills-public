"use strict";

const assert = require("node:assert/strict");
const {
  keyValueTextToObject,
  redactCell,
  tableMatrixToObjects,
  toCsv,
} = require("./extract-data");

const rows = tableMatrixToObjects(
  ["订单号", "手机号", "金额"],
  [["A001", "13800008888", "99.00"]],
);

assert.deepEqual(rows, [
  {
    "订单号": "A001",
    "手机号": "138****8888",
    "金额": "99.00",
  },
]);
assert.equal(redactCell("110101199001011234"), "110101********1234");
assert.deepEqual(keyValueTextToObject("订单号：A001\n手机号: 13800008888"), {
  "订单号": "A001",
  "手机号": "138****8888",
});
assert.equal(toCsv(rows), "订单号,手机号,金额\nA001,138****8888,99.00");

console.log("extract-data tests ok");
