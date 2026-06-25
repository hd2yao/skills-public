"use strict";

function tableMatrixToObjects(columns, rows) {
  return rows.map((row) => {
    const item = {};
    columns.forEach((column, index) => {
      item[column] = redactCell(row[index] === undefined ? "" : row[index]);
    });
    return item;
  });
}

function keyValueTextToObject(text) {
  const result = {};
  for (const line of String(text).split(/\r?\n/)) {
    const match = line.match(/^\s*([^:：]+)\s*[:：]\s*(.+?)\s*$/);
    if (match) {
      result[match[1].trim()] = redactCell(match[2].trim());
    }
  }
  return result;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  return [
    columns.map(escapeCsv).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")),
  ].join("\n");
}

function redactCell(value) {
  const text = String(value);
  if (/^1[3-9]\d{9}$/.test(text)) {
    return `${text.slice(0, 3)}****${text.slice(-4)}`;
  }
  if (/^\d{17}[\dXx]$/.test(text)) {
    return `${text.slice(0, 6)}********${text.slice(-4)}`;
  }
  return text;
}

function escapeCsv(value) {
  const text = String(value === undefined || value === null ? "" : value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

module.exports = {
  escapeCsv,
  keyValueTextToObject,
  redactCell,
  tableMatrixToObjects,
  toCsv,
};
