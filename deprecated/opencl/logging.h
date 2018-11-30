#ifndef LOGGING_H_header
#define LOGGING_H_header
#include <fstream>
#include <iostream>

class Logger
{
public:
  static std::string colorRed;
  static std::string colorYellow;
  static std::string colorGreen;
  static std::string colorBlue;
  static std::string colorNormal;

  std::fstream theFile;
  std::string descriptionPrependToLogs;
  bool flagExtraDescription;
  bool flagDeallocated;
  enum logModifiers{ endL};
  friend Logger& operator << (Logger& inputLogger, logModifiers other) {
    if (other == Logger::endL) {
      std::cout << std::endl;
      inputLogger.theFile << "\n";
    }
    inputLogger.flagExtraDescription = true;
    return inputLogger;
  }
  template<typename any>
  friend Logger& operator << (Logger& inputLogger, const any& other) {
    if (inputLogger.flagDeallocated) {
      std::cout << other << std::endl;
      return inputLogger;
    }
    if (inputLogger.flagExtraDescription) {
      inputLogger.flagExtraDescription = false;
      std::cout << inputLogger.descriptionPrependToLogs;
    }
    inputLogger.theFile << other;
    inputLogger.theFile.flush();
    std::cout << other;
    return inputLogger;
  }
  Logger(const std::string& pathname, const std::string& inputDescriptionPrependToLogs) {
    this->theFile.open(pathname, std::fstream::out | std::fstream::trunc);
    this->flagExtraDescription = true;
    this->descriptionPrependToLogs = inputDescriptionPrependToLogs;
    this->flagDeallocated = false;
  }
  ~Logger() {
    this->theFile.close();
    this->flagDeallocated = true;
  }
};

#endif // LOGGING_H

