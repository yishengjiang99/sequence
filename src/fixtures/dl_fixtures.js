require("fs").writeFileSync("midif.js", `export const midfile=new Uint8Array([${new Uint8Array(require("fs").readFileSync(require("path").resolve(__dirname, "41197.mid")).buffer).join(",")}]);`);