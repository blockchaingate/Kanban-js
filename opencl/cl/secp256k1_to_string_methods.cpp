#include "logging.h"
#include <sstream>
#include <iomanip>
#include "cl/secp256k1_cpp.h"


std::string toStringSecp256k1_FieldElement(const secp256k1_fe& input) {
  std::stringstream out;
  for (int i = 9; i >= 0; i --)
    out << std::hex << std::setfill('0') << std::setw(8) << input.n[i];
  return out.str();
}

std::string toStringSecp256k1_FieldElementStorage(const secp256k1_fe_storage& input) {
  std::stringstream out;
  for (int i = 7; i >= 0; i --)
    out << std::hex << std::setfill('0') << std::setw(8) << input.n[i];
  return out.str();
}

std::string toStringSecp256k1_Scalar(const secp256k1_scalar& input) {
  std::stringstream out;
  for (int i = 7; i >= 0; i --)
    out << std::hex << std::setfill('0') << std::setw(8) << input.d[i];
  return out.str();
}

std::string toStringSecp256k1_ECPoint(const secp256k1_ge& input) {
  std::stringstream out;
  out << "\nx: " << toStringSecp256k1_FieldElement(input.x);
  out << "\ny: " << toStringSecp256k1_FieldElement(input.y);
  return out.str();
}

std::string toStringSecp256k1_ECPointStorage(const secp256k1_ge_storage& input) {
  std::stringstream out;
  out << "(x,y): " << toStringSecp256k1_FieldElementStorage(input.x);
  out << ",   " << toStringSecp256k1_FieldElementStorage(input.y);
  return out.str();
}

std::string toStringSecp256k1_MultiplicationContext(const secp256k1_ecmult_context& multiplicationContext) {
  std::stringstream out;
  for (int i = 0; i < ECMULT_TABLE_SIZE(WINDOW_G); i++){
    out << i << ":" << toStringSecp256k1_ECPointStorage((*multiplicationContext.pre_g)[i]) << ", \n";
  }
  return out.str();
}

std::string toStringSecp256k1_GeneratorContext(const secp256k1_ecmult_gen_context& generatorContext) {
  std::stringstream out;
  out << "Generator context. Blind: " << toStringSecp256k1_Scalar(generatorContext.blind) << "\n";

  for (int i = 0; i < 64; i ++) {
    for (int j = 0; j < 16; j++) {
      out << "p_" << i << "_" << j << ": " << toStringSecp256k1_ECPointStorage((*generatorContext.prec)[i][j]) << ", ";
    }
    out << "\n";
  }
  return out.str();
}
