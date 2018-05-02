#include "logging.h"
#include <sstream>
#include <iomanip>
#include "gpu.h"
#include "cl/secp256k1.h"


Logger logTest("../logfiles/logTest.txt", "[test] ");


secp256k1_callback criticalFailure;

void criticalFailureHandler(const char *text, void* data){
  (void) data;
  logTest << text;
}

std::string toStringSecp256k1_Scalar(secp256k1_scalar& input) {
  std::stringstream out;
  for (int i = 0; i < 8; i ++)
    out << std::hex << std::setfill('0') << std::setw(8) << input.d[i];
  return out.str();
}

std::string toStringSecp256k1_ECPoint(secp256k1_ge& input) {
  std::stringstream out;
  out << "x: ";
  for (int i = 0; i < 10; i ++)
    out << std::hex << std::setfill('0') << std::setw(8) << input.x.n[i];
  out << "; y: ";
  for (int i = 0; i < 10; i ++)
    out << std::hex << std::setfill('0') << std::setw(8) << input.y.n[i];
  return out.str();
}

int mainTest() {
  GPU theGPU;
  theGPU.initialize();
  if (!theGPU.createKernel(
    theGPU.kernelVerifySignature,
    {"signatureR", "signatureS", "publicKey", "message"},
    {
      SharedMemory::typeVoidPointer, SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer, SharedMemory::typeVoidPointer
    },
    {"result"},
    {SharedMemory::typeVoidPointer}
  )) {
    logTest << "Failed to create kernel" << Logger::endL;
    return - 1;
  }


  logTest << "Got to here. " << Logger::endL;
  criticalFailure.data = 0;
  criticalFailure.fn = criticalFailureHandler;
  secp256k1_ecmult_context multiplicationContext;
  secp256k1_ecmult_context_init(&multiplicationContext);
  secp256k1_ecmult_context_build(&multiplicationContext, &criticalFailure, NULL);
  logTest << "Got to here pt 2. " << Logger::endL;
  secp256k1_ecmult_gen_context generatorContext;
  logTest << "Got to here pt 3. " << Logger::endL;
  secp256k1_ecmult_gen_context_init(&generatorContext);
  secp256k1_ecmult_gen_context_build(&generatorContext, &criticalFailure, NULL);
  logTest << "Got to here pt 4. " << Logger::endL;
  secp256k1_scalar signatureS, signatureR;
  secp256k1_scalar secretKey = SECP256K1_SCALAR_CONST(
    13, 17, 19, 0, 0, 0, 0, 0
  );
  secp256k1_scalar message = SECP256K1_SCALAR_CONST(
    2, 3, 5, 7, 11, 13, 17, 19
  );
  secp256k1_scalar nonce = SECP256K1_SCALAR_CONST(
    3, 5, 7, 11, 13, 17, 19, 23
  );
  secp256k1_ge publicKey;
  secp256k1_gej publicKeyJacobianCoordinates;

  secp256k1_ecmult_gen(&generatorContext, &publicKeyJacobianCoordinates, &secretKey);

  secp256k1_ge_set_gej(&publicKey, &publicKeyJacobianCoordinates);
  logTest << "DEBUG: public key: " << toStringSecp256k1_ECPoint(publicKey) << Logger::endL;

  int recId = 5;

  logTest << "Got to here pt 5. " << Logger::endL;
  secp256k1_ecdsa_sig_sign(&generatorContext, &signatureR, &signatureS, &secretKey, &message, &nonce, &recId);

  int signatureResult = secp256k1_ecdsa_sig_verify(&multiplicationContext, &signatureR, &signatureS, &publicKey, &message);
  logTest << "DEBUG: signature result: " << signatureResult << Logger::endL;

  logTest << "Got to here pt 6. " << Logger::endL;
  logTest << "secret: " << toStringSecp256k1_Scalar(secretKey) << Logger::endL;
  logTest << "message: " << toStringSecp256k1_Scalar(message) << Logger::endL;
  logTest << "nonce: " << toStringSecp256k1_Scalar(nonce) << Logger::endL;
  logTest << "outputR: " << toStringSecp256k1_Scalar(signatureR) << Logger::endL;
  logTest << "outputS: " << toStringSecp256k1_Scalar(signatureS) << Logger::endL;
  return 0;
}
