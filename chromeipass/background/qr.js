qr = {};
qr.uid = generateQRCode();

uid = qr.uid;
console.log("The value of the uid is  " + uid);

function generateQRCode(){
  var x = sjcl.random.randomWords(4);
  var encoded = sjcl.codec.base64.fromBits(x);
  return encoded;
}
