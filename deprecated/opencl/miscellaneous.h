#ifndef MISCELLANEOUS_header
#define MISCELLANEOUS_header
#include <string>
#include "logging.h"

class StateMaintainerFolderLocation {
//this is a RAII class that ensures preservation of the
//current directory.
private:
  StateMaintainerFolderLocation();
public:
  std::string ambientDirectoryAtObjectCreation;
  Logger* logFile;
  StateMaintainerFolderLocation(Logger& logFile);
  ~StateMaintainerFolderLocation();
};

class OSWrapper {
  //this class tries to wrap experimental, non-standard or system-dependent operations
  //to reduce porting/build/compilation errors when those features fail/are not present.
  //For example, we wrap std::experimental::filesystem functions here:
  //at some point, the "experimental" namespace will have to be dropped,
  //so having a wrapper will decrease the pain when that happens.
public:
  static void setCurrentPath(const std::string& path);
  static std::string getCurrentPath();
};

class Miscellaneous
{
public:
  static std::string toStringHex(const std::string& other);
  static std::string toStringShorten(const std::string& input, int numCharactersToRetain);
};


#endif // MISCELLANEOUS_header

