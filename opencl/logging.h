#ifndef LOGGING_H_header
#define LOGGING_H_header

class Logger
{
public:
  std::fstream theFile;
  std::string description;
  bool flagExtraDescription;
  enum logModifiers{ endL};
  friend Logger& operator << (Logger& inputLogger, logModifiers other)
  { if (other == Logger::endL)
      std::cout << std::endl;
   inputLogger.flagExtraDescription = true;
    return inputLogger;
  }
  template<typename any>
  friend Logger& operator << (Logger& inputLogger, const any& other)
  { if (inputLogger.flagExtraDescription)
    {
      inputLogger.flagExtraDescription = false;
      std::cout << inputLogger.description;
    }
    inputLogger.theFile << other;
    inputLogger.theFile.flush();
    std::cout << other;
    return inputLogger;
  }
  Logger(const std::string& pathname, const std::string& inputDescription)
  { this->theFile.open(pathname, std::fstream::out | std::fstream::trunc);
    this->flagExtraDescription = true;
    this->description = inputDescription;
  }
  ~Logger()
  { this->theFile.close();
  }

};

#endif // LOGGING_H

