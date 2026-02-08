import crypto from "crypto";

const sha1Hash = crypto.createHash("sha1").update("asd").digest("hex");
const sha256Hash = crypto.createHash("sha256").update("asd").digest("hex");
const sha384Hash = crypto.createHash("sha384").update("asd").digest("hex");
console.log({ sha1Hash });
console.log({ sha256Hash });
console.log({ sha384Hash });
