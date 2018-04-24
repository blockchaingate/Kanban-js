#ifndef MISCELLANEOUS_header
#define MISCELLANEOUS_header
#include <string>

class Miscellaneous
{
public:
  static std::string toStringHex(const std::string& other);
  static std::string toStringShorten(const std::string& input, int numCharactersToRetain);
};


#endif // MISCELLANEOUS_header

