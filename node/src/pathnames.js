var pathCertificates = __dirname + "/" + "../certificates_secret";


var pathnamePrivateKey = `${pathCertificates}/private_key.pem`;
var pathnameCertificate = `${pathCertificates}/certificate.pem`;

module.exports = {
  pathnamePrivateKey,
  pathnameCertificate,
  pathCertificates
}
