#ifndef SECP256K1_CPP_H_header
#define SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1.h"
#include <sstream>
std::string toStringSecp256k1_FieldElement(const secp256k1_fe& input);
std::string toStringSecp256k1_Scalar(const secp256k1_scalar& input);
std::string toStringSecp256k1_ECPoint(const secp256k1_ge& input);
#endif //SECP256K1_CPP_H_header

