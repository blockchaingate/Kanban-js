#ifndef MISCELLANEOUS_header
#define MISCELLANEOUS_header
#include <string>

class StateMaintainerFolderLocation {
//this is a RAII class that ensures preservation of the
//current directory.
public:
  std::string ambientDirectoryAtObjectCreation;
  StateMaintainerFolderLocation();
  ~StateMaintainerFolderLocation();
};

class Miscellaneous
{
public:
  static std::string toStringHex(const std::string& other);
  static std::string toStringShorten(const std::string& input, int numCharactersToRetain);
};


#endif // MISCELLANEOUS_header

